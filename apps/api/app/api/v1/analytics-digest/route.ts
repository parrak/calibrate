/**
 * Analytics Digest Cron Job — M1.4
 *
 * POST /api/v1/analytics-digest
 * Daily analytics digest with anomaly detection
 *
 * Features:
 * - Aggregates pricing metrics daily
 * - Detects price spikes (>20% increase in 24h)
 * - Detects margin compression (<15% margin after price change)
 * - Identifies top performers and underperformers
 * - Stores digest for historical analysis
 *
 * Should be triggered by Vercel cron daily at midnight
 */

import { NextRequest, NextResponse } from 'next/server'
import { withSecurity } from '@/lib/security-headers'
import { prisma, Prisma } from '@calibr/db'

export const runtime = 'nodejs'
export const maxDuration = 300 // 5 minutes max execution time

interface Anomaly {
  type: 'price_spike' | 'margin_compression' | 'high_volatility' | 'unusual_volume'
  severity: 'low' | 'medium' | 'high' | 'critical'
  skuCode: string
  skuName?: string
  description: string
  details: Record<string, unknown>
  detectedAt: string
}

interface TopPerformer {
  skuCode: string
  skuName?: string
  metric: string
  value: number
  rank: number
}

/**
 * POST /api/v1/analytics-digest
 * Generate daily analytics digest for all projects
 *
 * Query params:
 * - project?: string (optional: generate for specific project only)
 * - date?: string (optional: generate for specific date, defaults to today)
 */
export const POST = withSecurity(async function POST(req: NextRequest) {
  const startTime = Date.now()

  try {
    const { searchParams } = new URL(req.url)
    const projectSlug = searchParams.get('project')
    const dateParam = searchParams.get('date')

    const digestDate = dateParam ? new Date(dateParam) : new Date()
    digestDate.setHours(0, 0, 0, 0) // Start of day

    console.log('[Analytics Digest] Starting digest generation', { projectSlug, digestDate })

    let projects: Array<{ id: string; slug: string; tenantId: string }> = []

    if (projectSlug) {
      // Generate for specific project
      const project = await prisma().project.findUnique({
        where: { slug: projectSlug },
        select: { id: true, slug: true, tenantId: true },
      })

      if (!project) {
        return NextResponse.json({ error: 'Project not found' }, { status: 404 })
      }

      projects = [project]
    } else {
      // Generate for all projects
      projects = await prisma().project.findMany({
        select: { id: true, slug: true, tenantId: true },
      })
    }

    const results = []

    for (const project of projects) {
      try {
        const digest = await generateDigestForProject(project.id, project.tenantId, digestDate)
        results.push({
          projectId: project.id,
          projectSlug: project.slug,
          success: true,
          digest,
        })
      } catch (error) {
        console.error(`[Analytics Digest] Failed for project ${project.slug}:`, error)
        results.push({
          projectId: project.id,
          projectSlug: project.slug,
          success: false,
          error: error instanceof Error ? error.message : 'Unknown error',
        })
      }
    }

    const executionTime = Date.now() - startTime

    return NextResponse.json(
      {
        success: true,
        digestDate: digestDate.toISOString(),
        projectsProcessed: projects.length,
        results,
        executionTime,
      },
      { status: 200 }
    )
  } catch (error) {
    console.error('[Analytics Digest] Error:', error)
    return NextResponse.json(
      {
        error: 'Failed to generate analytics digest',
        message: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    )
  }
})

/**
 * Generate analytics digest for a single project
 */
async function generateDigestForProject(
  projectId: string,
  tenantId: string,
  digestDate: Date
): Promise<{
  totalPriceChanges: number
  totalRevenue: number | null
  avgMargin: number | null
  anomalies: Anomaly[]
  topPerformers: TopPerformer[]
}> {
  const yesterday = new Date(digestDate)
  yesterday.setDate(yesterday.getDate() - 1)

  const weekAgo = new Date(digestDate)
  weekAgo.setDate(weekAgo.getDate() - 7)

  // Count price changes in the last 24 hours
  const totalPriceChanges = await prisma().priceChange.count({
    where: {
      projectId,
      createdAt: {
        gte: yesterday,
        lt: digestDate,
      },
    },
  })

  // Get all recent price changes for analysis
  const recentPriceChanges = await prisma().priceChange.findMany({
    where: {
      projectId,
      createdAt: {
        gte: yesterday,
        lt: digestDate,
      },
    },
  })

  // Calculate total revenue impact
  const totalRevenue = recentPriceChanges.reduce((sum, pc) => {
    const delta = pc.toAmount - pc.fromAmount
    return sum + delta
  }, 0)

  // Calculate average margin for active SKUs
  const skusWithPricing = await prisma().sku.findMany({
    where: {
      Product: { projectId },
      status: 'ACTIVE',
    },
    select: {
      code: true,
      name: true,
      attributes: true,
      Price: {
        where: { status: 'ACTIVE' },
        select: { amount: true },
        take: 1,
      },
    },
  })

  const margins = skusWithPricing
    .filter((sku) => {
      const price = sku.Price[0]?.amount
      const attrs = sku.attributes as { cost?: number } | null
      const cost = attrs?.cost
      return price && cost && cost > 0
    })
    .map((sku) => {
      const price = sku.Price[0]!.amount
      const attrs = sku.attributes as { cost: number }
      const cost = attrs.cost
      return ((price - cost) / cost) * 100
    })

  const avgMargin = margins.length > 0 ? margins.reduce((sum, m) => sum + m, 0) / margins.length : null

  // Detect anomalies
  const anomalies: Anomaly[] = []

  // 1. Price Spikes: >20% increase in 24h
  for (const pc of recentPriceChanges) {
    const delta = pc.toAmount - pc.fromAmount
    const deltaPercent = (delta / pc.fromAmount) * 100

    if (deltaPercent > 20) {
      // Fetch SKU details separately
      const sku = await prisma().sku.findUnique({
        where: { id: pc.skuId },
        select: { code: true, name: true },
      })

      anomalies.push({
        type: 'price_spike',
        severity: deltaPercent > 50 ? 'critical' : deltaPercent > 35 ? 'high' : 'medium',
        skuCode: sku?.code || pc.skuId,
        skuName: sku?.name,
        description: `Price increased by ${deltaPercent.toFixed(1)}% in the last 24 hours`,
        details: {
          fromAmount: pc.fromAmount,
          toAmount: pc.toAmount,
          delta,
          deltaPercent,
          priceChangeId: pc.id,
        },
        detectedAt: new Date().toISOString(),
      })
    }
  }

  // 2. Margin Compression: <15% margin after price change
  for (const pc of recentPriceChanges) {
    // Fetch SKU details separately
    const sku = await prisma().sku.findUnique({
      where: { id: pc.skuId },
      select: { code: true, name: true, attributes: true },
    })

    const attrs = sku?.attributes as { cost?: number } | null
    const cost = attrs?.cost

    if (cost && cost > 0) {
      const newMargin = ((pc.toAmount - cost) / cost) * 100

      if (newMargin < 15) {
        anomalies.push({
          type: 'margin_compression',
          severity: newMargin < 5 ? 'critical' : newMargin < 10 ? 'high' : 'medium',
          skuCode: sku?.code || pc.skuId,
          skuName: sku?.name,
          description: `Margin compressed to ${newMargin.toFixed(1)}% after price change`,
          details: {
            cost,
            newPrice: pc.toAmount,
            newMargin,
            priceChangeId: pc.id,
          },
          detectedAt: new Date().toISOString(),
        })
      }
    }
  }

  // 3. High Volatility: Multiple price changes in 7 days
  const volatilityAnalysis = await prisma().priceChange.groupBy({
    by: ['skuId'],
    where: {
      projectId,
      createdAt: {
        gte: weekAgo,
        lt: digestDate,
      },
    },
    _count: {
      id: true,
    },
    having: {
      id: {
        _count: {
          gt: 3, // More than 3 changes in a week
        },
      },
    },
  })

  for (const vol of volatilityAnalysis) {
    const sku = await prisma().sku.findUnique({
      where: { id: vol.skuId },
      select: { code: true, name: true },
    })

    anomalies.push({
      type: 'high_volatility',
      severity: vol._count.id > 5 ? 'high' : 'medium',
      skuCode: sku?.code || vol.skuId,
      skuName: sku?.name,
      description: `${vol._count.id} price changes in the last 7 days`,
      details: {
        changeCount: vol._count.id,
        period: '7 days',
      },
      detectedAt: new Date().toISOString(),
    })
  }

  // 4. Unusual Volume: High number of price changes in 24h
  if (totalPriceChanges > 50) {
    anomalies.push({
      type: 'unusual_volume',
      severity: totalPriceChanges > 100 ? 'high' : 'medium',
      skuCode: 'SYSTEM',
      description: `Unusually high number of price changes: ${totalPriceChanges} in 24 hours`,
      details: {
        totalChanges: totalPriceChanges,
        period: '24 hours',
      },
      detectedAt: new Date().toISOString(),
    })
  }

  // Identify top performers (by margin)
  const topPerformers: TopPerformer[] = skusWithPricing
    .filter((sku) => {
      const price = sku.Price[0]?.amount
      const attrs = sku.attributes as { cost?: number } | null
      const cost = attrs?.cost
      return price && cost && cost > 0
    })
    .map((sku) => {
      const price = sku.Price[0]!.amount
      const attrs = sku.attributes as { cost: number }
      const cost = attrs.cost
      const margin = ((price - cost) / cost) * 100

      return {
        skuCode: sku.code,
        skuName: sku.name,
        metric: 'margin',
        value: margin,
        rank: 0, // Will be set after sorting
      }
    })
    .sort((a, b) => b.value - a.value)
    .slice(0, 10)
    .map((perf, idx) => ({ ...perf, rank: idx + 1 }))

  // Store digest in database
  await prisma().analyticsDigest.upsert({
    where: {
      projectId_digestDate: {
        projectId,
        digestDate,
      },
    },
    create: {
      tenantId,
      projectId,
      digestDate,
      totalPriceChanges,
      totalRevenue,
      avgMargin,
      anomalies: anomalies as unknown as Prisma.InputJsonValue,
      topPerformers: topPerformers as unknown as Prisma.InputJsonValue,
      metrics: {
        skusAnalyzed: skusWithPricing.length,
        anomalyCount: anomalies.length,
        criticalAnomalies: anomalies.filter((a) => a.severity === 'critical').length,
        highAnomalies: anomalies.filter((a) => a.severity === 'high').length,
      },
    },
    update: {
      totalPriceChanges,
      totalRevenue,
      avgMargin,
      anomalies: anomalies as unknown as Prisma.InputJsonValue,
      topPerformers: topPerformers as unknown as Prisma.InputJsonValue,
      metrics: {
        skusAnalyzed: skusWithPricing.length,
        anomalyCount: anomalies.length,
        criticalAnomalies: anomalies.filter((a) => a.severity === 'critical').length,
        highAnomalies: anomalies.filter((a) => a.severity === 'high').length,
      },
    },
  })

  return {
    totalPriceChanges,
    totalRevenue,
    avgMargin,
    anomalies,
    topPerformers,
  }
}

/**
 * GET /api/v1/analytics-digest
 * Retrieve analytics digests
 *
 * Query params:
 * - project: string (required)
 * - startDate?: string
 * - endDate?: string
 * - limit?: number (default: 30)
 */
export const GET = withSecurity(async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url)
    const projectSlug = searchParams.get('project')
    const startDate = searchParams.get('startDate')
    const endDate = searchParams.get('endDate')
    const limit = parseInt(searchParams.get('limit') || '30', 10)

    if (!projectSlug) {
      return NextResponse.json({ error: 'project parameter is required' }, { status: 400 })
    }

    // Get project
    const project = await prisma().project.findUnique({
      where: { slug: projectSlug },
      select: { id: true, tenantId: true },
    })

    if (!project) {
      return NextResponse.json({ error: 'Project not found' }, { status: 404 })
    }

    // Build where clause
    const where: {
      projectId: string
      digestDate?: { gte?: Date; lte?: Date }
    } = {
      projectId: project.id,
    }

    if (startDate || endDate) {
      where.digestDate = {}
      if (startDate) where.digestDate.gte = new Date(startDate)
      if (endDate) where.digestDate.lte = new Date(endDate)
    }

    const digests = await prisma().analyticsDigest.findMany({
      where,
      orderBy: { digestDate: 'desc' },
      take: limit,
    })

    return NextResponse.json(
      {
        project: projectSlug,
        count: digests.length,
        digests,
      },
      { status: 200 }
    )
  } catch (error) {
    console.error('[Analytics Digest GET] Error:', error)
    return NextResponse.json(
      {
        error: 'Failed to retrieve analytics digests',
        message: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    )
  }
})

/**
 * OPTIONS handler for CORS preflight
 */
export const OPTIONS = withSecurity(async () => {
  return new NextResponse(null, { status: 204 })
})
