import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@calibr/db'
import { withSecurity } from '@/lib/security-headers'
import { authSecurityManager, type AuthContext } from '@/lib/auth-security'
import { getCompetitorInsights } from '@calibr/pricing-engine/competitorRules'

const db = () => prisma()

function requireAuth(request: NextRequest): { error?: NextResponse; session?: AuthContext } {
  const authHeader = request.headers.get('authorization') || request.headers.get('Authorization')
  if (!authHeader?.startsWith('Bearer ')) {
    return {
      error: NextResponse.json(
        {
          error: 'Authentication required',
          message: 'Valid authentication token required'
        },
        { status: 401 }
      )
    }
  }

  const token = authHeader.substring(7).trim()
  const session = authSecurityManager.validateSessionToken(token)
  if (!session || !session.userId) {
    return {
      error: NextResponse.json(
        {
          error: 'Authentication required',
          message: 'Invalid session token'
        },
        { status: 401 }
      )
    }
  }

  return { session }
}

/**
 * GET /api/v1/competitors/analytics?projectSlug=demo
 * Returns price comparisons and market insights for the project
 */
export const GET = withSecurity(async (request: NextRequest) => {
  try {
    // Require authentication
    const authCheck = requireAuth(request)
    if (authCheck.error) {
      return authCheck.error
    }

    const { searchParams } = new URL(request.url)
    const projectSlug = searchParams.get('projectSlug')

    if (!projectSlug) {
      return NextResponse.json({ error: 'Missing projectSlug parameter' }, { status: 400 })
    }

    // Resolve projectSlug to project
    const project = await db().project.findUnique({
      where: { slug: projectSlug }
    })

    if (!project) {
      return NextResponse.json({ error: 'Project not found' }, { status: 404 })
    }

    // Get all active competitors with their products and prices
    const competitors = await db().competitor.findMany({
      where: {
        tenantId: project.tenantId,
        projectId: project.id,
        isActive: true
      },
      include: {
        CompetitorProduct: {
          where: { isActive: true },
          include: {
            CompetitorPrice: {
              orderBy: { createdAt: 'desc' },
              take: 1
            },
            Sku: {
              include: {
                Price: {
                  where: { status: 'ACTIVE' },
                  take: 1
                }
              }
            }
          }
        }
      }
    })

    // Build price comparisons grouped by SKU
    const priceComparisonsBySku = new Map<string, {
      skuId: string
      skuName: string
      ourPrice: number
      competitorPrices: Array<{
        competitorId: string
        competitorName: string
        price: number
        currency: string
        isOnSale: boolean
      }>
    }>()

    for (const competitor of competitors) {
      for (const product of competitor.CompetitorProduct) {
        if (!product.Sku || !product.CompetitorPrice[0]) continue

        const skuId = product.Sku.id
        const latestPrice = product.CompetitorPrice[0]

        if (!priceComparisonsBySku.has(skuId)) {
          priceComparisonsBySku.set(skuId, {
            skuId,
            skuName: product.Sku.name || product.name,
            ourPrice: product.Sku.Price[0]?.amount || 0,
            competitorPrices: []
          })
        }

        priceComparisonsBySku.get(skuId)!.competitorPrices.push({
          competitorId: competitor.id,
          competitorName: competitor.name,
          price: latestPrice.amount,
          currency: latestPrice.currency,
          isOnSale: latestPrice.isOnSale
        })
      }
    }

    const comparisons = Array.from(priceComparisonsBySku.values())

    // Calculate market insights using the pricing engine
    const priceComparisonsForInsights = comparisons.map(c => ({
      skuId: c.skuId,
      ourPrice: c.ourPrice,
      competitorPrices: c.competitorPrices
    }))

    const insights = getCompetitorInsights(priceComparisonsForInsights)

    return NextResponse.json({
      comparisons,
      insights,
      competitorCount: competitors.length
    })
  } catch (error) {
    console.error('Error fetching competitor analytics:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
})

/**
 * OPTIONS handler for CORS preflight
 */
export const OPTIONS = withSecurity(async (_req: NextRequest) => {
  return new NextResponse(null, { status: 204 })
})
