/**
 * Insights Digest Generator
 *
 * Generates weekly summaries and actionable insights from pricing analytics
 */

import { prisma } from '@calibr/db'
import type { PriceAnomaly } from './anomaly'
import { detectAnomalies } from './anomaly'

export interface InsightDigest {
  /** Digest period */
  period: {
    start: Date
    end: Date
    label: string // e.g., "Week of Jan 1-7, 2025"
  }

  /** Project identifier */
  projectId: string
  projectName?: string

  /** Executive summary */
  summary: {
    totalPriceChanges: number
    activeSkus: number
    approvalRate: number
    averagePriceChange: number
    topMetric: string // Most important metric this period
  }

  /** Key insights */
  insights: Insight[]

  /** Detected anomalies */
  anomalies: PriceAnomaly[]

  /** Recommendations */
  recommendations: string[]

  /** Performance vs previous period */
  performance: {
    metric: string
    current: number
    previous: number
    change: number
    changePercent: number
    trend: 'improving' | 'declining' | 'stable'
  }[]
}

export interface Insight {
  /** Insight type */
  type: 'pricing' | 'volume' | 'margin' | 'competitor' | 'performance' | 'opportunity'

  /** Priority level */
  priority: 'high' | 'medium' | 'low'

  /** Insight title */
  title: string

  /** Detailed description */
  description: string

  /** Supporting data */
  data?: Record<string, any>

  /** Suggested action */
  action?: string
}

/**
 * Generate weekly insights digest
 */
export async function generateWeeklyDigest(
  projectId: string,
  weekEndDate: Date = new Date()
): Promise<InsightDigest> {
  const weekEnd = new Date(weekEndDate)
  weekEnd.setHours(23, 59, 59, 999)

  const weekStart = new Date(weekEnd)
  weekStart.setDate(weekStart.getDate() - 7)
  weekStart.setHours(0, 0, 0, 0)

  const prevWeekStart = new Date(weekStart)
  prevWeekStart.setDate(prevWeekStart.getDate() - 7)

  const prevWeekEnd = new Date(weekStart)
  prevWeekEnd.setMilliseconds(-1)

  // Get project info
  const project = await prisma().project.findUnique({
    where: { id: projectId },
    select: { name: true, slug: true },
  })

  // Gather metrics for current week
  const currentMetrics = await gatherWeekMetrics(projectId, weekStart, weekEnd)
  const previousMetrics = await gatherWeekMetrics(projectId, prevWeekStart, prevWeekEnd)

  // Generate insights
  const insights = await generateInsights(projectId, weekStart, weekEnd, currentMetrics, previousMetrics)

  // Detect anomalies
  const anomalies = await detectAnomalies(projectId)

  // Generate recommendations
  const recommendations = generateRecommendations(insights, anomalies, currentMetrics)

  // Calculate performance trends
  const performance = calculatePerformanceTrends(currentMetrics, previousMetrics)

  // Determine top metric
  const topMetric = determineTopMetric(performance, insights)

  return {
    period: {
      start: weekStart,
      end: weekEnd,
      label: `Week of ${formatDate(weekStart)} - ${formatDate(weekEnd)}`,
    },
    projectId,
    projectName: project?.name || project?.slug,
    summary: {
      totalPriceChanges: currentMetrics.totalPriceChanges,
      activeSkus: currentMetrics.activeSkus,
      approvalRate: currentMetrics.approvalRate,
      averagePriceChange: currentMetrics.averagePriceChange,
      topMetric,
    },
    insights,
    anomalies,
    recommendations,
    performance,
  }
}

/**
 * Gather metrics for a week period
 */
async function gatherWeekMetrics(projectId: string, start: Date, end: Date) {
  const [priceChanges, skus, appliedChanges] = await Promise.all([
    prisma().priceChange.findMany({
      where: {
        projectId,
        createdAt: { gte: start, lte: end },
      },
      select: {
        status: true,
        fromAmount: true,
        toAmount: true,
      },
    }),
    prisma().sku.findMany({
      where: {
        Product: { projectId },
      },
      select: {
        id: true,
        Price: {
          where: { status: 'ACTIVE' },
          select: { amount: true },
          take: 1,
        },
        attributes: true,
      },
    }),
    prisma().priceChange.findMany({
      where: {
        projectId,
        status: 'APPLIED',
        updatedAt: { gte: start, lte: end },
      },
    }),
  ])

  const totalPriceChanges = priceChanges.length
  const approvedCount = priceChanges.filter((pc: { status: string }) => pc.status === 'APPROVED' || pc.status === 'APPLIED').length
  const approvalRate = totalPriceChanges > 0 ? (approvedCount / totalPriceChanges) * 100 : 0

  const priceDeltas = priceChanges.map((pc: { toAmount: number; fromAmount: number }) => Math.abs(pc.toAmount - pc.fromAmount))
  const averagePriceChange = priceDeltas.length > 0
    ? priceDeltas.reduce((sum: number, delta: number) => sum + delta, 0) / priceDeltas.length
    : 0

  // Calculate average margin
  const skusWithMargin = skus
    .map((s: typeof skus[0]) => {
      const price = s.Price[0]?.amount
      const cost = s.attributes && typeof s.attributes === 'object' && 'cost' in s.attributes
        ? (s.attributes as any).cost
        : null
      if (!price || !cost || cost <= 0) return null
      return ((price - cost) / cost) * 100
    })
    .filter((m: number | null): m is number => m !== null)

  const averageMargin = skusWithMargin.length > 0
    ? skusWithMargin.reduce((sum: number, m: number) => sum + m, 0) / skusWithMargin.length
    : 0

  return {
    totalPriceChanges,
    activeSkus: skus.length,
    approvalRate,
    averagePriceChange,
    appliedCount: appliedChanges.length,
    averageMargin,
  }
}

/**
 * Generate actionable insights
 */
async function generateInsights(
  projectId: string,
  start: Date,
  end: Date,
  current: any,
  previous: any
): Promise<Insight[]> {
  const insights: Insight[] = []

  // 1. Price change volume insight
  if (current.totalPriceChanges > previous.totalPriceChanges * 1.5) {
    insights.push({
      type: 'volume',
      priority: 'high',
      title: 'Increased Price Change Activity',
      description: `Price changes increased by ${(((current.totalPriceChanges - previous.totalPriceChanges) / previous.totalPriceChanges) * 100).toFixed(0)}% this week (${current.totalPriceChanges} vs ${previous.totalPriceChanges} last week).`,
      data: { current: current.totalPriceChanges, previous: previous.totalPriceChanges },
      action: 'Review recent pricing operations to ensure changes align with strategy.',
    })
  }

  // 2. Approval rate insight
  if (current.approvalRate < 70 && current.totalPriceChanges > 5) {
    insights.push({
      type: 'performance',
      priority: 'high',
      title: 'Low Approval Rate',
      description: `Only ${current.approvalRate.toFixed(0)}% of price changes were approved this week. This may indicate policy misalignment or overly aggressive suggestions.`,
      data: { approvalRate: current.approvalRate },
      action: 'Review pricing policies and AI suggestion parameters to improve approval rates.',
    })
  } else if (current.approvalRate > 90 && current.totalPriceChanges > 5) {
    insights.push({
      type: 'performance',
      priority: 'low',
      title: 'Strong Approval Rate',
      description: `${current.approvalRate.toFixed(0)}% approval rate indicates pricing suggestions align well with business objectives.`,
      data: { approvalRate: current.approvalRate },
    })
  }

  // 3. Margin insight
  if (current.averageMargin < previous.averageMargin - 5) {
    insights.push({
      type: 'margin',
      priority: 'high',
      title: 'Margin Compression Detected',
      description: `Average margin decreased by ${(previous.averageMargin - current.averageMargin).toFixed(1)}% this week. Current average margin is ${current.averageMargin.toFixed(1)}%.`,
      data: { currentMargin: current.averageMargin, previousMargin: previous.averageMargin },
      action: 'Review recent price reductions and consider price increases where market allows.',
    })
  }

  // 4. Efficiency insight
  if (current.appliedCount > 0) {
    const efficiency = (current.appliedCount / current.totalPriceChanges) * 100
    if (efficiency > 80) {
      insights.push({
        type: 'performance',
        priority: 'medium',
        title: 'High Execution Efficiency',
        description: `${efficiency.toFixed(0)}% of price changes were executed this week, demonstrating strong operational efficiency.`,
        data: { appliedCount: current.appliedCount, efficiency },
      })
    }
  }

  // 5. Opportunity insight - if low activity
  if (current.totalPriceChanges < 3 && current.activeSkus > 20) {
    insights.push({
      type: 'opportunity',
      priority: 'medium',
      title: 'Potential Optimization Opportunity',
      description: `Only ${current.totalPriceChanges} price changes this week across ${current.activeSkus} active SKUs. There may be untapped pricing opportunities.`,
      data: { totalPriceChanges: current.totalPriceChanges, activeSkus: current.activeSkus },
      action: 'Review AI suggestions and competitor pricing to identify optimization opportunities.',
    })
  }

  return insights
}

/**
 * Generate actionable recommendations
 */
function generateRecommendations(
  insights: Insight[],
  anomalies: PriceAnomaly[],
  metrics: any
): string[] {
  const recommendations: string[] = []

  // Add recommendations from high-priority insights
  insights
    .filter((i) => i.priority === 'high' && i.action)
    .forEach((i) => {
      if (i.action) recommendations.push(i.action)
    })

  // Add recommendations from critical anomalies
  anomalies
    .filter((a) => a.severity === 'critical' || a.severity === 'high')
    .slice(0, 3) // Top 3 anomalies
    .forEach((a) => {
      recommendations.push(a.recommendation)
    })

  // Add general recommendations based on metrics
  if (metrics.approvalRate < 50) {
    recommendations.push('Consider adjusting pricing policy constraints to align better with market conditions.')
  }

  if (recommendations.length === 0) {
    recommendations.push('Continue monitoring pricing performance and competitor activity.')
  }

  return recommendations
}

/**
 * Calculate performance trends
 */
function calculatePerformanceTrends(current: any, previous: any) {
  const trends = [
    {
      metric: 'Price Changes',
      current: current.totalPriceChanges,
      previous: previous.totalPriceChanges,
    },
    {
      metric: 'Approval Rate',
      current: current.approvalRate,
      previous: previous.approvalRate,
    },
    {
      metric: 'Average Margin',
      current: current.averageMargin,
      previous: previous.averageMargin,
    },
  ]

  return trends.map((t) => {
    const change = t.current - t.previous
    const changePercent = t.previous > 0 ? (change / t.previous) * 100 : 0
    const trend: 'improving' | 'declining' | 'stable' =
      Math.abs(changePercent) < 5 ? 'stable' : changePercent > 0 ? 'improving' : 'declining'

    return {
      ...t,
      change,
      changePercent,
      trend,
    }
  })
}

/**
 * Determine the top metric to highlight
 */
function determineTopMetric(performance: any[], insights: Insight[]): string {
  // Prioritize high-priority insights
  const highPriorityInsight = insights.find((i) => i.priority === 'high')
  if (highPriorityInsight) {
    return highPriorityInsight.title
  }

  // Find metric with largest change
  const sortedPerformance = [...performance].sort(
    (a, b) => Math.abs(b.changePercent) - Math.abs(a.changePercent)
  )

  const topChange = sortedPerformance[0]
  if (topChange && Math.abs(topChange.changePercent) > 10) {
    const direction = topChange.trend === 'improving' ? 'increased' : 'decreased'
    return `${topChange.metric} ${direction} by ${Math.abs(topChange.changePercent).toFixed(0)}%`
  }

  return 'Stable pricing performance this week'
}

/**
 * Format date for display
 */
function formatDate(date: Date): string {
  return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
}
