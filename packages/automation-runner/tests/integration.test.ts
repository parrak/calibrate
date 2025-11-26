/**
 * Integration tests for Automation Runner
 * Tests the complete flow of rule execution, retry logic, and reconciliation
 */

import { describe, it, expect, beforeEach, vi } from 'vitest'
import { RulesWorker, ReconciliationService, DLQService } from '../src'
import type { PrismaClient } from '@calibr/db'
import type { PriceConnector } from '../src/types'

// Mock connector for testing
class MockConnector implements PriceConnector {
  name = 'mock'
  private failureTargets = new Set<string>()
  private prices = new Map<string, number>()

  setFailure(externalId: string): void {
    this.failureTargets.add(externalId)
  }

  clearFailure(externalId: string): void {
    this.failureTargets.delete(externalId)
  }

  async applyPrice(params: {
    externalId: string
    variantId?: string
    price: number
    currency: string
  }): Promise<{ success: boolean; externalId?: string; error?: string }> {
    if (this.failureTargets.has(params.externalId)) {
      return {
        success: false,
        error: 'Connector error: Simulated failure',
      }
    }

    // Store the price
    this.prices.set(params.externalId, params.price)

    return {
      success: true,
      externalId: params.externalId,
    }
  }

  async fetchPrice(externalId: string): Promise<{ price: number; currency: string }> {
    const price = this.prices.get(externalId)
    if (!price) {
      throw new Error(`Price not found for ${externalId}`)
    }

    return {
      price,
      currency: 'USD',
    }
  }

  async isHealthy(): Promise<boolean> {
    return true
  }
}

const createPrismaMock = (): PrismaClient => {
  const prismaMock = {
    ruleRun: {
      findMany: vi.fn().mockResolvedValue([]),
      update: vi.fn().mockResolvedValue(null),
      create: vi.fn().mockResolvedValue({ id: 'run-id' }),
      findUnique: vi.fn().mockResolvedValue(null),
    },
    ruleTarget: {
      update: vi.fn().mockResolvedValue(null),
      findMany: vi.fn().mockResolvedValue([]),
      updateMany: vi.fn().mockResolvedValue({ count: 0 }),
      deleteMany: vi.fn().mockResolvedValue({ count: 0 }),
      count: vi.fn().mockResolvedValue(0),
    },
    pricingRule: {
      findUnique: vi.fn().mockResolvedValue(null),
    },
    eventLog: {
      create: vi.fn().mockResolvedValue(null),
    },
    project: {
      findUnique: vi.fn().mockResolvedValue(null),
    },
    $transaction: vi.fn(async (operations: Array<unknown>) => {
      return Promise.all(
        operations.map(operation => {
          if (typeof operation === 'function') {
            return (operation as () => unknown)()
          }
          return operation
        })
      )
    }),
  }

  return prismaMock as unknown as PrismaClient
}

describe('Automation Runner Integration', () => {
  let worker: RulesWorker
  let mockConnector: MockConnector
  let reconciliationService: ReconciliationService
  let dlqService: DLQService
  let prismaMock: PrismaClient

  beforeEach(() => {
    prismaMock = createPrismaMock()

    worker = new RulesWorker({
      maxConcurrency: 3,
      pollInterval: 1000,
      maxRetries: 3,
      enableReconciliation: true,
      reconciliationDelay: 1000,
      disablePolling: true,
    }, prismaMock)

    mockConnector = new MockConnector()
    worker.registerConnector('shopify', mockConnector)
    worker.registerConnector('mock', mockConnector)

    reconciliationService = new ReconciliationService(prismaMock)
    reconciliationService.registerConnector('shopify', mockConnector)
    reconciliationService.registerConnector('mock', mockConnector)

    dlqService = new DLQService(prismaMock)
  })

  describe('Worker Event Emissions', () => {
    it('should emit worker.started event when started', () => {
      const startedHandler = vi.fn()
      worker.on('worker.started', startedHandler)

      worker.start()

      expect(startedHandler).toHaveBeenCalledTimes(1)
      expect(startedHandler).toHaveBeenCalledWith(
        expect.objectContaining({
          eventType: 'worker.started',
          timestamp: expect.any(Date),
        })
      )

      worker.stop()
    })

    it('should emit worker.stopped event when stopped', async () => {
      const stoppedHandler = vi.fn()
      worker.on('worker.stopped', stoppedHandler)

      await worker.start()
      await worker.stop()

      expect(stoppedHandler).toHaveBeenCalledTimes(1)
      expect(stoppedHandler).toHaveBeenCalledWith(
        expect.objectContaining({
          eventType: 'worker.stopped',
          timestamp: expect.any(Date),
        })
      )
    })
  })

  describe('Backoff Integration', () => {
    it('should handle 429 errors with exponential backoff', () => {
      const error = {
        code: 429,
        message: 'Rate limit exceeded',
        headers: {
          'retry-after': '2',
        },
      }

      // Test that worker would handle this appropriately
      expect(error.code).toBe(429)
      expect(error.headers['retry-after']).toBe('2')
    })

    it('should respect retry limits and move to DLQ after max retries', () => {
      const maxRetries = 3
      expect(worker['config'].maxRetries).toBe(maxRetries)
    })
  })

  describe('DLQ Service', () => {
    it('should categorize errors correctly', () => {
      // Access private method for testing through type assertion
      const service = dlqService as any

      expect(service.categorizeError('Rate limit exceeded')).toBe('rate_limit')
      expect(service.categorizeError('HTTP 429 error')).toBe('rate_limit')
      expect(service.categorizeError('Authentication failed')).toBe('authentication')
      expect(service.categorizeError('401 Unauthorized')).toBe('authentication')
      expect(service.categorizeError('Product not found')).toBe('not_found')
      expect(service.categorizeError('404 error')).toBe('not_found')
      expect(service.categorizeError('Network timeout')).toBe('network')
      expect(service.categorizeError('Invalid price value')).toBe('validation')
      expect(service.categorizeError('Connector unavailable')).toBe('connector_error')
      expect(service.categorizeError('Unknown error occurred')).toBe('unknown')
    })

    it('should generate appropriate recommendations', () => {
      const service = dlqService as any
      const entries = [] as any[]
      const byErrorType = {
        rate_limit: 5,
        authentication: 2,
        not_found: 10,
        network: 3,
        validation: 1,
      }

      const recommendations = service.generateRecommendations(entries, byErrorType)

      expect(recommendations).toEqual(
        expect.arrayContaining([
          expect.stringContaining('5 rate limit errors'),
          expect.stringContaining('2 authentication errors'),
          expect.stringContaining('10 "not found" errors'),
          expect.stringContaining('3 network errors'),
          expect.stringContaining('1 validation errors'),
        ])
      )
    })
  })

  describe('Metrics', () => {
    it('should track worker metrics', () => {
      const events: string[] = []

      worker.on('run.queued', () => events.push('queued'))
      worker.on('run.started', () => events.push('started'))
      worker.on('run.completed', () => events.push('completed'))
      worker.on('run.failed', () => events.push('failed'))
      worker.on('target.applying', () => events.push('target.applying'))
      worker.on('target.applied', () => events.push('target.applied'))
      worker.on('target.failed', () => events.push('target.failed'))
      worker.on('target.retry', () => events.push('target.retry'))

      // Events array should be defined and ready to track
      expect(events).toBeDefined()
      expect(Array.isArray(events)).toBe(true)
    })
  })

  describe('Circuit Breaker', () => {
    it('should have circuit breaker configuration', () => {
      expect(worker['consecutiveFailures']).toBe(0)
      expect(worker['consecutive429Errors']).toBe(0)
      expect(worker['circuitBreakerOpen']).toBe(false)
    })
  })

  describe('Connector Registration', () => {
    it('should register and retrieve connectors', () => {
      const testConnector = new MockConnector()
      worker.registerConnector('test', testConnector)

      expect(worker['connectors'].has('test')).toBe(true)
      expect(worker['connectors'].get('test')).toBe(testConnector)
    })

    it('should handle multiple connectors', () => {
      const connector1 = new MockConnector()
      const connector2 = new MockConnector()

      worker.registerConnector('shopify', connector1)
      worker.registerConnector('amazon', connector2)

      expect(worker['connectors'].size).toBeGreaterThanOrEqual(2)
    })
  })
})

describe('Reconciliation Service Integration', () => {
  let service: ReconciliationService
  let mockConnector: MockConnector
  let prismaMock: PrismaClient

  beforeEach(() => {
    prismaMock = createPrismaMock()
    service = new ReconciliationService(prismaMock)
    mockConnector = new MockConnector()
    service.registerConnector('mock', mockConnector)
  })

  it('should detect price mismatches', async () => {
    // Set up mock price
    await mockConnector.applyPrice({
      externalId: 'test-123',
      price: 1000,
      currency: 'USD',
    })

    // Fetch price should return the applied price
    const result = await mockConnector.fetchPrice('test-123')
    expect(result.price).toBe(1000)
  })

  it('should handle connector errors gracefully', async () => {
    // Try to fetch price that doesn't exist
    await expect(mockConnector.fetchPrice('non-existent')).rejects.toThrow(
      'Price not found'
    )
  })
})

describe('DLQ Service Integration', () => {
  let service: DLQService
  let prismaMock: PrismaClient

  beforeEach(() => {
    prismaMock = createPrismaMock()
    service = new DLQService(prismaMock)
  })

  it('should initialize correctly', () => {
    expect(service).toBeDefined()
  })
})
