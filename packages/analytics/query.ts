/**
 * Analytics Query Functions
 */

import { prisma } from '@calibr/db'
import type { AnalyticsOverview, TrendData, SkuPerformance, DailySnapshot } from './types'

/**
 * Get analytics overview for a project
 */
export async function getAnalyticsOverview(
  projectId: string,
  days: number = 30
): Promise<AnalyticsOverview> {
  const endDate = new Date()
  const startDate = new Date(Date.now() - days * 24 * 60 * 60 * 1000)

  // Get SKUs (through Product relation)
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

  // Get price changes in period
  const priceChanges = await prisma().priceChange.findMany({
    where: {
      projectId,
      createdAt: { gte: startDate, lte: endDate },
    },
    select: {
      id: true,
      status: true,
      createdAt: true,
      fromAmount: true,
      toAmount: true,
    },
  })

  // Calculate summary
  const totalPriceChanges = priceChanges.length
  const approvedChanges = priceChanges.filter((pc: { status: string }) => pc.status === 'APPROVED').length
  const approvalRate = totalPriceChanges > 0
    ? Math.round((approvedChanges / totalPriceChanges) * 100) / 100
    : 0

  // Calculate trends
  const midPoint = new Date(startDate.getTime() + (days / 2) * 24 * 60 * 60 * 1000)
  const firstHalfChanges = priceChanges.filter((pc: { createdAt: Date }) => pc.createdAt < midPoint).length
  const secondHalfChanges = priceChanges.filter((pc: { createdAt: Date }) => pc.createdAt >= midPoint).length

  const priceChangesTrend: TrendData = {
    current: secondHalfChanges,
    previous: firstHalfChanges,
    change: secondHalfChanges - firstHalfChanges,
    changePercent: firstHalfChanges > 0
      ? Math.round(((secondHalfChanges - firstHalfChanges) / firstHalfChanges) * 100)
      : 0,
    direction: secondHalfChanges > firstHalfChanges
      ? 'up'
      : secondHalfChanges < firstHalfChanges
        ? 'down'
        : 'stable',
  }

  // Calculate average price trend
  const prices = skus
    .map((s: typeof skus[0]) => s.Price[0]?.amount)
    .filter((p: number | undefined | null): p is number => p !== undefined && p !== null)
  const avgPrice = prices.length > 0
    ? Math.round(prices.reduce((a: number, b: number) => a + b, 0) / prices.length)
    : 0

  const avgPriceTrend: TrendData = {
    current: avgPrice,
    previous: avgPrice, // Simplified - would need historical data
    change: 0,
    changePercent: 0,
    direction: 'stable',
  }

  // Fetch stored snapshots from database
  const snapshots = await prisma().dailySnapshot.findMany({
    where: {
      projectId,
      snapshotDate: {
        gte: startDate,
        lte: endDate,
      },
    },
    orderBy: { snapshotDate: 'asc' },
  })

  // Convert to DailySnapshot type
  const dailySnapshots: DailySnapshot[] = snapshots.map((s) => ({
    projectId: s.projectId,
    date: s.snapshotDate,
    totalSkus: s.totalSkus,
    priceChanges: {
      total: s.totalPriceChanges,
      approved: s.approvedChanges,
      rejected: s.rejectedChanges,
      pending: s.pendingChanges,
      applied: s.appliedChanges,
    },
    pricing: {
      averagePrice: s.averagePrice,
      minPrice: s.minPrice,
      maxPrice: s.maxPrice,
      medianPrice: s.medianPrice,
    },
    sales: s.totalRevenue !== null && s.totalUnits !== null && s.averageOrderValue !== null
      ? {
          totalRevenue: s.totalRevenue,
          totalUnits: s.totalUnits,
          averageOrderValue: s.averageOrderValue,
        }
      : undefined,
    margins: s.averageMargin !== null && s.minMargin !== null && s.maxMargin !== null
      ? {
          averageMargin: s.averageMargin,
          minMargin: s.minMargin,
          maxMargin: s.maxMargin,
        }
      : undefined,
    competitorInsights: s.competitorsSampled !== null && s.avgCompetitiveDelta !== null
      ? {
          totalCompetitorsSampled: s.competitorsSampled,
          averageCompetitiveDelta: s.avgCompetitiveDelta,
          pricesBelowMarket: s.pricesBelowMarket || 0,
          pricesAboveMarket: s.pricesAboveMarket || 0,
        }
      : undefined,
  }))

  // Top performers by price (simplified - would need sales data for real analysis)
  const topPerformers: AnalyticsOverview['topPerformers'] = {
    bySales: skus
      .filter((s: typeof skus[0]) => s.Price[0]?.amount !== undefined)
      .slice(0, 5)
      .map((s: typeof skus[0]) => ({
        sku: s.code,
        name: s.name,
        price: s.Price[0]!.amount,
      })),
    byMargin: skus
      .map((s: typeof skus[0]) => {
        const price = s.Price[0]?.amount
        const cost = s.attributes && typeof s.attributes === 'object' && 'cost' in s.attributes
          ? (s.attributes as any).cost
          : null
        return { sku: s.code, name: s.name, price, cost }
      })
      .filter((s: { sku: string; name: string; price?: number | null; cost?: number | null }): s is { sku: string; name: string; price: number; cost: number } =>
        s.price !== undefined && s.price !== null && s.cost !== undefined && s.cost !== null && s.cost > 0
      )
      .map((s: { sku: string; name: string; price: number; cost: number }) => ({
        sku: s.sku,
        name: s.name,
        price: s.price,
        margin: ((s.price - s.cost) / s.cost) * 100,
      }))
      .sort((a: { margin?: number }, b: { margin?: number }) => (b.margin || 0) - (a.margin || 0))
      .slice(0, 5),
  }

  return {
    projectId,
    period: {
      start: startDate,
      end: endDate,
      days,
    },
    summary: {
      totalSkus: skus.length,
      totalPriceChanges,
      averageChangePerDay: Math.round((totalPriceChanges / days) * 10) / 10,
      approvalRate,
    },
    trends: {
      averagePrice: avgPriceTrend,
      priceChanges: priceChangesTrend,
    },
    topPerformers,
    snapshots: dailySnapshots,
  }
}
