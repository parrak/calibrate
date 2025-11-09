import { describe, it, expect, beforeEach, vi } from 'vitest'
import { NextRequest } from 'next/server'
import { POST as copilotRoute } from '../app/api/v1/copilot/route'

type StoreState = {
  projects: Array<{ id: string; slug: string; tenantId: string }>
  tenants: Array<{ id: string; name: string }>
  memberships: Array<{ userId: string; projectId: string; role: string }>
  priceChanges: Array<{
    id: string
    tenantId: string
    projectId: string
    skuId: string
    fromAmount: number
    toAmount: number
    currency: string
    status: string
    createdAt: Date
    policyResult: Record<string, unknown> | null
  }>
  skus: Array<{
    id: string
    code: string
    name: string
    productId: string
    attributes: Record<string, unknown> | null
  }>
  products: Array<{
    id: string
    tenantId: string
    projectId: string
    code: string
    name: string
  }>
  prices: Array<{
    id: string
    skuId: string
    amount: number
    currency: string
    status: string
  }>
  copilotQueryLogs: Array<{
    id: string
    tenantId: string
    projectId: string
    userId?: string
    userRole?: string
    query: string
    generatedSQL?: string
    queryType: string
    resultCount?: number
    executionTime: number
    schemaVersion?: string
    method?: string
    success: boolean
    error?: string
    metadata?: Record<string, unknown>
    createdAt: Date
  }>
}

const uid = () => Math.random().toString(36).slice(2)

const initialState = (): StoreState => ({
  projects: [
    { id: 'proj1', slug: 'demo', tenantId: 'tenant1' },
    { id: 'proj2', slug: 'other', tenantId: 'tenant2' },
  ],
  tenants: [
    { id: 'tenant1', name: 'Demo Tenant' },
    { id: 'tenant2', name: 'Other Tenant' },
  ],
  memberships: [
    { userId: 'user1', projectId: 'proj1', role: 'ADMIN' },
    { userId: 'user2', projectId: 'proj1', role: 'VIEWER' },
    { userId: 'user3', projectId: 'proj2', role: 'ADMIN' },
  ],
  priceChanges: [
    {
      id: 'pc1',
      tenantId: 'tenant1',
      projectId: 'proj1',
      skuId: 'sku1',
      fromAmount: 1000,
      toAmount: 1200,
      currency: 'USD',
      status: 'APPLIED',
      createdAt: new Date('2025-01-01T00:00:00Z'),
      policyResult: { checks: [{ ok: true }, { ok: true }] },
    },
  ],
  skus: [
    {
      id: 'sku1',
      code: 'SKU-001',
      name: 'Test Product',
      productId: 'prod1',
      attributes: { cost: 500 },
    },
  ],
  products: [
    {
      id: 'prod1',
      tenantId: 'tenant1',
      projectId: 'proj1',
      code: 'PROD-001',
      name: 'Test Product',
    },
  ],
  prices: [
    {
      id: 'price1',
      skuId: 'sku1',
      amount: 1200,
      currency: 'USD',
      status: 'ACTIVE',
    },
  ],
  copilotQueryLogs: [],
})

const store = (() => {
  let state = initialState()

  const clone = <T,>(value: T): T => structuredClone(value)

  const client = {
    project: {
      findUnique: async ({ where, include }: { where: { slug?: string }; include?: unknown }) => {
        if (where?.slug) {
          const project = clone(state.projects.find((p) => p.slug === where.slug) ?? null)
          if (!project) return null

          if (include && typeof include === 'object' && 'Membership' in include) {
            const membershipInclude = include.Membership as { where?: { userId?: string } }
            if (membershipInclude?.where?.userId) {
              const membership = state.memberships.find(
                (m) => m.projectId === project.id && m.userId === membershipInclude.where.userId
              )
              return {
                ...project,
                Membership: membership ? [clone(membership)] : [],
              }
            }
          }

          return project
        }
        return null
      },
    },
    priceChange: {
      findFirst: async ({ where, orderBy }: { where: { projectId: string }; orderBy?: unknown }) => {
        const matches = state.priceChanges.filter((pc) => pc.projectId === where.projectId)
        if (matches.length === 0) return null
        return clone(matches[0])
      },
      count: async ({ where }: { where: { projectId: string; createdAt?: { gte: Date } } }) => {
        let matches = state.priceChanges.filter((pc) => pc.projectId === where.projectId)
        if (where.createdAt?.gte) {
          matches = matches.filter((pc) => pc.createdAt >= where.createdAt!.gte)
        }
        return matches.length
      },
      groupBy: async ({
        by,
        where,
        _count,
      }: {
        by: string[]
        where: { projectId: string; createdAt?: { gte: Date } }
        _count: boolean
      }) => {
        let matches = state.priceChanges.filter((pc) => pc.projectId === where.projectId)
        if (where.createdAt?.gte) {
          matches = matches.filter((pc) => pc.createdAt >= where.createdAt!.gte)
        }

        const groups = matches.reduce(
          (acc, pc) => {
            const key = by.map((field) => pc[field as keyof typeof pc]).join('|')
            if (!acc[key]) {
              acc[key] = { status: pc.status, _count: 0 }
            }
            acc[key]._count++
            return acc
          },
          {} as Record<string, { status: string; _count: number }>
        )

        return Object.values(groups)
      },
    },
    sku: {
      findUnique: async ({ where, select }: { where: { id: string }; select?: unknown }) => {
        const sku = state.skus.find((s) => s.id === where.id)
        if (!sku) return null
        return clone(sku)
      },
      findMany: async ({ where, select }: { where: { Product: { projectId: string } }; select?: unknown }) => {
        const projectId = where.Product.projectId
        const products = state.products.filter((p) => p.projectId === projectId)
        const productIds = products.map((p) => p.id)
        const skus = state.skus.filter((s) => productIds.includes(s.productId))

        return skus.map((sku) => {
          const prices = state.prices.filter((p) => p.skuId === sku.id && p.status === 'ACTIVE')
          return clone({
            ...sku,
            Price: prices.slice(0, 1),
          })
        })
      },
    },
    copilotQueryLog: {
      create: async ({ data }: { data: Omit<StoreState['copilotQueryLogs'][0], 'id' | 'createdAt'> }) => {
        const log = {
          id: uid(),
          ...data,
          createdAt: new Date(),
        }
        state.copilotQueryLogs.push(log)
        return clone(log)
      },
    },
  }

  return {
    get state() {
      return state
    },
    client,
    reset() {
      state = initialState()
    },
  }
})()

vi.mock('@calibr/db', () => ({
  prisma: () => store.client,
}))

// Mock OpenAI
vi.mock('@/lib/openai', () => ({
  generateSQL: vi.fn(async (query: string) => ({
    sql: 'SELECT * FROM "PriceChange" WHERE "projectId" = \'proj1\' LIMIT 100',
    explanation: 'Mock AI explanation',
  })),
}))

const makeRequest = (
  url: string,
  init: { method?: string; headers?: Record<string, string>; body?: string } = {}
) => {
  const { method = 'POST', headers = {}, body } = init
  const request = new Request(url, { method, headers, body })
  return new NextRequest(request)
}

describe('copilot API', () => {
  beforeEach(() => {
    store.reset()
  })

  it('requires projectSlug and query', async () => {
    const req = makeRequest('http://localhost/api/v1/copilot', {
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({}),
    })
    const res = await copilotRoute(req)
    expect(res.status).toBe(400)
    const body = await res.json()
    expect(body.error).toBe('projectSlug and query are required')
  })

  it('enforces RBAC - denies access without userId', async () => {
    const req = makeRequest('http://localhost/api/v1/copilot', {
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        projectSlug: 'demo',
        query: 'Show me price changes',
      }),
    })
    const res = await copilotRoute(req)
    expect(res.status).toBe(403)
    const body = await res.json()
    expect(body.error).toBe('Access denied')
  })

  it('enforces RBAC - denies access for non-member', async () => {
    const req = makeRequest('http://localhost/api/v1/copilot', {
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        projectSlug: 'demo',
        query: 'Show me price changes',
        userId: 'user999', // Not a member
      }),
    })
    const res = await copilotRoute(req)
    expect(res.status).toBe(403)
    const body = await res.json()
    expect(body.error).toBe('Access denied')
  })

  it('allows VIEWER role to query (read-only)', async () => {
    const req = makeRequest('http://localhost/api/v1/copilot', {
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        projectSlug: 'demo',
        query: 'Why was this price changed?',
        userId: 'user2', // VIEWER role
      }),
    })
    const res = await copilotRoute(req)
    expect(res.status).toBe(200)
    const body = await res.json()
    expect(body.answer).toBeDefined()
    expect(body.method).toBeDefined()
  })

  it('allows ADMIN role to query', async () => {
    const req = makeRequest('http://localhost/api/v1/copilot', {
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        projectSlug: 'demo',
        query: 'Why was this price changed?',
        userId: 'user1', // ADMIN role
      }),
    })
    const res = await copilotRoute(req)
    expect(res.status).toBe(200)
    const body = await res.json()
    expect(body.answer).toBeDefined()
  })

  it('logs queries to CopilotQueryLog', async () => {
    const req = makeRequest('http://localhost/api/v1/copilot', {
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        projectSlug: 'demo',
        query: 'Show me low margin products',
        userId: 'user1',
      }),
    })

    const initialLogCount = store.state.copilotQueryLogs.length

    const res = await copilotRoute(req)
    expect(res.status).toBe(200)

    // Check that a log entry was created
    expect(store.state.copilotQueryLogs.length).toBe(initialLogCount + 1)

    const log = store.state.copilotQueryLogs[store.state.copilotQueryLogs.length - 1]
    expect(log.query).toBe('Show me low margin products')
    expect(log.userId).toBe('user1')
    expect(log.success).toBe(true)
    expect(log.projectId).toBe('proj1')
    expect(log.tenantId).toBe('tenant1')
  })

  it('handles "why was price changed" pattern query', async () => {
    const req = makeRequest('http://localhost/api/v1/copilot', {
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        projectSlug: 'demo',
        query: 'Why was this price changed?',
        userId: 'user1',
      }),
    })
    const res = await copilotRoute(req)
    expect(res.status).toBe(200)
    const body = await res.json()
    expect(body.answer).toContain('Price')
    expect(body.data).toBeDefined()
    expect(body.data.sku).toBe('SKU-001')
  })

  it('handles "what if increase" pattern query', async () => {
    const req = makeRequest('http://localhost/api/v1/copilot', {
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        projectSlug: 'demo',
        query: 'What if I increase prices by 15%?',
        userId: 'user1',
      }),
    })
    const res = await copilotRoute(req)
    expect(res.status).toBe(200)
    const body = await res.json()
    expect(body.answer).toContain('Increasing')
    expect(body.data).toBeDefined()
    expect(body.data.affectedProducts).toBeDefined()
  })

  it('handles "low margin" pattern query', async () => {
    const req = makeRequest('http://localhost/api/v1/copilot', {
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        projectSlug: 'demo',
        query: 'Show me products with low margins',
        userId: 'user1',
      }),
    })
    const res = await copilotRoute(req)
    expect(res.status).toBe(200)
    const body = await res.json()
    expect(body.answer).toBeDefined()
    expect(body.sql).toBeDefined()
  })

  it('handles "how many price changes" pattern query', async () => {
    const req = makeRequest('http://localhost/api/v1/copilot', {
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        projectSlug: 'demo',
        query: 'How many price changes last week?',
        userId: 'user1',
      }),
    })
    const res = await copilotRoute(req)
    expect(res.status).toBe(200)
    const body = await res.json()
    expect(body.answer).toContain('price changes')
    expect(body.data).toBeDefined()
    expect(body.data.total).toBeDefined()
  })

  it('provides suggestions for unknown queries', async () => {
    const req = makeRequest('http://localhost/api/v1/copilot', {
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        projectSlug: 'demo',
        query: 'random query',
        userId: 'user1',
      }),
    })
    const res = await copilotRoute(req)
    expect(res.status).toBe(200)
    const body = await res.json()
    expect(body.suggestions).toBeDefined()
    expect(Array.isArray(body.suggestions)).toBe(true)
    expect(body.suggestions.length).toBeGreaterThan(0)
  })

  it('includes metadata in response', async () => {
    const req = makeRequest('http://localhost/api/v1/copilot', {
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        projectSlug: 'demo',
        query: 'Why was this price changed?',
        userId: 'user1',
      }),
    })
    const res = await copilotRoute(req)
    expect(res.status).toBe(200)
    const body = await res.json()
    expect(body.metadata).toBeDefined()
    expect(body.metadata.schemaVersion).toBe('1.4.0')
    expect(body.metadata.executionTime).toBeGreaterThanOrEqual(0)
    expect(body.metadata.role).toBe('ADMIN')
  })

  it('isolates queries by tenant (cross-tenant protection)', async () => {
    // User from tenant2 tries to query tenant1's project
    const req = makeRequest('http://localhost/api/v1/copilot', {
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        projectSlug: 'demo', // tenant1's project
        query: 'Show me price changes',
        userId: 'user3', // user from tenant2
      }),
    })
    const res = await copilotRoute(req)
    expect(res.status).toBe(403)
    const body = await res.json()
    expect(body.error).toBe('Access denied')
  })
})
