import { describe, it, expect, beforeEach, vi } from 'vitest'
import { NextRequest } from 'next/server'
import { POST as simulateRoute, OPTIONS as simulateOptions } from '../app/api/v1/copilot/simulate/route'
import { authSecurityManager } from '@/lib/auth-security'

type StoreState = {
  projects: Array<{ id: string; slug: string; tenantId: string; active?: boolean; tags?: string[] }>
  memberships: Array<{ userId: string; projectId: string; role: string }>
  products: Array<{ id: string; tenantId: string; projectId: string; name: string; code: string; active?: boolean; tags?: string[] }>
  skus: Array<{ id: string; code: string; name: string; productId: string; attributes: Record<string, unknown> | null }>
  prices: Array<{ id: string; skuId: string; amount: number; currency: string; status: string }>
  copilotQueryLogs: Array<{
    id: string
    tenantId: string
    projectId: string
    userId?: string
    userRole?: string
    query: string
    queryType: string
    resultCount: number
    executionTime?: number
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
  projects: [{ id: 'proj1', slug: 'demo', tenantId: 'tenant1', active: true }],
  memberships: [
    { userId: 'editor1', projectId: 'proj1', role: 'EDITOR' },
    { userId: 'viewer1', projectId: 'proj1', role: 'VIEWER' },
  ],
  products: [
    {
      id: 'prod1',
      tenantId: 'tenant1',
      projectId: 'proj1',
      name: 'Accessory Pack',
      code: 'PROD-1',
      active: true,
      tags: ['accessories'],
    },
  ],
  skus: [
    {
      id: 'sku1',
      code: 'SKU-1',
      name: 'Accessory Pack',
      productId: 'prod1',
      attributes: {},
    },
  ],
  prices: [
    { id: 'price1', skuId: 'sku1', amount: 1000, currency: 'USD', status: 'ACTIVE' },
  ],
  copilotQueryLogs: [],
})

const store = (() => {
  let state = initialState()

  const clone = <T,>(value: T): T => structuredClone(value)

  const client = {
    project: {
      findUnique: async ({ where, include }: { where: { slug?: string }; include?: unknown }) => {
        const project = state.projects.find((p) => p.slug === where.slug)
        if (!project) return null

        if (include && typeof include === 'object' && 'Membership' in include) {
          const membershipInclude = include.Membership as { where?: { userId?: string } }
          if (membershipInclude?.where?.userId) {
            const membership = state.memberships.find(
              (m) => m.projectId === project.id && m.userId === membershipInclude.where?.userId
            )
            return { ...clone(project), Membership: membership ? [clone(membership)] : [] }
          }
        }

        return clone(project)
      },
    },
    membership: {
      findUnique: async ({
        where,
      }: {
        where: { userId_projectId: { userId: string; projectId: string } }
      }) => {
        const membership = state.memberships.find(
          (m) => m.projectId === where.userId_projectId.projectId && m.userId === where.userId_projectId.userId
        )
        return membership ? clone(membership) : null
      },
    },
    product: {
      findMany: async ({ where }: { where: { tenantId: string; projectId: string; active?: boolean } }) => {
        return state.products
          .filter(
            (p) =>
              p.tenantId === where.tenantId &&
              p.projectId === where.projectId &&
              (where.active ? p.active !== false : true)
          )
          .map((product) => {
            const skus = state.skus.filter((s) => s.productId === product.id)
            const skuWithPrices = skus.map((sku) => ({
              ...clone(sku),
              Price: state.prices.filter((price) => price.skuId === sku.id).map(clone),
            }))

            return {
              ...clone(product),
              Sku: skuWithPrices,
            }
          })
      },
    },
    copilotQueryLog: {
      create: async ({ data }: { data: Omit<StoreState['copilotQueryLogs'][number], 'id' | 'createdAt'> }) => {
        const log = { id: uid(), createdAt: new Date(), ...data }
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

const makeRequest = (
  url: string,
  init: { method?: string; headers?: Record<string, string>; body?: string; token?: string } = {}
) => {
  const { method = 'POST', headers = {}, body, token } = init
  const finalHeaders = { ...headers }
  if (token) {
    finalHeaders.Authorization = `Bearer ${token}`
  }
  return new NextRequest(new Request(url, { method, headers: finalHeaders, body }))
}

const createToken = (userId: string) =>
  authSecurityManager.generateSessionToken(
    authSecurityManager.createAuthContext({
      userId,
      roles: ['editor'],
    })
  )

describe('copilot simulation API', () => {
  beforeEach(() => {
    store.reset()
  })

  it('responds to CORS preflight', async () => {
    const res = await simulateOptions(
      makeRequest('http://localhost/api/v1/copilot/simulate', {
        method: 'OPTIONS',
        headers: { Origin: 'http://localhost:3000' },
      })
    )

    expect(res.status).toBe(200)
    expect(res.headers.get('access-control-allow-origin')).toBe('http://localhost:3000')
    expect(res.headers.get('access-control-allow-methods')).toContain('OPTIONS')
  })

  it('validates request payloads', async () => {
    const res = await simulateRoute(
      makeRequest('http://localhost/api/v1/copilot/simulate', {
        headers: { 'Content-Type': 'application/json' },
        token: createToken('editor1'),
        body: JSON.stringify({}),
      })
    )

    expect(res.status).toBe(400)
  })

  it('enforces EDITOR access for simulations', async () => {
    const token = createToken('viewer1')
    const res = await simulateRoute(
      makeRequest('http://localhost/api/v1/copilot/simulate', {
        headers: { 'Content-Type': 'application/json' },
        token,
        body: JSON.stringify({
          projectSlug: 'demo',
          rule: {
            name: 'Increase accessories by 10%',
            selector: { predicates: [{ type: 'all' }] },
            transform: { transform: { type: 'percentage', value: 10 } },
          },
        }),
      })
    )

    expect(res.status).toBe(403)
    const body = await res.json()
    expect(body.error).toBe('Forbidden')
  })

  it('simulates pricing rules and logs the run', async () => {
    const token = createToken('editor1')
    const res = await simulateRoute(
      makeRequest('http://localhost/api/v1/copilot/simulate', {
        headers: { 'Content-Type': 'application/json' },
        token,
        body: JSON.stringify({
          projectSlug: 'demo',
          rule: {
            name: 'Raise accessory prices 10%',
            selector: { predicates: [{ type: 'tag', tags: ['accessories'] }], operator: 'AND' },
            transform: { transform: { type: 'percentage', value: 10 } },
          },
          metadata: { requestId: 'req-1' },
        }),
      })
    )

    expect(res.status).toBe(200)
    const body = await res.json()
    expect(body.summary).toMatchObject({ total: 1, matched: 1, wouldChange: 1 })
    expect(body.explainTrace?.rule?.name).toBe('Raise accessory prices 10%')

    expect(store.state.copilotQueryLogs.length).toBe(1)
    const log = store.state.copilotQueryLogs[0]
    expect(log.query).toContain('simulate:Raise accessory prices 10%')
    expect(log.metadata?.matched).toBe(1)
  })
})
