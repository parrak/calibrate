import { NextRequest, NextResponse } from 'next/server'
export const dynamic = 'force-dynamic'
export const runtime = 'nodejs'
import {
  getPerformanceStats,
  getResourceStats,
  getAllPerformanceMetrics,
  getAllErrorMetrics,
  getAllResourceMetrics,
  getDatabasePerformanceMetrics
} from '@/lib/performance-monitor'

export async function GET(req: NextRequest) {
  try {
    const startTime = Date.now()
    const url = new URL(req.url)

    // Get query parameters
    const timeRange = url.searchParams.get('timeRange') || '1h'
    const endpoint = url.searchParams.get('endpoint') || undefined
    const projectId = url.searchParams.get('project') || undefined
    const includeDetails = url.searchParams.get('includeDetails') === 'true'

    // Calculate time range
    const timeRangeMs = getTimeRangeMs(timeRange)

    // Get performance statistics
    const performanceStats = getPerformanceStats(timeRangeMs, endpoint)

    // Get resource statistics
    const resourceStats = getResourceStats(timeRangeMs)

    // Get database performance metrics
    const databaseMetrics = await getDatabasePerformanceMetrics()

    // Calculate resource trends
    const resourceTrends = calculateResourceTrends(resourceStats)

    // Get recent errors
    const recentErrors = getRecentErrors(timeRangeMs, projectId)

    // Calculate health score
    const healthScore = calculateHealthScore(performanceStats, resourceTrends)

    const responseTime = Date.now() - startTime

    const baseResponse = {
      timestamp: new Date().toISOString(),
      timeRange,
      responseTime: `${responseTime}ms`,
      healthScore,
      performance: {
        ...performanceStats,
        trends: calculatePerformanceTrends(timeRangeMs)
      },
      resources: {
        current: resourceStats[resourceStats.length - 1] || null,
        trends: resourceTrends,
        alerts: generateResourceAlerts(resourceTrends)
      },
      database: databaseMetrics,
      errors: {
        recent: recentErrors,
        breakdown: performanceStats.errorBreakdown
      },
      recommendations: generateRecommendations(performanceStats, resourceTrends)
    }

    return NextResponse.json(
      includeDetails
        ? {
            ...baseResponse,
            details: {
              performanceMetrics: Object.fromEntries(getAllPerformanceMetrics()),
              errorMetrics: Object.fromEntries(getAllErrorMetrics()),
              resourceMetrics: Object.fromEntries(getAllResourceMetrics())
            }
          }
        : baseResponse
    )
  } catch (error) {
    console.error('Performance metrics collection failed:', error)
    return NextResponse.json({
      error: 'Failed to collect performance metrics',
      message: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 })
  }
}

function getTimeRangeMs(timeRange: string): number {
  const ranges: Record<string, number> = {
    '5m': 5 * 60 * 1000,
    '15m': 15 * 60 * 1000,
    '1h': 60 * 60 * 1000,
    '4h': 4 * 60 * 60 * 1000,
    '24h': 24 * 60 * 60 * 1000,
    '7d': 7 * 24 * 60 * 60 * 1000
  }
  return ranges[timeRange] || ranges['1h']
}

interface ResourceStat {
  memory: { used: number }
  cpu: { loadAverage: [number, number, number] }
  database: { connections: number }
}

function calculateResourceTrends(resourceStats: ResourceStat[]) {
  if (resourceStats.length < 2) {
    return {
      memory: { trend: 'stable', change: 0 },
      cpu: { trend: 'stable', change: 0 },
      database: { trend: 'stable', change: 0 }
    }
  }

  const latest = resourceStats[resourceStats.length - 1]
  const previous = resourceStats[Math.max(0, resourceStats.length - 2)]

  const memoryChange = ((latest.memory.used - previous.memory.used) / previous.memory.used) * 100
  const cpuChange = latest.cpu.loadAverage[0] - previous.cpu.loadAverage[0]
  const dbChange = latest.database.connections - previous.database.connections

  return {
    memory: {
      trend: memoryChange > 5 ? 'increasing' : memoryChange < -5 ? 'decreasing' : 'stable',
      change: Math.round(memoryChange * 100) / 100
    },
    cpu: {
      trend: cpuChange > 0.1 ? 'increasing' : cpuChange < -0.1 ? 'decreasing' : 'stable',
      change: Math.round(cpuChange * 100) / 100
    },
    database: {
      trend: dbChange > 2 ? 'increasing' : dbChange < -2 ? 'decreasing' : 'stable',
      change: dbChange
    }
  }
}

function calculatePerformanceTrends(_timeRangeMs: number) {
  // This would analyze historical performance data
  // For now, return placeholder trends
  return {
    responseTime: { trend: 'stable', change: 0 },
    throughput: { trend: 'stable', change: 0 },
    errorRate: { trend: 'stable', change: 0 }
  }
}

function getRecentErrors(_timeRangeMs: number, _projectId?: string) {
  // This would filter recent errors from the error metrics
  // For now, return placeholder data
  return []
}

function calculateHealthScore(performanceStats: { errorRate: number; p95ResponseTime: number }, resourceTrends: { memory: { trend: string; change: number }; cpu: { trend: string; change: number } }): number {
  let score = 100

  // Deduct points for high error rate
  if (performanceStats.errorRate > 5) score -= 20
  else if (performanceStats.errorRate > 1) score -= 10

  // Deduct points for slow response times
  if (performanceStats.p95ResponseTime > 2000) score -= 20
  else if (performanceStats.p95ResponseTime > 1000) score -= 10

  // Deduct points for resource issues
  if (resourceTrends.memory.trend === 'increasing' && resourceTrends.memory.change > 20) score -= 15
  if (resourceTrends.cpu.trend === 'increasing' && resourceTrends.cpu.change > 0.5) score -= 15

  return Math.max(0, score)
}

function generateResourceAlerts(resourceTrends: { memory: { trend: string; change: number }; cpu: { trend: string; change: number }; database: { trend: string; change: number } }): string[] {
  const alerts: string[] = []

  if (resourceTrends.memory.trend === 'increasing' && resourceTrends.memory.change > 20) {
    alerts.push('Memory usage is increasing rapidly')
  }

  if (resourceTrends.cpu.trend === 'increasing' && resourceTrends.cpu.change > 0.5) {
    alerts.push('CPU load is increasing')
  }

  if (resourceTrends.database.trend === 'increasing' && resourceTrends.database.change > 5) {
    alerts.push('Database connections are increasing')
  }

  return alerts
}

function generateRecommendations(performanceStats: { p95ResponseTime: number; errorRate: number }, resourceTrends: { memory: { trend: string }; cpu: { trend: string } }): string[] {
  const recommendations: string[] = []

  if (performanceStats.p95ResponseTime > 1000) {
    recommendations.push('Consider optimizing slow endpoints or adding caching')
  }

  if (performanceStats.errorRate > 1) {
    recommendations.push('Investigate and fix error sources')
  }

  if (resourceTrends.memory.trend === 'increasing') {
    recommendations.push('Monitor memory usage and consider memory optimization')
  }

  if (performanceStats.throughput > 1000) {
    recommendations.push('Consider horizontal scaling for high traffic')
  }

  return recommendations
}
