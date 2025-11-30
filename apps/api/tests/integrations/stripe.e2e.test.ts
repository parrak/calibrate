import { describe, it, expect, beforeEach, vi } from 'vitest'
import { NextRequest } from 'next/server'
import { POST as connectRoute } from '../../app/api/integrations/stripe/connect/route'
import { POST as syncCatalogRoute } from '../../app/api/integrations/stripe/sync/catalog/route'
import { POST as syncTransactionsRoute } from '../../app/api/integrations/stripe/sync/transactions/route'
import { GET as transactionsRoute } from '../../app/api/projects/[slug]/transactions/route'

// Mock dependencies
const mocks = vi.hoisted(() => ({
    stripeAccount: {
        findUnique: vi.fn(),
        upsert: vi.fn(),
    },
    project: {
        findUnique: vi.fn().mockResolvedValue({ id: 'proj1', tenantId: 'tenant1', slug: 'demo' }),
    },
    membership: {
        findUnique: vi.fn().mockResolvedValue({ role: 'OWNER' }),
    },
    stripeProductMap: {
        findUnique: vi.fn(),
        create: vi.fn(),
    },
    stripePriceMap: {
        findUnique: vi.fn(),
        create: vi.fn(),
    },
    product: {
        create: vi.fn().mockResolvedValue({ id: 'prod1' }),
        update: vi.fn(),
    },
    sku: {
        findFirst: vi.fn(),
        create: vi.fn().mockResolvedValue({ id: 'sku1' }),
    },
    price: {
        create: vi.fn().mockResolvedValue({ id: 'price1' }),
        update: vi.fn(),
    },
    transaction: {
        findUnique: vi.fn(),
        create: vi.fn(),
    },
    $transaction: vi.fn((cb) => cb(mocks)),
}))

vi.mock('@calibr/db', () => ({
    prisma: () => mocks
}))

vi.mock('@calibr/security', () => ({
    getEncryptionService: () => ({
        encrypt: vi.fn().mockReturnValue('encrypted_key'),
        decrypt: vi.fn().mockReturnValue('sk_test_123')
    })
}))

// Helper to create requests
const makeRequest = (url: string, init?: RequestInit) => {
    const req = new Request(url, init) as any
    req.nextUrl = new URL(url)
    return req as NextRequest
}

import { StripeService } from '@calibr/connectors'

describe('Stripe Integration E2E (API Key)', () => {
    beforeEach(() => {
        vi.clearAllMocks()
        process.env.NEXT_PUBLIC_API_BASE = 'http://localhost:3000'
        process.env.STRIPE_CLIENT_SECRET = 'sk_test_fallback'

        // Mock StripeService methods to avoid real Stripe calls
        vi.spyOn(StripeService.prototype, 'getAccount').mockResolvedValue({
            id: 'acct_test123',
            email: 'test@example.com'
        } as any)

        vi.spyOn(StripeService.prototype, 'listProducts').mockResolvedValue({
            data: [
                { id: 'prod_1', name: 'Test Product', images: [], active: true }
            ],
            has_more: false
        } as any)

        vi.spyOn(StripeService.prototype, 'listPrices').mockResolvedValue({
            data: [
                { id: 'price_1', product: 'prod_1', unit_amount: 1000, currency: 'usd', active: true }
            ],
            has_more: false
        } as any)

        vi.spyOn(StripeService.prototype, 'listBalanceTransactions').mockResolvedValue({
            data: [{
                id: 'txn_123',
                type: 'charge',
                amount: 1000,
                currency: 'usd',
                status: 'available',
                fee: 100,
                net: 900,
                created: 1234567890
            }],
            has_more: false
        } as any)
    })

    describe('Connection Flow', () => {
        it('connects with valid API key', async () => {
            const req = makeRequest('http://localhost/api/integrations/stripe/connect', {
                method: 'POST',
                headers: {
                    Authorization: 'Bearer token',
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({ projectId: 'proj1', apiKey: 'sk_test_123' })
            })

            const res = await connectRoute(req)
            const body = await res.json()

            if (res.status !== 200) {
                console.log('Connection Flow Error:', res.status, body)
            }

            expect(res.status).toBe(200)
            expect(body.success).toBe(true)
            expect(body.accountId).toBe('acct_test123')
            expect(mocks.stripeAccount.upsert).toHaveBeenCalled()
        })

        it('fails with missing params', async () => {
            const req = makeRequest('http://localhost/api/integrations/stripe/connect', {
                method: 'POST',
                headers: {
                    Authorization: 'Bearer token',
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({ projectId: 'proj1' }) // Missing apiKey
            })

            const res = await connectRoute(req)
            expect(res.status).toBe(400)
        })
    })

    describe('Sync', () => {
        it('triggers catalog sync and writes to database', async () => {
            // Setup mocks for sync
            mocks.stripeAccount.findUnique.mockResolvedValue({
                projectId: 'proj1',
                tenantId: 'tenant1',
                secretKey: 'encrypted_key'
            })

            // First call returns null (for product sync -> create new)
            // Second call returns map (for price sync -> find product)
            mocks.stripeProductMap.findUnique
                .mockResolvedValueOnce(null)
                .mockResolvedValue({ productId: 'prod1', stripeProductId: 'prod_1' })

            mocks.stripePriceMap.findUnique.mockResolvedValue(null) // Simulate new price
            mocks.sku.findFirst.mockResolvedValue({ id: 'sku1' }) // Simulate existing SKU

            const req = makeRequest('http://localhost/api/integrations/stripe/sync/catalog', {
                method: 'POST',
                headers: {
                    Authorization: 'Bearer token',
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({ projectId: 'proj1' })
            })

            const res = await syncCatalogRoute(req)
            const body = await res.json()

            expect(res.status).toBe(200)
            expect(body.success).toBe(true)

            // Verify Product Creation
            expect(mocks.product.create).toHaveBeenCalledWith(expect.objectContaining({
                data: expect.objectContaining({
                    projectId: 'proj1',
                    name: 'Test Product',
                    code: 'prod_1',
                    status: 'ACTIVE'
                })
            }))

            // Verify Price Creation
            expect(mocks.price.create).toHaveBeenCalledWith(expect.objectContaining({
                data: expect.objectContaining({
                    currency: 'usd',
                    amount: 1000,
                    status: 'ACTIVE'
                })
            }))
        })

        it('triggers transaction sync', async () => {
            const req = makeRequest('http://localhost/api/integrations/stripe/sync/transactions', {
                method: 'POST',
                headers: {
                    Authorization: 'Bearer token',
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({ projectId: 'proj1' })
            })

            const res = await syncTransactionsRoute(req)
            const body = await res.json()

            expect(res.status).toBe(200)
            expect(body.success).toBe(true)
        })
    })

    describe('Transactions API', () => {
        it('fetches transactions', async () => {
            const req = makeRequest('http://localhost/api/projects/demo/transactions?userId=user1', {
                method: 'GET',
                headers: {
                    Authorization: 'Bearer token',
                }
            })

            // Mock membership check
            mocks.membership = {
                findUnique: vi.fn().mockResolvedValue({ role: 'OWNER' })
            }
            // Mock transactions
            mocks.transaction.findMany = vi.fn().mockResolvedValue([
                { id: 'txn1', amount: 1000, currency: 'usd', status: 'succeeded', occurredAt: new Date() }
            ])

            const res = await transactionsRoute(req, { params: Promise.resolve({ slug: 'demo' }) })
            const body = await res.json()

            expect(res.status).toBe(200)
            expect(body.data).toHaveLength(1)
            expect(body.data[0].id).toBe('txn1')
        })
    })
})
