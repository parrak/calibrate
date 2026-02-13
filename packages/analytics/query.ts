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

  // Get transactions for period
  const txns = await prisma().transaction.findMany({
    where: {
      projectId,
      occurredAt: { gte: startDate, lte: endDate },
      status: { in: ['succeeded', 'paid', 'complete'] }
    },
    select: {
      amount: true,
      skuId: true,
      occurredAt: true
    }
  })

  const prevStartDate = new Date(startDate.getTime() - days * 24 * 60 * 60 * 1000)
  const prevTxns = await prisma().transaction.findMany({
    where: {
      projectId,
      occurredAt: { gte: prevStartDate, lte: startDate },
      status: { in: ['succeeded', 'paid', 'complete'] }
    },
    select: {
      amount: true
    }
  })

  // Calculate trends for revenue and units
  const currentRevenue = txns.reduce((a, b) => a + b.amount, 0)
  const prevRevenue = prevTxns.reduce((a, b) => a + b.amount, 0)
  const currentUnits = txns.length
  const prevUnits = prevTxns.length

  const revenueTrend: TrendData = calculateTrend(currentRevenue, prevRevenue)
  const unitsTrend: TrendData = calculateTrend(currentUnits, prevUnits)

  // Calculate top performers by sales (actual revenue)
  const skuSales = txns.reduce((acc, t) => {
    if (!t.skuId) return acc
    acc[t.skuId] = (acc[t.skuId] || 0) + t.amount
    return acc
  }, {} as Record<string, number>)

  const skuUnits = txns.reduce((acc, t) => {
    if (!t.skuId) return acc
    acc[t.skuId] = (acc[t.skuId] || 0) + 1
    return acc
  }, {} as Record<string, number>)

  const topBySales = skus
    .filter(s => skuSales[s.id] !== undefined)
    .map(s => ({
      sku: s.code,
      name: s.name,
      price: s.Price[0]?.amount || 0,
      revenue: skuSales[s.id],
      units: skuUnits[s.id]
    }))
    .sort((a, b) => (b.revenue || 0) - (a.revenue || 0))
    .slice(0, 5)

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

  const priceChangesTrend: TrendData = calculateTrend(secondHalfChanges, firstHalfChanges)

  // Calculate average price trend
  const prices = skus
    .map((s) => s.Price[0]?.amount)
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

  // Generate snapshots (simplified - would fetch from DB in production)
  const snapshots: DailySnapshot[] = []

  // Top performers by margin (realized margin if sales exist, otherwise potential margin)
  const topByMargin = skus
    .map((s) => {
      const price = s.Price[0]?.amount
      const cost = s.attributes && typeof s.attributes === 'object' && 'cost' in s.attributes
        ? (s.attributes as any).cost
        : null

      const sales = skuSales[s.id] || 0
      const units = skuUnits[s.id] || 0
      const realizedMargin = (sales > 0 && cost) ? ((sales - (units * cost)) / (units * cost)) * 100 : undefined
      const potentialMargin = (price && cost) ? ((price - cost) / cost) * 100 : undefined

      return {
        sku: s.code,
        name: s.name,
        price: price || 0,
        margin: realizedMargin ?? potentialMargin,
        revenue: sales,
        units
      }
    })
    .filter((s) => s.margin !== undefined)
    .sort((a, b) => (b.margin || 0) - (a.margin || 0))
    .slice(0, 5)

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
      revenue: revenueTrend,
      units: unitsTrend,
      averagePrice: avgPriceTrend,
      priceChanges: priceChangesTrend,
    },
    topPerformers: {
      bySales: topBySales,
      byMargin: topByMargin,
    },
    snapshots,
  }
}

function calculateTrend(current: number, previous: number): TrendData {
  const change = current - previous
  const changePercent = previous > 0 ? Math.round((change / previous) * 100) : 0

  return {
    current,
    previous,
    change,
    changePercent,
    direction: current > previous ? 'up' : current < previous ? 'down' : 'stable'
  }
}
