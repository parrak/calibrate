/**
 * Staging Management API
 * Provides endpoints for managing staging environment
 */

import { NextRequest, NextResponse } from 'next/server'
import { stagingDatabase } from '@/lib/staging-database'
import { withAdminAuth } from '@/lib/auth-security'
import { withSecurity } from '@/lib/security-headers'

export const GET = withSecurity(withAdminAuth(async (req: NextRequest) => {
  try {
    const url = new URL(req.url)
    const action = url.searchParams.get('action')

    switch (action) {
      case 'status':
        return await getStagingStatus()
      case 'health':
        return await getStagingHealth()
      case 'config':
        return await getStagingConfig()
      default:
        return NextResponse.json({
          error: 'Invalid action',
          availableActions: ['status', 'health', 'config']
        }, { status: 400 })
    }
  } catch (error) {
    console.error('Staging management GET failed:', error)
    return NextResponse.json({
      error: 'Staging management failed',
      message: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 })
  }
}))

export const POST = withSecurity(withAdminAuth(async (req: NextRequest) => {
  try {
    const url = new URL(req.url)
    const action = url.searchParams.get('action')

    switch (action) {
      case 'reset':
        return await resetStagingEnvironment()
      case 'seed':
        return await seedStagingData()
      case 'cleanup':
        return await cleanupStagingData()
      default:
        return NextResponse.json({
          error: 'Invalid action',
          availableActions: ['reset', 'seed', 'cleanup']
        }, { status: 400 })
    }
  } catch (error) {
    console.error('Staging management POST failed:', error)
    return NextResponse.json({
      error: 'Staging management failed',
      message: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 })
  }
}))

async function getStagingStatus() {
  const dbHealth = await stagingDatabase.getHealthStatus()

  return NextResponse.json({
    environment: 'staging',
    timestamp: new Date().toISOString(),
    status: {
      database: dbHealth.connected ? 'connected' : 'disconnected',
      migrations: dbHealth.migrations ? 'up-to-date' : 'outdated',
      testData: dbHealth.testData ? 'present' : 'missing',
      overall: dbHealth.connected && dbHealth.migrations && dbHealth.testData ? 'healthy' : 'unhealthy'
    },
    database: dbHealth
  })
}

async function getStagingHealth() {
  const dbHealth = await stagingDatabase.getHealthStatus()

  return NextResponse.json({
    environment: 'staging',
    timestamp: new Date().toISOString(),
    health: {
      database: dbHealth.connected,
      migrations: dbHealth.migrations,
      testData: dbHealth.testData,
      lastReset: dbHealth.lastReset
    },
    checks: {
      database: dbHealth.connected,
      migrations: dbHealth.migrations,
      testData: dbHealth.testData
    }
  })
}

async function getStagingConfig() {
  const { stagingConfig } = await import('@/config/staging')

  return NextResponse.json({
    environment: 'staging',
    timestamp: new Date().toISOString(),
    config: {
      database: {
        schema: stagingConfig.database.schema,
        ssl: stagingConfig.database.ssl,
        connectionLimit: stagingConfig.database.connectionLimit
      },
      api: {
        baseUrl: stagingConfig.api.baseUrl,
        corsOrigins: stagingConfig.api.corsOrigins
      },
      security: {
        enableHttps: stagingConfig.security.enableHttps,
        enableCors: stagingConfig.security.enableCors,
        enableRateLimiting: stagingConfig.security.enableRateLimiting
      },
      monitoring: {
        enabled: stagingConfig.monitoring.enabled,
        performanceMonitoring: stagingConfig.monitoring.performanceMonitoring,
        securityMonitoring: stagingConfig.monitoring.securityMonitoring
      },
      features: stagingConfig.features
    }
  })
}

async function resetStagingEnvironment() {
  try {
    await stagingDatabase.reset()

    return NextResponse.json({
      success: true,
      message: 'Staging environment reset successfully',
      timestamp: new Date().toISOString()
    })
  } catch (error) {
    throw new Error(`Failed to reset staging environment: ${error instanceof Error ? error.message : 'Unknown error'}`)
  }
}

async function seedStagingData() {
  try {
    await stagingDatabase.initialize()

    return NextResponse.json({
      success: true,
      message: 'Staging data seeded successfully',
      timestamp: new Date().toISOString()
    })
  } catch (error) {
    throw new Error(`Failed to seed staging data: ${error instanceof Error ? error.message : 'Unknown error'}`)
  }
}

async function cleanupStagingData() {
  try {
    await stagingDatabase.cleanupTestData()

    return NextResponse.json({
      success: true,
      message: 'Staging data cleaned up successfully',
      timestamp: new Date().toISOString()
    })
  } catch (error) {
    throw new Error(`Failed to cleanup staging data: ${error instanceof Error ? error.message : 'Unknown error'}`)
  }
}

// Handle OPTIONS preflight requests
export const OPTIONS = withSecurity(async (_req: NextRequest) => {
  return new NextResponse(null, { status: 204 })
})
