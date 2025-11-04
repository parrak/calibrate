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

        // Store snapshot (implement storage later - for now just track)
        console.log(`[Analytics] Generated snapshot for ${project.slug}:`, {
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
    approved: priceChanges.filter((pc) => pc.status === 'APPROVED').length,
    rejected: priceChanges.filter((pc) => pc.status === 'REJECTED').length,
    pending: priceChanges.filter((pc) => pc.status === 'PENDING').length,
    applied: priceChanges.filter((pc) => pc.status === 'APPROVED').length, // Simplified
  }

  // Calculate pricing metrics
  const prices = skus
    .map((s) => s.Price[0]?.amount)
    .filter((p): p is number => p !== undefined && p !== null)
  const pricingMetrics = {
    averagePrice: prices.length > 0 ? Math.round(prices.reduce((a, b) => a + b, 0) / prices.length) : 0,
    minPrice: prices.length > 0 ? Math.min(...prices) : 0,
    maxPrice: prices.length > 0 ? Math.max(...prices) : 0,
    medianPrice: prices.length > 0 ? calculateMedian(prices) : 0,
  }

  // Calculate margin metrics if cost data available (cost might be in attributes JSON)
  const skusWithCost = skus
    .map((s) => {
      const price = s.Price[0]?.amount
      const cost = s.attributes && typeof s.attributes === 'object' && 'cost' in s.attributes
        ? (s.attributes as any).cost
        : null
      return { price, cost }
    })
    .filter((s): s is { price: number; cost: number } => 
      s.price !== undefined && s.price !== null && s.cost !== null && s.cost > 0
    )
  
  const marginMetrics = skusWithCost.length > 0 ? {
    averageMargin: calculateAverageMargin(skusWithCost),
    minMargin: calculateMinMargin(skusWithCost),
    maxMargin: calculateMaxMargin(skusWithCost),
  } : undefined

  // TODO: Fetch sales data if includeSales is true
  // const salesMetrics = includeSales ? await fetchSalesMetrics(projectId, dayStart, dayEnd) : undefined

  // TODO: Fetch competitor insights if includeCompetitorData is true
  // const competitorInsights = includeCompetitorData ? await fetchCompetitorInsights(projectId) : undefined

  return {
    projectId,
    date,
    totalSkus: skus.length,
    priceChanges: priceChangeMetrics,
    pricing: pricingMetrics,
    margins: marginMetrics,
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
