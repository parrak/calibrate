import { describe, it, expect, beforeEach, vi } from 'vitest'
import { NextRequest } from 'next/server'
import { POST as digestRoute, GET as getDigestRoute } from '../app/api/v1/analytics-digest/route'

type StoreState = {
  projects: Array<{ id: string; slug: string; tenantId: string }>
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
    Sku?: {
      code: string
      name: string
      attributes: Record<string, unknown> | null
      Price: Array<{ amount: number }>
    }
  }>
  skus: Array<{
    id: string
    code: string
    name: string
    productId: string
    status: string
    attributes: Record<string, unknown> | null
    Price: Array<{ amount: number; status: string }>
  }>
  products: Array<{
    id: string
    projectId: string
  }>
  analyticsDigests: Array<{
    id: string
    tenantId: string
    projectId: string
    digestDate: Date
    totalPriceChanges: number
    totalRevenue: number | null
    avgMargin: number | null
    anomalies: unknown
    topPerformers: unknown
    metrics: unknown
    createdAt: Date
  }>
}

const uid = () => Math.random().toString(36).slice(2)

const initialState = (): StoreState => {
  const now = new Date()
  const yesterday = new Date(now)
  yesterday.setDate(yesterday.getDate() - 1)

  return {
    projects: [
      { id: 'proj1', slug: 'demo', tenantId: 'tenant1' },
      { id: 'proj2', slug: 'other', tenantId: 'tenant2' },
    ],
    priceChanges: [
      // Price spike: >20% increase
      {
        id: 'pc1',
        tenantId: 'tenant1',
        projectId: 'proj1',
        skuId: 'sku1',
        fromAmount: 1000,
        toAmount: 1300, // 30% increase
        currency: 'USD',
        status: 'APPLIED',
        createdAt: yesterday,
        Sku: {
          code: 'SKU-001',
          name: 'High Spike Product',
          attributes: { cost: 500 },
          Price: [{ amount: 1300 }],
        },
      },
      // Margin compression: low margin
      {
        id: 'pc2',
        tenantId: 'tenant1',
        projectId: 'proj1',
        skuId: 'sku2',
        fromAmount: 1000,
        toAmount: 550, // New margin: (550-500)/500 = 10%
        currency: 'USD',
        status: 'APPLIED',
        createdAt: yesterday,
        Sku: {
          code: 'SKU-002',
          name: 'Low Margin Product',
          attributes: { cost: 500 },
          Price: [{ amount: 550 }],
        },
      },
      // Normal change
      {
        id: 'pc3',
        tenantId: 'tenant1',
        projectId: 'proj1',
        skuId: 'sku3',
        fromAmount: 1000,
        toAmount: 1050, // 5% increase
        currency: 'USD',
        status: 'APPLIED',
        createdAt: yesterday,
        Sku: {
          code: 'SKU-003',
          name: 'Normal Product',
          attributes: { cost: 500 },
          Price: [{ amount: 1050 }],
        },
      },
    ],
    skus: [
      {
        id: 'sku1',
        code: 'SKU-001',
        name: 'High Spike Product',
        productId: 'prod1',
        status: 'ACTIVE',
        attributes: { cost: 500 },
        Price: [{ amount: 1300, status: 'ACTIVE' }],
      },
      {
        id: 'sku2',
        code: 'SKU-002',
        name: 'Low Margin Product',
        productId: 'prod1',
        status: 'ACTIVE',
        attributes: { cost: 500 },
        Price: [{ amount: 550, status: 'ACTIVE' }],
      },
      {
        id: 'sku3',
        code: 'SKU-003',
        name: 'Normal Product',
        productId: 'prod1',
        status: 'ACTIVE',
        attributes: { cost: 500 },
        Price: [{ amount: 1050, status: 'ACTIVE' }],
      },
    ],
    products: [{ id: 'prod1', projectId: 'proj1' }],
    analyticsDigests: [],
  }
}

const store = (() => {
  let state = initialState()

  const clone = <T,>(value: T): T => structuredClone(value)

  const client = {
    project: {
      findUnique: async ({ where, select }: { where: { slug?: string }; select?: unknown }) => {
        if (where?.slug) {
          return clone(state.projects.find((p) => p.slug === where.slug) ?? null)
        }
        return null
      },
      findMany: async ({ select }: { select?: unknown }) => {
        return clone(state.projects)
      },
    },
    priceChange: {
      count: async ({
        where,
      }: {
        where: { projectId: string; createdAt: { gte: Date; lt: Date } }
      }) => {
        return state.priceChanges.filter(
          (pc) =>
            pc.projectId === where.projectId &&
            pc.createdAt >= where.createdAt.gte &&
            pc.createdAt < where.createdAt.lt
        ).length
      },
      findMany: async ({
        where,
        include,
      }: {
        where: { projectId: string; createdAt: { gte: Date; lt: Date } }
        include?: unknown
      }) => {
        return clone(
          state.priceChanges.filter(
            (pc) =>
              pc.projectId === where.projectId &&
              pc.createdAt >= where.createdAt.gte &&
              pc.createdAt < where.createdAt.lt
          )
        )
      },
      groupBy: async ({ by, where, _count, having }: { by: string[]; where: unknown; _count: unknown; having?: unknown }) => {
        const weekAgo = new Date()
        weekAgo.setDate(weekAgo.getDate() - 7)

        const groups = state.priceChanges
          .filter((pc) => pc.createdAt >= weekAgo)
          .reduce(
            (acc, pc) => {
              const key = pc.skuId
              if (!acc[key]) {
                acc[key] = { skuId: pc.skuId, _count: { id: 0 } }
              }
              acc[key]._count.id++
              return acc
            },
            {} as Record<string, { skuId: string; _count: { id: number } }>
          )

        return Object.values(groups).filter((g) => g._count.id > 3)
      },
    },
    sku: {
      findUnique: async ({ where, select }: { where: { id: string }; select?: unknown }) => {
        return clone(state.skus.find((s) => s.id === where.id) ?? null)
      },
      findMany: async ({ where, select }: { where: { Product: { projectId: string }; status: string }; select?: unknown }) => {
        const productIds = state.products
          .filter((p) => p.projectId === where.Product.projectId)
          .map((p) => p.id)
        return clone(state.skus.filter((s) => productIds.includes(s.productId) && s.status === where.status))
      },
    },
    analyticsDigest: {
      upsert: async ({
        where,
        create,
        update,
      }: {
        where: { projectId_digestDate: { projectId: string; digestDate: Date } }
        create: Omit<StoreState['analyticsDigests'][0], 'id' | 'createdAt'>
        update: Partial<Omit<StoreState['analyticsDigests'][0], 'id' | 'createdAt'>>
      }) => {
        const existing = state.analyticsDigests.find(
          (d) =>
            d.projectId === where.projectId_digestDate.projectId &&
            d.digestDate.getTime() === where.projectId_digestDate.digestDate.getTime()
        )

        if (existing) {
          Object.assign(existing, update)
          return clone(existing)
        }

        const newDigest = {
          id: uid(),
          ...create,
          createdAt: new Date(),
        }
        state.analyticsDigests.push(newDigest)
        return clone(newDigest)
      },
      findMany: async ({
        where,
        orderBy,
        take,
      }: {
        where: { projectId: string; digestDate?: { gte?: Date; lte?: Date } }
        orderBy?: unknown
        take?: number
      }) => {
        let results = state.analyticsDigests.filter((d) => d.projectId === where.projectId)

        if (where.digestDate) {
          if (where.digestDate.gte) {
            results = results.filter((d) => d.digestDate >= where.digestDate!.gte!)
          }
          if (where.digestDate.lte) {
            results = results.filter((d) => d.digestDate <= where.digestDate!.lte!)
          }
        }

        results.sort((a, b) => b.digestDate.getTime() - a.digestDate.getTime())

        if (take) {
          results = results.slice(0, take)
        }

        return clone(results)
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

const makeRequest = (
  url: string,
  init: { method?: string; headers?: Record<string, string>; body?: string } = {}
) => {
  const { method = 'POST', headers = {}, body } = init
  const request = new Request(url, { method, headers, body })
  return new NextRequest(request)
}

describe('analytics-digest API - POST', () => {
  beforeEach(() => {
    store.reset()
  })

  it('generates digest for specific project', async () => {
    const req = makeRequest('http://localhost/api/v1/analytics-digest?project=demo')
    const res = await digestRoute(req)
    expect(res.status).toBe(200)
    const body = await res.json()
    expect(body.success).toBe(true)
    expect(body.projectsProcessed).toBe(1)
    expect(body.results).toHaveLength(1)
    expect(body.results[0].success).toBe(true)
  })

  it('generates digest for all projects when no project specified', async () => {
    const req = makeRequest('http://localhost/api/v1/analytics-digest')
    const res = await digestRoute(req)
    expect(res.status).toBe(200)
    const body = await res.json()
    expect(body.success).toBe(true)
    expect(body.projectsProcessed).toBe(2)
  })

  it('detects price spike anomaly (>20% increase)', async () => {
    const req = makeRequest('http://localhost/api/v1/analytics-digest?project=demo')
    const res = await digestRoute(req)
    expect(res.status).toBe(200)
    const body = await res.json()

    const digest = body.results[0].digest
    expect(digest.anomalies).toBeDefined()

    const priceSpike = digest.anomalies.find((a: { type: string }) => a.type === 'price_spike')
    expect(priceSpike).toBeDefined()
    expect(priceSpike.skuCode).toBe('SKU-001')
    expect(priceSpike.severity).toMatch(/medium|high|critical/)
  })

  it('detects margin compression anomaly (<15%)', async () => {
    const req = makeRequest('http://localhost/api/v1/analytics-digest?project=demo')
    const res = await digestRoute(req)
    expect(res.status).toBe(200)
    const body = await res.json()

    const digest = body.results[0].digest
    const marginCompression = digest.anomalies.find(
      (a: { type: string }) => a.type === 'margin_compression'
    )
    expect(marginCompression).toBeDefined()
    expect(marginCompression.skuCode).toBe('SKU-002')
  })

  it('calculates total price changes', async () => {
    const req = makeRequest('http://localhost/api/v1/analytics-digest?project=demo')
    const res = await digestRoute(req)
    expect(res.status).toBe(200)
    const body = await res.json()

    const digest = body.results[0].digest
    expect(digest.totalPriceChanges).toBe(3)
  })

  it('calculates total revenue impact', async () => {
    const req = makeRequest('http://localhost/api/v1/analytics-digest?project=demo')
    const res = await digestRoute(req)
    expect(res.status).toBe(200)
    const body = await res.json()

    const digest = body.results[0].digest
    expect(digest.totalRevenue).toBeDefined()
    // (1300-1000) + (550-1000) + (1050-1000) = 300 - 450 + 50 = -100
    expect(digest.totalRevenue).toBeLessThan(0)
  })

  it('calculates average margin', async () => {
    const req = makeRequest('http://localhost/api/v1/analytics-digest?project=demo')
    const res = await digestRoute(req)
    expect(res.status).toBe(200)
    const body = await res.json()

    const digest = body.results[0].digest
    expect(digest.avgMargin).toBeDefined()
    expect(typeof digest.avgMargin).toBe('number')
  })

  it('identifies top performers by margin', async () => {
    const req = makeRequest('http://localhost/api/v1/analytics-digest?project=demo')
    const res = await digestRoute(req)
    expect(res.status).toBe(200)
    const body = await res.json()

    const digest = body.results[0].digest
    expect(digest.topPerformers).toBeDefined()
    expect(Array.isArray(digest.topPerformers)).toBe(true)
    expect(digest.topPerformers.length).toBeGreaterThan(0)
    expect(digest.topPerformers[0].rank).toBe(1)
  })

  it('stores digest in database', async () => {
    const initialDigestCount = store.state.analyticsDigests.length

    const req = makeRequest('http://localhost/api/v1/analytics-digest?project=demo')
    const res = await digestRoute(req)
    expect(res.status).toBe(200)

    expect(store.state.analyticsDigests.length).toBe(initialDigestCount + 1)

    const savedDigest = store.state.analyticsDigests[0]
    expect(savedDigest.projectId).toBe('proj1')
    expect(savedDigest.tenantId).toBe('tenant1')
    expect(savedDigest.totalPriceChanges).toBe(3)
  })

  it('returns 404 for non-existent project', async () => {
    const req = makeRequest('http://localhost/api/v1/analytics-digest?project=nonexistent')
    const res = await digestRoute(req)
    expect(res.status).toBe(404)
  })
})

describe('analytics-digest API - GET', () => {
  beforeEach(() => {
    store.reset()

    // Add some test digests
    store.state.analyticsDigests.push({
      id: 'digest1',
      tenantId: 'tenant1',
      projectId: 'proj1',
      digestDate: new Date('2025-01-01'),
      totalPriceChanges: 5,
      totalRevenue: 100,
      avgMargin: 25.5,
      anomalies: [],
      topPerformers: [],
      metrics: {},
      createdAt: new Date(),
    })
  })

  it('requires project parameter', async () => {
    const req = makeRequest('http://localhost/api/v1/analytics-digest', { method: 'GET' })
    const res = await getDigestRoute(req)
    expect(res.status).toBe(400)
  })

  it('retrieves digests for a project', async () => {
    const req = makeRequest('http://localhost/api/v1/analytics-digest?project=demo', {
      method: 'GET',
    })
    const res = await getDigestRoute(req)
    expect(res.status).toBe(200)
    const body = await res.json()
    expect(body.digests).toBeDefined()
    expect(Array.isArray(body.digests)).toBe(true)
    expect(body.digests.length).toBe(1)
  })

  it('filters by date range', async () => {
    const req = makeRequest(
      'http://localhost/api/v1/analytics-digest?project=demo&startDate=2025-01-01&endDate=2025-01-02',
      { method: 'GET' }
    )
    const res = await getDigestRoute(req)
    expect(res.status).toBe(200)
    const body = await res.json()
    expect(body.digests.length).toBe(1)
  })

  it('respects limit parameter', async () => {
    // Add more digests
    for (let i = 0; i < 35; i++) {
      store.state.analyticsDigests.push({
        id: `digest-${i}`,
        tenantId: 'tenant1',
        projectId: 'proj1',
        digestDate: new Date(`2025-01-${(i % 28) + 1}`),
        totalPriceChanges: i,
        totalRevenue: i * 100,
        avgMargin: 20,
        anomalies: [],
        topPerformers: [],
        metrics: {},
        createdAt: new Date(),
      })
    }

    const req = makeRequest('http://localhost/api/v1/analytics-digest?project=demo&limit=10', {
      method: 'GET',
    })
    const res = await getDigestRoute(req)
    expect(res.status).toBe(200)
    const body = await res.json()
    expect(body.digests.length).toBe(10)
  })

  it('returns 404 for non-existent project', async () => {
    const req = makeRequest('http://localhost/api/v1/analytics-digest?project=nonexistent', {
      method: 'GET',
    })
    const res = await getDigestRoute(req)
    expect(res.status).toBe(404)
  })
})
