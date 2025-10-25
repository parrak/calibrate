import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@calibr/db'
import { 
  getPerformanceStats, 
  getResourceStats, 
  getDatabasePerformanceMetrics,
  startResourceMonitoring
} from '@/lib/performance-monitor'

// Track if monitoring has been started to prevent multiple intervals
let monitoringStarted = false

export async function GET(req: NextRequest) {
  try {
    const startTime = Date.now()
    
    // Get query parameters
    const url = new URL(req.url)
    const projectSlug = url.searchParams.get('project')
    const timeRange = url.searchParams.get('timeRange') || '24h'
    
    // Calculate time range
    const now = new Date()
    const timeRangeMs = getTimeRangeMs(timeRange)
    const startDate = new Date(now.getTime() - timeRangeMs)
    
    // Get project if specified
    let project = null
    if (projectSlug) {
      project = await prisma().project.findUnique({
        where: { slug: projectSlug },
        include: { tenant: true }
      })
    }
    
    // Start resource monitoring if not already started
    if (!monitoringStarted) {
      startResourceMonitoring(30000) // Every 30 seconds
      monitoringStarted = true
    }
    
    // Collect enhanced metrics
    const [
      priceChanges,
      webhookStats,
      systemMetrics,
      databaseMetrics,
      errorMetrics,
      performanceStats,
      resourceStats,
      databasePerformance
    ] = await Promise.all([
      getPriceChangeMetrics(project?.id, startDate),
      getWebhookMetrics(project?.id, startDate),
      getSystemMetrics(),
      getDatabaseMetrics(),
      getErrorMetrics(startDate),
      getPerformanceStats(timeRangeMs),
      getResourceStats(timeRangeMs),
      getDatabasePerformanceMetrics()
    ])
    
    const responseTime = Date.now() - startTime
    
    return NextResponse.json({
      timestamp: now.toISOString(),
      timeRange,
      responseTime: `${responseTime}ms`,
      project: project ? {
        id: project.id,
        name: project.name,
        slug: project.slug,
        tenant: project.tenant.name
      } : null,
      metrics: {
        priceChanges,
        webhooks: webhookStats,
        system: systemMetrics,
        database: databaseMetrics,
        errors: errorMetrics,
        performance: performanceStats,
        resources: resourceStats,
        databasePerformance
      }
    })
  } catch (error) {
    console.error('Metrics collection failed:', error)
    return NextResponse.json({
      error: 'Failed to collect metrics',
      message: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 })
  }
}

function getTimeRangeMs(timeRange: string): number {
  const ranges: Record<string, number> = {
    '1h': 60 * 60 * 1000,
    '24h': 24 * 60 * 60 * 1000,
    '7d': 7 * 24 * 60 * 60 * 1000,
    '30d': 30 * 24 * 60 * 60 * 1000
  }
  return ranges[timeRange] || ranges['24h']
}

async function getPriceChangeMetrics(projectId: string | null, startDate: Date) {
  const where = projectId ? { projectId, createdAt: { gte: startDate } } : { createdAt: { gte: startDate } }
  
  const [total, byStatus, bySource] = await Promise.all([
    prisma().priceChange.count({ where }),
    prisma().priceChange.groupBy({
      by: ['status'],
      where,
      _count: { status: true }
    }),
    prisma().priceChange.groupBy({
      by: ['source'],
      where,
      _count: { source: true }
    })
  ])
  
  return {
    total,
    byStatus: byStatus.reduce((acc, item) => {
      acc[item.status] = item._count.status
      return acc
    }, {} as Record<string, number>),
    bySource: bySource.reduce((acc, item) => {
      // Normalize source names to avoid duplicates
      const normalizedSource = item.source?.toLowerCase() || 'unknown'
      acc[normalizedSource] = (acc[normalizedSource] || 0) + item._count.source
      return acc
    }, {} as Record<string, number>)
  }
}

async function getWebhookMetrics(projectId: string | null, startDate: Date) {
  // This would need to be implemented based on your webhook logging
  // For now, return placeholder data
  return {
    total: 0,
    successful: 0,
    failed: 0,
    averageResponseTime: 0
  }
}

async function getSystemMetrics() {
  const memoryUsage = process.memoryUsage()
  const uptime = process.uptime()
  
  return {
    uptime: Math.floor(uptime),
    memory: {
      used: Math.round(memoryUsage.heapUsed / 1024 / 1024),
      total: Math.round(memoryUsage.heapTotal / 1024 / 1024),
      external: Math.round(memoryUsage.external / 1024 / 1024)
    },
    cpu: {
      // Node.js doesn't provide direct CPU usage, would need external monitoring
      loadAverage: process.platform === 'win32' ? [0, 0, 0] : require('os').loadavg()
    }
  }
}

async function getDatabaseMetrics() {
  try {
    const [connections, tableSizes] = await Promise.all([
      prisma().$queryRaw`
        SELECT 
          count(*) as total_connections,
          count(*) FILTER (WHERE state = 'active') as active_connections,
          count(*) FILTER (WHERE state = 'idle') as idle_connections
        FROM pg_stat_activity
      `,
      prisma().$queryRaw`
        SELECT 
          schemaname,
          tablename,
          pg_size_pretty(pg_total_relation_size(schemaname||'.'||tablename)) as size
        FROM pg_tables 
        WHERE schemaname = 'public'
        ORDER BY pg_total_relation_size(schemaname||'.'||tablename) DESC
        LIMIT 10
      `
    ])
    
    // Convert BigInt values to numbers
    const connectionData = connections[0] as any
    const processedConnections = {
      total_connections: Number(connectionData?.total_connections) || 0,
      active_connections: Number(connectionData?.active_connections) || 0,
      idle_connections: Number(connectionData?.idle_connections) || 0
    }
    
    return {
      connections: processedConnections,
      tableSizes: tableSizes
    }
  } catch (error) {
    return {
      error: 'Failed to collect database metrics',
      connections: null,
      tableSizes: []
    }
  }
}

async function getErrorMetrics(startDate: Date) {
  // This would need to be implemented with proper error logging
  // For now, return placeholder data
  return {
    total: 0,
    byType: {},
    recent: []
  }
}
