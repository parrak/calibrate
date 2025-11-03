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

  // Get SKUs
  const skus = await prisma().sku.findMany({
    where: { projectId },
    select: {
      id: true,
      sku: true,
      name: true,
      priceAmount: true,
      cost: true,
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
  const approvedChanges = priceChanges.filter((pc) => pc.status === 'APPROVED').length
  const approvalRate = totalPriceChanges > 0
    ? Math.round((approvedChanges / totalPriceChanges) * 100) / 100
    : 0

  // Calculate trends
  const midPoint = new Date(startDate.getTime() + (days / 2) * 24 * 60 * 60 * 1000)
  const firstHalfChanges = priceChanges.filter((pc) => pc.createdAt < midPoint).length
  const secondHalfChanges = priceChanges.filter((pc) => pc.createdAt >= midPoint).length

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
  const prices = skus.map((s) => s.priceAmount).filter((p): p is number => p !== null)
  const avgPrice = prices.length > 0
    ? Math.round(prices.reduce((a, b) => a + b, 0) / prices.length)
    : 0

  const avgPriceTrend: TrendData = {
    current: avgPrice,
    previous: avgPrice, // Simplified - would need historical data
    change: 0,
    changePercent: 0,
    direction: 'stable',
  }

  // Generate mock snapshots (in real implementation, fetch from stored snapshots)
  const snapshots: DailySnapshot[] = []

  // Top performers by price (simplified - would need sales data for real analysis)
  const topPerformers: AnalyticsOverview['topPerformers'] = {
    bySales: skus
      .filter((s) => s.priceAmount !== null)
      .slice(0, 5)
      .map((s) => ({
        sku: s.sku,
        name: s.name,
        price: s.priceAmount!,
      })),
    byMargin: skus
      .filter((s) => s.priceAmount !== null && s.cost !== null)
      .map((s) => ({
        sku: s.sku,
        name: s.name,
        price: s.priceAmount!,
        margin: s.cost ? ((s.priceAmount! - s.cost) / s.cost) * 100 : undefined,
      }))
      .sort((a, b) => (b.margin || 0) - (a.margin || 0))
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
    snapshots,
  }
}
