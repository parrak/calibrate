/**
 * Daily Snapshot Aggregation
 *
 * Aggregates pricing, sales, and competitor data into daily snapshots
 * for historical tracking and analytics
 */

import { prisma } from '@calibr/db'
import type {
  DailySnapshot,
  AggregationConfig,
  AggregationResult,
} from './types'

/**
 * Aggregate daily snapshots for all or specific projects
 */
export async function aggregateDailySnapshots(
  config: AggregationConfig = {}
): Promise<AggregationResult> {
  const startTime = Date.now()
  const {
    projectIds,
    startDate = new Date(Date.now() - 24 * 60 * 60 * 1000), // Yesterday
    endDate = new Date(),
    includeSales = false,
    includeCompetitorData = false,
  } = config

  const errors: Array<{ projectId: string; error: string }> = []
  const processedProjects: string[] = []
  let snapshotsCreated = 0

  try {
    // Get projects to process
    const projects = await prisma().project.findMany({
      where: projectIds ? { id: { in: projectIds } } : undefined,
      select: { id: true, slug: true },
    })

    for (const project of projects) {
      try {
        const snapshot = await generateSnapshot(project.id, {
          date: startDate,
          includeSales,
          includeCompetitorData,
        })

        // Store snapshot in database
        await prisma().dailySnapshot.upsert({
          where: {
            projectId_snapshotDate: {
              projectId: project.id,
              snapshotDate: startDate,
            },
          },
          create: {
            projectId: project.id,
            snapshotDate: startDate,
            totalSkus: snapshot.totalSkus,
            totalPriceChanges: snapshot.priceChanges.total,
            approvedChanges: snapshot.priceChanges.approved,
            rejectedChanges: snapshot.priceChanges.rejected,
            pendingChanges: snapshot.priceChanges.pending,
            appliedChanges: snapshot.priceChanges.applied,
            averagePrice: snapshot.pricing.averagePrice,
            minPrice: snapshot.pricing.minPrice,
            maxPrice: snapshot.pricing.maxPrice,
            medianPrice: snapshot.pricing.medianPrice,
            totalRevenue: snapshot.sales?.totalRevenue,
            totalUnits: snapshot.sales?.totalUnits,
            averageOrderValue: snapshot.sales?.averageOrderValue,
            averageMargin: snapshot.margins?.averageMargin,
            minMargin: snapshot.margins?.minMargin,
            maxMargin: snapshot.margins?.maxMargin,
            competitorsSampled: snapshot.competitorInsights?.totalCompetitorsSampled,
            avgCompetitiveDelta: snapshot.competitorInsights?.averageCompetitiveDelta,
            pricesBelowMarket: snapshot.competitorInsights?.pricesBelowMarket,
            pricesAboveMarket: snapshot.competitorInsights?.pricesAboveMarket,
          },
          update: {
            totalSkus: snapshot.totalSkus,
            totalPriceChanges: snapshot.priceChanges.total,
            approvedChanges: snapshot.priceChanges.approved,
            rejectedChanges: snapshot.priceChanges.rejected,
            pendingChanges: snapshot.priceChanges.pending,
            appliedChanges: snapshot.priceChanges.applied,
            averagePrice: snapshot.pricing.averagePrice,
            minPrice: snapshot.pricing.minPrice,
            maxPrice: snapshot.pricing.maxPrice,
            medianPrice: snapshot.pricing.medianPrice,
            totalRevenue: snapshot.sales?.totalRevenue,
            totalUnits: snapshot.sales?.totalUnits,
            averageOrderValue: snapshot.sales?.averageOrderValue,
            averageMargin: snapshot.margins?.averageMargin,
            minMargin: snapshot.margins?.minMargin,
            maxMargin: snapshot.margins?.maxMargin,
            competitorsSampled: snapshot.competitorInsights?.totalCompetitorsSampled,
            avgCompetitiveDelta: snapshot.competitorInsights?.averageCompetitiveDelta,
            pricesBelowMarket: snapshot.competitorInsights?.pricesBelowMarket,
            pricesAboveMarket: snapshot.competitorInsights?.pricesAboveMarket,
          },
        })

        console.log(`[Analytics] Stored snapshot for ${project.slug}:`, {
          totalSkus: snapshot.totalSkus,
          priceChanges: snapshot.priceChanges.total,
        })

        snapshotsCreated++
        processedProjects.push(project.id)
      } catch (error) {
        errors.push({
          projectId: project.id,
          error: error instanceof Error ? error.message : 'Unknown error',
        })
      }
    }

    return {
      snapshotsCreated,
      projectsProcessed: processedProjects,
      errors,
      duration: Date.now() - startTime,
    }
  } catch (error) {
    throw new Error(
      `Failed to aggregate snapshots: ${error instanceof Error ? error.message : 'Unknown error'}`
    )
  }
}

/**
 * Generate snapshot for a single project
 */
async function generateSnapshot(
  projectId: string,
  options: {
    date: Date
    includeSales?: boolean
    includeCompetitorData?: boolean
  }
): Promise<DailySnapshot> {
  const { date, includeSales, includeCompetitorData } = options

  // Get all SKUs for project (through Product relation)
  const skus = await prisma().sku.findMany({
    where: {
      Product: {
        projectId,
      },
    },
    select: {
      id: true,
      code: true,
      name: true,
      Price: {
        where: {
          status: 'ACTIVE',
        },
        select: {
          amount: true,
          currency: true,
        },
        take: 1,
      },
      attributes: true,
    },
  })

  // Get price changes for the day
  const dayStart = new Date(date)
  dayStart.setHours(0, 0, 0, 0)
  const dayEnd = new Date(date)
  dayEnd.setHours(23, 59, 59, 999)

  const priceChanges = await prisma().priceChange.findMany({
    where: {
      projectId,
      createdAt: {
        gte: dayStart,
        lte: dayEnd,
      },
    },
    select: {
      status: true,
      fromAmount: true,
      toAmount: true,
    },
  })

  // Calculate price change metrics
  const priceChangeMetrics = {
    total: priceChanges.length,
    approved: priceChanges.filter((pc: { status: string }) => pc.status === 'APPROVED').length,
    rejected: priceChanges.filter((pc: { status: string }) => pc.status === 'REJECTED').length,
    pending: priceChanges.filter((pc: { status: string }) => pc.status === 'PENDING').length,
    applied: priceChanges.filter((pc: { status: string }) => pc.status === 'APPROVED').length, // Simplified
  }

  // Calculate pricing metrics
  const prices = skus
    .map((s: typeof skus[0]) => s.Price[0]?.amount)
    .filter((p: number | undefined | null): p is number => p !== undefined && p !== null)
  const pricingMetrics = {
    averagePrice: prices.length > 0 ? Math.round(prices.reduce((a: number, b: number) => a + b, 0) / prices.length) : 0,
    minPrice: prices.length > 0 ? Math.min(...prices) : 0,
    maxPrice: prices.length > 0 ? Math.max(...prices) : 0,
    medianPrice: prices.length > 0 ? calculateMedian(prices) : 0,
  }

  // Calculate margin metrics if cost data available (cost might be in attributes JSON)
  const skusWithCost = skus
    .map((s: typeof skus[0]) => {
      const price = s.Price[0]?.amount
      const cost = s.attributes && typeof s.attributes === 'object' && 'cost' in s.attributes
        ? (s.attributes as any).cost
        : null
      return { price, cost }
    })
    .filter((s: { price?: number | null; cost?: number | null }): s is { price: number; cost: number } =>
      s.price !== undefined && s.price !== null && s.cost !== undefined && s.cost !== null && s.cost > 0
    )
  
  const marginMetrics = skusWithCost.length > 0 ? {
    averageMargin: calculateAverageMargin(skusWithCost),
    minMargin: calculateMinMargin(skusWithCost),
    maxMargin: calculateMaxMargin(skusWithCost),
  } : undefined

  // Fetch sales data if includeSales is true
  const salesMetrics = includeSales ? await fetchSalesMetrics(projectId, dayStart, dayEnd) : undefined

  // Fetch competitor insights if includeCompetitorData is true
  const competitorInsights = includeCompetitorData ? await fetchCompetitorInsights(projectId) : undefined

  return {
    projectId,
    date,
    totalSkus: skus.length,
    priceChanges: priceChangeMetrics,
    pricing: pricingMetrics,
    margins: marginMetrics,
    sales: salesMetrics,
    competitorInsights,
  }
}

/**
 * Calculate median from sorted prices
 */
function calculateMedian(values: number[]): number {
  if (values.length === 0) return 0
  const sorted = [...values].sort((a, b) => a - b)
  const mid = Math.floor(sorted.length / 2)
  return sorted.length % 2 === 0
    ? Math.round((sorted[mid - 1] + sorted[mid]) / 2)
    : sorted[mid]
}

/**
 * Calculate average margin percentage
 */
function calculateAverageMargin(skus: Array<{ price: number; cost: number }>): number {
  const margins = skus
    .map((s) => ((s.price - s.cost) / s.cost) * 100)

  return margins.length > 0
    ? Math.round(margins.reduce((a, b) => a + b, 0) / margins.length)
    : 0
}

function calculateMinMargin(skus: Array<{ price: number; cost: number }>): number {
  const margins = skus
    .map((s) => ((s.price - s.cost) / s.cost) * 100)

  return margins.length > 0 ? Math.round(Math.min(...margins)) : 0
}

function calculateMaxMargin(skus: Array<{ price: number; cost: number }>): number {
  const margins = skus
    .map((s) => ((s.price - s.cost) / s.cost) * 100)

  return margins.length > 0 ? Math.round(Math.max(...margins)) : 0
}

/**
 * Fetch sales metrics from Transactions table
 * Aggregates data from Shopify, Amazon, and Stripe sources
 */
async function fetchSalesMetrics(
  projectId: string,
  dayStart: Date,
  dayEnd: Date
): Promise<{ totalRevenue: number; totalUnits: number; averageOrderValue: number }> {
  const transactions = await prisma().transaction.findMany({
    where: {
      projectId,
      occurredAt: {
        gte: dayStart,
        lte: dayEnd,
      },
      status: 'succeeded', // Only successful transactions
    },
    select: {
      amount: true,
      netAmount: true,
    },
  })

  if (transactions.length === 0) {
    return {
      totalRevenue: 0,
      totalUnits: 0,
      averageOrderValue: 0,
    }
  }

  const totalRevenue = transactions.reduce((sum, t) => sum + (t.netAmount || t.amount), 0)
  const totalUnits = transactions.length // Simplified - could be improved with line items
  const averageOrderValue = Math.round(totalRevenue / totalUnits)

  return {
    totalRevenue,
    totalUnits,
    averageOrderValue,
  }
}

/**
 * Fetch competitor insights from CompetitorPrice table
 */
async function fetchCompetitorInsights(
  projectId: string
): Promise<{
  totalCompetitorsSampled: number
  averageCompetitiveDelta: number
  pricesBelowMarket: number
  pricesAboveMarket: number
}> {
  // Get all SKUs for the project with their current prices
  const skus = await prisma().sku.findMany({
    where: {
      Product: {
        projectId,
      },
    },
    select: {
      id: true,
      code: true,
      Price: {
        where: { status: 'ACTIVE' },
        select: { amount: true },
        take: 1,
      },
    },
  })

  // Get all competitor products linked to these SKUs
  const competitorProducts = await prisma().competitorProduct.findMany({
    where: {
      skuId: { in: skus.map((s) => s.id) },
    },
    select: {
      id: true,
      skuId: true,
      CompetitorPrice: {
        orderBy: { createdAt: 'desc' },
        take: 1, // Latest price
        select: {
          amount: true,
        },
      },
    },
  })

  if (competitorProducts.length === 0) {
    return {
      totalCompetitorsSampled: 0,
      averageCompetitiveDelta: 0,
      pricesBelowMarket: 0,
      pricesAboveMarket: 0,
    }
  }

  // Calculate competitive deltas
  const deltas: number[] = []
  let pricesBelowMarket = 0
  let pricesAboveMarket = 0

  for (const compProd of competitorProducts) {
    const competitorPrice = compProd.CompetitorPrice[0]?.amount
    if (!competitorPrice) continue

    const sku = skus.find((s) => s.id === compProd.skuId)
    const ourPrice = sku?.Price[0]?.amount

    if (!ourPrice) continue

    const delta = ourPrice - competitorPrice
    deltas.push(delta)

    if (ourPrice < competitorPrice) {
      pricesBelowMarket++
    } else if (ourPrice > competitorPrice) {
      pricesAboveMarket++
    }
  }

  const averageCompetitiveDelta = deltas.length > 0
    ? Math.round(deltas.reduce((sum, d) => sum + d, 0) / deltas.length)
    : 0

  return {
    totalCompetitorsSampled: competitorProducts.length,
    averageCompetitiveDelta,
    pricesBelowMarket,
    pricesAboveMarket,
  }
}
