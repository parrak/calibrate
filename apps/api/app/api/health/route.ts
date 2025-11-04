import { NextResponse } from 'next/server'
export const dynamic = 'force-dynamic'
export const runtime = 'nodejs'
import { prisma } from '@calibr/db'

export async function GET() {
  const startTime = Date.now()
  const timestamp = new Date().toISOString()

  try {
    // Test database connection
    const dbStart = Date.now()
    await prisma().$queryRaw`SELECT 1`
    const dbLatency = Date.now() - dbStart

    // Get basic system metrics
    const memoryUsage = process.memoryUsage()
    const uptime = process.uptime()

    // Check database health
    const dbHealth = await checkDatabaseHealth()

    const responseTime = Date.now() - startTime

    return NextResponse.json({
      status: 'ok',
      timestamp,
      service: 'calibr-api',
      version: process.env.npm_package_version || '1.0.0',
      environment: process.env.NODE_ENV || 'development',
      uptime: Math.floor(uptime),
      responseTime: `${responseTime}ms`,
      database: {
        status: dbHealth.status,
        latency: `${dbLatency}ms`,
        connections: dbHealth.connections,
        migrations: dbHealth.migrations
      },
      memory: {
        used: `${Math.round(memoryUsage.heapUsed / 1024 / 1024)}MB`,
        total: `${Math.round(memoryUsage.heapTotal / 1024 / 1024)}MB`,
        external: `${Math.round(memoryUsage.external / 1024 / 1024)}MB`
      },
      system: {
        platform: process.platform,
        nodeVersion: process.version,
        pid: process.pid
      }
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
    // Test basic connectivity
    await prisma().$queryRaw`SELECT 1`

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
      LIMIT 5
    `

    return {
      status: 'healthy',
      connections: Number(connections[0]?.active_connections) || 0,
      migrations: migrations.length
    }
  } catch (error) {
    return {
      status: 'unhealthy',
      error: error instanceof Error ? error.message : 'Database connection failed',
      connections: 0,
      migrations: 0
    }
  }
}
