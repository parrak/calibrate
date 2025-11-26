/**
 * Outbox Worker — Retry/backoff worker for processing outbox events
 * Handles failed events and moves them to DLQ after max retries
 */

import { PrismaClient } from '@prisma/client'
import type { EventSubscriber, RetryConfig } from './types'

const DEFAULT_RETRY_CONFIG: Required<RetryConfig> = {
  maxRetries: 5,
  initialDelayMs: 1000,
  maxDelayMs: 60000,
  backoffMultiplier: 2
}

export class OutboxWorker {
  private prisma: PrismaClient
  private retryConfig: Required<RetryConfig>
  private subscribers: EventSubscriber[]
  private isRunning: boolean
  private pollIntervalMs: number
  private processInterval?: NodeJS.Timeout

  constructor(
    prisma: PrismaClient,
    options?: {
      retryConfig?: RetryConfig
      pollIntervalMs?: number
    }
  ) {
    this.prisma = prisma
    this.retryConfig = { ...DEFAULT_RETRY_CONFIG, ...options?.retryConfig }
    this.subscribers = []
    this.isRunning = false
    this.pollIntervalMs = options?.pollIntervalMs || 5000 // Default 5 seconds
  }

  /**
   * Register an event subscriber
   */
  subscribe(subscriber: EventSubscriber) {
    this.subscribers.push(subscriber)
  }

  /**
   * Start the outbox worker
   */
  start() {
    if (this.isRunning) {
      return
    }

    this.isRunning = true
    this.processInterval = setInterval(() => {
      this.processPendingEvents().catch((error) => {
        console.error('Error processing pending events:', error)
      })
    }, this.pollIntervalMs)

    console.log('[OutboxWorker] Started')
  }

  /**
   * Stop the outbox worker
   */
  stop() {
    if (!this.isRunning) {
      return
    }

    this.isRunning = false
    if (this.processInterval) {
      clearInterval(this.processInterval)
      this.processInterval = undefined
    }

    console.log('[OutboxWorker] Stopped')
  }

  /**
   * Process pending events from outbox
   */
  async processPendingEvents() {
    // Find events ready to be processed
    const pendingEvents = await this.prisma.outbox.findMany({
      where: {
        status: 'PENDING',
        OR: [
          { nextRetryAt: null },
          { nextRetryAt: { lte: new Date() } }
        ]
      },
      take: 100, // Process in batches
      orderBy: { createdAt: 'asc' }
    })

    if (pendingEvents.length === 0) {
      return
    }

    console.log(`[OutboxWorker] Processing ${pendingEvents.length} pending events`)

    // Process each event
    for (const event of pendingEvents) {
      await this.processEvent(event.id)
    }
  }

  /**
   * Process a single event
   */
  private async processEvent(outboxId: string) {
    // Mark as processing
    const outboxEvent = await this.prisma.outbox.update({
      where: { id: outboxId },
      data: { status: 'PROCESSING' }
    })

    try {
      // Get the original event log
      const eventLog = await this.prisma.eventLog.findUnique({
        where: { id: outboxEvent.eventLogId }
      })

      if (!eventLog) {
        throw new Error(`EventLog not found for outbox event ${outboxId}`)
      }

      // Find matching subscribers
      const matchingSubscribers = this.subscribers.filter(
        (sub) => sub.eventTypes.includes(outboxEvent.eventType)
      )

      if (matchingSubscribers.length === 0) {
        console.warn(`[OutboxWorker] No subscribers for event type: ${outboxEvent.eventType}`)
      }

      // Call all matching subscribers
      for (const subscriber of matchingSubscribers) {
        await subscriber.handler({
          eventKey: eventLog.eventKey,
          tenantId: eventLog.tenantId,
          projectId: eventLog.projectId || undefined,
          eventType: eventLog.eventType,
          payload: eventLog.payload as Record<string, unknown>,
          metadata: (eventLog.metadata as Record<string, unknown>) || undefined,
          correlationId: eventLog.correlationId || undefined
        })
      }

      // Mark as completed
      await this.prisma.outbox.update({
        where: { id: outboxId },
        data: {
          status: 'COMPLETED',
          processedAt: new Date(),
          lastError: null
        }
      })

      console.log(`[OutboxWorker] Successfully processed event ${outboxId}`)
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error'
      console.error(`[OutboxWorker] Error processing event ${outboxId}:`, errorMessage)

      // Increment retry count
      const newRetryCount = outboxEvent.retryCount + 1

      // Check if max retries exceeded
      if (newRetryCount >= outboxEvent.maxRetries) {
        await this.moveToDeadLetterQueue(outboxEvent.id, errorMessage, newRetryCount)
      } else {
        // Calculate next retry time with exponential backoff
        const nextRetryAt = this.calculateNextRetry(newRetryCount)

        await this.prisma.outbox.update({
          where: { id: outboxId },
          data: {
            status: 'PENDING',
            retryCount: newRetryCount,
            nextRetryAt,
            lastError: errorMessage
          }
        })

        console.log(
          `[OutboxWorker] Scheduled retry ${newRetryCount}/${outboxEvent.maxRetries} for event ${outboxId} at ${nextRetryAt.toISOString()}`
        )
      }
    }
  }

  /**
   * Move failed event to dead letter queue
   */
  private async moveToDeadLetterQueue(outboxId: string, errorMessage: string, retryCount: number) {
    try {
      const outboxEvent = await this.prisma.outbox.findUnique({
        where: { id: outboxId }
      })

      if (!outboxEvent) {
        console.error(`[OutboxWorker] Outbox event ${outboxId} not found for DLQ`)
        return
      }

      const eventLog = await this.prisma.eventLog.findUnique({
        where: { id: outboxEvent.eventLogId }
      })

      if (!eventLog) {
        console.error(`[OutboxWorker] EventLog not found for DLQ: ${outboxEvent.eventLogId}`)
        return
      }

      // Use a transaction to ensure atomicity
      await this.prisma.$transaction([
        // Insert into DLQ
        this.prisma.dlqEventLog.create({
          data: {
            originalId: outboxEvent.id,
            eventKey: eventLog.eventKey,
            tenantId: eventLog.tenantId,
            projectId: eventLog.projectId || undefined,
            eventType: eventLog.eventType,
            payload: eventLog.payload as any,
            metadata: eventLog.metadata as any,
            failureReason: errorMessage,
            retryCount
          }
        }),
        // Mark outbox event as failed
        this.prisma.outbox.update({
          where: { id: outboxId },
          data: {
            status: 'FAILED',
            lastError: `Max retries exceeded: ${errorMessage}`
          }
        })
      ])

      console.error(
        `[OutboxWorker] Moved event ${outboxId} to DLQ after ${retryCount} retries: ${errorMessage}`
      )
    } catch (error) {
      console.error(
        `[OutboxWorker] Failed to move event to DLQ:`,
        error instanceof Error ? error.message : 'Unknown error'
      )
    }
  }

  /**
   * Calculate next retry time with exponential backoff
   */
  private calculateNextRetry(retryCount: number): Date {
    const delay = Math.min(
      this.retryConfig.initialDelayMs * Math.pow(this.retryConfig.backoffMultiplier, retryCount),
      this.retryConfig.maxDelayMs
    )

    return new Date(Date.now() + delay)
  }

  /**
   * Retry a failed event from DLQ
   * This allows manual intervention to retry failed events
   */
  async retryFromDlq(dlqId: string): Promise<string> {
    const dlqEvent = await this.prisma.dlqEventLog.findUnique({
      where: { id: dlqId }
    })

    if (!dlqEvent) {
      throw new Error(`DLQ event ${dlqId} not found`)
    }

    // Re-add to outbox
    const outbox = await this.prisma.outbox.create({
      data: {
        eventLogId: dlqEvent.originalId,
        tenantId: dlqEvent.tenantId,
        eventType: dlqEvent.eventType,
        payload: dlqEvent.payload as any,
        status: 'PENDING',
        retryCount: 0,
        maxRetries: this.retryConfig.maxRetries,
        nextRetryAt: new Date()
      }
    })

    console.log(`[OutboxWorker] Retrying DLQ event ${dlqId} as outbox ${outbox.id}`)

    return outbox.id
  }

  /**
   * Get metrics about the outbox
   */
  async getMetrics() {
    const [total, pending, processing, completed, failed] = await Promise.all([
      this.prisma.outbox.count(),
      this.prisma.outbox.count({ where: { status: 'PENDING' } }),
      this.prisma.outbox.count({ where: { status: 'PROCESSING' } }),
      this.prisma.outbox.count({ where: { status: 'COMPLETED' } }),
      this.prisma.outbox.count({ where: { status: 'FAILED' } })
    ])

    const dlqCount = await this.prisma.dlqEventLog.count()

    return {
      total,
      pending,
      processing,
      completed,
      failed,
      dlqCount
    }
  }
}
