/**
 * Staging Health Check Endpoint
 * Provides comprehensive health status for staging environment
 */

import { NextRequest, NextResponse } from 'next/server'
import { loadavg } from 'os'
import { stagingDatabase } from '@/lib/staging-database'
import { stagingConfig } from '@/config/staging'

export async function GET(_req: NextRequest) {
  const startTime = Date.now()

  try {
    // Get staging database health
    const dbHealth = await stagingDatabase.getHealthStatus()

    // Get system metrics
    const systemMetrics = await getSystemMetrics()

    // Get staging-specific configuration
    const config = {
      environment: stagingConfig.NODE_ENV,
      features: stagingConfig.features,
      monitoring: stagingConfig.monitoring,
      security: stagingConfig.security
    }

    const responseTime = Date.now() - startTime

    // Determine overall health
    const isHealthy = dbHealth.connected && dbHealth.migrations && dbHealth.testData

    return NextResponse.json({
      status: isHealthy ? 'healthy' : 'unhealthy',
      timestamp: new Date().toISOString(),
      environment: 'staging',
      responseTime: `${responseTime}ms`,
      database: {
        connected: dbHealth.connected,
        migrations: dbHealth.migrations,
        testData: dbHealth.testData,
        lastReset: dbHealth.lastReset
      },
      system: systemMetrics,
      config: config,
      checks: {
        database: dbHealth.connected,
        migrations: dbHealth.migrations,
        testData: dbHealth.testData,
        system: systemMetrics.memory.used < 1000, // Less than 1GB
        performance: responseTime < 1000 // Less than 1 second
      }
    }, {
      status: isHealthy ? 200 : 503,
      headers: {
        'Cache-Control': 'no-cache, no-store, must-revalidate',
        'X-Environment': 'staging',
        'X-Health-Check': 'true'
      }
    })
  } catch (error) {
    console.error('Staging health check failed:', error)

    return NextResponse.json({
      status: 'unhealthy',
      timestamp: new Date().toISOString(),
      environment: 'staging',
      error: 'Health check failed',
      message: error instanceof Error ? error.message : 'Unknown error'
    }, {
      status: 503,
      headers: {
        'Cache-Control': 'no-cache, no-store, must-revalidate',
        'X-Environment': 'staging',
        'X-Health-Check': 'true'
      }
    })
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
      loadAverage: process.platform === 'win32' ? [0, 0, 0] : loadavg()
    },
    node: {
      version: process.version,
      platform: process.platform,
      arch: process.arch
    }
  }
}
