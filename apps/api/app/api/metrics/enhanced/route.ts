/**
 * Enhanced Metrics Endpoint
 * Includes event bus, connector health, and SLA metrics
 * Compatible with Prometheus/OpenMetrics format
 */

import { NextRequest, NextResponse } from 'next/server'
export const dynamic = 'force-dynamic'
export const runtime = 'nodejs'
import { prisma } from '@calibr/db'
import {
  getEventBusStats,
  getAllConnectorHealthStats,
  getPerformanceStats,
  getResourceStats
} from '@calibr/monitor'

export async function GET(req: NextRequest) {
  const startTime = Date.now()
  const format = req.nextUrl.searchParams.get('format') || 'json'
  const timeRange = req.nextUrl.searchParams.get('timeRange') || '1h'

  try {
    const timeRangeMs = getTimeRangeMs(timeRange)

    const [
      eventBusMetrics,
      connectorMetrics,
      performanceMetrics,
      resourceMetrics,
      outboxMetrics
    ] = await Promise.all([
      getEventBusMetrics(timeRangeMs),
      getConnectorMetrics(timeRangeMs),
      getPerformanceMetrics(timeRangeMs),
      getResourceMetrics(timeRangeMs),
      getOutboxMetrics()
    ])

    const metrics = {
      timestamp: new Date().toISOString(),
      timeRange,
      responseTime: Date.now() - startTime,
      eventBus: eventBusMetrics,
      connectors: connectorMetrics,
      performance: performanceMetrics,
      resources: resourceMetrics,
      outbox: outboxMetrics
    }

    if (format === 'prometheus') {
      return new NextResponse(formatPrometheus(metrics), {
        headers: {
          'Content-Type': 'text/plain; version=0.0.4'
        }
      })
    }

    return NextResponse.json(metrics)
  } catch (error) {
    console.error('Enhanced metrics collection failed:', error)
    return NextResponse.json({
      error: 'Failed to collect metrics',
      message: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 })
  }
}

function getTimeRangeMs(timeRange: string): number {
  const ranges: Record<string, number> = {
    '5m': 5 * 60 * 1000,
    '15m': 15 * 60 * 1000,
    '1h': 60 * 60 * 1000,
    '24h': 24 * 60 * 60 * 1000,
    '7d': 7 * 24 * 60 * 60 * 1000
  }
  return ranges[timeRange] || ranges['1h']
}

async function getEventBusMetrics(timeRangeMs: number) {
  const stats = getEventBusStats(timeRangeMs)

  return {
    totalEvents: stats.totalEvents,
    successRate: stats.successRate,
    retryRate: stats.retryRate,
    failureRate: stats.failureRate,
    averageLatency: stats.averageLatency,
    p50Latency: stats.p50Latency,
    p95Latency: stats.p95Latency,
    p99Latency: stats.p99Latency,
    maxLatency: stats.maxLatency,
    throughput: stats.throughput,
    eventTypes: stats.eventTypeBreakdown
  }
}

async function getConnectorMetrics(timeRangeMs: number) {
  const connectorStats = getAllConnectorHealthStats(timeRangeMs)

  return connectorStats.map(c => ({
    type: c.connectorType,
    status: c.status,
    totalOperations: c.totalOperations,
    successRate: c.successRate,
    averageLatency: c.averageLatency,
    p95Latency: c.p95Latency,
    errorCount: c.errorCount,
    lastSuccessAt: c.lastSuccessAt,
    lastFailureAt: c.lastFailureAt,
    operations: c.operationBreakdown
  }))
}

async function getPerformanceMetrics(timeRangeMs: number) {
  const stats = getPerformanceStats(timeRangeMs)

  return {
    totalRequests: stats.totalRequests,
    averageResponseTime: stats.averageResponseTime,
    p50ResponseTime: stats.p50ResponseTime,
    p95ResponseTime: stats.p95ResponseTime,
    p99ResponseTime: stats.p99ResponseTime,
    errorRate: stats.errorRate,
    throughput: stats.throughput,
    slowestEndpoints: stats.slowestEndpoints,
    errorBreakdown: stats.errorBreakdown,
    sla: {
      p95Target: 1500, // 1.5s write
      p95Current: stats.p95ResponseTime,
      p95Met: stats.p95ResponseTime <= 1500,
      errorRateTarget: 2, // 2%
      errorRateCurrent: stats.errorRate,
      errorRateMet: stats.errorRate <= 2
    }
  }
}

async function getResourceMetrics(timeRangeMs: number) {
  const resourceStats = getResourceStats(timeRangeMs)
  const memoryUsage = process.memoryUsage()

  return {
    uptime: Math.floor(process.uptime()),
    memory: {
      heapUsedMB: Math.round(memoryUsage.heapUsed / 1024 / 1024),
      heapTotalMB: Math.round(memoryUsage.heapTotal / 1024 / 1024),
      externalMB: Math.round(memoryUsage.external / 1024 / 1024),
      rssMB: Math.round(memoryUsage.rss / 1024 / 1024)
    },
    cpu: resourceStats.length > 0 ? {
      loadAverage: resourceStats[resourceStats.length - 1].cpu.loadAverage
    } : null,
    history: resourceStats.slice(-10) // Last 10 samples
  }
}

async function getOutboxMetrics() {
  const [
    totalEvents,
    pendingEvents,
    processingEvents,
    completedEvents,
    failedEvents,
    dlqEvents,
    oldestPending
  ] = await Promise.all([
    prisma().outbox.count(),
    prisma().outbox.count({ where: { status: 'PENDING' } }),
    prisma().outbox.count({ where: { status: 'PROCESSING' } }),
    prisma().outbox.count({ where: { status: 'COMPLETED' } }),
    prisma().outbox.count({ where: { status: 'FAILED' } }),
    prisma().dlqEventLog.count(),
    prisma().outbox.findFirst({
      where: { status: 'PENDING' },
      orderBy: { createdAt: 'asc' },
      select: { createdAt: true }
    })
  ])

  const backlogAge = oldestPending
    ? Date.now() - oldestPending.createdAt.getTime()
    : 0

  return {
    total: totalEvents,
    pending: pendingEvents,
    processing: processingEvents,
    completed: completedEvents,
    failed: failedEvents,
    dlq: dlqEvents,
    backlogAge: backlogAge,
    health: {
      status: failedEvents === 0 && dlqEvents < 10 && pendingEvents < 1000 ? 'healthy'
        : failedEvents < 10 && dlqEvents < 100 && pendingEvents < 5000 ? 'degraded'
        : 'unhealthy'
    }
  }
}

function formatPrometheus(metrics: any): string {
  const lines: string[] = []

  // Event Bus Metrics
  lines.push('# HELP calibr_event_bus_total_events Total number of events processed')
  lines.push('# TYPE calibr_event_bus_total_events counter')
  lines.push(`calibr_event_bus_total_events ${metrics.eventBus.totalEvents}`)

  lines.push('# HELP calibr_event_bus_success_rate Success rate percentage')
  lines.push('# TYPE calibr_event_bus_success_rate gauge')
  lines.push(`calibr_event_bus_success_rate ${metrics.eventBus.successRate}`)

  lines.push('# HELP calibr_event_bus_latency_p95 95th percentile latency in milliseconds')
  lines.push('# TYPE calibr_event_bus_latency_p95 gauge')
  lines.push(`calibr_event_bus_latency_p95 ${metrics.eventBus.p95Latency}`)

  lines.push('# HELP calibr_event_bus_throughput Events per second')
  lines.push('# TYPE calibr_event_bus_throughput gauge')
  lines.push(`calibr_event_bus_throughput ${metrics.eventBus.throughput}`)

  // Connector Metrics
  for (const connector of metrics.connectors) {
    lines.push(`# HELP calibr_connector_operations_total Total operations for ${connector.type}`)
    lines.push(`# TYPE calibr_connector_operations_total counter`)
    lines.push(`calibr_connector_operations_total{connector="${connector.type}"} ${connector.totalOperations}`)

    lines.push(`# HELP calibr_connector_success_rate Success rate for ${connector.type}`)
    lines.push(`# TYPE calibr_connector_success_rate gauge`)
    lines.push(`calibr_connector_success_rate{connector="${connector.type}"} ${connector.successRate}`)

    lines.push(`# HELP calibr_connector_latency_p95 95th percentile latency for ${connector.type}`)
    lines.push(`# TYPE calibr_connector_latency_p95 gauge`)
    lines.push(`calibr_connector_latency_p95{connector="${connector.type}"} ${connector.p95Latency}`)
  }

  // Performance Metrics
  lines.push('# HELP calibr_api_requests_total Total API requests')
  lines.push('# TYPE calibr_api_requests_total counter')
  lines.push(`calibr_api_requests_total ${metrics.performance.totalRequests}`)

  lines.push('# HELP calibr_api_latency_p95 95th percentile API latency in milliseconds')
  lines.push('# TYPE calibr_api_latency_p95 gauge')
  lines.push(`calibr_api_latency_p95 ${metrics.performance.p95ResponseTime}`)

  lines.push('# HELP calibr_api_error_rate Error rate percentage')
  lines.push('# TYPE calibr_api_error_rate gauge')
  lines.push(`calibr_api_error_rate ${metrics.performance.errorRate}`)

  lines.push('# HELP calibr_api_sla_met SLA compliance (1 = met, 0 = not met)')
  lines.push('# TYPE calibr_api_sla_met gauge')
  lines.push(`calibr_api_sla_met{metric="p95_latency"} ${metrics.performance.sla.p95Met ? 1 : 0}`)
  lines.push(`calibr_api_sla_met{metric="error_rate"} ${metrics.performance.sla.errorRateMet ? 1 : 0}`)

  // Outbox Metrics
  lines.push('# HELP calibr_outbox_pending Pending events in outbox')
  lines.push('# TYPE calibr_outbox_pending gauge')
  lines.push(`calibr_outbox_pending ${metrics.outbox.pending}`)

  lines.push('# HELP calibr_outbox_failed Failed events in outbox')
  lines.push('# TYPE calibr_outbox_failed gauge')
  lines.push(`calibr_outbox_failed ${metrics.outbox.failed}`)

  lines.push('# HELP calibr_outbox_dlq Events in dead letter queue')
  lines.push('# TYPE calibr_outbox_dlq gauge')
  lines.push(`calibr_outbox_dlq ${metrics.outbox.dlq}`)

  lines.push('# HELP calibr_outbox_backlog_age Age of oldest pending event in milliseconds')
  lines.push('# TYPE calibr_outbox_backlog_age gauge')
  lines.push(`calibr_outbox_backlog_age ${metrics.outbox.backlogAge}`)

  // Resource Metrics
  lines.push('# HELP calibr_memory_heap_used Heap memory used in MB')
  lines.push('# TYPE calibr_memory_heap_used gauge')
  lines.push(`calibr_memory_heap_used ${metrics.resources.memory.heapUsedMB}`)

  lines.push('# HELP calibr_memory_heap_total Total heap memory in MB')
  lines.push('# TYPE calibr_memory_heap_total gauge')
  lines.push(`calibr_memory_heap_total ${metrics.resources.memory.heapTotalMB}`)

  lines.push('# HELP calibr_uptime Process uptime in seconds')
  lines.push('# TYPE calibr_uptime counter')
  lines.push(`calibr_uptime ${metrics.resources.uptime}`)

  return lines.join('\n')
}
