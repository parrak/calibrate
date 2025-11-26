/**
 * Comprehensive Health Check Endpoint
 * Includes database, event bus, connectors, and SLA checks
 */

import { NextResponse } from 'next/server'
export const dynamic = 'force-dynamic'
export const runtime = 'nodejs'
import { prisma } from '@calibr/db'
import {
  getAllConnectorHealthStats,
  getEventBusStats,
  getPerformanceStats
} from '@calibr/monitor'

export async function GET() {
  const startTime = Date.now()
  const timestamp = new Date().toISOString()

  try {
    const [
      dbHealth,
      eventBusHealth,
      connectorHealth,
      outboxHealth,
      performanceHealth,
      memoryHealth
    ] = await Promise.allSettled([
      checkDatabaseHealth(),
      checkEventBusHealth(),
      checkConnectorHealth(),
      checkOutboxHealth(),
      checkPerformanceHealth(),
      checkMemoryHealth()
    ])

    // Determine overall status
    const checks = [
      { name: 'database', check: dbHealth },
      { name: 'eventBus', check: eventBusHealth },
      { name: 'connectors', check: connectorHealth },
      { name: 'outbox', check: outboxHealth },
      { name: 'performance', check: performanceHealth },
      { name: 'memory', check: memoryHealth }
    ]

    const failedChecks = checks.filter(c =>
      c.check.status === 'rejected' ||
      (c.check.status === 'fulfilled' && c.check.value.status !== 'healthy')
    )

    const overallStatus = failedChecks.length === 0 ? 'healthy'
      : failedChecks.length <= 2 ? 'degraded'
      : 'unhealthy'

    const responseTime = Date.now() - startTime

    return NextResponse.json({
      status: overallStatus,
      timestamp,
      service: 'calibr-api',
      version: process.env.npm_package_version || '1.0.0',
      environment: process.env.NODE_ENV || 'development',
      uptime: Math.floor(process.uptime()),
      responseTime: `${responseTime}ms`,
      checks: {
        database: dbHealth.status === 'fulfilled' ? dbHealth.value : { status: 'error', error: String(dbHealth.reason) },
        eventBus: eventBusHealth.status === 'fulfilled' ? eventBusHealth.value : { status: 'error', error: String(eventBusHealth.reason) },
        connectors: connectorHealth.status === 'fulfilled' ? connectorHealth.value : { status: 'error', error: String(connectorHealth.reason) },
        outbox: outboxHealth.status === 'fulfilled' ? outboxHealth.value : { status: 'error', error: String(outboxHealth.reason) },
        performance: performanceHealth.status === 'fulfilled' ? performanceHealth.value : { status: 'error', error: String(performanceHealth.reason) },
        memory: memoryHealth.status === 'fulfilled' ? memoryHealth.value : { status: 'error', error: String(memoryHealth.reason) }
      }
    }, {
      status: overallStatus === 'healthy' ? 200 : overallStatus === 'degraded' ? 200 : 503
    })
  } catch (error) {
    console.error('Health check failed:', error)

    return NextResponse.json({
      status: 'error',
      timestamp,
      service: 'calibr-api',
      error: error instanceof Error ? error.message : 'Unknown error',
      responseTime: `${Date.now() - startTime}ms`
    }, { status: 503 })
  }
}

async function checkDatabaseHealth() {
  try {
    const dbStart = Date.now()
    await prisma().$queryRaw`SELECT 1`
    const dbLatency = Date.now() - dbStart

    // Get connection pool info
    const connections = await prisma().$queryRaw<Array<{ active_connections: string | number }>>`
      SELECT count(*) as active_connections
      FROM pg_stat_activity
      WHERE state = 'active'
    `

    // Check if migrations are up to date
    const migrations = await prisma().$queryRaw<Array<{ migration_name: string; finished_at: Date | null }>>`
      SELECT migration_name, finished_at
      FROM _prisma_migrations
      ORDER BY finished_at DESC
      LIMIT 1
    `

    const status = dbLatency < 100 ? 'healthy' : dbLatency < 500 ? 'degraded' : 'unhealthy'

    return {
      status,
      latencyMs: dbLatency,
      connections: Number(connections[0]?.active_connections) || 0,
      lastMigration: migrations[0]?.migration_name || 'none',
      checks: [
        { name: 'connectivity', passed: true },
        { name: 'latency', passed: dbLatency < 500, message: `${dbLatency}ms` },
        { name: 'migrations', passed: migrations.length > 0 }
      ]
    }
  } catch (error) {
    return {
      status: 'unhealthy',
      error: error instanceof Error ? error.message : 'Database connection failed',
      checks: [
        { name: 'connectivity', passed: false, message: error instanceof Error ? error.message : 'Failed' }
      ]
    }
  }
}

async function checkEventBusHealth() {
  try {
    const stats = getEventBusStats(60 * 60 * 1000) // Last hour

    const status = stats.successRate >= 95 ? 'healthy'
      : stats.successRate >= 80 ? 'degraded'
      : 'unhealthy'

    return {
      status,
      totalEvents: stats.totalEvents,
      successRate: stats.successRate,
      averageLatency: stats.averageLatency,
      p95Latency: stats.p95Latency,
      throughput: stats.throughput,
      checks: [
        { name: 'successRate', passed: stats.successRate >= 95, message: `${stats.successRate.toFixed(2)}%` },
        { name: 'latency', passed: stats.p95Latency < 2000, message: `p95: ${stats.p95Latency}ms` },
        { name: 'throughput', passed: true, message: `${stats.throughput.toFixed(2)} events/s` }
      ]
    }
  } catch (error) {
    return {
      status: 'unknown',
      error: error instanceof Error ? error.message : 'Failed to get event bus stats',
      checks: []
    }
  }
}

async function checkConnectorHealth() {
  try {
    const connectorStats = getAllConnectorHealthStats(60 * 60 * 1000) // Last hour

    if (connectorStats.length === 0) {
      return {
        status: 'healthy',
        message: 'No active connectors',
        connectors: [],
        checks: []
      }
    }

    const unhealthyConnectors = connectorStats.filter(c => c.status === 'down' || c.status === 'degraded')
    const status = unhealthyConnectors.length === 0 ? 'healthy'
      : unhealthyConnectors.length < connectorStats.length / 2 ? 'degraded'
      : 'unhealthy'

    return {
      status,
      connectors: connectorStats.map(c => ({
        type: c.connectorType,
        status: c.status,
        successRate: c.successRate,
        totalOperations: c.totalOperations,
        errorCount: c.errorCount
      })),
      checks: connectorStats.map(c => ({
        name: `connector:${c.connectorType}`,
        passed: c.status === 'healthy',
        message: `${c.successRate.toFixed(1)}% success, ${c.errorCount} errors`
      }))
    }
  } catch (error) {
    return {
      status: 'unknown',
      error: error instanceof Error ? error.message : 'Failed to get connector health',
      connectors: [],
      checks: []
    }
  }
}

async function checkOutboxHealth() {
  try {
    const [pendingCount, failedCount, dlqCount] = await Promise.all([
      prisma().outbox.count({ where: { status: 'PENDING' } }),
      prisma().outbox.count({ where: { status: 'FAILED' } }),
      prisma().dlqEventLog.count()
    ])

    const status = failedCount === 0 && dlqCount < 10 && pendingCount < 1000 ? 'healthy'
      : failedCount < 10 && dlqCount < 100 && pendingCount < 5000 ? 'degraded'
      : 'unhealthy'

    return {
      status,
      pending: pendingCount,
      failed: failedCount,
      dlq: dlqCount,
      checks: [
        { name: 'pending', passed: pendingCount < 1000, message: `${pendingCount} pending events` },
        { name: 'failed', passed: failedCount < 10, message: `${failedCount} failed events` },
        { name: 'dlq', passed: dlqCount < 10, message: `${dlqCount} events in DLQ` }
      ]
    }
  } catch (error) {
    return {
      status: 'unknown',
      error: error instanceof Error ? error.message : 'Failed to check outbox health',
      checks: []
    }
  }
}

async function checkPerformanceHealth() {
  try {
    const stats = getPerformanceStats(60 * 60 * 1000) // Last hour

    if (stats.totalRequests === 0) {
      return {
        status: 'healthy',
        message: 'No requests in the last hour',
        checks: []
      }
    }

    // SLA: p95 ≤ 1.0s read / ≤ 1.5s write
    const status = stats.p95ResponseTime <= 1500 && stats.errorRate < 2 ? 'healthy'
      : stats.p95ResponseTime <= 3000 && stats.errorRate < 5 ? 'degraded'
      : 'unhealthy'

    return {
      status,
      totalRequests: stats.totalRequests,
      p95ResponseTime: stats.p95ResponseTime,
      errorRate: stats.errorRate,
      throughput: stats.throughput,
      checks: [
        { name: 'p95Latency', passed: stats.p95ResponseTime <= 1500, message: `${stats.p95ResponseTime}ms` },
        { name: 'errorRate', passed: stats.errorRate < 2, message: `${stats.errorRate.toFixed(2)}%` },
        { name: 'throughput', passed: true, message: `${stats.throughput.toFixed(2)} req/s` }
      ]
    }
  } catch (error) {
    return {
      status: 'unknown',
      error: error instanceof Error ? error.message : 'Failed to get performance stats',
      checks: []
    }
  }
}

async function checkMemoryHealth() {
  const memoryUsage = process.memoryUsage()
  const heapUsedPercent = (memoryUsage.heapUsed / memoryUsage.heapTotal) * 100

  const status = heapUsedPercent < 80 ? 'healthy'
    : heapUsedPercent < 95 ? 'degraded'
    : 'unhealthy'

  return {
    status,
    heapUsedMB: Math.round(memoryUsage.heapUsed / 1024 / 1024),
    heapTotalMB: Math.round(memoryUsage.heapTotal / 1024 / 1024),
    heapUsedPercent: heapUsedPercent.toFixed(2),
    externalMB: Math.round(memoryUsage.external / 1024 / 1024),
    checks: [
      { name: 'heapUsage', passed: heapUsedPercent < 80, message: `${heapUsedPercent.toFixed(1)}%` }
    ]
  }
}
