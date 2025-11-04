import { NextRequest, NextResponse } from 'next/server'
import {
  getPerformanceStats,
  getResourceStats,
  getDatabasePerformanceMetrics
} from '@/lib/performance-monitor'

interface ResourceStat {
  timestamp: number
  memory: {
    used: number
    total: number
    external: number
    rss: number
  }
  cpu: {
    loadAverage: [number, number, number]
  }
  database: {
    connections: number
    activeQueries: number
    slowQueries: number
  }
  uptime: number
}

interface PerformanceStats {
  totalRequests: number
  averageResponseTime: number
  errorRate: number
  throughput: number
  p50ResponseTime: number
  p95ResponseTime: number
  p99ResponseTime: number
  slowestEndpoints: Array<{ endpoint: string; averageTime: number }>
  errorBreakdown: Record<string, number>
}

interface DatabaseMetrics {
  slowQueries: unknown[]
  connectionStats: unknown
  queryStats: unknown
}

export async function GET(req: NextRequest) {
  try {
    const startTime = Date.now()

    // Get query parameters
    const timeRange = req.nextUrl.searchParams.get('timeRange') || '24h'

    // Calculate time range
    const timeRangeMs = getTimeRangeMs(timeRange)

    // Get comprehensive performance data
    const [
      performanceStats,
      resourceStats,
      databaseMetrics
    ] = await Promise.all([
      getPerformanceStats(timeRangeMs, undefined),
      getResourceStats(timeRangeMs),
      getDatabasePerformanceMetrics()
    ])

    // Calculate trends and insights
    const trends = calculateTrends(resourceStats)
    const insights = generateInsights(performanceStats, resourceStats, databaseMetrics)
    const alerts = generateAlerts(performanceStats, resourceStats, databaseMetrics)

    const responseTime = Date.now() - startTime

    return NextResponse.json({
      timestamp: new Date().toISOString(),
      timeRange,
      responseTime: `${responseTime}ms`,
      overview: {
        healthScore: calculateHealthScore(performanceStats, resourceStats),
        totalRequests: performanceStats.totalRequests,
        averageResponseTime: Math.round(performanceStats.averageResponseTime),
        errorRate: Math.round(performanceStats.errorRate * 100) / 100,
        throughput: Math.round(performanceStats.throughput * 100) / 100
      },
      performance: {
        responseTimes: {
          average: Math.round(performanceStats.averageResponseTime),
          p50: Math.round(performanceStats.p50ResponseTime),
          p95: Math.round(performanceStats.p95ResponseTime),
          p99: Math.round(performanceStats.p99ResponseTime)
        },
        slowestEndpoints: performanceStats.slowestEndpoints.slice(0, 10),
        errorBreakdown: performanceStats.errorBreakdown
      },
      resources: {
        memory: {
          current: resourceStats[resourceStats.length - 1]?.memory || null,
          trend: trends.memory,
          usage: calculateMemoryUsage(resourceStats)
        },
        cpu: {
          current: resourceStats[resourceStats.length - 1]?.cpu || null,
          trend: trends.cpu,
          load: calculateCpuLoad(resourceStats)
        },
        database: {
          ...databaseMetrics,
          trend: trends.database
        }
      },
      trends,
      insights,
      alerts,
      charts: {
        responseTimeOverTime: generateResponseTimeChart(resourceStats),
        throughputOverTime: generateThroughputChart(resourceStats),
        errorRateOverTime: generateErrorRateChart(resourceStats),
        resourceUsageOverTime: generateResourceUsageChart(resourceStats)
      }
    })
  } catch (error) {
    console.error('Performance dashboard data collection failed:', error)
    return NextResponse.json({
      error: 'Failed to collect performance dashboard data',
      message: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 })
  }
}

function getTimeRangeMs(timeRange: string): number {
  const ranges: Record<string, number> = {
    '1h': 60 * 60 * 1000,
    '4h': 4 * 60 * 60 * 1000,
    '24h': 24 * 60 * 60 * 1000,
    '7d': 7 * 24 * 60 * 60 * 1000,
    '30d': 30 * 24 * 60 * 60 * 1000
  }
  return ranges[timeRange] || ranges['24h']
}

function calculateTrends(resourceStats: ResourceStat[]) {
  if (resourceStats.length < 2) {
    return {
      memory: { direction: 'stable', change: 0 },
      cpu: { direction: 'stable', change: 0 },
      database: { direction: 'stable', change: 0 }
    }
  }

  const latest = resourceStats[resourceStats.length - 1]
  const previous = resourceStats[Math.max(0, resourceStats.length - 2)]

  const memoryChange = ((latest.memory.used - previous.memory.used) / previous.memory.used) * 100
  const cpuChange = latest.cpu.loadAverage[0] - previous.cpu.loadAverage[0]
  const dbChange = latest.database.connections - previous.database.connections

  return {
    memory: {
      direction: memoryChange > 5 ? 'increasing' : memoryChange < -5 ? 'decreasing' : 'stable',
      change: Math.round(memoryChange * 100) / 100
    },
    cpu: {
      direction: cpuChange > 0.1 ? 'increasing' : cpuChange < -0.1 ? 'decreasing' : 'stable',
      change: Math.round(cpuChange * 100) / 100
    },
    database: {
      direction: dbChange > 2 ? 'increasing' : dbChange < -2 ? 'decreasing' : 'stable',
      change: dbChange
    }
  }
}

function calculateHealthScore(performanceStats: PerformanceStats, resourceStats: ResourceStat[]): number {
  let score = 100

  // Deduct points for high error rate
  if (performanceStats.errorRate > 5) score -= 25
  else if (performanceStats.errorRate > 1) score -= 15

  // Deduct points for slow response times
  if (performanceStats.p95ResponseTime > 2000) score -= 25
  else if (performanceStats.p95ResponseTime > 1000) score -= 15

  // Deduct points for high memory usage
  const latestMemory = resourceStats[resourceStats.length - 1]?.memory
  if (latestMemory) {
    const memoryUsagePercent = (latestMemory.used / latestMemory.total) * 100
    if (memoryUsagePercent > 90) score -= 20
    else if (memoryUsagePercent > 80) score -= 10
  }

  // Deduct points for high CPU load
  const latestCpu = resourceStats[resourceStats.length - 1]?.cpu
  if (latestCpu && latestCpu.loadAverage[0] > 2) {
    score -= 15
  }

  return Math.max(0, score)
}

function calculateMemoryUsage(resourceStats: ResourceStat[]) {
  if (resourceStats.length === 0) return { used: 0, total: 0, percentage: 0 }

  const latest = resourceStats[resourceStats.length - 1]
  const used = latest.memory.used
  const total = latest.memory.total
  const percentage = Math.round((used / total) * 100)

  return { used, total, percentage }
}

function calculateCpuLoad(resourceStats: ResourceStat[]) {
  if (resourceStats.length === 0) return { load1: 0, load5: 0, load15: 0 }

  const latest = resourceStats[resourceStats.length - 1]
  const [load1, load5, load15] = latest.cpu.loadAverage

  return { load1, load5, load15 }
}

function generateInsights(performanceStats: PerformanceStats, resourceStats: ResourceStat[], databaseMetrics: DatabaseMetrics): string[] {
  const insights: string[] = []

  // Performance insights
  if (performanceStats.p95ResponseTime > 1000) {
    insights.push(`95th percentile response time is ${Math.round(performanceStats.p95ResponseTime)}ms, which is above recommended 1000ms threshold`)
  }

  if (performanceStats.errorRate > 1) {
    insights.push(`Error rate is ${performanceStats.errorRate.toFixed(2)}%, which exceeds the 1% threshold`)
  }

  if (performanceStats.throughput > 1000) {
    insights.push(`High throughput detected: ${Math.round(performanceStats.throughput)} requests/second`)
  }

  // Resource insights
  const latestMemory = resourceStats[resourceStats.length - 1]?.memory
  if (latestMemory) {
    const memoryUsagePercent = (latestMemory.used / latestMemory.total) * 100
    if (memoryUsagePercent > 80) {
      insights.push(`Memory usage is at ${Math.round(memoryUsagePercent)}%, consider monitoring for potential issues`)
    }
  }

  // Database insights
  if (databaseMetrics.slowQueries && databaseMetrics.slowQueries.length > 0) {
    insights.push(`${databaseMetrics.slowQueries.length} slow queries detected in the database`)
  }

  return insights
}

function generateAlerts(performanceStats: PerformanceStats, resourceStats: ResourceStat[], _databaseMetrics: DatabaseMetrics): Array<{type: string, message: string, severity: string}> {
  const alerts: Array<{type: string, message: string, severity: string}> = []

  // Performance alerts
  if (performanceStats.errorRate > 5) {
    alerts.push({
      type: 'error_rate',
      message: `High error rate: ${performanceStats.errorRate.toFixed(2)}%`,
      severity: 'critical'
    })
  } else if (performanceStats.errorRate > 1) {
    alerts.push({
      type: 'error_rate',
      message: `Elevated error rate: ${performanceStats.errorRate.toFixed(2)}%`,
      severity: 'warning'
    })
  }

  if (performanceStats.p95ResponseTime > 2000) {
    alerts.push({
      type: 'response_time',
      message: `Slow response times: P95 is ${Math.round(performanceStats.p95ResponseTime)}ms`,
      severity: 'critical'
    })
  }

  // Resource alerts
  const latestMemory = resourceStats[resourceStats.length - 1]?.memory
  if (latestMemory) {
    const memoryUsagePercent = (latestMemory.used / latestMemory.total) * 100
    if (memoryUsagePercent > 90) {
      alerts.push({
        type: 'memory',
        message: `High memory usage: ${Math.round(memoryUsagePercent)}%`,
        severity: 'critical'
      })
    } else if (memoryUsagePercent > 80) {
      alerts.push({
        type: 'memory',
        message: `Elevated memory usage: ${Math.round(memoryUsagePercent)}%`,
        severity: 'warning'
      })
    }
  }

  return alerts
}

function generateResponseTimeChart(resourceStats: ResourceStat[]) {
  // Generate chart data for response times over time
  return resourceStats.map((stat) => ({
    timestamp: stat.timestamp,
    value: stat.memory?.used || 0 // Placeholder - would be actual response time data
  }))
}

function generateThroughputChart(resourceStats: ResourceStat[]) {
  // Generate chart data for throughput over time
  return resourceStats.map((_stat, index) => ({
    timestamp: _stat.timestamp,
    value: index * 10 // Placeholder - would be actual throughput data
  }))
}

function generateErrorRateChart(resourceStats: ResourceStat[]) {
  // Generate chart data for error rate over time
  return resourceStats.map((stat, _index) => ({
    timestamp: stat.timestamp,
    value: Math.random() * 5 // Placeholder - would be actual error rate data
  }))
}

function generateResourceUsageChart(resourceStats: ResourceStat[]) {
  // Generate chart data for resource usage over time
  return resourceStats.map(stat => ({
    timestamp: stat.timestamp,
    memory: stat.memory?.used || 0,
    cpu: stat.cpu?.loadAverage[0] || 0
  }))
}
