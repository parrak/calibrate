/**
 * Event Writer Tests
 */

import { describe, it, expect, beforeEach, vi } from 'vitest'
import { EventWriter } from './event-writer'
import type { EventPayload } from './types'

// Mock PrismaClient
const mockPrismaClient = {
  eventLog: {
    upsert: vi.fn(),
    findMany: vi.fn()
  },
  outbox: {
    create: vi.fn()
  },
  $transaction: vi.fn()
}

describe('EventWriter', () => {
  let eventWriter: EventWriter

  beforeEach(() => {
    vi.clearAllMocks()
    eventWriter = new EventWriter(mockPrismaClient as any)
  })

  describe('writeEvent', () => {
    it('should write a new event to the event log', async () => {
      const eventPayload: EventPayload = {
        eventKey: 'test-event-1',
        tenantId: 'tenant-123',
        projectId: 'project-456',
        eventType: 'test.event',
        payload: { data: 'test' },
        metadata: { source: 'test' },
        correlationId: 'corr-123'
      }

      const mockEventLog = {
        id: 'event-log-1',
        ...eventPayload,
        createdAt: new Date(),
        version: 1
      }

      mockPrismaClient.eventLog.upsert.mockResolvedValue(mockEventLog)

      const result = await eventWriter.writeEvent(eventPayload)

      expect(result).toBe('event-log-1')
      expect(mockPrismaClient.eventLog.upsert).toHaveBeenCalledWith({
        where: {
          EventLog_eventKey_tenantId_unique: {
            eventKey: 'test-event-1',
            tenantId: 'tenant-123'
          }
        },
        update: {},
        create: {
          eventKey: 'test-event-1',
          tenantId: 'tenant-123',
          projectId: 'project-456',
          eventType: 'test.event',
          payload: { data: 'test' },
          metadata: { source: 'test' },
          correlationId: 'corr-123',
          version: 1
        }
      })
    })

    it('should handle idempotent writes (duplicate event keys)', async () => {
      const eventPayload: EventPayload = {
        eventKey: 'duplicate-event',
        tenantId: 'tenant-123',
        eventType: 'test.event',
        payload: { data: 'test' }
      }

      const existingEventLog = {
        id: 'existing-event-1',
        ...eventPayload,
        createdAt: new Date(),
        version: 1
      }

      mockPrismaClient.eventLog.upsert.mockResolvedValue(existingEventLog)

      const result = await eventWriter.writeEvent(eventPayload)

      expect(result).toBe('existing-event-1')
    })
  })

  describe('writeEventWithOutbox', () => {
    it('should write event and add to outbox in transaction', async () => {
      const eventPayload: EventPayload = {
        eventKey: 'test-event-2',
        tenantId: 'tenant-123',
        eventType: 'test.event',
        payload: { data: 'test' }
      }

      const mockEventLog = {
        id: 'event-log-2',
        ...eventPayload,
        createdAt: new Date(),
        version: 1
      }

      const mockOutbox = {
        id: 'outbox-1',
        eventLogId: 'event-log-2',
        tenantId: 'tenant-123',
        eventType: 'test.event',
        payload: { data: 'test' },
        status: 'PENDING',
        retryCount: 0,
        maxRetries: 5,
        nextRetryAt: new Date(),
        createdAt: new Date(),
        updatedAt: new Date()
      }

      mockPrismaClient.eventLog.upsert.mockResolvedValue(mockEventLog)
      mockPrismaClient.outbox.create.mockResolvedValue(mockOutbox)

      const result = await eventWriter.writeEventWithOutbox(eventPayload)

      expect(result).toEqual({
        eventLogId: 'event-log-2',
        outboxId: 'outbox-1'
      })
      expect(mockPrismaClient.eventLog.upsert).toHaveBeenCalled()
      expect(mockPrismaClient.outbox.create).toHaveBeenCalled()
    })
  })

  describe('getEventsForReplay', () => {
    it('should fetch events for replay with filters', async () => {
      const mockEvents = [
        {
          id: 'event-1',
          eventKey: 'key-1',
          tenantId: 'tenant-123',
          eventType: 'test.event',
          payload: {},
          createdAt: new Date()
        }
      ]

      mockPrismaClient.eventLog.findMany.mockResolvedValue(mockEvents)

      const result = await eventWriter.getEventsForReplay({
        tenantId: 'tenant-123',
        eventTypes: ['test.event'],
        limit: 100
      })

      expect(result).toEqual(mockEvents)
      expect(mockPrismaClient.eventLog.findMany).toHaveBeenCalledWith({
        where: {
          tenantId: 'tenant-123',
          eventType: { in: ['test.event'] }
        },
        orderBy: { createdAt: 'asc' },
        take: 100
      })
    })
  })

  describe('calculateNextRetry', () => {
    it('should calculate exponential backoff correctly', () => {
      const retry0 = eventWriter.calculateNextRetry(0)
      const retry1 = eventWriter.calculateNextRetry(1)
      const retry2 = eventWriter.calculateNextRetry(2)

      // First retry should be initialDelayMs (1000ms)
      expect(retry0.getTime()).toBeGreaterThan(Date.now())
      expect(retry0.getTime()).toBeLessThan(Date.now() + 2000)

      // Second retry should be 2x (2000ms)
      expect(retry1.getTime()).toBeGreaterThan(Date.now() + 1000)
      expect(retry1.getTime()).toBeLessThan(Date.now() + 3000)

      // Third retry should be 4x (4000ms)
      expect(retry2.getTime()).toBeGreaterThan(Date.now() + 3000)
      expect(retry2.getTime()).toBeLessThan(Date.now() + 5000)
    })

    it('should cap at maxDelayMs', () => {
      const retry10 = eventWriter.calculateNextRetry(10)

      // Should be capped at maxDelayMs (60000ms)
      expect(retry10.getTime()).toBeLessThan(Date.now() + 65000)
    })
  })
})
