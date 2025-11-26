/**
 * @calibr/monitor - Event Bus Metrics
 * Tracks event latency, throughput, and health for the event bus system
 */

export interface EventMetric {
  timestamp: number
  eventId: string
  eventType: string
  tenantId: string
  projectId?: string
  correlationId?: string
  latencyMs: number // Time from event creation to processing
  retryCount: number
  status: 'success' | 'failed' | 'retrying'
}

export interface EventBusStats {
  totalEvents: number
  averageLatency: number
  p50Latency: number
  p95Latency: number
  p99Latency: number
  maxLatency: number
  throughput: number // events per second
  successRate: number
  retryRate: number
  failureRate: number
  eventTypeBreakdown: Array<{
    eventType: string
    count: number
    averageLatency: number
    successRate: number
  }>
}

// Event metrics storage (in production, this would be Redis or similar)
const eventMetrics = new Map<string, EventMetric[]>()

// Configuration
const MAX_EVENT_METRICS_HISTORY = 10000
const METRICS_RETENTION_MS = 24 * 60 * 60 * 1000 // 24 hours

/**
 * Record an event metric
 */
export function recordEventMetric(metric: EventMetric) {
  const key = metric.eventType

  if (!eventMetrics.has(key)) {
    eventMetrics.set(key, [])
  }

  const metrics = eventMetrics.get(key)!
  metrics.push(metric)

  // Keep only recent metrics
  if (metrics.length > MAX_EVENT_METRICS_HISTORY) {
    metrics.splice(0, metrics.length - MAX_EVENT_METRICS_HISTORY)
  }

  // Clean up old metrics periodically
  cleanupOldEventMetrics()
}

/**
 * Get event bus statistics for a time range
 */
export function getEventBusStats(
  timeRangeMs: number = 60 * 60 * 1000, // 1 hour default
  eventType?: string
): EventBusStats {
  const now = Date.now()
  const startTime = now - timeRangeMs

  const allMetrics: EventMetric[] = []

  if (eventType) {
    // Get metrics for specific event type
    const metrics = eventMetrics.get(eventType) || []
    allMetrics.push(...metrics.filter(m => m.timestamp >= startTime))
  } else {
    // Get all metrics
    for (const metrics of eventMetrics.values()) {
      allMetrics.push(...metrics.filter(m => m.timestamp >= startTime))
    }
  }

  if (allMetrics.length === 0) {
    return {
      totalEvents: 0,
      averageLatency: 0,
      p50Latency: 0,
      p95Latency: 0,
      p99Latency: 0,
      maxLatency: 0,
      throughput: 0,
      successRate: 0,
      retryRate: 0,
      failureRate: 0,
      eventTypeBreakdown: []
    }
  }

  // Calculate latency percentiles
  const latencies = allMetrics.map(m => m.latencyMs).sort((a, b) => a - b)
  const p50Index = Math.floor(latencies.length * 0.5)
  const p95Index = Math.floor(latencies.length * 0.95)
  const p99Index = Math.floor(latencies.length * 0.99)

  const p50Latency = latencies[p50Index] || 0
  const p95Latency = latencies[p95Index] || 0
  const p99Latency = latencies[p99Index] || 0
  const maxLatency = latencies[latencies.length - 1] || 0

  // Calculate status rates
  const successCount = allMetrics.filter(m => m.status === 'success').length
  const retryingCount = allMetrics.filter(m => m.status === 'retrying').length
  const failedCount = allMetrics.filter(m => m.status === 'failed').length

  const successRate = (successCount / allMetrics.length) * 100
  const retryRate = (retryingCount / allMetrics.length) * 100
  const failureRate = (failedCount / allMetrics.length) * 100

  // Calculate throughput (events per second)
  const timeRangeSeconds = timeRangeMs / 1000
  const throughput = allMetrics.length / timeRangeSeconds

  // Calculate event type breakdown
  const eventTypeStats = new Map<string, {
    count: number
    totalLatency: number
    successCount: number
  }>()

  for (const metric of allMetrics) {
    const existing = eventTypeStats.get(metric.eventType) || {
      count: 0,
      totalLatency: 0,
      successCount: 0
    }

    eventTypeStats.set(metric.eventType, {
      count: existing.count + 1,
      totalLatency: existing.totalLatency + metric.latencyMs,
      successCount: existing.successCount + (metric.status === 'success' ? 1 : 0)
    })
  }

  const eventTypeBreakdown = Array.from(eventTypeStats.entries())
    .map(([eventType, stats]) => ({
      eventType,
      count: stats.count,
      averageLatency: stats.totalLatency / stats.count,
      successRate: (stats.successCount / stats.count) * 100
    }))
    .sort((a, b) => b.count - a.count)

  return {
    totalEvents: allMetrics.length,
    averageLatency: latencies.reduce((a, b) => a + b, 0) / latencies.length,
    p50Latency,
    p95Latency,
    p99Latency,
    maxLatency,
    throughput,
    successRate,
    retryRate,
    failureRate,
    eventTypeBreakdown
  }
}

/**
 * Get slow events (above threshold)
 */
export function getSlowEvents(
  thresholdMs: number = 1000,
  timeRangeMs: number = 60 * 60 * 1000
): EventMetric[] {
  const now = Date.now()
  const startTime = now - timeRangeMs

  const allMetrics: EventMetric[] = []
  for (const metrics of eventMetrics.values()) {
    allMetrics.push(...metrics.filter(m => m.timestamp >= startTime && m.latencyMs > thresholdMs))
  }

  return allMetrics.sort((a, b) => b.latencyMs - a.latencyMs)
}

/**
 * Get failed events
 */
export function getFailedEvents(timeRangeMs: number = 60 * 60 * 1000): EventMetric[] {
  const now = Date.now()
  const startTime = now - timeRangeMs

  const allMetrics: EventMetric[] = []
  for (const metrics of eventMetrics.values()) {
    allMetrics.push(...metrics.filter(m => m.timestamp >= startTime && m.status === 'failed'))
  }

  return allMetrics.sort((a, b) => b.timestamp - a.timestamp)
}

/**
 * Get events by correlation ID
 */
export function getEventsByCorrelation(correlationId: string): EventMetric[] {
  const allMetrics: EventMetric[] = []
  for (const metrics of eventMetrics.values()) {
    allMetrics.push(...metrics.filter(m => m.correlationId === correlationId))
  }

  return allMetrics.sort((a, b) => a.timestamp - b.timestamp)
}

/**
 * Clean up old event metrics
 */
function cleanupOldEventMetrics() {
  const now = Date.now()
  const cutoffTime = now - METRICS_RETENTION_MS

  for (const [key, metrics] of eventMetrics.entries()) {
    const filtered = metrics.filter(m => m.timestamp >= cutoffTime)
    if (filtered.length === 0) {
      eventMetrics.delete(key)
    } else {
      eventMetrics.set(key, filtered)
    }
  }
}

/**
 * Get all event metrics (for testing/debugging)
 */
export function getAllEventMetrics(): Map<string, EventMetric[]> {
  return new Map(eventMetrics)
}

/**
 * Clear all event metrics (useful for testing)
 */
export function clearEventMetrics() {
  eventMetrics.clear()
}
