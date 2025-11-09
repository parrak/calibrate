/**
 * Synthetic Probes API
 * Endpoint for managing and viewing synthetic probe results
 */

import { NextRequest, NextResponse } from 'next/server'
import {
  executeAllProbes,
  executeProbe,
  getAllProbeStats,
  getProbeStats,
  DEFAULT_PROBES,
  type ProbeConfig
} from '@calibr/monitor'

/**
 * GET /api/admin/probes
 * Get all probe statistics and recent results
 */
export async function GET(req: NextRequest) {
  try {
    const url = new URL(req.url)
    const probeId = url.searchParams.get('probeId')

    if (probeId) {
      // Get specific probe stats
      const stats = getProbeStats(probeId)
      if (!stats) {
        return NextResponse.json({
          error: 'Probe not found',
          message: `No results found for probe: ${probeId}`
        }, { status: 404 })
      }

      return NextResponse.json({
        success: true,
        probe: stats
      })
    }

    // Get all probe stats
    const allStats = getAllProbeStats()
    const statsArray = Array.from(allStats.values())

    return NextResponse.json({
      success: true,
      timestamp: new Date().toISOString(),
      probes: statsArray.map(stats => ({
        probeId: stats.probeId,
        totalChecks: stats.totalChecks,
        successRate: stats.successRate,
        avgResponseTime: stats.avgResponseTime,
        p95ResponseTime: stats.p95ResponseTime,
        lastCheck: stats.lastCheck
          ? {
              status: stats.lastCheck.status,
              responseTime: stats.lastCheck.responseTime,
              healthy: stats.lastCheck.healthy,
              timestamp: new Date(stats.lastCheck.timestamp).toISOString()
            }
          : null
      })),
      total: statsArray.length,
      healthy: statsArray.filter(s => s.lastCheck?.status === 'healthy').length,
      degraded: statsArray.filter(s => s.lastCheck?.status === 'degraded').length,
      unhealthy: statsArray.filter(s => s.lastCheck?.status === 'unhealthy').length
    })
  } catch (error) {
    console.error('Failed to get probe stats:', error)
    return NextResponse.json({
      success: false,
      error: 'Failed to get probe stats',
      message: error instanceof Error ? error.message : String(error)
    }, { status: 500 })
  }
}

/**
 * POST /api/admin/probes
 * Execute synthetic probes
 */
export async function POST(req: NextRequest) {
  try {
    const body = await req.json().catch(() => ({}))
    const { probeId, baseUrl } = body

    // Get base URL from environment if not provided
    const probeBaseUrl = baseUrl || process.env.NEXT_PUBLIC_API_URL || process.env.VERCEL_URL
      ? `https://${process.env.VERCEL_URL}`
      : 'http://localhost:3000'

    if (probeId) {
      // Execute specific probe
      const probe = DEFAULT_PROBES.find(p => p.id === probeId)
      if (!probe) {
        return NextResponse.json({
          error: 'Probe not found',
          message: `No probe configuration found for: ${probeId}`
        }, { status: 404 })
      }

      const result = await executeProbe(probe, probeBaseUrl)

      return NextResponse.json({
        success: true,
        result: {
          probeId: result.probeId,
          status: result.status,
          responseTime: result.responseTime,
          statusCode: result.statusCode,
          healthy: result.healthy,
          message: result.message,
          error: result.error,
          timestamp: new Date(result.timestamp).toISOString()
        }
      })
    }

    // Execute all probes
    const results = await executeAllProbes(probeBaseUrl)

    return NextResponse.json({
      success: true,
      timestamp: new Date().toISOString(),
      results: results.map(r => ({
        probeId: r.probeId,
        status: r.status,
        responseTime: r.responseTime,
        statusCode: r.statusCode,
        healthy: r.healthy,
        message: r.message,
        error: r.error,
        timestamp: new Date(r.timestamp).toISOString()
      })),
      summary: {
        total: results.length,
        healthy: results.filter(r => r.status === 'healthy').length,
        degraded: results.filter(r => r.status === 'degraded').length,
        unhealthy: results.filter(r => r.status === 'unhealthy').length
      }
    })
  } catch (error) {
    console.error('Failed to execute probes:', error)
    return NextResponse.json({
      success: false,
      error: 'Failed to execute probes',
      message: error instanceof Error ? error.message : String(error)
    }, { status: 500 })
  }
}
