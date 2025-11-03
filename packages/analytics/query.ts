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
      product: {
        projectId,
      },
    },
    select: {
      id: true,
      code: true,
      name: true,
      prices: {
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
  const prices = skus
    .map((s) => s.prices[0]?.amount)
    .filter((p): p is number => p !== undefined && p !== null)
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
      .filter((s) => s.prices[0]?.amount !== undefined)
      .slice(0, 5)
      .map((s) => ({
        sku: s.code,
        name: s.name,
        price: s.prices[0]!.amount,
      })),
    byMargin: skus
      .map((s) => {
        const price = s.prices[0]?.amount
        const cost = s.attributes && typeof s.attributes === 'object' && 'cost' in s.attributes
          ? (s.attributes as any).cost
          : null
        return { sku: s.code, name: s.name, price, cost }
      })
      .filter((s): s is { sku: string; name: string; price: number; cost: number } => 
        s.price !== undefined && s.price !== null && s.cost !== null && s.cost > 0
      )
      .map((s) => ({
        sku: s.sku,
        name: s.name,
        price: s.price,
        margin: ((s.price - s.cost) / s.cost) * 100,
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
