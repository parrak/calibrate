import { describe, it, expect, vi, beforeEach } from 'vitest'
import { RulesWorker } from '../src/rulesWorker'
import { prisma } from '@calibr/db'

// Mock dependencies
vi.mock('@calibr/db', () => ({
    prisma: vi.fn(),
    EventWriter: vi.fn(),
    OutboxWorker: vi.fn()
}))

vi.mock('@calibr/monitor', () => ({
    logger: {
        info: vi.fn(),
        warn: vi.fn(),
        error: vi.fn()
    }
}))

describe('RulesWorker Guardrails', () => {
    let worker: RulesWorker

    beforeEach(() => {
        vi.clearAllMocks()
        worker = new RulesWorker()
    })

    // Helper to access private method
    const checkGuardrails = (policy: any, target: any, newPrice: number, beforeData: any) => {
        // @ts-ignore - Accessing private method for testing
        return worker.checkGuardrails(policy, target, newPrice, beforeData)
    }

    describe('checkGuardrails', () => {
        const mockTarget = { id: 'target-1' }
        const mockBeforeData = { unit_amount: 1000 } // $10.00

        it('should pass when no limits are violated', () => {
            const policy = {
                minPriceCents: 500,
                maxPriceIncreasePct: 10,
                maxPriceDecreasePct: 10
            }

            expect(() => checkGuardrails(policy, mockTarget, 1050, mockBeforeData)).not.toThrow()
        })

        it('should throw when price is below floor', () => {
            const policy = {
                minPriceCents: 1200
            }

            expect(() => checkGuardrails(policy, mockTarget, 1100, mockBeforeData)).toThrow(/below floor/)
        })

        it('should throw when price increase exceeds limit', () => {
            const policy = {
                maxPriceIncreasePct: 10 // Max 10% increase ($11.00)
            }

            // Try increasing to $12.00 (20%)
            expect(() => checkGuardrails(policy, mockTarget, 1200, mockBeforeData)).toThrow(/Price increase 20.00% exceeds limit/)
        })

        it('should throw when price decrease exceeds limit', () => {
            const policy = {
                maxPriceDecreasePct: 10 // Max 10% decrease ($9.00)
            }

            // Try decreasing to $8.00 (20%)
            expect(() => checkGuardrails(policy, mockTarget, 800, mockBeforeData)).toThrow(/Price decrease 20.00% exceeds limit/)
        })
        it('should pass when current price is 0 (cannot calculate % increase)', () => {
            const policy = {
                maxPriceIncreasePct: 10
            }
            // 0 -> 100
            expect(() => checkGuardrails(policy, mockTarget, 100, { unit_amount: 0 })).not.toThrow()
        })
    })
})
