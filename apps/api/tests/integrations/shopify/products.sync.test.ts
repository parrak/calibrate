import { describe, it, expect, beforeEach, vi } from 'vitest'
import { NextRequest } from 'next/server'
import { GET as syncProductsRoute } from '@/app/api/integrations/shopify/products/route'
import type { ShopifyProduct, ShopifyVariant } from '@calibr/shopify-connector'

interface ProductRecord {
  id: string
  tenantId: string
  projectId: string
  name: string
  code: string
  status: 'DRAFT' | 'ACTIVE' | 'ARCHIVED'
  title?: string | null
  sku?: string | null
  tags: string[]
  channelRefs: Record<string, any> | null
  active: boolean
}

interface SkuRecord {
  id: string
  productId: string
  code: string
  name: string
  status: 'DRAFT' | 'ACTIVE' | 'ARCHIVED'
  attributes?: Record<string, any> | null
}

interface PriceRecord {
  id: string
  skuId: string
  currency: string
  amount: number
  status: 'DRAFT' | 'ACTIVE' | 'ARCHIVED'
}

interface PriceVersionRecord {
  id: string
  priceId: string
  amount: number
  productId?: string | null
  currency?: string | null
  unitAmount?: number | null
  compareAt?: number | null
  note?: string | null
  validFrom?: Date | null
  createdAt: Date
}

interface StoreState {
  projects: Array<{ id: string; tenantId: string; slug: string }>
  shopifyIntegrations: Array<{
    id: string
    projectId: string
    shopDomain: string
    accessToken: string
    scope: string
    isActive: boolean
    lastSyncAt: Date | null
    syncStatus: string | null
    syncError: string | null
  }>
  products: ProductRecord[]
  skus: SkuRecord[]
  prices: PriceRecord[]
  priceVersions: PriceVersionRecord[]
}

let idCounter = 0
const makeId = () => `test_${++idCounter}`

function clone<T>(value: T): T {
  if (value === null || typeof value !== 'object') return value
  if (value instanceof Date) return new Date(value.getTime()) as unknown as T
  if (Array.isArray(value)) return value.map((entry) => clone(entry)) as unknown as T
  const result: Record<string, any> = {}
  for (const key of Object.keys(value as Record<string, any>)) {
    result[key] = clone((value as Record<string, any>)[key])
  }
  return result as T
}

function defaultState(): StoreState {
  return {
    projects: [{ id: 'proj1', tenantId: 'tenant1', slug: 'demo' }],
    shopifyIntegrations: [{
      id: 'integration1',
      projectId: 'proj1',
      shopDomain: 'demo.myshopify.com',
      accessToken: 'token',
      scope: 'read_products,write_products',
      isActive: true,
      lastSyncAt: null,
      syncStatus: null,
      syncError: null,
    }],
    products: [],
    skus: [],
    prices: [],
    priceVersions: [],
  }
}

const store = (() => {
  let state = defaultState()

  const client = {
    project: {
      findUnique: async ({ where }: any) => {
        if (where?.id) {
          return clone(state.projects.find((p) => p.id === where.id) ?? null)
        }
        if (where?.slug) {
          return clone(state.projects.find((p) => p.slug === where.slug) ?? null)
        }
        return null
      },
    },
    shopifyIntegration: {
      findFirst: async ({ where }: any) => {
        const match = state.shopifyIntegrations.find((integration) => {
          if (where?.projectId && integration.projectId !== where.projectId) return false
          if (typeof where?.isActive === 'boolean' && integration.isActive !== where.isActive) return false
          return true
        })
        return clone(match ?? null)
      },
      update: async ({ where, data }: any) => {
        const idx = state.shopifyIntegrations.findIndex((integration) => integration.id === where.id)
        if (idx === -1) throw new Error('integration not found')
        state.shopifyIntegrations[idx] = {
          ...state.shopifyIntegrations[idx],
          ...clone(data),
        }
        return clone(state.shopifyIntegrations[idx])
      },
      updateMany: async ({ where, data }: any) => {
        let updated = 0
        state.shopifyIntegrations = state.shopifyIntegrations.map((integration) => {
          const matches = (!where?.projectId || integration.projectId === where.projectId)
            && (typeof where?.isActive !== 'boolean' || integration.isActive === where.isActive)
          if (matches) {
            updated += 1
            return { ...integration, ...clone(data) }
          }
          return integration
        })
        return { count: updated }
      },
    },
    product: {
      findUnique: async ({ where }: any) => {
        if (where?.id) {
          return clone(state.products.find((product) => product.id === where.id) ?? null)
        }
        const composite = where?.tenantId_projectId_code
        if (composite) {
          return clone(
            state.products.find(
              (product) => product.tenantId === composite.tenantId
                && product.projectId === composite.projectId
                && product.code === composite.code
            ) ?? null
          )
        }
        return null
      },
      update: async ({ where, data }: any) => {
        const idx = state.products.findIndex((product) => product.id === where.id)
        if (idx === -1) throw new Error('product not found')
        state.products[idx] = {
          ...state.products[idx],
          ...clone(data),
        }
        return clone(state.products[idx])
      },
      create: async ({ data }: any) => {
        const record: ProductRecord = {
          id: data.id ?? makeId(),
          tenantId: data.tenantId,
          projectId: data.projectId,
          name: data.name,
          code: data.code,
          status: data.status,
          title: data.title,
          sku: data.sku ?? null,
          tags: data.tags ?? [],
          channelRefs: clone(data.channelRefs ?? null),
          active: data.active ?? true,
        }
        state.products.push(record)
        return clone(record)
      },
    },
    sku: {
      findUnique: async ({ where }: any) => {
        const composite = where?.productId_code
        if (!composite) return null
        return clone(
          state.skus.find(
            (sku) => sku.productId === composite.productId && sku.code === composite.code
          ) ?? null
        )
      },
      update: async ({ where, data }: any) => {
        const idx = state.skus.findIndex((sku) => sku.id === where.id)
        if (idx === -1) throw new Error('sku not found')
        state.skus[idx] = {
          ...state.skus[idx],
          ...clone(data),
        }
        return clone(state.skus[idx])
      },
      create: async ({ data }: any) => {
        const record: SkuRecord = {
          id: data.id ?? makeId(),
          productId: data.productId,
          code: data.code,
          name: data.name,
          status: data.status,
          attributes: clone(data.attributes ?? null),
        }
        state.skus.push(record)
        return clone(record)
      },
    },
    price: {
      findUnique: async ({ where }: any) => {
        const composite = where?.skuId_currency
        if (!composite) return null
        return clone(
          state.prices.find(
            (price) => price.skuId === composite.skuId && price.currency === composite.currency
          ) ?? null
        )
      },
      update: async ({ where, data }: any) => {
        const idx = state.prices.findIndex((price) => price.id === where.id)
        if (idx === -1) throw new Error('price not found')
        state.prices[idx] = {
          ...state.prices[idx],
          ...clone(data),
        }
        return clone(state.prices[idx])
      },
      create: async ({ data }: any) => {
        const record: PriceRecord = {
          id: data.id ?? makeId(),
          skuId: data.skuId,
          currency: data.currency,
          amount: data.amount,
          status: data.status,
        }
        state.prices.push(record)
        return clone(record)
      },
    },
    priceVersion: {
      findFirst: async ({ where, orderBy }: any) => {
        let records = state.priceVersions.filter((version) => version.priceId === where?.priceId)
        if (orderBy?.createdAt === 'desc') {
          records = [...records].sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime())
        }
        return clone(records[0] ?? null)
      },
      create: async ({ data }: any) => {
        const record: PriceVersionRecord = {
          id: data.id ?? makeId(),
          priceId: data.priceId,
          amount: data.amount,
          productId: data.productId ?? null,
          currency: data.currency ?? null,
          unitAmount: data.unitAmount ?? null,
          compareAt: data.compareAt ?? null,
          note: data.note ?? null,
          validFrom: data.validFrom ?? null,
          createdAt: new Date(),
        }
        state.priceVersions.push(record)
        return clone(record)
      },
    },
  }

  return {
    get state() {
      return state
    },
    reset(partial?: Partial<StoreState>) {
      state = defaultState()
      if (partial?.projects) state.projects = clone(partial.projects)
      if (partial?.shopifyIntegrations) state.shopifyIntegrations = clone(partial.shopifyIntegrations)
      if (partial?.products) state.products = clone(partial.products)
      if (partial?.skus) state.skus = clone(partial.skus)
      if (partial?.prices) state.prices = clone(partial.prices)
      if (partial?.priceVersions) state.priceVersions = clone(partial.priceVersions)
    },
    client,
  }
})()

const connectorMocks = {
  listProducts: vi.fn(),
}

vi.mock('@calibr/db', () => ({
  prisma: () => store.client,
}))

vi.mock('@/lib/shopify-connector', () => ({
  initializeShopifyConnector: vi.fn(async () => ({
    isAuthenticated: () => true,
  })),
  getProductsClient: vi.fn(() => ({
    listProducts: (...args: any[]) => connectorMocks.listProducts(...args),
    getProduct: vi.fn(),
  })),
}))

function makeRequest(query: string) {
  const url = `https://api.example.com/api/integrations/shopify/products${query}`
  const request = new Request(url)
  // @ts-expect-error NextRequest compatibility
  return new NextRequest(request)
}

function makeVariant(variant: Partial<ShopifyVariant>): ShopifyVariant {
  return {
    id: variant.id ?? `gid://shopify/ProductVariant/${makeId()}`,
    productId: variant.productId ?? 'gid://shopify/Product/123',
    title: variant.title ?? 'Default Title',
    sku: variant.sku,
    price: variant.price ?? '0.00',
    compareAtPrice: variant.compareAtPrice,
    inventoryQuantity: variant.inventoryQuantity,
    inventoryPolicy: variant.inventoryPolicy ?? 'deny',
    fulfillmentService: variant.fulfillmentService ?? 'manual',
    createdAt: variant.createdAt ?? new Date().toISOString(),
    updatedAt: variant.updatedAt ?? new Date().toISOString(),
    option1: variant.option1,
    option2: variant.option2,
    option3: variant.option3,
    barcode: variant.barcode,
    image: variant.image,
    inventoryItemId: variant.inventoryItemId,
  }
}

function makeProduct(product: Partial<ShopifyProduct>): ShopifyProduct {
  return {
    id: product.id ?? 'gid://shopify/Product/123',
    title: product.title ?? 'Test Product',
    handle: product.handle ?? 'test-product',
    vendor: product.vendor,
    productType: product.productType,
    tags: product.tags ?? [],
    variants: product.variants ?? [makeVariant({ price: '19.99', sku: 'SKU-1' })],
    createdAt: product.createdAt ?? new Date().toISOString(),
    updatedAt: product.updatedAt ?? new Date().toISOString(),
    body_html: product.body_html,
    status: product.status ?? 'active',
    images: product.images,
    publishedAt: product.publishedAt,
  }
}

describe('Shopify product sync API', () => {
  beforeEach(() => {
    idCounter = 0
    store.reset()
    connectorMocks.listProducts.mockReset()
  })

  it('persists Shopify products and variants into Product and PriceVersion records', async () => {
    const product = makeProduct({
      id: 'gid://shopify/Product/111',
      handle: 'calibrate-shirt',
      title: 'Calibrate Tee',
      tags: ['apparel'],
      variants: [makeVariant({
        id: 'gid://shopify/ProductVariant/200',
        sku: 'TEE-RED-S',
        price: '24.50',
        compareAtPrice: '29.00',
      })],
    })

    connectorMocks.listProducts.mockResolvedValue({
      products: [product],
      page_info: { has_next_page: false, has_previous_page: false },
    })

    const response = await syncProductsRoute(makeRequest('?project_id=proj1'))
    expect(response.status).toBe(200)
    const body = await response.json()

    expect(body.sync.processed).toBe(1)
    expect(body.sync.results[0].variantResults[0].priceChanged).toBe(true)

    expect(store.state.products).toHaveLength(1)
    expect(store.state.skus).toHaveLength(1)
    expect(store.state.prices).toHaveLength(1)
    expect(store.state.priceVersions).toHaveLength(1)

    const storedProduct = store.state.products[0]
    expect(storedProduct.code).toBe('calibrate-shirt')
    expect(storedProduct.tags).toContain('apparel')
    expect(storedProduct.channelRefs?.shopify?.productId).toBe('gid://shopify/Product/111')

    const storedPrice = store.state.prices[0]
    expect(storedPrice.amount).toBe(2450)

    const storedVersion = store.state.priceVersions[0]
    expect(storedVersion.amount).toBe(2450)
    expect(storedVersion.compareAt).toBe(2900)
    expect(storedVersion.note).toContain('Shopify sync')

    const integration = store.state.shopifyIntegrations[0]
    expect(integration.syncStatus).toBe('success')
    expect(integration.lastSyncAt).toBeInstanceOf(Date)
  })

  it('creates a new price version when variant price changes', async () => {
    store.reset({
      products: [{
        id: 'product-existing',
        tenantId: 'tenant1',
        projectId: 'proj1',
        name: 'Existing Product',
        code: 'existing-product',
        status: 'ACTIVE',
        title: 'Existing Product',
        sku: 'SKU-1',
        tags: [],
        channelRefs: { shopify: { productId: 'gid://shopify/Product/222' } },
        active: true,
      }],
      skus: [{
        id: 'sku-existing',
        productId: 'product-existing',
        code: 'SKU-1',
        name: 'Existing SKU',
        status: 'ACTIVE',
        attributes: {},
      }],
      prices: [{
        id: 'price-existing',
        skuId: 'sku-existing',
        currency: 'USD',
        amount: 1000,
        status: 'ACTIVE',
      }],
      priceVersions: [{
        id: 'pv-existing',
        priceId: 'price-existing',
        amount: 1000,
        productId: 'product-existing',
        currency: 'USD',
        unitAmount: 1000,
        compareAt: null,
        note: 'Initial price',
        validFrom: new Date('2024-01-01T00:00:00Z'),
        createdAt: new Date('2024-01-01T00:00:00Z'),
      }],
    })

    connectorMocks.listProducts.mockResolvedValue({
      products: [makeProduct({
        id: 'gid://shopify/Product/222',
        handle: 'existing-product',
        title: 'Existing Product',
        variants: [makeVariant({
          id: 'gid://shopify/ProductVariant/999',
          sku: 'SKU-1',
          price: '15.00',
        })],
      })],
      page_info: { has_next_page: false, has_previous_page: false },
    })

    const response = await syncProductsRoute(makeRequest('?project_id=proj1'))
    expect(response.status).toBe(200)

    expect(store.state.prices[0].amount).toBe(1500)
    expect(store.state.priceVersions).toHaveLength(2)
    const latest = store.state.priceVersions[1]
    expect(latest.amount).toBe(1500)
    expect(latest.note).toBe('Shopify sync update')
  })
})
