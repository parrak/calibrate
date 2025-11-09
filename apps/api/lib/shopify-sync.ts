import type { PrismaClient, Status } from '@calibr/db'
import { createId } from '@paralleldrive/cuid2'
import type { ShopifyProduct, ShopifyVariant } from '@calibr/shopify-connector'

interface ShopifySyncOptions {
  projectId: string
  shopDomain: string
  products: ShopifyProduct[]
}

export interface ShopifyVariantSyncResult {
  externalId: string
  skuId: string
  priceId: string
  priceVersionId: string | null
  currency: string
  amount: number
  created: boolean
  priceChanged: boolean
}

export interface ShopifyProductSyncResult {
  externalId: string
  productId: string
  status: Status
  created: boolean
  variantResults: ShopifyVariantSyncResult[]
}

const DEFAULT_CURRENCY = 'USD'

export async function syncShopifyProducts(
  db: PrismaClient,
  options: ShopifySyncOptions
): Promise<ShopifyProductSyncResult[]> {
  const { projectId, products, shopDomain } = options

  if (products.length === 0) {
    return []
  }

  const project = await db.project.findUnique({
    where: { id: projectId },
    select: { id: true, tenantId: true },
  })

  if (!project) {
    throw new Error(`Project ${projectId} not found while syncing Shopify products`)
  }

  const results: ShopifyProductSyncResult[] = []

  for (const product of products) {
    const productResult = await syncSingleProduct(db, {
      project,
      shopDomain,
      product,
    })
    results.push(productResult)
  }

  return results
}

interface SyncContext {
  project: { id: string; tenantId: string }
  shopDomain: string
  product: ShopifyProduct
}

async function syncSingleProduct(
  db: PrismaClient,
  context: SyncContext
): Promise<ShopifyProductSyncResult> {
  const { project, shopDomain, product } = context
  const status = mapShopifyStatus(product.status)
  const productCode = normalizeProductCode(product)
  const primarySku = product.variants?.[0]?.sku ?? null

  const productData = {
    tenantId: project.tenantId,
    projectId: project.id,
    name: product.title,
    code: productCode,
    status,
    title: product.title,
    sku: primarySku,
    tags: Array.isArray(product.tags) ? product.tags : [],
    channelRefs: {
      shopify: {
        shopDomain,
        productId: product.id,
        handle: product.handle,
        variants: product.variants?.map((variant) => ({
          id: variant.id,
          sku: variant.sku ?? null,
        })) ?? [],
      },
    },
    active: status === 'ACTIVE',
  }

  const existingProduct = await db.product.findUnique({
    where: {
      tenantId_projectId_code: {
        tenantId: project.tenantId,
        projectId: project.id,
        code: productCode,
      },
    },
  })

  const persistedProduct = existingProduct
    ? await db.product.update({
        where: { id: existingProduct.id },
        data: productData,
      })
    : await db.product.create({
        data: {
          id: createId(),
          ...productData,
        },
      })

  const variantResults: ShopifyVariantSyncResult[] = []

  for (const variant of product.variants ?? []) {
    const result = await syncVariant(db, {
      productId: persistedProduct.id,
      variant,
      product,
      status,
    })
    variantResults.push(result)
  }

  return {
    externalId: product.id,
    productId: persistedProduct.id,
    status,
    created: !existingProduct,
    variantResults,
  }
}

interface VariantContext {
  productId: string
  product: ShopifyProduct
  variant: ShopifyVariant
  status: Status
}

async function syncVariant(
  db: PrismaClient,
  context: VariantContext
): Promise<ShopifyVariantSyncResult> {
  const { productId, variant, product, status } = context
  const skuCode = normalizeSkuCode(variant)
  const skuData = {
    productId,
    code: skuCode,
    name: variant.title || product.title,
    status,
    attributes: {
      options: {
        option1: variant.option1 ?? null,
        option2: variant.option2 ?? null,
        option3: variant.option3 ?? null,
      },
      shopify: {
        variantId: variant.id,
        inventoryItemId: variant.inventoryItemId ?? null,
        inventoryPolicy: variant.inventoryPolicy,
      },
    },
  }

  const existingSku = await db.sku.findUnique({
    where: {
      productId_code: {
        productId,
        code: skuCode,
      },
    },
  })

  const persistedSku = existingSku
    ? await db.sku.update({
        where: { id: existingSku.id },
        data: skuData,
      })
    : await db.sku.create({
        data: {
          id: createId(),
          ...skuData,
        },
      })

  const currency = DEFAULT_CURRENCY
  const desiredAmount = toMinorUnits(variant.price)
  const compareAtAmount = variant.compareAtPrice ? toMinorUnits(variant.compareAtPrice) : null

  const existingPrice = await db.price.findUnique({
    where: {
      skuId_currency: {
        skuId: persistedSku.id,
        currency,
      },
    },
  })

  let persistedPrice = existingPrice
  let priceChanged = false
  let createdPrice = false

  if (!existingPrice) {
    persistedPrice = await db.price.create({
      data: {
        id: createId(),
        skuId: persistedSku.id,
        currency,
        amount: desiredAmount,
        status,
      },
    })
    priceChanged = true
    createdPrice = true
  } else if (existingPrice.amount !== desiredAmount || existingPrice.status !== status) {
    priceChanged = existingPrice.amount !== desiredAmount
    persistedPrice = await db.price.update({
      where: { id: existingPrice.id },
      data: {
        amount: desiredAmount,
        status,
      },
    })
  }

  const latestVersion = await db.priceVersion.findFirst({
    where: { priceId: persistedPrice!.id },
    orderBy: { createdAt: 'desc' },
  })

  let newVersionId: string | null = latestVersion?.id ?? null

  if (priceChanged || !latestVersion) {
    const version = await db.priceVersion.create({
      data: {
        id: createId(),
        priceId: persistedPrice!.id,
        amount: desiredAmount,
        productId,
        currency,
        unitAmount: desiredAmount,
        compareAt: compareAtAmount,
        note: createdPrice ? 'Shopify sync (initial)' : 'Shopify sync update',
        validFrom: new Date(),
      },
    })
    newVersionId = version.id
  }

  return {
    externalId: variant.id,
    skuId: persistedSku.id,
    priceId: persistedPrice!.id,
    priceVersionId: newVersionId,
    currency,
    amount: desiredAmount,
    created: createdPrice,
    priceChanged: priceChanged || !latestVersion,
  }
}

function normalizeProductCode(product: ShopifyProduct): string {
  if (product.handle?.trim()) {
    return product.handle.trim()
  }
  return `shopify-${product.id}`
}

function normalizeSkuCode(variant: ShopifyVariant): string {
  if (variant.sku?.trim()) {
    return variant.sku.trim()
  }
  return `shopify-variant-${variant.id}`
}

function toMinorUnits(price: string | number | null | undefined): number {
  if (typeof price === 'number') {
    return Math.round(price * 100)
  }

  if (!price) {
    return 0
  }

  const parsed = Number.parseFloat(price)
  if (Number.isNaN(parsed)) {
    return 0
  }

  return Math.round(parsed * 100)
}

function mapShopifyStatus(status: ShopifyProduct['status']): Status {
  switch ((status ?? 'draft').toLowerCase()) {
    case 'active':
      return 'ACTIVE'
    case 'archived':
      return 'ARCHIVED'
    default:
      return 'DRAFT'
  }
}
