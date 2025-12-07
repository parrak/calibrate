import { NextResponse } from 'next/server'
import { prisma } from '@calibr/db'

export const dynamic = 'force-dynamic'

async function checkDatabase() {
    const start = Date.now()
    try {
        await prisma.$queryRaw`SELECT 1`
        return { status: 'up', latency: Date.now() - start }
    } catch (error) {
        return { status: 'down', error: error instanceof Error ? error.message : 'Unknown error' }
    }
}

// Placeholder for other service checks
async function checkRedis() {
    // TODO: Implement Redis check
    return { status: 'unknown' }
}

async function checkEventBus() {
    // TODO: Implement Event Bus check
    return { status: 'unknown' }
}

export async function GET() {
    const [db] = await Promise.all([
        checkDatabase()
    ])

    const status = db.status === 'up' ? 'healthy' : 'degraded'

    return NextResponse.json({
        status,
        timestamp: new Date().toISOString(),
        checks: {
            database: db,
            redis: await checkRedis(),
            eventBus: await checkEventBus()
        }
    }, { status: status === 'healthy' ? 200 : 503 })
}
