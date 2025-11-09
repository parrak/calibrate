/**
 * Test: Verify replay can reconstruct historical price changes
 */

import { describe, it, expect, beforeEach } from 'vitest'
import { EventReplay } from './event-replay'
import type { EventPayload } from './types'

// Mock PrismaClient
const mockPrisma = {
  eventLog: {
    findMany: async ({ where, orderBy }: any) => {
      const events = mockEventStore.filter((event) => {
        if (where.tenantId && event.tenantId !== where.tenantId) return false
        if (where.eventType?.in && !where.eventType.in.includes(event.eventType)) return false
        if (where.correlationId && event.correlationId !== where.correlationId) return false
        if (where.createdAt?.gte && event.createdAt < where.createdAt.gte) return false
        if (where.createdAt?.lte && event.createdAt > where.createdAt.lte) return false
        return true
      })

      // Sort if orderBy is specified
      if (orderBy?.createdAt === 'asc') {
        events.sort((a, b) => a.createdAt.getTime() - b.createdAt.getTime())
      } else if (orderBy?.createdAt === 'desc') {
        events.sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime())
      }

      return events
    },
    count: async ({ where }: any) => {
      return mockEventStore.filter((event) => {
        if (where.tenantId && event.tenantId !== where.tenantId) return false
        if (where.eventType && event.eventType !== where.eventType) return false
        return true
      }).length
    },
    findFirst: async ({ where, orderBy }: any) => {
      const events = await mockPrisma.eventLog.findMany({ where, orderBy })
      return events[0] || null
    },
    groupBy: async ({ by, where, orderBy }: any) => {
      const events = mockEventStore.filter((event) => {
        if (where.tenantId && event.tenantId !== where.tenantId) return false
        return true
      })

      const grouped = new Map<string, number>()
      events.forEach((event) => {
        const count = grouped.get(event.eventType) || 0
        grouped.set(event.eventType, count + 1)
      })

      const result = Array.from(grouped.entries()).map(([eventType, count]) => ({
        eventType,
        _count: count,
      }))

      if (orderBy?._count?.eventType === 'desc') {
        result.sort((a, b) => b._count - a._count)
      }

      return result
    },
  },
}

let mockEventStore: Array<{
  id: string
  eventKey: string
  tenantId: string
  projectId: string | null
  eventType: string
  payload: any
  metadata: any
  correlationId: string | null
  createdAt: Date
  version: number
}>

describe('Event Replay - Price Change Reconstruction', () => {
  beforeEach(() => {
    // Reset event store
    mockEventStore = []
  })

  it('replays price change events in chronological order', async () => {
    // Create sample price change events
    const baseTime = new Date('2025-01-01T00:00:00Z')

    mockEventStore = [
      {
        id: 'event_1',
        eventKey: 'pricechange-applied-pc1-1',
        tenantId: 'tenant1',
        projectId: 'proj1',
        eventType: 'pricechange.applied',
        payload: {
          priceChangeId: 'pc1',
          skuId: 'sku1',
          skuCode: 'SKU-001',
          fromAmount: 4990,
          toAmount: 5490,
          currency: 'USD',
        },
        metadata: { actor: 'user-admin', correlationId: 'corr_123' },
        correlationId: 'corr_123',
        createdAt: new Date(baseTime.getTime() + 1000),
        version: 1,
      },
      {
        id: 'event_2',
        eventKey: 'pricechange-applied-pc2-1',
        tenantId: 'tenant1',
        projectId: 'proj1',
        eventType: 'pricechange.applied',
        payload: {
          priceChangeId: 'pc2',
          skuId: 'sku2',
          skuCode: 'SKU-002',
          fromAmount: 9990,
          toAmount: 8990,
          currency: 'USD',
        },
        metadata: { actor: 'user-admin', correlationId: 'corr_124' },
        correlationId: 'corr_124',
        createdAt: new Date(baseTime.getTime() + 2000),
        version: 1,
      },
      {
        id: 'event_3',
        eventKey: 'pricechange-rolled-back-pc1-1',
        tenantId: 'tenant1',
        projectId: 'proj1',
        eventType: 'pricechange.rolled_back',
        payload: {
          priceChangeId: 'pc1',
          skuId: 'sku1',
          skuCode: 'SKU-001',
          fromAmount: 5490,
          toAmount: 4990,
          currency: 'USD',
        },
        metadata: { actor: 'user-admin', correlationId: 'corr_125' },
        correlationId: 'corr_125',
        createdAt: new Date(baseTime.getTime() + 3000),
        version: 1,
      },
    ]

    const replay = new EventReplay(mockPrisma as any)

    // Track replayed events
    const replayedEvents: EventPayload[] = []
    replay.subscribe({
      eventTypes: ['pricechange.applied', 'pricechange.rolled_back'],
      handler: async (event: EventPayload) => {
        replayedEvents.push(event)
      },
    })

    // Replay all price change events
    const count = await replay.replay({
      tenantId: 'tenant1',
      eventTypes: ['pricechange.applied', 'pricechange.rolled_back'],
    })

    // Verify all events were replayed
    expect(count).toBe(3)
    expect(replayedEvents.length).toBe(3)

    // Verify events are in chronological order
    expect(replayedEvents[0].payload.priceChangeId).toBe('pc1')
    expect(replayedEvents[0].eventType).toBe('pricechange.applied')
    expect(replayedEvents[1].payload.priceChangeId).toBe('pc2')
    expect(replayedEvents[1].eventType).toBe('pricechange.applied')
    expect(replayedEvents[2].payload.priceChangeId).toBe('pc1')
    expect(replayedEvents[2].eventType).toBe('pricechange.rolled_back')
  })

  it('reconstructs price history from events', async () => {
    // Simulate a series of price changes
    const baseTime = new Date('2025-01-01T00:00:00Z')

    mockEventStore = [
      {
        id: 'event_1',
        eventKey: 'pricechange-applied-pc1-1',
        tenantId: 'tenant1',
        projectId: 'proj1',
        eventType: 'pricechange.applied',
        payload: {
          priceChangeId: 'pc1',
          skuId: 'sku1',
          fromAmount: 1000,
          toAmount: 1200,
          currency: 'USD',
        },
        metadata: {},
        correlationId: null,
        createdAt: new Date(baseTime.getTime()),
        version: 1,
      },
      {
        id: 'event_2',
        eventKey: 'pricechange-applied-pc2-1',
        tenantId: 'tenant1',
        projectId: 'proj1',
        eventType: 'pricechange.applied',
        payload: {
          priceChangeId: 'pc2',
          skuId: 'sku1',
          fromAmount: 1200,
          toAmount: 1500,
          currency: 'USD',
        },
        metadata: {},
        correlationId: null,
        createdAt: new Date(baseTime.getTime() + 1000),
        version: 1,
      },
      {
        id: 'event_3',
        eventKey: 'pricechange-rolled-back-pc2-1',
        tenantId: 'tenant1',
        projectId: 'proj1',
        eventType: 'pricechange.rolled_back',
        payload: {
          priceChangeId: 'pc2',
          skuId: 'sku1',
          fromAmount: 1500,
          toAmount: 1200,
          currency: 'USD',
        },
        metadata: {},
        correlationId: null,
        createdAt: new Date(baseTime.getTime() + 2000),
        version: 1,
      },
    ]

    const replay = new EventReplay(mockPrisma as any)

    // Track price history
    const priceHistory: Array<{ amount: number; timestamp: Date }> = []
    let currentPrice = 1000

    replay.subscribe({
      eventTypes: ['pricechange.applied', 'pricechange.rolled_back'],
      handler: async (event: EventPayload) => {
        currentPrice = event.payload.toAmount as number
        priceHistory.push({
          amount: currentPrice,
          timestamp: new Date(),
        })
      },
    })

    await replay.replay({ tenantId: 'tenant1' })

    // Verify price history was reconstructed correctly
    expect(priceHistory.length).toBe(3)
    expect(priceHistory[0].amount).toBe(1200) // After first apply
    expect(priceHistory[1].amount).toBe(1500) // After second apply
    expect(priceHistory[2].amount).toBe(1200) // After rollback
  })

  it('filters events by correlation ID', async () => {
    const baseTime = new Date('2025-01-01T00:00:00Z')

    mockEventStore = [
      {
        id: 'event_1',
        eventKey: 'pricechange-applied-pc1-1',
        tenantId: 'tenant1',
        projectId: 'proj1',
        eventType: 'pricechange.applied',
        payload: { priceChangeId: 'pc1' },
        metadata: {},
        correlationId: 'corr_123',
        createdAt: new Date(baseTime.getTime()),
        version: 1,
      },
      {
        id: 'event_2',
        eventKey: 'pricechange-applied-pc2-1',
        tenantId: 'tenant1',
        projectId: 'proj1',
        eventType: 'pricechange.applied',
        payload: { priceChangeId: 'pc2' },
        metadata: {},
        correlationId: 'corr_456',
        createdAt: new Date(baseTime.getTime() + 1000),
        version: 1,
      },
    ]

    const replay = new EventReplay(mockPrisma as any)

    const replayedEvents: EventPayload[] = []
    replay.subscribe({
      eventTypes: ['pricechange.applied'],
      handler: async (event: EventPayload) => {
        replayedEvents.push(event)
      },
    })

    // Replay only events with specific correlation ID
    const count = await replay.replay({
      tenantId: 'tenant1',
      correlationId: 'corr_123',
    })

    expect(count).toBe(1)
    expect(replayedEvents.length).toBe(1)
    expect(replayedEvents[0].payload.priceChangeId).toBe('pc1')
  })

  it('verifies event integrity', async () => {
    const baseTime = new Date('2025-01-01T00:00:00Z')

    mockEventStore = [
      {
        id: 'event_1',
        eventKey: 'pricechange-applied-pc1-1',
        tenantId: 'tenant1',
        projectId: 'proj1',
        eventType: 'pricechange.applied',
        payload: {},
        metadata: {},
        correlationId: null,
        createdAt: new Date(baseTime.getTime()),
        version: 1,
      },
      {
        id: 'event_2',
        eventKey: 'pricechange-applied-pc2-1',
        tenantId: 'tenant1',
        projectId: 'proj1',
        eventType: 'pricechange.applied',
        payload: {},
        metadata: {},
        correlationId: null,
        createdAt: new Date(baseTime.getTime() + 1000),
        version: 1,
      },
    ]

    const replay = new EventReplay(mockPrisma as any)
    const result = await replay.verifyIntegrity('tenant1')

    expect(result.valid).toBe(true)
    expect(result.totalEvents).toBe(2)
    expect(result.issues.length).toBe(0)
  })

  it('detects out-of-order events', async () => {
    const baseTime = new Date('2025-01-01T00:00:00Z')

    // Events are intentionally out of order
    mockEventStore = [
      {
        id: 'event_1',
        eventKey: 'event-1',
        tenantId: 'tenant1',
        projectId: 'proj1',
        eventType: 'test',
        payload: {},
        metadata: {},
        correlationId: null,
        createdAt: new Date(baseTime.getTime() + 2000),
        version: 1,
      },
      {
        id: 'event_2',
        eventKey: 'event-2',
        tenantId: 'tenant1',
        projectId: 'proj1',
        eventType: 'test',
        payload: {},
        metadata: {},
        correlationId: null,
        createdAt: new Date(baseTime.getTime() + 1000),
        version: 1,
      },
    ]

    const replay = new EventReplay(mockPrisma as any)
    const result = await replay.verifyIntegrity('tenant1')

    expect(result.valid).toBe(false)
    expect(result.issues.length).toBeGreaterThan(0)
    expect(result.issues[0]).toContain('out of temporal order')
  })
})
