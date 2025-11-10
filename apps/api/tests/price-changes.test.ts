import { describe, it, expect, beforeEach, vi } from 'vitest'
import { NextRequest } from 'next/server'
import { GET as listRoute } from '../app/api/v1/price-changes/route'
import { POST as approveRoute } from '../app/api/v1/price-changes/[id]/approve/route'
import { POST as applyRoute } from '../app/api/v1/price-changes/[id]/apply/route'
import { POST as rejectRoute } from '../app/api/v1/price-changes/[id]/reject/route'
import { POST as rollbackRoute } from '../app/api/v1/price-changes/[id]/rollback/route'
import { authSecurityManager } from '../lib/auth-security'

const shopifyMocks = {
  initializeShopifyConnector: vi.fn(),
  updatePrice: vi.fn(),
}

vi.mock('@/lib/shopify-connector', () => ({
  initializeShopifyConnector: (...args: any[]) =>
    shopifyMocks.initializeShopifyConnector(...args),
  serializeShopifyRateLimit: (rateLimit: any) => {
    if (!rateLimit) return null
    return {
      limit: rateLimit.limit,
      remaining: rateLimit.remaining,
      resetTime: rateLimit.resetTime instanceof Date 
        ? rateLimit.resetTime.toISOString() 
        : new Date(rateLimit.resetTime).toISOString(),
    }
  },
}))

type PriceChangeStatus = 'PENDING' | 'APPROVED' | 'APPLIED' | 'REJECTED' | 'FAILED' | 'ROLLED_BACK'

type PriceChangeRecord = {
  id: string
  tenantId: string
  projectId: string
  skuId: string
  source: string
  fromAmount: number
  toAmount: number
  currency: string
  context?: Record<string, any>
  status: PriceChangeStatus
  policyResult?: any
  approvedBy?: string | null
  appliedAt?: Date | null
  createdAt: Date
  connectorStatus?: any
  variantId?: string | null
}

type StoreState = {
  projects: Array<{ id: string; slug: string; tenantId: string }>
  memberships: Array<{ userId: string; projectId: string; role: 'OWNER' | 'ADMIN' | 'EDITOR' | 'VIEWER' }>
  priceChanges: PriceChangeRecord[]
  prices: Array<{ id: string; skuId: string; currency: string; amount: number }>
  priceVersions: Array<{ id: string; priceId: string; amount: number; note?: string | null }>
  policies: Array<{ projectId: string; autoApply: boolean; rules: any }>
  events: any[]
  shopifyIntegrations: Array<{
    id: string
    projectId: string
    shopDomain: string
    accessToken: string
    scope: string
    isActive: boolean
  }>
  audit: Array<{
    id: string
    tenantId: string
    projectId: string | null
    entity: string
    entityId: string
    action: string
    actor: string
    explain: Record<string, any> | null
    createdAt: Date
  }>
}

const uid = () => Math.random().toString(36).slice(2)

const initialState = (): StoreState => ({
  projects: [{ id: 'proj1', slug: 'demo', tenantId: 'tenant1' }],
  memberships: [
    { userId: 'user-admin', projectId: 'proj1', role: 'ADMIN' },
    { userId: 'user-editor', projectId: 'proj1', role: 'EDITOR' },
    { userId: 'user-viewer', projectId: 'proj1', role: 'VIEWER' },
  ],
  priceChanges: [
    {
      id: 'pc_pending',
      tenantId: 'tenant1',
      projectId: 'proj1',
      skuId: 'sku1',
      source: 'AI',
      fromAmount: 4990,
      toAmount: 5490,
      currency: 'USD',
      context: { skuCode: 'SKU-1', shopifyVariantId: 'variant_pending' },
      status: 'PENDING',
      policyResult: { ok: true, checks: [{ name: 'maxPctDelta', ok: true }] },
      createdAt: new Date('2025-01-01T00:00:00Z'),
      approvedBy: null,
      appliedAt: null,
      connectorStatus: { target: 'shopify', state: 'QUEUED', errorMessage: null },
    },
    {
      id: 'pc_approved',
      tenantId: 'tenant1',
      projectId: 'proj1',
      skuId: 'sku1',
      source: 'Manual',
      fromAmount: 4990,
      toAmount: 5290,
      currency: 'USD',
      context: { skuCode: 'SKU-APPROVED', shopifyVariantId: 'variant_approved' },
      status: 'APPROVED',
      policyResult: { ok: true, checks: [{ name: 'maxPctDelta', ok: true }] },
      createdAt: new Date('2025-01-02T00:00:00Z'),
      approvedBy: 'user-editor',
      appliedAt: null,
      connectorStatus: { target: 'shopify', state: 'SYNCED', errorMessage: null },
    },
    {
      id: 'pc_applied',
      tenantId: 'tenant1',
      projectId: 'proj1',
      skuId: 'sku1',
      source: 'AI',
      fromAmount: 4990,
      toAmount: 4590,
      currency: 'USD',
      context: { skuCode: 'SKU-APPLIED', shopifyVariantId: 'variant_applied' },
      status: 'APPLIED',
      policyResult: { ok: true, checks: [{ name: 'maxPctDelta', ok: true }] },
      createdAt: new Date('2025-01-03T00:00:00Z'),
      approvedBy: 'user-admin',
      appliedAt: new Date('2025-01-04T00:00:00Z'),
      connectorStatus: { target: 'shopify', state: 'SYNCED', errorMessage: null },
    },
    {
      id: 'pc_policy_fail',
      tenantId: 'tenant1',
      projectId: 'proj1',
      skuId: 'sku1',
      source: 'AI',
      fromAmount: 4990,
      toAmount: 9990,
      currency: 'USD',
      context: { skuCode: 'SKU-FAIL', shopifyVariantId: 'variant_policy' },
      status: 'APPROVED',
      policyResult: { ok: false, checks: [{ name: 'maxPctDelta', ok: false }] },
      createdAt: new Date('2025-01-05T00:00:00Z'),
      approvedBy: 'user-admin',
      appliedAt: null,
      connectorStatus: { target: 'shopify', state: 'QUEUED', errorMessage: null },
    },
    {
      id: 'pc_connector_err',
      tenantId: 'tenant1',
      projectId: 'proj1',
      skuId: 'sku1',
      source: 'AI',
      fromAmount: 4990,
      toAmount: 5290,
      currency: 'USD',
      context: {
        skuCode: 'SKU-CONNECTOR',
        simulateConnectorError: 'connector down',
        shopifyVariantId: 'variant_error',
      },
      status: 'APPROVED',
      policyResult: { ok: true, checks: [{ name: 'maxPctDelta', ok: true }] },
      createdAt: new Date('2025-01-06T00:00:00Z'),
      approvedBy: 'user-editor',
      appliedAt: null,
      connectorStatus: { target: 'shopify', state: 'ERROR', errorMessage: 'connector down' },
    },
  ],
  prices: [{ id: 'price1', skuId: 'sku1', currency: 'USD', amount: 4990 }],
  priceVersions: [],
  policies: [
    { projectId: 'proj1', autoApply: true, rules: { maxPctDelta: 0.2, floors: { 'SKU-APPLIED': 3000 } } },
  ],
  events: [],
  shopifyIntegrations: [
    {
      id: 'shopify1',
      projectId: 'proj1',
      shopDomain: 'demo.myshopify.com',
      accessToken: 'test-token',
      scope: 'read_products,write_products',
      isActive: true,
    },
  ],
  audit: [],
})

const store = (() => {
  let state = initialState()

  const findPriceChangeIndex = (id: string) => state.priceChanges.findIndex((pc) => pc.id === id)

  const clone = <T>(value: T): T => structuredClone(value)

  const client = {
    project: {
      findUnique: async ({ where }: any) => {
        if (where?.slug) {
          return clone(state.projects.find((p) => p.slug === where.slug) ?? null)
        }
        if (where?.id) {
          return clone(state.projects.find((p) => p.id === where.id) ?? null)
        }
        return null
      },
    },
    membership: {
      findUnique: async ({ where }: any) => {
        const key = where?.userId_projectId
        if (!key) return null
        return clone(
          state.memberships.find(
            (m) => m.userId === key.userId && m.projectId === key.projectId
          ) ?? null
        )
      },
    },
    priceChange: {
      findUnique: async ({ where }: any) => {
        if (!where?.id) return null
        return clone(state.priceChanges.find((pc) => pc.id === where.id) ?? null)
      },
      findMany: async (args: any) => {
        let results = state.priceChanges.slice()
        if (args?.where?.projectId) {
          results = results.filter((pc) => pc.projectId === args.where.projectId)
        }
        if (args?.where?.status) {
          results = results.filter((pc) => pc.status === args.where.status)
        }
        if (Array.isArray(args?.where?.OR) && args.where.OR.length > 0) {
          const query = args.where.OR
          results = results.filter((pc) => {
            return query.some((cond: any) => {
              if (cond.source?.contains) {
                return (
                  pc.source.toLowerCase().includes(cond.source.contains.toLowerCase())
                )
              }
              if (cond.context?.string_contains) {
                const value = pc.context?.[cond.context.path?.[0] ?? '']
                return typeof value === 'string'
                  ? value.toLowerCase().includes(cond.context.string_contains.toLowerCase())
                  : false
              }
              return false
            })
          })
        }
        results.sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime())
        if (args?.cursor?.id) {
          const idx = results.findIndex((pc) => pc.id === args.cursor.id)
          if (idx === -1) {
            throw Object.assign(new Error('cursor not found'), { code: 'P2025' })
          }
          results = results.slice(idx + (args?.skip ?? 0))
        }
        const take = args?.take ?? results.length
        return clone(results.slice(0, take))
      },
      update: async ({ where, data }: any) => {
        const idx = findPriceChangeIndex(where.id)
        if (idx === -1) throw new Error('Price change not found')
        const merged = {
          ...state.priceChanges[idx],
          ...data,
          policyResult: data.policyResult ?? state.priceChanges[idx].policyResult,
          connectorStatus: data.connectorStatus ?? state.priceChanges[idx].connectorStatus,
        }
        state.priceChanges[idx] = merged
        return clone(merged)
      },
    },
    price: {
      findFirst: async ({ where }: any) => {
        const found = state.prices.find(
          (p) => p.skuId === where.skuId && p.currency === where.currency
        )
        return clone(found ?? null)
      },
      update: async ({ where, data }: any) => {
        const idx = state.prices.findIndex((p) => p.id === where.id)
        if (idx === -1) throw new Error('price not found')
        state.prices[idx] = { ...state.prices[idx], ...data }
        return clone(state.prices[idx])
      },
    },
    priceVersion: {
      create: async ({ data }: any) => {
        const record = { id: `pv_${uid()}`, ...data }
        state.priceVersions.push(record)
        return clone(record)
      },
    },
    event: {
      create: async ({ data }: any) => {
        const record = { id: `ev_${uid()}`, ...data }
        state.events.push(record)
        return clone(record)
      },
    },
    policy: {
      findUnique: async ({ where }: any) => {
        return clone(state.policies.find((p) => p.projectId === where.projectId) ?? null)
      },
    },
    shopifyIntegration: {
      findFirst: async ({ where }: any) => {
        const matches = state.shopifyIntegrations.find((integration) => {
          if (where?.projectId && integration.projectId !== where.projectId) {
            return false
          }
          if (typeof where?.isActive === 'boolean' && integration.isActive !== where.isActive) {
            return false
          }
          return true
        })
        return clone(matches ?? null)
      },
    },
    audit: {
      create: async ({ data }: any) => {
        const record = { id: `audit_${uid()}`, createdAt: new Date(), ...data }
        state.audit.push(record)
        return clone(record)
      },
    },
    sku: {
      findUnique: async ({ where, select }: any) => {
        if (!where?.id) return null
        // Mock SKU with Shopify variant ID in attributes
        const sku = {
          id: where.id,
          attributes: {
            shopify: {
              variantId: 'variant_from_sku_attributes',
            },
          },
        }
        if (select?.attributes) {
          return clone({ attributes: sku.attributes })
        }
        return clone(sku)
      },
    },
    $transaction: async (cb: any) => cb(client),
  }

  return {
    get state() {
      return state
    },
    client,
    reset() {
      state = initialState()
    },
    pushPriceChange(pc: PriceChangeRecord) {
      state.priceChanges.push(pc)
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

const makeRequest = (url: string, init: { method?: string; headers?: Record<string, string> } = {}) => {
  const { method = 'GET', headers = {} } = init
  const request = new Request(url, { method, headers })
  return new NextRequest(request)
}

const paramsFor = (id: string) => ({ params: Promise.resolve({ id }) })

describe('price changes API', () => {
  beforeEach(() => {
    shopifyMocks.updatePrice.mockReset()
    shopifyMocks.updatePrice.mockImplementation(async (payload: any) => ({
      externalId: payload.externalId,
      platform: 'shopify',
      success: true,
      oldPrice: 4990,
      newPrice: payload.price,
      currency: payload.currency,
      updatedAt: new Date(),
    }))
    shopifyMocks.initializeShopifyConnector.mockReset()
    shopifyMocks.initializeShopifyConnector.mockImplementation(async () => ({
      pricing: { updatePrice: shopifyMocks.updatePrice },
      getConnectionStatus: async () => ({
        connected: true,
        rateLimit: {
          limit: 40,
          remaining: 30,
          resetTime: new Date(),
        },
        shopInfo: null,
      }),
    }))
    store.reset()
    clearSessions()
  })

  it('requires project query parameter', async () => {
    const token = makeToken('user-editor')
    const req = makeRequest('http://localhost/api/v1/price-changes', {
      headers: { Authorization: `Bearer ${token}` },
    })
    const res = await listRoute(req)
    expect(res.status).toBe(400)
  })

  it('lists pending price changes by default with role metadata', async () => {
    const token = makeToken('user-editor')
    const req = makeRequest('http://localhost/api/v1/price-changes?project=demo', {
      headers: { Authorization: `Bearer ${token}` },
    })
    const res = await listRoute(req)
    expect(res.status).toBe(200)
    const body = await res.json()
    expect(Array.isArray(body.items)).toBe(true)
    expect(body.items.every((item: any) => item.status === 'PENDING')).toBe(true)
    expect(body.role).toBe('EDITOR')
  })

  it('supports status filters, search, and pagination', async () => {
    // Add extra items for pagination
    for (let i = 0; i < 55; i++) {
      store.pushPriceChange({
        id: `pc_extra_${i}`,
        tenantId: 'tenant1',
        projectId: 'proj1',
        skuId: 'sku1',
        source: 'AI',
        fromAmount: 4990,
        toAmount: 5090,
        currency: 'USD',
        context: { skuCode: `SKU-${i}`, shopifyVariantId: `variant_extra_${i}` },
        status: 'PENDING',
        policyResult: { ok: true, checks: [] },
        createdAt: new Date(Date.now() - i * 1000),
        approvedBy: null,
        appliedAt: null,
        connectorStatus: { target: 'shopify', state: 'QUEUED', errorMessage: null },
      })
    }
    const token = makeToken('user-editor')
    const firstReq = makeRequest(
      'http://localhost/api/v1/price-changes?project=demo&status=ALL&q=SKU-APPROVED',
      { headers: { Authorization: `Bearer ${token}` } }
    )
    const firstRes = await listRoute(firstReq)
    expect(firstRes.status).toBe(200)
    const firstBody = await firstRes.json()
    expect(firstBody.items.length).toBeGreaterThan(0)
    expect(firstBody.items.every((item: any) => item.context?.skuCode?.includes('SKU-APPROVED'))).toBe(true)

    if (firstBody.nextCursor) {
      const cursor = firstBody.nextCursor
      const secondReq = makeRequest(
        `http://localhost/api/v1/price-changes?project=demo&status=ALL&cursor=${cursor}`,
        { headers: { Authorization: `Bearer ${token}` } }
      )
      const secondRes = await listRoute(secondReq)
      expect(secondRes.status).toBe(200)
      const secondBody = await secondRes.json()
      expect(Array.isArray(secondBody.items)).toBe(true)
    }
  })

  it('approves a pending price change', async () => {
    const token = makeToken('user-editor')
    const req = makeRequest('http://localhost/api/v1/price-changes/pc_pending/approve', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${token}`,
        'X-Calibr-Project': 'demo',
      },
    })
    const res = await approveRoute(req, paramsFor('pc_pending') as any)
    expect(res.status).toBe(200)
    const body = await res.json()
    expect(body.item.status).toBe('APPROVED')
    expect(store.state.priceChanges.find((pc) => pc.id === 'pc_pending')?.status).toBe('APPROVED')
  })

  it('rejects price change as editor', async () => {
    const token = makeToken('user-editor')
    const req = makeRequest('http://localhost/api/v1/price-changes/pc_approved/reject', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${token}`,
        'X-Calibr-Project': 'demo',
      },
    })
    const res = await rejectRoute(req, paramsFor('pc_approved') as any)
    expect(res.status).toBe(200)
    const body = await res.json()
    expect(body.item.status).toBe('REJECTED')
    expect(store.state.priceChanges.find((pc) => pc.id === 'pc_approved')?.status).toBe('REJECTED')
  })

  it('prevents viewer from rejecting', async () => {
    const token = makeToken('user-viewer')
    const req = makeRequest('http://localhost/api/v1/price-changes/pc_pending/reject', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${token}`,
        'X-Calibr-Project': 'demo',
      },
    })
    const res = await rejectRoute(req, paramsFor('pc_pending') as any)
    expect(res.status).toBe(403)
  })

  it('applies price change and updates price + connector status', async () => {
    const token = makeToken('user-admin')
    const req = makeRequest('http://localhost/api/v1/price-changes/pc_approved/apply', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${token}`,
        'X-Calibr-Project': 'demo',
      },
    })
    const res = await applyRoute(req, paramsFor('pc_approved') as any)
    expect(res.status).toBe(200)
    const body = await res.json()
    expect(body.item.status).toBe('APPLIED')
    expect(body.item.connectorStatus.state).toBe('SYNCED')
    expect(body.item.connectorStatus.variantId).toBe('variant_approved')
    expect(shopifyMocks.initializeShopifyConnector).toHaveBeenCalledTimes(1)
    expect(shopifyMocks.updatePrice).toHaveBeenCalledWith(
      expect.objectContaining({
        externalId: 'variant_approved',
        price: 5290,
        currency: 'USD',
      })
    )
    const updatedPc = store.state.priceChanges.find((pc) => pc.id === 'pc_approved')
    expect(updatedPc?.status).toBe('APPLIED')
    expect(updatedPc?.connectorStatus?.variantId).toBe('variant_approved')
    expect(updatedPc?.connectorStatus?.externalId).toBe('variant_approved')
    expect(store.state.prices.find((p) => p.id === 'price1')?.amount).toBe(5290)
    expect(store.state.priceVersions.length).toBeGreaterThan(0)
  })

  it('prevents apply when policy fails', async () => {
    const token = makeToken('user-admin')
    const req = makeRequest('http://localhost/api/v1/price-changes/pc_policy_fail/apply', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${token}`,
        'X-Calibr-Project': 'demo',
      },
    })
    const res = await applyRoute(req, paramsFor('pc_policy_fail') as any)
    expect(res.status).toBe(422)
    const body = await res.json()
    expect(body.error).toBe('PolicyViolation')
  })

  it('returns 409 when no active Shopify integration exists', async () => {
    store.state.shopifyIntegrations.length = 0
    const token = makeToken('user-admin')
    const req = makeRequest('http://localhost/api/v1/price-changes/pc_approved/apply', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${token}`,
        'X-Calibr-Project': 'demo',
      },
    })
    const res = await applyRoute(req, paramsFor('pc_approved') as any)
    expect(res.status).toBe(409)
    const body = await res.json()
    expect(body.error).toBe('IntegrationMissing')
  })

  it('returns 422 when Shopify variant identifier is unavailable', async () => {
    const target = store.state.priceChanges.find((pc) => pc.id === 'pc_approved')
    if (target) {
      // Remove variantId from all possible sources
      if (target.context) {
        delete target.context.shopifyVariantId
        delete target.context.variantId
        delete target.context.connectorVariantId
        delete target.context.externalVariantId
        delete target.context.shopify
      }
      // Clear direct variantId field
      target.variantId = null
      // Clear connectorStatus variantId
      if (target.connectorStatus && typeof target.connectorStatus === 'object') {
        const status = target.connectorStatus as Record<string, unknown>
        delete status.variantId
        if (status.metadata && typeof status.metadata === 'object') {
          const metadata = status.metadata as Record<string, unknown>
          delete metadata.variantId
          delete metadata.externalId
        }
      }
    }
    // Mock SKU to return null/empty attributes so it can't find variantId there either
    const originalSku = store.client.sku
    store.client.sku = {
      findUnique: async () => null,
    } as any

    try {
      const token = makeToken('user-admin')
      const req = makeRequest('http://localhost/api/v1/price-changes/pc_approved/apply', {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${token}`,
          'X-Calibr-Project': 'demo',
        },
      })
      const res = await applyRoute(req, paramsFor('pc_approved') as any)
      expect(res.status).toBe(422)
      const body = await res.json()
      expect(body.error).toBe('MissingVariant')
    } finally {
      // Restore original SKU mock
      store.client.sku = originalSku
    }
  })

  it('resolves Shopify variant ID from direct variantId field on PriceChange', async () => {
    // Create a price change with variantId directly on the model (not in context)
    const pcWithDirectVariantId: PriceChangeRecord = {
      id: 'pc_direct_variant',
      tenantId: 'tenant1',
      projectId: 'proj1',
      skuId: 'sku1',
      source: 'Manual',
      fromAmount: 4990,
      toAmount: 5490,
      currency: 'USD',
      context: {}, // No shopifyVariantId in context
      status: 'APPROVED',
      policyResult: { ok: true, checks: [{ name: 'maxPctDelta', ok: true }] },
      createdAt: new Date('2025-01-07T00:00:00Z'),
      approvedBy: 'user-editor',
      appliedAt: null,
      connectorStatus: {},
      variantId: 'variant_direct_field', // Direct field on PriceChange
    }
    store.pushPriceChange(pcWithDirectVariantId)

    shopifyMocks.updatePrice.mockResolvedValueOnce({
      externalId: 'variant_direct_field',
      platform: 'shopify',
      success: true,
      currency: 'USD',
      updatedAt: new Date(),
    })

    const token = makeToken('user-admin')
    const req = makeRequest('http://localhost/api/v1/price-changes/pc_direct_variant/apply', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${token}`,
        'X-Calibr-Project': 'demo',
      },
    })
    const res = await applyRoute(req, paramsFor('pc_direct_variant') as any)
    expect(res.status).toBe(200)
    const body = await res.json()
    expect(body.item.status).toBe('APPLIED')
    expect(shopifyMocks.updatePrice).toHaveBeenCalledWith(
      expect.objectContaining({
        externalId: 'variant_direct_field',
        price: 5490,
        currency: 'USD',
      })
    )
  })

  it('surfaces Shopify connector API failures', async () => {
    shopifyMocks.updatePrice.mockResolvedValueOnce({
      externalId: 'variant_approved',
      platform: 'shopify',
      success: false,
      error: 'API failure',
      currency: 'USD',
      updatedAt: new Date(),
    })
    const token = makeToken('user-admin')
    const req = makeRequest('http://localhost/api/v1/price-changes/pc_approved/apply', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${token}`,
        'X-Calibr-Project': 'demo',
      },
    })
    const res = await applyRoute(req, paramsFor('pc_approved') as any)
    expect(res.status).toBe(502)
    const body = await res.json()
    expect(body.error).toBe('ConnectorError')
  })

  it('surfaces connector errors', async () => {
    const token = makeToken('user-admin')
    const req = makeRequest('http://localhost/api/v1/price-changes/pc_connector_err/apply', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${token}`,
        'X-Calibr-Project': 'demo',
      },
    })
    const res = await applyRoute(req, paramsFor('pc_connector_err') as any)
    expect(res.status).toBe(502)
    const body = await res.json()
    expect(body.error).toBe('ConnectorError')
  })

  it('rolls back an applied change and restores price', async () => {
    // Ensure price matches applied state before rollback
    const applied = store.state.priceChanges.find((pc) => pc.id === 'pc_applied')
    if (applied) {
      const price = store.state.prices.find((p) => p.id === 'price1')
      if (price) {
        price.amount = applied.toAmount
      }
    }
    const token = makeToken('user-admin')
    const req = makeRequest('http://localhost/api/v1/price-changes/pc_applied/rollback', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${token}`,
        'X-Calibr-Project': 'demo',
      },
    })
    const res = await rollbackRoute(req, paramsFor('pc_applied') as any)
    expect(res.status).toBe(200)
    const body = await res.json()
    expect(body.item.status).toBe('ROLLED_BACK')
    expect(body.item.connectorStatus.variantId).toBe('variant_applied')
    expect(shopifyMocks.initializeShopifyConnector).toHaveBeenCalledTimes(1)
    expect(shopifyMocks.updatePrice).toHaveBeenCalledWith(
      expect.objectContaining({
        externalId: 'variant_applied',
        price: 4990,
        currency: 'USD',
      })
    )
    const price = store.state.prices.find((p) => p.id === 'price1')
    expect(price?.amount).toBe(4990)
    const rollbackPc = store.state.priceChanges.find((pc) => pc.id === 'pc_applied')
    expect(rollbackPc?.connectorStatus?.variantId).toBe('variant_applied')
  })

  it('enforces admin role for apply', async () => {
    const token = makeToken('user-editor')
    const req = makeRequest('http://localhost/api/v1/price-changes/pc_approved/apply', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${token}`,
        'X-Calibr-Project': 'demo',
      },
    })
    const res = await applyRoute(req, paramsFor('pc_approved') as any)
    expect(res.status).toBe(403)
  })

  it('creates audit record when approving a price change', async () => {
    const token = makeToken('user-editor')
    const req = makeRequest('http://localhost/api/v1/price-changes/pc_pending/approve', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${token}`,
        'X-Calibr-Project': 'demo',
      },
    })
    const initialAuditCount = store.state.audit.length
    const res = await approveRoute(req, paramsFor('pc_pending') as any)
    expect(res.status).toBe(200)

    // Verify audit record was created
    expect(store.state.audit.length).toBe(initialAuditCount + 1)
    const auditRecord = store.state.audit[store.state.audit.length - 1]
    expect(auditRecord.entity).toBe('PriceChange')
    expect(auditRecord.entityId).toBe('pc_pending')
    expect(auditRecord.action).toBe('approved')
    expect(auditRecord.actor).toBe('user-editor')
    expect(auditRecord.tenantId).toBe('tenant1')
    expect(auditRecord.projectId).toBe('proj1')
    expect(auditRecord.explain).toBeDefined()
  })

  it('creates audit record when rejecting a price change', async () => {
    const token = makeToken('user-editor')
    const req = makeRequest('http://localhost/api/v1/price-changes/pc_approved/reject', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${token}`,
        'X-Calibr-Project': 'demo',
      },
    })
    const initialAuditCount = store.state.audit.length
    const res = await rejectRoute(req, paramsFor('pc_approved') as any)
    expect(res.status).toBe(200)

    // Verify audit record was created
    expect(store.state.audit.length).toBe(initialAuditCount + 1)
    const auditRecord = store.state.audit[store.state.audit.length - 1]
    expect(auditRecord.entity).toBe('PriceChange')
    expect(auditRecord.entityId).toBe('pc_approved')
    expect(auditRecord.action).toBe('rejected')
    expect(auditRecord.actor).toBe('user-editor')
    expect(auditRecord.tenantId).toBe('tenant1')
    expect(auditRecord.projectId).toBe('proj1')
    expect(auditRecord.explain).toBeDefined()
  })

  it('includes correlation ID in audit records when provided in headers', async () => {
    const token = makeToken('user-editor')
    const correlationId = 'test-correlation-id-123'
    const req = makeRequest('http://localhost/api/v1/price-changes/pc_pending/approve', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${token}`,
        'X-Calibr-Project': 'demo',
        'X-Correlation-ID': correlationId,
      },
    })
    const res = await approveRoute(req, paramsFor('pc_pending') as any)
    expect(res.status).toBe(200)

    // Verify correlation ID is in the audit record
    const auditRecord = store.state.audit[store.state.audit.length - 1]
    expect(auditRecord.explain).toBeDefined()
    expect((auditRecord.explain as any).correlationId).toBe(correlationId)
  })

  it('generates correlation ID when not provided in headers', async () => {
    const token = makeToken('user-editor')
    const req = makeRequest('http://localhost/api/v1/price-changes/pc_pending/approve', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${token}`,
        'X-Calibr-Project': 'demo',
      },
    })
    const res = await approveRoute(req, paramsFor('pc_pending') as any)
    expect(res.status).toBe(200)

    // Verify correlation ID was generated
    const auditRecord = store.state.audit[store.state.audit.length - 1]
    expect(auditRecord.explain).toBeDefined()
    expect((auditRecord.explain as any).correlationId).toBeDefined()
    expect((auditRecord.explain as any).correlationId).toMatch(/^corr_/)
  })
})
