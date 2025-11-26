import { NextRequest, NextResponse } from 'next/server'
import { withSecurity } from '@/lib/security-headers'
import { prisma } from '@calibr/db'
import { initializeShopifyConnector, serializeShopifyRateLimit } from '@/lib/shopify-connector'
import { z } from 'zod'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

const querySchema = z
  .object({
    project_id: z.string().trim().min(1, 'project_id must be provided').optional(),
    project_slug: z.string().trim().min(1, 'project_slug must be provided').optional(),
  })
  .refine((value) => value.project_id || value.project_slug, {
    message: 'project_id or project_slug is required',
    path: ['project_id'],
  })

function pickShopSummary(shopInfo: unknown) {
  if (!shopInfo || typeof shopInfo !== 'object') {
    return null
  }

  const shop = (shopInfo as { shop?: Record<string, unknown> }).shop
  if (!shop || typeof shop !== 'object') {
    return null
  }

  const summary: Record<string, string> = {}

  if (typeof shop.name === 'string' && shop.name.trim().length > 0) {
    summary.name = shop.name
  }
  if (typeof shop.domain === 'string' && shop.domain.trim().length > 0) {
    summary.domain = shop.domain
  }
  const shopRecord = shop as Record<string, unknown>

  const myshopifyDomain = shopRecord.myshopify_domain
  if (typeof myshopifyDomain === 'string' && myshopifyDomain.trim().length > 0) {
    summary.myshopifyDomain = myshopifyDomain
  }
  const plan = shopRecord.plan_display_name ?? shopRecord.plan_name
  if (typeof plan === 'string' && plan.trim().length > 0) {
    summary.plan = plan
  }
  const primaryLocale = shopRecord.primary_locale
  if (typeof primaryLocale === 'string' && primaryLocale.trim().length > 0) {
    summary.primaryLocale = primaryLocale
  }

  return Object.keys(summary).length > 0 ? summary : null
}

export const GET = withSecurity(async (request: NextRequest) => {
  const { searchParams } = new URL(request.url)
  const parsed = querySchema.safeParse({
    project_id: searchParams.get('project_id'),
    project_slug: searchParams.get('project_slug'),
  })

  if (!parsed.success) {
    const [{ message }] = parsed.error.issues
    return NextResponse.json({ error: message }, { status: 400 })
  }

  const { project_id: projectIdParam, project_slug: projectSlug } = parsed.data

  try {
    let resolvedProjectId = projectIdParam ?? null

    if (projectSlug) {
      const project = await prisma().project.findUnique({
        where: { slug: projectSlug },
      })

      if (!project) {
        return NextResponse.json(
          { error: 'Project not found' },
          { status: 404 }
        )
      }

      resolvedProjectId = project.id
    }

    if (!resolvedProjectId) {
      return NextResponse.json(
        { error: 'Project not found' },
        { status: 404 }
      )
    }

    const integration = await prisma().shopifyIntegration.findFirst({
      where: {
        projectId: resolvedProjectId,
        isActive: true,
      },
      select: {
        shopDomain: true,
        accessToken: true,
        scope: true,
        isActive: true,
        lastSyncAt: true,
        syncStatus: true,
        syncError: true,
      },
    })

    if (!integration) {
      return NextResponse.json(
        { error: 'No active Shopify integration found' },
        { status: 404 }
      )
    }

    const connector = await initializeShopifyConnector(integration)
    const status = await connector.getConnectionStatus()

    const rateLimit = serializeShopifyRateLimit(status.rateLimit ?? null)
    const healthStatus = status.connected ? 'ok' : 'disconnected'
    const rateLimitStatus =
      rateLimit && typeof rateLimit.remaining === 'number'
        ? rateLimit.remaining <= 5
          ? 'limited'
          : 'normal'
        : 'unknown'

    const shopSummary = pickShopSummary(status.shopInfo)

    return NextResponse.json({
      projectId: resolvedProjectId,
      shopDomain: integration.shopDomain,
      connected: status.connected,
      status: healthStatus,
      rateLimit,
      rateLimitStatus,
      lastSyncAt: integration.lastSyncAt?.toISOString() ?? null,
      syncStatus: integration.syncStatus ?? 'unknown',
      syncError: integration.syncError ?? null,
      shopInfo: shopSummary,
    })
  } catch (error) {
    console.error('Shopify health check failed:', error)
    const message =
      error instanceof Error
        ? error.message
        : 'Failed to evaluate Shopify connector health.'

    return NextResponse.json(
      {
        error: 'ShopifyHealthCheckFailed',
        message,
      },
      { status: 500 }
    )
  }
})

export const OPTIONS = withSecurity(async () => new NextResponse(null, { status: 204 }))
