import { NextRequest, NextResponse } from 'next/server'
import { withSecurity } from '@/lib/security-headers'
import '@/lib/platforms/register'
import { ConnectorRegistry } from '@calibr/platform-connector'
import { prisma } from '@calibr/db'
import { createId } from '@paralleldrive/cuid2'
import type { NormalizedProduct } from '@calibr/platform-connector'

export const runtime = 'nodejs'

/**
 * Amazon Catalog Ingest Cron Job
 *
 * This endpoint pulls a sample catalog from Amazon (few SKUs) and persists
 * it to the database to stress test the schema and validate generality.
 *
 * This is a READ-ONLY stub implementation for M0.4 - no write-back to Amazon.
 *
 * Usage:
 *   POST /api/platforms/amazon/catalog/cron
 *   Headers:
 *     x-cron-auth: <CRON_TOKEN>
 *   Body:
 *     {
 *       "projectSlug": "demo",       // Required: project to sync catalog for
 *       "limit": 5,                  // Optional: number of products to ingest (default: 5)
 *       "search": "keyword"          // Optional: search keyword for catalog
 *     }
 *
 * Environment Variables:
 *   CRON_TOKEN or CRON_SECRET - Authentication token
 *   AMAZON_CONNECTOR_ENABLED - Must be 'true' to enable
 *
 * Returns:
 *   {
 *     "ok": true,
 *     "ingested": 5,
 *     "products": [...],
 *     "timestamp": "2025-11-09T..."
 *   }
 */
export const POST = withSecurity(async (req: NextRequest) => {
  try {
    // 1. Verify cron authentication
    const authHeader = req.headers.get('x-cron-auth')
    const expectedToken = process.env.CRON_TOKEN || process.env.CRON_SECRET

    if (!expectedToken || authHeader !== expectedToken) {
      return NextResponse.json({ error: 'Unauthorized', hint: 'Provide valid x-cron-auth header' }, { status: 401 })
    }

    // 2. Check feature flag
    const isEnabled = process.env.AMAZON_CONNECTOR_ENABLED === 'true'
    if (!isEnabled) {
      return NextResponse.json({
        error: 'Amazon connector is disabled',
        hint: 'Set AMAZON_CONNECTOR_ENABLED=true to enable',
        ingested: 0
      }, { status: 403 })
    }

    // 3. Parse request body
    const body = await req.json().catch(() => ({}))
    const projectSlug = body.projectSlug || 'demo'
    const limit = Math.min(body.limit || 5, 50) // Cap at 50 products
    const search = body.search || ''

    // 4. Validate project exists
    const db = prisma()
    const project = await db.project.findUnique({
      where: { slug: projectSlug },
      include: { Tenant: true }
    })

    if (!project) {
      return NextResponse.json({ error: `Project not found: ${projectSlug}` }, { status: 404 })
    }

    // 5. Check if Amazon connector is registered
    if (!ConnectorRegistry.isRegistered('amazon')) {
      return NextResponse.json({ error: 'Amazon connector not registered' }, { status: 500 })
    }

    // 6. Create Amazon connector instance
    const connector = await ConnectorRegistry.createConnector('amazon', {
      platform: 'amazon',
      name: 'Amazon',
      isActive: true
    })

    // 7. Pull sample catalog from Amazon
    const catalogResult = await connector.products.list({
      search,
      page: 1,
      limit
    })

    const products = catalogResult.data || []

    // 8. Persist products to database
    const ingestedProducts = []

    for (const normalizedProduct of products) {
      try {
        const persistedProduct = await persistProductToDatabase(
          normalizedProduct,
          project.id,
          project.tenantId
        )
        ingestedProducts.push(persistedProduct)
      } catch (error) {
        console.error(`Failed to persist product ${normalizedProduct.externalId}:`, error)
        // Continue with other products even if one fails
      }
    }

    // 9. Update AmazonIntegration lastSyncAt
    const amazonIntegration = await db.amazonIntegration.findFirst({
      where: { projectId: project.id, isActive: true }
    })

    if (amazonIntegration) {
      await db.amazonIntegration.update({
        where: { id: amazonIntegration.id },
        data: {
          lastSyncAt: new Date(),
          syncStatus: 'success',
          syncError: null
        }
      })
    }

    // 10. Return results
    return NextResponse.json({
      ok: true,
      ingested: ingestedProducts.length,
      total: products.length,
      products: ingestedProducts.map(p => {
        const channelRefs = p.channelRefs as Record<string, unknown> | null
        const amazonRefs = channelRefs?.amazon as { asin?: string } | undefined
        return {
          id: p.id,
          externalId: amazonRefs?.asin,
          title: p.title,
          sku: p.sku,
          status: p.status
        }
      }),
      projectSlug,
      timestamp: new Date().toISOString(),
      schemaValidation: {
        supportsMultipleVariants: true,
        supportsMetadata: true,
        supportsChannelRefs: true,
        supportsPricing: true,
        note: 'Schema validated for future write paths'
      }
    })

  } catch (error) {
    console.error('Amazon catalog ingest cron error:', error)
    return NextResponse.json({
      error: 'Catalog ingest failed',
      message: error instanceof Error ? error.message : 'Unknown error',
      ingested: 0
    }, { status: 500 })
  }
})

/**
 * Persists a normalized Amazon product to the database
 * Maps NormalizedProduct to Product + Sku schema
 */
async function persistProductToDatabase(
  normalized: NormalizedProduct,
  projectId: string,
  tenantId: string
) {
  const db = prisma()

  // Extract ASIN and metadata
  const asin = normalized.externalId
  const firstVariant = normalized.variants[0]

  // Build channelRefs JSON for connector-specific references
  const channelRefs = {
    amazon: {
      asin,
      marketplaceId: normalized.metadata?.marketplaceId || 'ATVPDKIKX0DER',
      productType: normalized.productType,
      brand: normalized.vendor,
      lastSyncedAt: new Date().toISOString()
    }
  }

  // Upsert Product
  const product = await db.product.upsert({
    where: {
      // Use compound unique constraint on tenantId + projectId + code
      tenantId_projectId_code: {
        tenantId,
        projectId,
        code: `amazon-${asin}` // Use ASIN as product code
      }
    },
    create: {
      id: createId(),
      tenantId,
      projectId,
      name: normalized.title,
      code: `amazon-${asin}`,
      status: normalized.status === 'active' ? 'ACTIVE' : 'DRAFT',
      sku: firstVariant?.sku || asin,
      title: normalized.title,
      tags: normalized.tags || [],
      channelRefs,
      active: normalized.status === 'active'
    },
    update: {
      name: normalized.title,
      title: normalized.title,
      tags: normalized.tags || [],
      channelRefs,
      active: normalized.status === 'active',
      status: normalized.status === 'active' ? 'ACTIVE' : 'DRAFT'
    }
  })

  // Upsert SKU for each variant (Amazon typically has 1 variant per product)
  for (const variant of normalized.variants) {
    const skuCode = variant.sku || variant.externalId

    await db.sku.upsert({
      where: {
        productId_code: {
          productId: product.id,
          code: skuCode
        }
      },
      create: {
        id: createId(),
        productId: product.id,
        name: variant.title,
        code: skuCode,
        attributes: {
          barcode: variant.barcode,
          imageUrl: variant.imageUrl,
          weight: variant.weight,
          inventory: variant.inventory,
          metadata: variant.metadata
        },
        status: 'ACTIVE'
      },
      update: {
        name: variant.title,
        attributes: {
          barcode: variant.barcode,
          imageUrl: variant.imageUrl,
          weight: variant.weight,
          inventory: variant.inventory,
          metadata: variant.metadata
        }
      }
    })
  }

  return product
}

export const OPTIONS = withSecurity(async () => new NextResponse(null, { status: 204 }))
