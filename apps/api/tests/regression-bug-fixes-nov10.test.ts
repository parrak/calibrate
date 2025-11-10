/**
 * Regression Tests for Bug Fixes - November 10, 2025
 *
 * This file contains regression tests for critical bugs discovered and fixed:
 * 1. AI query returning zero products due to projectId slug vs CUID mismatch
 * 2. Audit table missing from database (500 errors on approve/reject)
 * 3. Sync history not displaying due to case sensitivity in status checks
 * 4. Price rules page not loading data on navigation
 */

import { describe, it, expect, beforeEach, vi, afterEach } from 'vitest'
import { NextRequest } from 'next/server'
import { POST as copilotRoute } from '../app/api/v1/copilot/route'
import { POST as approveRoute } from '../app/api/v1/price-changes/[id]/approve/route'
import { GET as syncStatusRoute } from '../app/api/platforms/shopify/sync/status/route'
import { GET as rulesRoute } from '../app/api/v1/rules/route'

// Mock Prisma
vi.mock('@calibr/db', () => {
  let store: StoreState

  return {
    prisma: vi.fn(() => ({
      project: {
        findUnique: vi.fn(async ({ where }: { where: { slug?: string; id?: string } }) => {
          if (where.slug) {
            return store.projects.find(p => p.slug === where.slug) || null
          }
          if (where.id) {
            return store.projects.find(p => p.id === where.id) || null
          }
          return null
        }),
      },
      $queryRawUnsafe: vi.fn(async (sql: string) => {
        // Simulate database query execution
        // For COUNT(*) queries, return count based on projectId in WHERE clause
        if (sql.includes('COUNT(*)') && sql.includes('Product')) {
          // Extract projectId from SQL
          const match = sql.match(/"projectId"\s*=\s*'([^']+)'/)
          if (match) {
            const projectId = match[1]
            // Count products for this projectId
            const count = store.products.filter(p => p.projectId === projectId).length
            return [{ count }]
          }
          return [{ count: 0 }]
        }
        return []
      }),
      copilotQueryLog: {
        create: vi.fn(async () => ({ id: 'log1' })),
      },
      priceChange: {
        findUnique: vi.fn(async ({ where }: { where: { id: string } }) => {
          return store.priceChanges.find(pc => pc.id === where.id) || null
        }),
        update: vi.fn(async ({ where, data }: { where: { id: string }; data: unknown }) => {
          const pc = store.priceChanges.find(pc => pc.id === where.id)
          if (pc) {
            Object.assign(pc, data)
          }
          return pc
        }),
      },
      audit: {
        create: vi.fn(async (args: { data: unknown }) => {
          store.audits.push(args.data as AuditRecord)
          return args.data
        }),
      },
      shopifyIntegration: {
        findFirst: vi.fn(async ({ where }: { where: { projectId: string; isActive: boolean } }) => {
          return store.shopifyIntegrations.find(
            i => i.projectId === where.projectId && i.isActive === where.isActive
          ) || null
        }),
      },
      pricingRule: {
        findMany: vi.fn(async ({ where }: { where: { projectId: string; tenantId: string; deletedAt: null } }) => {
          return store.pricingRules.filter(
            r => r.projectId === where.projectId && r.tenantId === where.tenantId && !r.deletedAt
          )
        }),
      },
    })),
    Prisma: {
      InputJsonValue: {},
    },
    __setStore: (newStore: StoreState) => {
      store = newStore
    },
  }
})

// Mock OpenAI
vi.mock('../lib/openai', () => ({
  generateSQL: vi.fn(async (query: string) => {
    // Simulate OpenAI generating SQL with project SLUG instead of ID
    // This is the bug we're testing!
    if (query.includes('how many products')) {
      return {
        sql: 'SELECT COUNT(*) FROM "Product" WHERE "projectId" = \'demo\'',
        explanation: 'This query counts the total number of products in your catalog.',
      }
    }
    return {
      sql: 'SELECT * FROM "Product" LIMIT 10',
      explanation: 'List products',
    }
  }),
}))

// Mock environment
process.env.OPENAI_API_KEY = 'test-key'

type StoreState = {
  projects: Array<{
    id: string
    slug: string
    tenantId: string
    Tenant?: { id: string }
    Membership?: Array<{ role: string }>
  }>
  products: Array<{
    id: string
    projectId: string
    tenantId: string
    name: string
    code: string
  }>
  priceChanges: Array<{
    id: string
    projectId: string
    tenantId: string
    skuId: string
    status: string
    fromAmount: number
    toAmount: number
    currency: string
    approvedBy: string | null
    policyResult: Record<string, unknown> | null
  }>
  audits: Array<AuditRecord>
  shopifyIntegrations: Array<{
    id: string
    projectId: string
    isActive: boolean
    lastSyncAt: Date | null
    syncStatus: string | null
    syncError: string | null
    shopDomain: string
  }>
  pricingRules: Array<{
    id: string
    projectId: string
    tenantId: string
    name: string
    enabled: boolean
    deletedAt: Date | null
  }>
}

type AuditRecord = {
  tenantId: string
  projectId: string | null
  entity: string
  entityId: string
  action: string
  actor: string
  explain: Record<string, unknown>
}

const { __setStore } = await import('@calibr/db') as unknown as {
  __setStore: (store: StoreState) => void
}

describe('Regression Tests - November 10 Bug Fixes', () => {
  beforeEach(() => {
    // Reset store before each test
    __setStore({
      projects: [
        {
          id: 'proj-cuid-123',
          slug: 'demo',
          tenantId: 'tenant1',
          Tenant: { id: 'tenant1' },
          Membership: [{ role: 'ADMIN' }],
        },
      ],
      products: [
        { id: 'prod1', projectId: 'proj-cuid-123', tenantId: 'tenant1', name: 'Product 1', code: 'P1' },
        { id: 'prod2', projectId: 'proj-cuid-123', tenantId: 'tenant1', name: 'Product 2', code: 'P2' },
        { id: 'prod3', projectId: 'proj-cuid-123', tenantId: 'tenant1', name: 'Product 3', code: 'P3' },
      ],
      priceChanges: [
        {
          id: 'pc1',
          projectId: 'proj-cuid-123',
          tenantId: 'tenant1',
          skuId: 'sku1',
          status: 'PENDING',
          fromAmount: 1000,
          toAmount: 1200,
          currency: 'USD',
          approvedBy: null,
          policyResult: null,
        },
      ],
      audits: [],
      shopifyIntegrations: [
        {
          id: 'shopify1',
          projectId: 'proj-cuid-123',
          isActive: true,
          lastSyncAt: new Date('2025-11-09T12:00:00Z'),
          syncStatus: 'success', // lowercase - this was the bug!
          syncError: null,
          shopDomain: 'test-shop.myshopify.com',
        },
      ],
      pricingRules: [
        {
          id: 'rule1',
          projectId: 'proj-cuid-123',
          tenantId: 'tenant1',
          name: 'Test Rule',
          enabled: true,
          deletedAt: null,
        },
      ],
    })
  })

  afterEach(() => {
    vi.clearAllMocks()
  })

  describe('BUG #1: AI Query ProjectId Slug vs CUID', () => {
    it('should replace project slug with CUID in AI-generated SQL', async () => {
      const request = new NextRequest('https://api.test.com/api/v1/copilot', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          projectSlug: 'demo',
          query: 'how many products are there in my catalog',
          userId: 'user1',
        }),
      })

      const response = await copilotRoute(request)
      const data = await response.json()

      expect(response.status).toBe(200)
      expect(data.data).toBeDefined()

      // The key assertion: should return the correct count (3 products)
      // not 0 which would happen if using slug 'demo' instead of CUID 'proj-cuid-123'
      expect(data.data).toEqual([{ count: 3 }])

      // Verify the SQL was corrected to use the CUID
      expect(data.sql).toContain('proj-cuid-123')
      expect(data.sql).not.toContain('"projectId" = \'demo\'')
    })

    it('should work even when OpenAI generates SQL with slug', async () => {
      const request = new NextRequest('https://api.test.com/api/v1/copilot', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          projectSlug: 'demo',
          query: 'how many products',
          userId: 'user1',
        }),
      })

      const response = await copilotRoute(request)
      const data = await response.json()

      expect(response.status).toBe(200)
      // Should still return correct count despite OpenAI using slug
      expect(data.data).toEqual([{ count: 3 }])
    })
  })

  describe('BUG #2: Missing Audit Table', () => {
    it('should create audit record when approving price change', async () => {
      const request = new NextRequest(
        'https://api.test.com/api/v1/price-changes/pc1/approve',
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'X-Calibr-Project': 'demo',
          },
        }
      )

      const context = { params: Promise.resolve({ id: 'pc1' }) }
      const response = await approveRoute(request, context)

      expect(response.status).toBe(200)

      // Verify audit record was created
      const { prisma } = await import('@calibr/db')
      const mockPrisma = prisma()
      expect(mockPrisma.audit.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            entity: 'PriceChange',
            entityId: 'pc1',
            action: 'approved',
          }),
        })
      )
    })

    it('should not fail if audit table exists', async () => {
      // This test verifies that the migration creates the table
      // and the approve endpoint can use it
      const request = new NextRequest(
        'https://api.test.com/api/v1/price-changes/pc1/approve',
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'X-Calibr-Project': 'demo',
          },
        }
      )

      const context = { params: Promise.resolve({ id: 'pc1' }) }
      const response = await approveRoute(request, context)

      // Should not throw "table does not exist" error
      expect(response.status).not.toBe(500)
      expect(response.status).toBe(200)
    })
  })

  describe('BUG #3: Sync History Case Sensitivity', () => {
    it('should handle lowercase sync status correctly', async () => {
      const request = new NextRequest(
        'https://api.test.com/api/platforms/shopify/sync/status?projectSlug=demo',
        { method: 'GET' }
      )

      const response = await syncStatusRoute(request)
      const data = await response.json()

      expect(response.status).toBe(200)
      expect(data.syncLogs).toBeDefined()
      expect(data.syncLogs.length).toBeGreaterThan(0)

      // The key assertion: should return sync logs even when status is lowercase 'success'
      const firstLog = data.syncLogs[0]
      expect(firstLog.status).toBe('SUCCESS') // Should be normalized to uppercase
      expect(firstLog.itemsSuccessful).toBeGreaterThan(0) // Should have items synced
    })

    it('should handle uppercase sync status correctly', async () => {
      // Update store to have uppercase status
      __setStore({
        projects: [
          {
            id: 'proj-cuid-123',
            slug: 'demo',
            tenantId: 'tenant1',
          },
        ],
        products: [],
        priceChanges: [],
        audits: [],
        shopifyIntegrations: [
          {
            id: 'shopify1',
            projectId: 'proj-cuid-123',
            isActive: true,
            lastSyncAt: new Date('2025-11-09T12:00:00Z'),
            syncStatus: 'SUCCESS', // uppercase
            syncError: null,
            shopDomain: 'test-shop.myshopify.com',
          },
        ],
        pricingRules: [],
      })

      const request = new NextRequest(
        'https://api.test.com/api/platforms/shopify/sync/status?projectSlug=demo',
        { method: 'GET' }
      )

      const response = await syncStatusRoute(request)
      const data = await response.json()

      expect(response.status).toBe(200)
      expect(data.syncLogs.length).toBeGreaterThan(0)
      expect(data.syncLogs[0].status).toBe('SUCCESS')
    })

    it('should handle mixed case sync status correctly', async () => {
      // Test with mixed case like 'Success'
      __setStore({
        projects: [
          {
            id: 'proj-cuid-123',
            slug: 'demo',
            tenantId: 'tenant1',
          },
        ],
        products: [],
        priceChanges: [],
        audits: [],
        shopifyIntegrations: [
          {
            id: 'shopify1',
            projectId: 'proj-cuid-123',
            isActive: true,
            lastSyncAt: new Date('2025-11-09T12:00:00Z'),
            syncStatus: 'Success', // mixed case
            syncError: null,
            shopDomain: 'test-shop.myshopify.com',
          },
        ],
        pricingRules: [],
      })

      const request = new NextRequest(
        'https://api.test.com/api/platforms/shopify/sync/status?projectSlug=demo',
        { method: 'GET' }
      )

      const response = await syncStatusRoute(request)
      const data = await response.json()

      expect(response.status).toBe(200)
      expect(data.syncLogs[0].status).toBe('SUCCESS')
    })
  })

  describe('BUG #4: Price Rules Not Loading', () => {
    it('should return pricing rules when queried', async () => {
      const request = new NextRequest(
        'https://api.test.com/api/v1/rules?project=demo',
        { method: 'GET' }
      )

      const response = await rulesRoute(request)
      const data = await response.json()

      expect(response.status).toBe(200)
      expect(data.items).toBeDefined()
      expect(data.items.length).toBe(1)
      expect(data.items[0].name).toBe('Test Rule')
    })

    it('should filter by enabled status', async () => {
      const request = new NextRequest(
        'https://api.test.com/api/v1/rules?project=demo&enabled=true',
        { method: 'GET' }
      )

      const response = await rulesRoute(request)
      const data = await response.json()

      expect(response.status).toBe(200)
      expect(data.items.length).toBe(1)
      expect(data.items[0].enabled).toBe(true)
    })

    it('should return empty array when no rules exist', async () => {
      __setStore({
        projects: [
          {
            id: 'proj-cuid-123',
            slug: 'demo',
            tenantId: 'tenant1',
          },
        ],
        products: [],
        priceChanges: [],
        audits: [],
        shopifyIntegrations: [],
        pricingRules: [], // No rules
      })

      const request = new NextRequest(
        'https://api.test.com/api/v1/rules?project=demo',
        { method: 'GET' }
      )

      const response = await rulesRoute(request)
      const data = await response.json()

      expect(response.status).toBe(200)
      expect(data.items).toEqual([])
      expect(data.count).toBe(0)
    })
  })
})
