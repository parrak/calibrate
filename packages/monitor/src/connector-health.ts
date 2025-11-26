/**
 * @calibr/monitor - Connector Health Tracking
 * Monitors health, latency, and success rates for platform connectors
 */

export type ConnectorStatus = 'healthy' | 'degraded' | 'down' | 'unknown'

export interface ConnectorHealthMetric {
  timestamp: number
  connectorType: string // 'shopify', 'amazon', 'stripe'
  connectorId: string
  tenantId: string
  projectId?: string
  operation: string // 'sync', 'apply', 'fetch', 'health_check'
  success: boolean
  latencyMs: number
  errorMessage?: string
  metadata?: Record<string, unknown>
}

export interface ConnectorHealthStats {
  connectorType: string
  status: ConnectorStatus
  totalOperations: number
  successRate: number
  averageLatency: number
  p95Latency: number
  errorCount: number
  lastSuccessAt?: number
  lastFailureAt?: number
  lastHealthCheck?: number
  operationBreakdown: Array<{
    operation: string
    count: number
    successRate: number
    averageLatency: number
  }>
  recentErrors: Array<{
    timestamp: number
    operation: string
    errorMessage: string
  }>
}

export interface ConnectorHealthCheck {
  connectorType: string
  connectorId: string
  tenantId: string
  projectId?: string
  timestamp: number
  status: ConnectorStatus
  latencyMs: number
  checks: Array<{
    name: string
    passed: boolean
    message?: string
  }>
}

// Connector health metrics storage
const connectorMetrics = new Map<string, ConnectorHealthMetric[]>()
const connectorHealthChecks = new Map<string, ConnectorHealthCheck>()

// Configuration
const MAX_METRICS_PER_CONNECTOR = 1000
const METRICS_RETENTION_MS = 24 * 60 * 60 * 1000 // 24 hours
const HEALTH_CHECK_STALE_MS = 5 * 60 * 1000 // 5 minutes

/**
 * Record a connector operation metric
 */
export function recordConnectorMetric(metric: ConnectorHealthMetric) {
  const key = `${metric.connectorType}:${metric.connectorId}`

  if (!connectorMetrics.has(key)) {
    connectorMetrics.set(key, [])
  }

  const metrics = connectorMetrics.get(key)!
  metrics.push(metric)

  // Keep only recent metrics
  if (metrics.length > MAX_METRICS_PER_CONNECTOR) {
    metrics.splice(0, metrics.length - MAX_METRICS_PER_CONNECTOR)
  }

  // Clean up old metrics periodically
  cleanupOldConnectorMetrics()
}

/**
 * Record a connector health check
 */
export function recordConnectorHealthCheck(healthCheck: ConnectorHealthCheck) {
  const key = `${healthCheck.connectorType}:${healthCheck.connectorId}`
  connectorHealthChecks.set(key, healthCheck)
}

/**
 * Get health stats for a connector
 */
export function getConnectorHealthStats(
  connectorType: string,
  connectorId?: string,
  timeRangeMs: number = 60 * 60 * 1000 // 1 hour default
): ConnectorHealthStats {
  const now = Date.now()
  const startTime = now - timeRangeMs

  const allMetrics: ConnectorHealthMetric[] = []

  // Get metrics for the connector
  for (const [key, metrics] of connectorMetrics.entries()) {
    if (key.startsWith(`${connectorType}:`)) {
      if (connectorId && !key.endsWith(connectorId)) {
        continue
      }
      allMetrics.push(...metrics.filter(m => m.timestamp >= startTime))
    }
  }

  if (allMetrics.length === 0) {
    return {
      connectorType,
      status: 'unknown',
      totalOperations: 0,
      successRate: 0,
      averageLatency: 0,
      p95Latency: 0,
      errorCount: 0,
      operationBreakdown: [],
      recentErrors: []
    }
  }

  // Calculate success rate
  const successCount = allMetrics.filter(m => m.success).length
  const successRate = (successCount / allMetrics.length) * 100

  // Calculate latency percentiles
  const latencies = allMetrics.map(m => m.latencyMs).sort((a, b) => a - b)
  const p95Index = Math.floor(latencies.length * 0.95)
  const p95Latency = latencies[p95Index] || 0
  const averageLatency = latencies.reduce((a, b) => a + b, 0) / latencies.length

  // Find last success and failure
  const successMetrics = allMetrics.filter(m => m.success)
  const failureMetrics = allMetrics.filter(m => !m.success)
  const lastSuccessAt = successMetrics.length > 0
    ? Math.max(...successMetrics.map(m => m.timestamp))
    : undefined
  const lastFailureAt = failureMetrics.length > 0
    ? Math.max(...failureMetrics.map(m => m.timestamp))
    : undefined

  // Calculate operation breakdown
  const operationStats = new Map<string, { count: number; successCount: number; totalLatency: number }>()
  for (const metric of allMetrics) {
    const existing = operationStats.get(metric.operation) || {
      count: 0,
      successCount: 0,
      totalLatency: 0
    }
    operationStats.set(metric.operation, {
      count: existing.count + 1,
      successCount: existing.successCount + (metric.success ? 1 : 0),
      totalLatency: existing.totalLatency + metric.latencyMs
    })
  }

  const operationBreakdown = Array.from(operationStats.entries())
    .map(([operation, stats]) => ({
      operation,
      count: stats.count,
      successRate: (stats.successCount / stats.count) * 100,
      averageLatency: stats.totalLatency / stats.count
    }))
    .sort((a, b) => b.count - a.count)

  // Get recent errors
  const recentErrors = failureMetrics
    .sort((a, b) => b.timestamp - a.timestamp)
    .slice(0, 10)
    .map(m => ({
      timestamp: m.timestamp,
      operation: m.operation,
      errorMessage: m.errorMessage || 'Unknown error'
    }))

  // Get last health check
  const healthCheckKey = connectorId
    ? `${connectorType}:${connectorId}`
    : Array.from(connectorHealthChecks.keys()).find(k => k.startsWith(`${connectorType}:`))

  const lastHealthCheck = healthCheckKey
    ? connectorHealthChecks.get(healthCheckKey)?.timestamp
    : undefined

  // Determine status
  let status: ConnectorStatus = 'healthy'

  if (successRate < 50) {
    status = 'down'
  } else if (successRate < 90) {
    status = 'degraded'
  } else if (lastHealthCheck && (now - lastHealthCheck) > HEALTH_CHECK_STALE_MS) {
    status = 'unknown'
  }

  return {
    connectorType,
    status,
    totalOperations: allMetrics.length,
    successRate,
    averageLatency,
    p95Latency,
    errorCount: failureMetrics.length,
    lastSuccessAt,
    lastFailureAt,
    lastHealthCheck,
    operationBreakdown,
    recentErrors
  }
}

/**
 * Get all connector health stats
 */
export function getAllConnectorHealthStats(
  timeRangeMs: number = 60 * 60 * 1000
): ConnectorHealthStats[] {
  const connectorTypes = new Set<string>()
  for (const key of connectorMetrics.keys()) {
    const [type] = key.split(':')
    connectorTypes.add(type)
  }

  return Array.from(connectorTypes).map(type =>
    getConnectorHealthStats(type, undefined, timeRangeMs)
  )
}

/**
 * Get connector health check status
 */
export function getConnectorHealthCheck(
  connectorType: string,
  connectorId: string
): ConnectorHealthCheck | null {
  const key = `${connectorType}:${connectorId}`
  return connectorHealthChecks.get(key) || null
}

/**
 * Clean up old connector metrics
 */
function cleanupOldConnectorMetrics() {
  const now = Date.now()
  const cutoffTime = now - METRICS_RETENTION_MS

  for (const [key, metrics] of connectorMetrics.entries()) {
    const filtered = metrics.filter(m => m.timestamp >= cutoffTime)
    if (filtered.length === 0) {
      connectorMetrics.delete(key)
    } else {
      connectorMetrics.set(key, filtered)
    }
  }
}

/**
 * Clear all connector metrics (useful for testing)
 */
export function clearConnectorMetrics() {
  connectorMetrics.clear()
  connectorHealthChecks.clear()
}

/**
 * Get all connector metrics (for testing/debugging)
 */
export function getAllConnectorMetrics(): Map<string, ConnectorHealthMetric[]> {
  return new Map(connectorMetrics)
}
