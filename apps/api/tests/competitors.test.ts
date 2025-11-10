import { describe, it, expect, beforeEach, vi } from 'vitest'
import { NextRequest } from 'next/server'
import { GET as listRoute, POST as createRoute } from '../app/api/v1/competitors/route'
import { authSecurityManager } from '../lib/auth-security'

type CompetitorRecord = {
  id: string
  tenantId: string
  projectId: string
  name: string
  domain: string
  channel: string
  isActive: boolean
  createdAt: Date
  updatedAt: Date
}

type CompetitorProduct = {
  id: string
  competitorId: string
  skuId: string | null
  name: string
  skuCode: string | null
  url: string
  imageUrl: string | null
  isActive: boolean
  createdAt: Date
  updatedAt: Date
}

type CompetitorPrice = {
  id: string
  productId: string
  amount: number
  currency: string
  channel: string | null
  isOnSale: boolean
  saleEndsAt: Date | null
  stockStatus: string | null
  createdAt: Date
}

type StoreState = {
  projects: Array<{ id: string; slug: string; tenantId: string }>
  competitors: CompetitorRecord[]
  competitorProducts: CompetitorProduct[]
  competitorPrices: CompetitorPrice[]
}

const uid = () => Math.random().toString(36).slice(2)

const initialState = (): StoreState => ({
  projects: [{ id: 'proj1', slug: 'demo', tenantId: 'tenant1' }],
  competitors: [
    {
      id: 'comp1',
      tenantId: 'tenant1',
      projectId: 'proj1',
      name: 'Competitor Store 1',
      domain: 'competitor1.com',
      channel: 'shopify',
      isActive: true,
      createdAt: new Date('2025-01-01T00:00:00Z'),
      updatedAt: new Date('2025-01-01T00:00:00Z'),
    },
    {
      id: 'comp2',
      tenantId: 'tenant1',
      projectId: 'proj1',
      name: 'Competitor Store 2',
      domain: 'competitor2.com',
      channel: 'amazon',
      isActive: true,
      createdAt: new Date('2025-01-02T00:00:00Z'),
      updatedAt: new Date('2025-01-02T00:00:00Z'),
    },
  ],
  competitorProducts: [
    {
      id: 'prod1',
      competitorId: 'comp1',
      skuId: 'sku1',
      name: 'Test Product 1',
      skuCode: 'SKU-001',
      url: 'https://competitor1.com/products/test-1',
      imageUrl: 'https://competitor1.com/images/test-1.jpg',
      isActive: true,
      createdAt: new Date('2025-01-01T00:00:00Z'),
      updatedAt: new Date('2025-01-01T00:00:00Z'),
    },
  ],
  competitorPrices: [
    {
      id: 'price1',
      productId: 'prod1',
      amount: 4990,
      currency: 'USD',
      channel: null,
      isOnSale: false,
      saleEndsAt: null,
      stockStatus: 'in_stock',
      createdAt: new Date('2025-01-01T00:00:00Z'),
    },
  ],
})

const clone = <T>(obj: T): T => JSON.parse(JSON.stringify(obj))

const store = (() => {
  let state = initialState()

  const client = {
    project: {
      findUnique: async ({ where }: { where: { slug: string } }) => {
        const project = state.projects.find((p) => p.slug === where.slug)
        return clone(project ?? null)
      },
    },
    competitor: {
      findMany: async ({
        where,
        include,
        orderBy,
      }: {
        where: { tenantId: string; projectId: string }
        include?: { CompetitorProduct?: { include?: { CompetitorPrice?: { orderBy?: any; take?: number } } } }
        orderBy?: any
      }) => {
        let competitors = state.competitors.filter(
          (c) => c.tenantId === where.tenantId && c.projectId === where.projectId
        )

        if (orderBy?.createdAt === 'desc') {
          competitors.sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime())
        }

        if (include?.CompetitorProduct) {
          competitors = competitors.map((comp) => {
            const products = state.competitorProducts.filter((p) => p.competitorId === comp.id)
            const productsWithPrices = products.map((prod) => {
              if (include.CompetitorProduct?.include?.CompetitorPrice) {
                const prices = state.competitorPrices
                  .filter((p) => p.productId === prod.id)
                  .sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime())
                const take = include.CompetitorProduct.include.CompetitorPrice.take
                return {
                  ...prod,
                  CompetitorPrice: take ? prices.slice(0, take) : prices,
                }
              }
              return prod
            })
            return {
              ...comp,
              CompetitorProduct: productsWithPrices,
            }
          })
        }

        return clone(competitors)
      },
      create: async ({ data }: { data: Omit<CompetitorRecord, 'id' | 'createdAt' | 'updatedAt'> & { id?: string } }) => {
        const competitor: CompetitorRecord = {
          id: data.id || `comp_${uid()}`,
          ...data,
          createdAt: new Date(),
          updatedAt: new Date(),
        }
        state.competitors.push(competitor)
        return clone(competitor)
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

const clearSessions = () => {
  const ref = authSecurityManager as any
  if (ref.sessionStore?.clear) {
    ref.sessionStore.clear()
  }
}

const makeToken = (userId: string, roles: string[] = ['admin']) => {
  const ctx = authSecurityManager.createAuthContext({
    userId,
    tenantId: 'tenant1',
    projectId: 'proj1',
    roles,
  })
  return authSecurityManager.generateSessionToken(ctx)
}

const makeRequest = (
  url: string,
  init: { method?: string; headers?: Record<string, string>; body?: string } = {}
) => {
  const { method = 'GET', headers = {}, body } = init
  const request = new Request(url, { method, headers, body })
  return new NextRequest(request)
}

describe('competitors API', () => {
  beforeEach(() => {
    store.reset()
    clearSessions()
  })

  describe('GET /api/v1/competitors', () => {
    it('requires projectSlug query parameter', async () => {
      const token = makeToken('user-viewer')
      const req = makeRequest('http://localhost/api/v1/competitors', {
        headers: { Authorization: `Bearer ${token}` },
      })
      const res = await listRoute(req)
      expect(res.status).toBe(400)
      const body = await res.json()
      expect(body.error).toBe('Missing projectSlug parameter')
    })

    it('returns 404 when project not found', async () => {
      const token = makeToken('user-viewer')
      const req = makeRequest('http://localhost/api/v1/competitors?projectSlug=nonexistent', {
        headers: { Authorization: `Bearer ${token}` },
      })
      const res = await listRoute(req)
      expect(res.status).toBe(404)
      const body = await res.json()
      expect(body.error).toBe('Project not found')
    })

    it('lists competitors for a project with products and prices', async () => {
      const token = makeToken('user-viewer')
      const req = makeRequest('http://localhost/api/v1/competitors?projectSlug=demo', {
        headers: { Authorization: `Bearer ${token}` },
      })
      const res = await listRoute(req)
      expect(res.status).toBe(200)
      const body = await res.json()
      expect(Array.isArray(body.competitors)).toBe(true)
      expect(body.competitors.length).toBe(2)
      expect(body.competitors[0].name).toBe('Competitor Store 2') // Ordered by createdAt desc
      expect(body.competitors[0].CompetitorProduct).toBeDefined()
      if (body.competitors[0].CompetitorProduct?.length > 0) {
        expect(body.competitors[0].CompetitorProduct[0].CompetitorPrice).toBeDefined()
      }
    })

    it('returns empty array when no competitors exist', async () => {
      store.reset()
      store.state.competitors = []
      const token = makeToken('user-viewer')
      const req = makeRequest('http://localhost/api/v1/competitors?projectSlug=demo', {
        headers: { Authorization: `Bearer ${token}` },
      })
      const res = await listRoute(req)
      expect(res.status).toBe(200)
      const body = await res.json()
      expect(body.competitors).toEqual([])
    })

    it('requires authentication - returns 401 without Bearer token', async () => {
      const req = makeRequest('http://localhost/api/v1/competitors?projectSlug=demo', {
        headers: {},
      })
      const res = await listRoute(req)
      expect(res.status).toBe(401)
      const body = await res.json()
      expect(body.error).toBe('Authentication required')
      expect(body.message).toBe('Valid authentication token required')
    })

    it('returns 401 with invalid Bearer token', async () => {
      const req = makeRequest('http://localhost/api/v1/competitors?projectSlug=demo', {
        headers: { Authorization: 'Bearer invalid-token' },
      })
      const res = await listRoute(req)
      expect(res.status).toBe(401)
      const body = await res.json()
      expect(body.error).toBe('Authentication required')
      expect(body.message).toBe('Invalid session token')
    })
  })

  describe('POST /api/v1/competitors', () => {
    it('requires projectSlug in body', async () => {
      const token = makeToken('user-editor')
      const req = makeRequest('http://localhost/api/v1/competitors', {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          name: 'Test Competitor',
          domain: 'test.com',
          channel: 'shopify',
        }),
      })
      const res = await createRoute(req)
      expect(res.status).toBe(400)
      const body = await res.json()
      expect(body.error).toContain('Missing required fields')
      expect(body.error).toContain('projectSlug')
    })

    it('requires all required fields (projectSlug, name, domain, channel)', async () => {
      const token = makeToken('user-editor')
      const req = makeRequest('http://localhost/api/v1/competitors', {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          projectSlug: 'demo',
          name: 'Test Competitor',
          // Missing domain and channel
        }),
      })
      const res = await createRoute(req)
      expect(res.status).toBe(400)
      const body = await res.json()
      expect(body.error).toContain('Missing required fields')
    })

    it('returns 404 when project not found', async () => {
      const token = makeToken('user-editor')
      const req = makeRequest('http://localhost/api/v1/competitors', {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          projectSlug: 'nonexistent',
          name: 'Test Competitor',
          domain: 'test.com',
          channel: 'shopify',
        }),
      })
      const res = await createRoute(req)
      expect(res.status).toBe(404)
      const body = await res.json()
      expect(body.error).toBe('Project not found')
    })

    it('creates a new competitor successfully', async () => {
      const token = makeToken('user-editor')
      const req = makeRequest('http://localhost/api/v1/competitors', {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          projectSlug: 'demo',
          name: 'New Competitor',
          domain: 'newcompetitor.com',
          channel: 'amazon',
        }),
      })
      const res = await createRoute(req)
      expect(res.status).toBe(201)
      const body = await res.json()
      expect(body.competitor).toBeDefined()
      expect(body.competitor.name).toBe('New Competitor')
      expect(body.competitor.domain).toBe('newcompetitor.com')
      expect(body.competitor.channel).toBe('amazon')
      expect(body.competitor.tenantId).toBe('tenant1')
      expect(body.competitor.projectId).toBe('proj1')
      expect(body.competitor.id).toBeDefined()
    })

    it('requires authentication - returns 401 without Bearer token', async () => {
      const req = makeRequest('http://localhost/api/v1/competitors', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          projectSlug: 'demo',
          name: 'Test Competitor',
          domain: 'test.com',
          channel: 'shopify',
        }),
      })
      const res = await createRoute(req)
      expect(res.status).toBe(401)
      const body = await res.json()
      expect(body.error).toBe('Authentication required')
      expect(body.message).toBe('Valid authentication token required')
    })

    it('returns 401 with invalid Bearer token', async () => {
      const req = makeRequest('http://localhost/api/v1/competitors', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: 'Bearer invalid-token',
        },
        body: JSON.stringify({
          projectSlug: 'demo',
          name: 'Test Competitor',
          domain: 'test.com',
          channel: 'shopify',
        }),
      })
      const res = await createRoute(req)
      expect(res.status).toBe(401)
      const body = await res.json()
      expect(body.error).toBe('Authentication required')
      expect(body.message).toBe('Invalid session token')
    })
  })
})

