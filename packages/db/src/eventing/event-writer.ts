/**
 * Event Writer — Append-only event writer with idempotent dedupe
 * Implements the transactional outbox pattern
 */

import { PrismaClient } from '@prisma/client'
import type { EventPayload, RetryConfig } from './types'

const DEFAULT_RETRY_CONFIG: Required<RetryConfig> = {
  maxRetries: 5,
  initialDelayMs: 1000,
  maxDelayMs: 60000,
  backoffMultiplier: 2
}

export class EventWriter {
  private prisma: PrismaClient
  private retryConfig: Required<RetryConfig>

  constructor(prisma: PrismaClient, retryConfig?: RetryConfig) {
    this.prisma = prisma
    this.retryConfig = { ...DEFAULT_RETRY_CONFIG, ...retryConfig }
  }

  /**
   * Write an event to the event log with idempotent dedupe
   * Returns the event log ID or existing ID if duplicate
   */
  async writeEvent(event: EventPayload): Promise<string> {
    const { eventKey, tenantId, projectId, eventType, payload, metadata, correlationId } = event

    try {
      // Use upsert to handle idempotency — if event with same key + tenant exists, return existing
      const eventLog = await this.prisma.eventLog.upsert({
        where: {
          EventLog_eventKey_tenantId_unique: {
            eventKey,
            tenantId
          }
        },
        update: {
          // On conflict, do nothing (idempotent)
          // Could optionally increment version here
        },
        create: {
          eventKey,
          tenantId,
          projectId: projectId || null,
          eventType,
          payload: payload as any,
          metadata: metadata as any,
          correlationId: correlationId || null,
          version: 1
        }
      })

      return eventLog.id
    } catch (error) {
      throw new Error(`Failed to write event: ${error instanceof Error ? error.message : 'Unknown error'}`)
    }
  }

  /**
   * Write event and add to outbox in a transaction
   * This ensures atomicity between domain changes and event publishing
   */
  async writeEventWithOutbox(
    event: EventPayload,
    options?: { tx?: PrismaClient }
  ): Promise<{ eventLogId: string; outboxId: string }> {
    const prisma = options?.tx || this.prisma

    try {
      // Write to event log (idempotent)
      const eventLog = await prisma.eventLog.upsert({
        where: {
          EventLog_eventKey_tenantId_unique: {
            eventKey: event.eventKey,
            tenantId: event.tenantId
          }
        },
        update: {},
        create: {
          eventKey: event.eventKey,
          tenantId: event.tenantId,
          projectId: event.projectId || null,
          eventType: event.eventType,
          payload: event.payload as any,
          metadata: event.metadata as any,
          correlationId: event.correlationId || null,
          version: 1
        }
      })

      // Add to outbox for async processing
      const outbox = await prisma.outbox.create({
        data: {
          eventLogId: eventLog.id,
          tenantId: event.tenantId,
          eventType: event.eventType,
          payload: event.payload as any,
          status: 'PENDING',
          retryCount: 0,
          maxRetries: this.retryConfig.maxRetries,
          nextRetryAt: new Date() // Process immediately
        }
      })

      return {
        eventLogId: eventLog.id,
        outboxId: outbox.id
      }
    } catch (error) {
      throw new Error(
        `Failed to write event with outbox: ${error instanceof Error ? error.message : 'Unknown error'}`
      )
    }
  }

  /**
   * Write multiple events in a batch
   * Useful for bulk operations
   */
  async writeEventBatch(events: EventPayload[]): Promise<string[]> {
    const eventLogIds: string[] = []

    // Use a transaction to ensure atomicity
    await this.prisma.$transaction(async (tx) => {
      for (const event of events) {
        const result = await this.writeEventWithOutbox(event, { tx })
        eventLogIds.push(result.eventLogId)
      }
    })

    return eventLogIds
  }

  /**
   * Get events for replay
   */
  async getEventsForReplay(options: {
    tenantId: string
    eventTypes?: string[]
    fromDate?: Date
    toDate?: Date
    correlationId?: string
    limit?: number
  }) {
    const { tenantId, eventTypes, fromDate, toDate, correlationId, limit = 1000 } = options

    return this.prisma.eventLog.findMany({
      where: {
        tenantId,
        ...(eventTypes && eventTypes.length > 0 && { eventType: { in: eventTypes } }),
        ...(fromDate && { createdAt: { gte: fromDate } }),
        ...(toDate && { createdAt: { lte: toDate } }),
        ...(correlationId && { correlationId })
      },
      orderBy: { createdAt: 'asc' },
      take: limit
    })
  }

  /**
   * Calculate next retry time with exponential backoff
   */
  calculateNextRetry(retryCount: number): Date {
    const delay = Math.min(
      this.retryConfig.initialDelayMs * Math.pow(this.retryConfig.backoffMultiplier, retryCount),
      this.retryConfig.maxDelayMs
    )

    return new Date(Date.now() + delay)
  }
}
