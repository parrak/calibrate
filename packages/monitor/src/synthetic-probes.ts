/**
 * @calibr/monitor - Synthetic Probes
 * Synthetic monitoring for critical API endpoints
 */

import { logger } from './logger'

export type ProbeStatus = 'healthy' | 'degraded' | 'unhealthy' | 'unknown'

export interface ProbeConfig {
  id: string
  name: string
  description: string
  endpoint: string
  method?: 'GET' | 'POST' | 'PUT' | 'DELETE'
  headers?: Record<string, string>
  body?: any
  timeout?: number // milliseconds
  expectedStatus?: number[]
  expectedResponseTime?: number // milliseconds (p95 threshold)
  healthCheck?: (response: Response, responseTime: number) => boolean
}

export interface ProbeResult {
  probeId: string
  timestamp: number
  status: ProbeStatus
  responseTime: number
  statusCode?: number
  error?: string
  healthy: boolean
  message?: string
}

export interface ProbeStats {
  probeId: string
  totalChecks: number
  successfulChecks: number
  failedChecks: number
  successRate: number
  avgResponseTime: number
  p95ResponseTime: number
  lastCheck?: ProbeResult
  recentResults: ProbeResult[]
}

// In-memory storage for probe results
const probeResults = new Map<string, ProbeResult[]>()
const MAX_RESULTS_PER_PROBE = 1000
const RESULTS_RETENTION_MS = 24 * 60 * 60 * 1000 // 24 hours

/**
 * Default probe configurations for Calibr platform
 */
export const DEFAULT_PROBES: ProbeConfig[] = [
  {
    id: 'price_changes_list',
    name: 'Price Changes List',
    description: 'Check price changes listing endpoint',
    endpoint: '/api/v1/price-changes',
    method: 'GET',
    expectedStatus: [200],
    expectedResponseTime: 1000, // 1s
    timeout: 5000
  },
  {
    id: 'analytics_overview',
    name: 'Analytics Overview',
    description: 'Check analytics overview endpoint',
    endpoint: '/api/v1/analytics/:projectId/overview',
    method: 'GET',
    expectedStatus: [200, 404], // 404 is ok if project doesn't exist
    expectedResponseTime: 1500, // 1.5s
    timeout: 5000
  },
  {
    id: 'copilot_query',
    name: 'Copilot Query',
    description: 'Check copilot query endpoint health',
    endpoint: '/api/copilot/query',
    method: 'POST',
    expectedStatus: [200, 400, 401], // Various auth/validation responses are ok
    expectedResponseTime: 2000, // 2s
    timeout: 10000,
    body: {
      query: 'test health check',
      project: 'test'
    }
  },
  {
    id: 'health_check',
    name: 'Health Check',
    description: 'Basic health check endpoint',
    endpoint: '/api/health',
    method: 'GET',
    expectedStatus: [200],
    expectedResponseTime: 500, // 500ms
    timeout: 3000
  },
  {
    id: 'metrics_endpoint',
    name: 'Metrics Endpoint',
    description: 'Metrics endpoint availability',
    endpoint: '/api/metrics/enhanced',
    method: 'GET',
    expectedStatus: [200],
    expectedResponseTime: 1000, // 1s
    timeout: 5000
  }
]

/**
 * Execute a synthetic probe
 */
export async function executeProbe(
  config: ProbeConfig,
  baseUrl?: string
): Promise<ProbeResult> {
  const startTime = Date.now()
  const result: ProbeResult = {
    probeId: config.id,
    timestamp: startTime,
    status: 'unknown',
    responseTime: 0,
    healthy: false
  }

  try {
    // Build full URL
    const url = baseUrl
      ? `${baseUrl.replace(/\/$/, '')}${config.endpoint}`
      : config.endpoint

    // Execute request with timeout
    const controller = new AbortController()
    const timeout = setTimeout(() => controller.abort(), config.timeout || 5000)

    const response = await fetch(url, {
      method: config.method || 'GET',
      headers: {
        'Content-Type': 'application/json',
        ...config.headers
      },
      body: config.body ? JSON.stringify(config.body) : undefined,
      signal: controller.signal
    })

    clearTimeout(timeout)

    const responseTime = Date.now() - startTime
    result.responseTime = responseTime
    result.statusCode = response.status

    // Check status code
    const expectedStatus = config.expectedStatus || [200]
    const statusOk = expectedStatus.includes(response.status)

    // Check response time
    const expectedResponseTime = config.expectedResponseTime || 2000
    const responseTimeOk = responseTime <= expectedResponseTime

    // Run custom health check if provided
    let customCheckOk = true
    if (config.healthCheck) {
      customCheckOk = config.healthCheck(response, responseTime)
    }

    // Determine overall health
    result.healthy = statusOk && responseTimeOk && customCheckOk

    if (!statusOk) {
      result.status = 'unhealthy'
      result.message = `Unexpected status code: ${response.status}`
    } else if (!responseTimeOk) {
      result.status = 'degraded'
      result.message = `Slow response: ${responseTime}ms (expected ≤${expectedResponseTime}ms)`
    } else if (!customCheckOk) {
      result.status = 'degraded'
      result.message = 'Custom health check failed'
    } else {
      result.status = 'healthy'
      result.message = 'Probe successful'
    }

  } catch (error) {
    result.responseTime = Date.now() - startTime
    result.status = 'unhealthy'
    result.healthy = false

    if (error instanceof Error) {
      if (error.name === 'AbortError') {
        result.error = `Request timeout after ${config.timeout}ms`
      } else {
        result.error = error.message
      }
    } else {
      result.error = String(error)
    }

    result.message = `Probe failed: ${result.error}`
  }

  // Store result
  recordProbeResult(result)

  // Log result
  logger.info('Synthetic probe executed', {
    probeId: config.id,
    status: result.status,
    responseTime: result.responseTime,
    healthy: result.healthy
  })

  return result
}

/**
 * Execute all probes
 */
export async function executeAllProbes(
  baseUrl?: string,
  probes: ProbeConfig[] = DEFAULT_PROBES
): Promise<ProbeResult[]> {
  const results = await Promise.all(
    probes.map(probe => executeProbe(probe, baseUrl))
  )

  logger.info('All synthetic probes executed', {
    total: results.length,
    healthy: results.filter(r => r.status === 'healthy').length,
    degraded: results.filter(r => r.status === 'degraded').length,
    unhealthy: results.filter(r => r.status === 'unhealthy').length
  })

  return results
}

/**
 * Record a probe result
 */
export function recordProbeResult(result: ProbeResult): void {
  const results = probeResults.get(result.probeId) || []

  // Add new result
  results.push(result)

  // Clean old results
  const cutoff = Date.now() - RESULTS_RETENTION_MS
  const filtered = results.filter(r => r.timestamp > cutoff)

  // Limit size
  if (filtered.length > MAX_RESULTS_PER_PROBE) {
    filtered.splice(0, filtered.length - MAX_RESULTS_PER_PROBE)
  }

  probeResults.set(result.probeId, filtered)
}

/**
 * Get probe statistics
 */
export function getProbeStats(probeId: string): ProbeStats | undefined {
  const results = probeResults.get(probeId)
  if (!results || results.length === 0) {
    return undefined
  }

  const totalChecks = results.length
  const successfulChecks = results.filter(r => r.healthy).length
  const failedChecks = totalChecks - successfulChecks
  const successRate = (successfulChecks / totalChecks) * 100

  const responseTimes = results.map(r => r.responseTime).sort((a, b) => a - b)
  const avgResponseTime = responseTimes.reduce((a, b) => a + b, 0) / responseTimes.length
  const p95Index = Math.floor(responseTimes.length * 0.95)
  const p95ResponseTime = responseTimes[p95Index] || responseTimes[responseTimes.length - 1]

  const recentResults = results.slice(-10) // Last 10 results

  return {
    probeId,
    totalChecks,
    successfulChecks,
    failedChecks,
    successRate,
    avgResponseTime,
    p95ResponseTime,
    lastCheck: results[results.length - 1],
    recentResults
  }
}

/**
 * Get all probe statistics
 */
export function getAllProbeStats(): Map<string, ProbeStats> {
  const stats = new Map<string, ProbeStats>()

  for (const [probeId] of probeResults) {
    const probeStats = getProbeStats(probeId)
    if (probeStats) {
      stats.set(probeId, probeStats)
    }
  }

  return stats
}

/**
 * Get all probe results
 */
export function getAllProbeResults(): Map<string, ProbeResult[]> {
  return new Map(probeResults)
}

/**
 * Clear probe results
 */
export function clearProbeResults(probeId?: string): void {
  if (probeId) {
    probeResults.delete(probeId)
  } else {
    probeResults.clear()
  }
}

/**
 * Start periodic probe execution
 * @param intervalMs - Check interval in milliseconds (default: 5 minutes)
 * @param baseUrl - Base URL for API endpoints
 * @param probes - Probe configurations
 * @returns A function to stop the periodic probing
 */
export function startPeriodicProbing(
  intervalMs: number = 5 * 60 * 1000, // 5 minutes default
  baseUrl?: string,
  probes?: ProbeConfig[]
): () => void {
  logger.info('Starting periodic synthetic probing', { intervalMs })

  // Execute immediately
  executeAllProbes(baseUrl, probes).catch(error => {
    logger.error('Initial probe execution failed', { error })
  })

  // Then execute periodically
  const interval = setInterval(async () => {
    try {
      await executeAllProbes(baseUrl, probes)
    } catch (error) {
      logger.error('Periodic probe execution failed', { error })
    }
  }, intervalMs)

  // Return stop function
  return () => {
    logger.info('Stopping periodic synthetic probing')
    clearInterval(interval)
  }
}
