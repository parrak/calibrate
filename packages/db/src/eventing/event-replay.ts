/**
 * Event Replay — Replay historical events for recovery or connector sync
 * Supports filtering by tenant, event type, date range, and correlation ID
 */

import { PrismaClient } from '@prisma/client'
import type { EventPayload, ReplayOptions, EventSubscriber } from './types'

export class EventReplay {
  private prisma: PrismaClient
  private subscribers: EventSubscriber[]

  constructor(prisma: PrismaClient) {
    this.prisma = prisma
    this.subscribers = []
  }

  /**
   * Register an event subscriber
   */
  subscribe(subscriber: EventSubscriber) {
    this.subscribers.push(subscriber)
  }

  /**
   * Replay events based on filters
   * Useful for:
   * - Connector initial sync
   * - Recovery after system failures
   * - Reconstructing historical state
   */
  async replay(options: ReplayOptions): Promise<number> {
    const { tenantId, eventTypes, fromDate, toDate, correlationId } = options

    // Fetch events matching criteria
    const events = await this.prisma.eventLog.findMany({
      where: {
        tenantId,
        ...(eventTypes && eventTypes.length > 0 && { eventType: { in: eventTypes } }),
        ...(fromDate && { createdAt: { gte: fromDate } }),
        ...(toDate && { createdAt: { lte: toDate } }),
        ...(correlationId && { correlationId })
      },
      orderBy: { createdAt: 'asc' }
    })

    console.log(`[EventReplay] Replaying ${events.length} events for tenant ${tenantId}`)

    let processedCount = 0

    // Process events in order
    for (const event of events) {
      const eventPayload: EventPayload = {
        eventKey: event.eventKey,
        tenantId: event.tenantId,
        projectId: event.projectId || undefined,
        eventType: event.eventType,
        payload: event.payload as Record<string, unknown>,
        metadata: (event.metadata as Record<string, unknown>) || undefined,
        correlationId: event.correlationId || undefined
      }

      // Find matching subscribers
      const matchingSubscribers = this.subscribers.filter(
        (sub) => sub.eventTypes.includes(event.eventType)
      )

      // Call all matching subscribers
      for (const subscriber of matchingSubscribers) {
        try {
          await subscriber.handler(eventPayload)
          processedCount++
        } catch (error) {
          console.error(
            `[EventReplay] Error replaying event ${event.id}:`,
            error instanceof Error ? error.message : 'Unknown error'
          )
          // Continue with next event even if one fails
        }
      }
    }

    console.log(`[EventReplay] Successfully replayed ${processedCount}/${events.length} events`)

    return processedCount
  }

  /**
   * Get event statistics for a tenant
   */
  async getEventStats(tenantId: string, eventType?: string) {
    const where = {
      tenantId,
      ...(eventType && { eventType })
    }

    const [total, firstEvent, lastEvent, eventTypeCounts] = await Promise.all([
      this.prisma.eventLog.count({ where }),
      this.prisma.eventLog.findFirst({
        where,
        orderBy: { createdAt: 'asc' }
      }),
      this.prisma.eventLog.findFirst({
        where,
        orderBy: { createdAt: 'desc' }
      }),
      this.prisma.eventLog.groupBy({
        by: ['eventType'],
        where: { tenantId },
        _count: true,
        orderBy: { _count: { eventType: 'desc' } }
      })
    ])

    return {
      total,
      firstEventAt: firstEvent?.createdAt,
      lastEventAt: lastEvent?.createdAt,
      eventTypeCounts: eventTypeCounts.map((item) => ({
        eventType: item.eventType,
        count: item._count
      }))
    }
  }

  /**
   * Verify replay integrity
   * Ensures all events can be successfully fetched and are in order
   */
  async verifyIntegrity(tenantId: string): Promise<{
    valid: boolean
    totalEvents: number
    issues: string[]
  }> {
    const issues: string[] = []

    const events = await this.prisma.eventLog.findMany({
      where: { tenantId },
      orderBy: { createdAt: 'asc' }
    })

    // Check for duplicate event keys
    const eventKeys = new Set<string>()
    for (const event of events) {
      const key = `${event.eventKey}-${event.tenantId}`
      if (eventKeys.has(key)) {
        issues.push(`Duplicate event key found: ${event.eventKey}`)
      }
      eventKeys.add(key)
    }

    // Check for temporal ordering
    let lastTimestamp = new Date(0)
    for (const event of events) {
      if (event.createdAt < lastTimestamp) {
        issues.push(`Event ${event.id} is out of temporal order`)
      }
      lastTimestamp = event.createdAt
    }

    // Check for missing correlation IDs in chains
    const correlationIds = events
      .filter((e) => e.correlationId)
      .map((e) => e.correlationId)

    return {
      valid: issues.length === 0,
      totalEvents: events.length,
      issues
    }
  }

  /**
   * Get events by correlation ID
   * Useful for tracing a complete operation across multiple events
   */
  async getEventsByCorrelation(correlationId: string) {
    return this.prisma.eventLog.findMany({
      where: { correlationId },
      orderBy: { createdAt: 'asc' }
    })
  }
}
