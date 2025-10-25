import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@calibr/db'

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
    
    // Collect dashboard data
    const [
      overview,
      priceChanges,
      systemHealth,
      recentActivity,
      topProducts
    ] = await Promise.all([
      getOverviewMetrics(project?.id, startDate),
      getPriceChangeMetrics(project?.id, startDate),
      getSystemHealthMetrics(),
      getRecentActivity(project?.id, startDate),
      getTopProducts(project?.id, startDate)
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
      dashboard: {
        overview,
        priceChanges,
        systemHealth,
        recentActivity,
        topProducts
      }
    })
  } catch (error) {
    console.error('Dashboard data collection failed:', error)
    return NextResponse.json({
      error: 'Failed to collect dashboard data',
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

async function getOverviewMetrics(projectId: string | null, startDate: Date) {
  const where = projectId ? { projectId, createdAt: { gte: startDate } } : { createdAt: { gte: startDate } }
  
  const [
    totalPriceChanges,
    pendingChanges,
    approvedChanges,
    appliedChanges,
    rejectedChanges
  ] = await Promise.all([
    prisma().priceChange.count({ where }),
    prisma().priceChange.count({ where: { ...where, status: 'PENDING' } }),
    prisma().priceChange.count({ where: { ...where, status: 'APPROVED' } }),
    prisma().priceChange.count({ where: { ...where, status: 'APPLIED' } }),
    prisma().priceChange.count({ where: { ...where, status: 'REJECTED' } })
  ])
  
  return {
    totalPriceChanges,
    pendingChanges,
    approvedChanges,
    appliedChanges,
    rejectedChanges,
    approvalRate: totalPriceChanges > 0 ? (approvedChanges + appliedChanges) / totalPriceChanges : 0,
    applicationRate: totalPriceChanges > 0 ? appliedChanges / totalPriceChanges : 0
  }
}

async function getPriceChangeMetrics(projectId: string | null, startDate: Date) {
  const where = projectId ? { projectId, createdAt: { gte: startDate } } : { createdAt: { gte: startDate } }
  
  // Get price changes by hour for the last 24 hours
  const hourlyData = await prisma().$queryRaw`
    SELECT 
      DATE_TRUNC('hour', "createdAt") as hour,
      COUNT(*) as count,
      status
    FROM "PriceChange"
    WHERE "createdAt" >= ${startDate}
    ${projectId ? prisma().$queryRaw`AND "projectId" = ${projectId}` : prisma().$queryRaw``}
    GROUP BY DATE_TRUNC('hour', "createdAt"), status
    ORDER BY hour DESC
    LIMIT 24
  `
  
  // Get price changes by source
  const bySource = await prisma().priceChange.groupBy({
    by: ['source'],
    where,
    _count: { source: true }
  })
  
  return {
    hourlyData,
    bySource: bySource.reduce((acc, item) => {
      acc[item.source] = item._count.source
      return acc
    }, {} as Record<string, number>)
  }
}

async function getSystemHealthMetrics() {
  const memoryUsage = process.memoryUsage()
  const uptime = process.uptime()
  
  // Test database connection
  const dbStart = Date.now()
  await prisma().$queryRaw`SELECT 1`
  const dbLatency = Date.now() - dbStart
  
  return {
    uptime: Math.floor(uptime),
    memory: {
      used: Math.round(memoryUsage.heapUsed / 1024 / 1024),
      total: Math.round(memoryUsage.heapTotal / 1024 / 1024),
      percentage: Math.round((memoryUsage.heapUsed / memoryUsage.heapTotal) * 100)
    },
    database: {
      status: 'healthy',
      latency: dbLatency
    },
    status: 'operational'
  }
}

async function getRecentActivity(projectId: string | null, startDate: Date) {
  const where = projectId ? { projectId, createdAt: { gte: startDate } } : { createdAt: { gte: startDate } }
  
  const activities = await prisma().priceChange.findMany({
    where,
    orderBy: { createdAt: 'desc' },
    take: 10,
    include: {
      sku: {
        include: {
          product: true
        }
      }
    }
  })
  
  return activities.map(activity => ({
    id: activity.id,
    type: 'price_change',
    status: activity.status,
    source: activity.source,
    skuCode: activity.sku.code,
    productName: activity.sku.product.name,
    fromAmount: activity.fromAmount,
    toAmount: activity.toAmount,
    currency: activity.currency,
    createdAt: activity.createdAt,
    context: activity.context
  }))
}

async function getTopProducts(projectId: string | null, startDate: Date) {
  const where = projectId ? { projectId, createdAt: { gte: startDate } } : { createdAt: { gte: startDate } }
  
  const topProducts = await prisma().$queryRaw`
    SELECT 
      p.name as product_name,
      p.code as product_code,
      COUNT(pc.id) as change_count,
      AVG(pc."toAmount" - pc."fromAmount") as avg_change_amount
    FROM "PriceChange" pc
    JOIN "Sku" s ON pc."skuId" = s.id
    JOIN "Product" p ON s."productId" = p.id
    WHERE pc."createdAt" >= ${startDate}
    ${projectId ? prisma().$queryRaw`AND pc."projectId" = ${projectId}` : prisma().$queryRaw``}
    GROUP BY p.id, p.name, p.code
    ORDER BY change_count DESC
    LIMIT 10
  `
  
  // Convert BigInt values to numbers
  return (topProducts as any[]).map(product => ({
    product_name: product.product_name,
    product_code: product.product_code,
    change_count: Number(product.change_count),
    avg_change_amount: Number(product.avg_change_amount)
  }))
}
