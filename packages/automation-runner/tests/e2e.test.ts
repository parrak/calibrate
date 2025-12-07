import { describe, it, expect, beforeEach, vi } from 'vitest'
import { RulesWorker, ReconciliationService, DLQService } from '../src'
import type { PrismaClient } from '@calibr/db'
import type { PriceConnector } from '../src/types'

// Reusing MockConnector logic
class MockConnector implements PriceConnector {
    name = 'mock'
    private failureTargets = new Set<string>()
    private prices = new Map<string, number>()
    private rateLimitTargets = new Set<string>()

    setFailure(externalId: string) {
        this.failureTargets.add(externalId)
    }

    clearFailure(externalId: string) {
        this.failureTargets.delete(externalId)
    }

    setRateLimit(externalId: string) {
        this.rateLimitTargets.add(externalId)
    }

    async applyPrice(params: {
        externalId: string
        variantId?: string
        price: number
        currency: string
    }): Promise<{ success: boolean; externalId?: string; error?: string }> {
        if (this.failureTargets.has(params.externalId)) {
            return { success: false, error: 'Simulated failure' }
        }

        if (this.rateLimitTargets.has(params.externalId)) {
            const error = new Error('Rate limit exceeded')
            // @ts-ignore
            error.code = 429
            // @ts-ignore
            error.headers = { 'retry-after': '1' }
            throw error
        }

        this.prices.set(params.externalId, params.price)
        return { success: true, externalId: params.externalId }
    }

    async fetchPrice(externalId: string): Promise<{ price: number; currency: string }> {
        const price = this.prices.get(externalId) || 1000
        return { price, currency: 'USD' }
    }

    async isHealthy() { return true }
}

// Create the mock instance using vi.hoisted to ensure it's available in vi.mock
const { prismaMock } = vi.hoisted(() => {
    const store = {
        ruleRun: new Map<string, any>(),
        ruleTarget: new Map<string, any>(),
        pricingRule: new Map<string, any>(),
        product: new Map<string, any>(),
        audit: [] as any[],
        eventLog: [] as any[]
    }

    const mock = {
        ruleRun: {
            findUnique: vi.fn(async ({ where }) => {
                const run = store.ruleRun.get(where.id)
                if (!run) return null
                const targets = Array.from(store.ruleTarget.values()).filter(t => t.ruleRunId === where.id)
                return { ...run, RuleTarget: targets, PricingRule: store.pricingRule.get(run.ruleId) }
            }),
            create: vi.fn(async ({ data }) => {
                store.ruleRun.set(data.id, data)
                return data
            }),
            update: vi.fn(async ({ where, data }) => {
                const run = store.ruleRun.get(where.id)
                const updated = { ...run, ...data }
                store.ruleRun.set(where.id, updated)
                return updated
            })
        },
        ruleTarget: {
            create: vi.fn(async ({ data }) => {
                store.ruleTarget.set(data.id, data)
                return data
            }),
            update: vi.fn(async ({ where, data }) => {
                const target = store.ruleTarget.get(where.id)
                const updated = { ...target, ...data }
                store.ruleTarget.set(where.id, updated)
                return updated
            }),
            updateMany: vi.fn(async ({ where, data }) => {
                let count = 0
                for (const target of store.ruleTarget.values()) {
                    if (target.ruleRunId === where.ruleRunId && (where.status === undefined || target.status === where.status)) {
                        store.ruleTarget.set(target.id, { ...target, ...data })
                        count++
                    }
                }
                return { count }
            }),
            findMany: vi.fn(async ({ where }) => {
                return Array.from(store.ruleTarget.values()).filter(t => {
                    if (where.ruleRunId && t.ruleRunId !== where.ruleRunId) return false
                    if (where.status && t.status !== where.status) return false
                    if (where.id?.in && !where.id.in.includes(t.id)) return false
                    return true
                })
            }),
            count: vi.fn(async () => 0)
        },
        pricingRule: {
            findUnique: vi.fn(async ({ where }) => store.pricingRule.get(where.id))
        },
        product: {
            findUnique: vi.fn(async ({ where }) => store.product.get(where.id)),
            findMany: vi.fn(async () => Array.from(store.product.values()))
        },
        audit: {
            create: vi.fn(async ({ data }) => {
                store.audit.push(data)
                return data
            })
        },
        guardrailPolicy: {
            findUnique: vi.fn(async () => null)
        },
        _reset: () => {
            store.ruleRun.clear()
            store.ruleTarget.clear()
            store.pricingRule.clear()
            store.product.clear()
            store.audit.length = 0
            store.eventLog.length = 0
        },
        _store: store
    }

    return { prismaMock: mock as unknown as PrismaClient & { _reset: () => void, _store: typeof store } }
})

// Mock the @calibr/db module
vi.mock('@calibr/db', async () => {
    return {
        prisma: () => prismaMock,
        EventWriter: vi.fn().mockImplementation(() => ({
            writeEventWithOutbox: vi.fn().mockResolvedValue(undefined)
        })),
        OutboxWorker: vi.fn().mockImplementation(() => ({
            subscribe: vi.fn(),
            start: vi.fn(),
            stop: vi.fn()
        }))
    }
})

vi.mock('@calibr/monitor', () => ({
    logger: {
        info: vi.fn(),
        warn: vi.fn(),
        error: vi.fn()
    },
    registerGauge: vi.fn(),
    setGauge: vi.fn()
}))

describe('Automation Runner E2E', () => {
    let worker: RulesWorker
    let connector: MockConnector
    let dlqService: DLQService

    beforeEach(() => {
        // Reset mocks
        vi.clearAllMocks()
        prismaMock._reset()
        connector = new MockConnector()

        worker = new RulesWorker({
            maxConcurrency: 5,
            pollInterval: 100,
            maxRetries: 2,
            disablePolling: true // We manually trigger processing
        })

        worker.registerConnector('shopify', connector)

        dlqService = new DLQService()
    })

    it('should execute a full successful run', async () => {
        // 1. Setup Data
        const ruleId = 'rule-1'
        const productId = 'prod-1'

        prismaMock._store.pricingRule.set(ruleId, {
            id: ruleId,
            tenantId: 'tenant-1',
            projectId: 'proj-1',
            transformJson: { op: 'percent', value: 10 }
        })

        prismaMock._store.product.set(productId, {
            id: productId,
            tenantId: 'tenant-1',
            channelRefs: { channel: 'shopify', externalId: 'ext-1' },
            Sku: [{ id: 'sku-1', Price: [{ amount: 1000, currency: 'USD' }] }]
        })

        // 2. Materialize
        const run = await worker.materialize(ruleId)
        expect(run.status).toBe('PREVIEW')

        // 3. Apply (Queue)
        await worker.queueRun(run.id)

        // Manually trigger worker processing since polling is disabled
        // @ts-ignore - Accessing private method for testing
        await worker.handleApplyJob({ payload: { runId: run.id }, correlationId: 'test' })

        // 4. Verify
        const status = await worker.getRunStatus(run.id)
        expect(status?.status).toBe('APPLIED')
        expect(status?.appliedTargets).toBe(1)
        expect(status?.failedTargets).toBe(0)
    })

    it('should handle partial failures and retry', async () => {
        // 1. Setup Data
        const ruleId = 'rule-2'

        prismaMock._store.pricingRule.set(ruleId, {
            id: ruleId,
            tenantId: 'tenant-1',
            projectId: 'proj-1',
            transformJson: { op: 'absolute', value: 500 }
        })

        // 2 products, one will fail
        prismaMock._store.product.set('prod-1', {
            id: 'prod-1',
            channelRefs: { channel: 'shopify', externalId: 'success-1' },
            Sku: [{ id: 'sku-1', Price: [{ amount: 1000, currency: 'USD' }] }]
        })

        prismaMock._store.product.set('prod-2', {
            id: 'prod-2',
            channelRefs: { channel: 'shopify', externalId: 'fail-1' },
            Sku: [{ id: 'sku-2', Price: [{ amount: 1000, currency: 'USD' }] }]
        })

        connector.setFailure('fail-1')

        // 2. Materialize & Apply
        const run = await worker.materialize(ruleId)
        await worker.queueRun(run.id)

        // @ts-ignore
        await worker.handleApplyJob({ payload: { runId: run.id }, correlationId: 'test' })

        // 3. Verify Partial State
        const status = await worker.getRunStatus(run.id)
        expect(status?.status).toBe('PARTIAL')
        expect(status?.appliedTargets).toBe(1)
        expect(status?.failedTargets).toBe(1)

        // 4. Retry Failed
        connector.clearFailure('fail-1') // Fix the issue
        await dlqService.retryFailed(run.id)

        // Re-process
        // @ts-ignore
        await worker.handleApplyJob({ payload: { runId: run.id }, correlationId: 'test' })

        // 5. Verify Success
        const finalStatus = await worker.getRunStatus(run.id)
        expect(finalStatus?.status).toBe('APPLIED')
        expect(finalStatus?.appliedTargets).toBe(2)
    })
})
