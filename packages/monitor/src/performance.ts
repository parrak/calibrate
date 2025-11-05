/**
 * @calibr/monitor - Performance Monitoring
 * Tracks response times, throughput, errors, and resource usage
 */

export interface PerformanceMetric {
  timestamp: number
  endpoint: string
  method: string
  responseTime: number
  statusCode: number
  projectId?: string
  userId?: string
  userAgent?: string
  ip?: string
}

export interface ErrorMetric {
  timestamp: number
  endpoint: string
  method: string
  errorType: string
  errorMessage: string
  stackTrace?: string
  projectId?: string
  userId?: string
  statusCode: number
}

export interface ResourceMetric {
  timestamp: number
  memory: {
    used: number
    total: number
    external: number
    rss: number
  }
  cpu: {
    loadAverage: [number, number, number]
    usage?: number
  }
  uptime: number
}

export interface PerformanceStats {
  totalRequests: number
  averageResponseTime: number
  p50ResponseTime: number
  p95ResponseTime: number
  p99ResponseTime: number
  errorRate: number
  throughput: number // requests per second
  slowestEndpoints: Array<{
    endpoint: string
    averageTime: number
    requestCount: number
  }>
  errorBreakdown: Array<{
    errorType: string
    count: number
    percentage: number
  }>
}

// Performance metrics storage (in production, this would be Redis or similar)
const performanceMetrics = new Map<string, PerformanceMetric[]>()
const errorMetrics = new Map<string, ErrorMetric[]>()
const resourceMetrics = new Map<string, ResourceMetric[]>()

// Configuration
const MAX_METRICS_HISTORY = 1000
const METRICS_RETENTION_MS = 24 * 60 * 60 * 1000 // 24 hours

/**
 * Record a performance metric
 */
export function recordPerformanceMetric(metric: PerformanceMetric) {
  const key = `${metric.endpoint}:${metric.method}`

  if (!performanceMetrics.has(key)) {
    performanceMetrics.set(key, [])
  }

  const metrics = performanceMetrics.get(key)!
  metrics.push(metric)

  // Keep only recent metrics
  if (metrics.length > MAX_METRICS_HISTORY) {
    metrics.splice(0, metrics.length - MAX_METRICS_HISTORY)
  }

  // Clean up old metrics periodically
  cleanupOldMetrics()
}

/**
 * Record an error metric
 */
export function recordErrorMetric(metric: ErrorMetric) {
  const key = `${metric.endpoint}:${metric.method}`

  if (!errorMetrics.has(key)) {
    errorMetrics.set(key, [])
  }

  const metrics = errorMetrics.get(key)!
  metrics.push(metric)

  // Keep only recent metrics
  if (metrics.length > MAX_METRICS_HISTORY) {
    metrics.splice(0, metrics.length - MAX_METRICS_HISTORY)
  }
}

/**
 * Record resource usage metrics
 */
export function recordResourceMetric() {
  const memoryUsage = process.memoryUsage()
  const uptime = process.uptime()

  // Ensure loadAverage is always a tuple of 3 numbers
  let loadAverage: [number, number, number] = [0, 0, 0]
  try {
    // eslint-disable-next-line @typescript-eslint/no-var-requires
    const { loadavg } = require('os')
    const rawLoadAvg = process.platform === 'win32' ? [0, 0, 0] : loadavg()
    loadAverage = [
      rawLoadAvg[0] ?? 0,
      rawLoadAvg[1] ?? 0,
      rawLoadAvg[2] ?? 0
    ]
  } catch {
    // Fallback for platforms without loadavg
    loadAverage = [0, 0, 0]
  }

  const metric: ResourceMetric = {
    timestamp: Date.now(),
    memory: {
      used: memoryUsage.heapUsed,
      total: memoryUsage.heapTotal,
      external: memoryUsage.external,
      rss: memoryUsage.rss
    },
    cpu: {
      loadAverage
    },
    uptime
  }

  const key = 'system'
  if (!resourceMetrics.has(key)) {
    resourceMetrics.set(key, [])
  }

  const metrics = resourceMetrics.get(key)!
  metrics.push(metric)

  // Keep only recent metrics
  if (metrics.length > MAX_METRICS_HISTORY) {
    metrics.splice(0, metrics.length - MAX_METRICS_HISTORY)
  }
}

/**
 * Get performance statistics for a time range
 */
export function getPerformanceStats(
  timeRangeMs: number = 60 * 60 * 1000, // 1 hour default
  endpoint?: string
): PerformanceStats {
  const now = Date.now()
  const startTime = now - timeRangeMs

  const allMetrics: PerformanceMetric[] = []

  if (endpoint) {
    // Get metrics for specific endpoint
    for (const [key, metrics] of performanceMetrics.entries()) {
      if (key.startsWith(endpoint)) {
        allMetrics.push(...metrics.filter(m => m.timestamp >= startTime))
      }
    }
  } else {
    // Get all metrics
    for (const metrics of performanceMetrics.values()) {
      allMetrics.push(...metrics.filter(m => m.timestamp >= startTime))
    }
  }

  if (allMetrics.length === 0) {
    return {
      totalRequests: 0,
      averageResponseTime: 0,
      p50ResponseTime: 0,
      p95ResponseTime: 0,
      p99ResponseTime: 0,
      errorRate: 0,
      throughput: 0,
      slowestEndpoints: [],
      errorBreakdown: []
    }
  }

  // Calculate response time percentiles
  const responseTimes = allMetrics.map(m => m.responseTime).sort((a, b) => a - b)
  const p50Index = Math.floor(responseTimes.length * 0.5)
  const p95Index = Math.floor(responseTimes.length * 0.95)
  const p99Index = Math.floor(responseTimes.length * 0.99)

  const p50ResponseTime = responseTimes[p50Index] || 0
  const p95ResponseTime = responseTimes[p95Index] || 0
  const p99ResponseTime = responseTimes[p99Index] || 0

  // Calculate error rate
  const errorCount = allMetrics.filter(m => m.statusCode >= 400).length
  const errorRate = (errorCount / allMetrics.length) * 100

  // Calculate throughput (requests per second)
  const timeRangeSeconds = timeRangeMs / 1000
  const throughput = allMetrics.length / timeRangeSeconds

  // Calculate slowest endpoints
  const endpointStats = new Map<string, { totalTime: number; count: number }>()
  for (const metric of allMetrics) {
    const key = `${metric.endpoint}:${metric.method}`
    const existing = endpointStats.get(key) || { totalTime: 0, count: 0 }
    endpointStats.set(key, {
      totalTime: existing.totalTime + metric.responseTime,
      count: existing.count + 1
    })
  }

  const slowestEndpoints = Array.from(endpointStats.entries())
    .map(([endpoint, stats]) => ({
      endpoint,
      averageTime: stats.totalTime / stats.count,
      requestCount: stats.count
    }))
    .sort((a, b) => b.averageTime - a.averageTime)
    .slice(0, 10)

  // Calculate error breakdown
  const errorBreakdown = new Map<string, number>()
  for (const metric of allMetrics.filter(m => m.statusCode >= 400)) {
    const errorType = getErrorType(metric.statusCode)
    errorBreakdown.set(errorType, (errorBreakdown.get(errorType) || 0) + 1)
  }

  const errorBreakdownArray = Array.from(errorBreakdown.entries())
    .map(([errorType, count]) => ({
      errorType,
      count,
      percentage: (count / errorCount) * 100
    }))
    .sort((a, b) => b.count - a.count)

  return {
    totalRequests: allMetrics.length,
    averageResponseTime: responseTimes.reduce((a, b) => a + b, 0) / responseTimes.length,
    p50ResponseTime,
    p95ResponseTime,
    p99ResponseTime,
    errorRate,
    throughput,
    slowestEndpoints,
    errorBreakdown: errorBreakdownArray
  }
}

/**
 * Get resource usage statistics
 */
export function getResourceStats(timeRangeMs: number = 60 * 60 * 1000): ResourceMetric[] {
  const now = Date.now()
  const startTime = now - timeRangeMs

  const metrics = resourceMetrics.get('system') || []
  return metrics.filter(m => m.timestamp >= startTime)
}

/**
 * Get all performance metrics (for testing/debugging)
 */
export function getAllPerformanceMetrics(): Map<string, PerformanceMetric[]> {
  return new Map(performanceMetrics)
}

/**
 * Get all error metrics (for testing/debugging)
 */
export function getAllErrorMetrics(): Map<string, ErrorMetric[]> {
  return new Map(errorMetrics)
}

/**
 * Get all resource metrics (for testing/debugging)
 */
export function getAllResourceMetrics(): Map<string, ResourceMetric[]> {
  return new Map(resourceMetrics)
}

/**
 * Clean up old metrics
 */
function cleanupOldMetrics() {
  const now = Date.now()
  const cutoffTime = now - METRICS_RETENTION_MS

  // Clean up performance metrics
  for (const [key, metrics] of performanceMetrics.entries()) {
    const filtered = metrics.filter(m => m.timestamp >= cutoffTime)
    if (filtered.length === 0) {
      performanceMetrics.delete(key)
    } else {
      performanceMetrics.set(key, filtered)
    }
  }

  // Clean up error metrics
  for (const [key, metrics] of errorMetrics.entries()) {
    const filtered = metrics.filter(m => m.timestamp >= cutoffTime)
    if (filtered.length === 0) {
      errorMetrics.delete(key)
    } else {
      errorMetrics.set(key, filtered)
    }
  }

  // Clean up resource metrics
  for (const [key, metrics] of resourceMetrics.entries()) {
    const filtered = metrics.filter(m => m.timestamp >= cutoffTime)
    if (filtered.length === 0) {
      resourceMetrics.delete(key)
    } else {
      resourceMetrics.set(key, filtered)
    }
  }
}

/**
 * Get error type from status code
 */
function getErrorType(statusCode: number): string {
  if (statusCode >= 500) return 'server_error'
  if (statusCode >= 400) return 'client_error'
  if (statusCode >= 300) return 'redirect'
  return 'success'
}

// Track the monitoring interval to prevent memory leaks
let resourceMonitoringInterval: NodeJS.Timeout | null = null

/**
 * Start periodic resource monitoring
 */
export function startResourceMonitoring(intervalMs: number = 30000) {
  // Clear existing interval if it exists
  if (resourceMonitoringInterval) {
    clearInterval(resourceMonitoringInterval)
  }

  // Record initial metric
  recordResourceMetric()

  // Set up new interval
  resourceMonitoringInterval = setInterval(() => {
    recordResourceMetric()
  }, intervalMs)
}

/**
 * Stop resource monitoring
 */
export function stopResourceMonitoring() {
  if (resourceMonitoringInterval) {
    clearInterval(resourceMonitoringInterval)
    resourceMonitoringInterval = null
  }
}

/**
 * Clear all metrics (useful for testing)
 */
export function clearAllMetrics() {
  performanceMetrics.clear()
  errorMetrics.clear()
  resourceMetrics.clear()
}

