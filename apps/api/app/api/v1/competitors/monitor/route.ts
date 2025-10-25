import { NextRequest, NextResponse } from 'next/server'
import { PrismaClient } from '@prisma/client'
import { CompetitorMonitor } from '@calibrate/competitor-monitoring'

const db = new PrismaClient()

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { tenantId, projectId, competitorId } = body

    if (!tenantId || !projectId) {
      return NextResponse.json({ error: 'Missing tenantId or projectId' }, { status: 400 })
    }

    const monitor = new CompetitorMonitor(db)
    
    let results
    if (competitorId) {
      // Monitor specific competitor
      const competitor = await db.competitor.findUnique({
        where: { id: competitorId },
        include: {
          products: {
            where: { isActive: true },
            include: { prices: { orderBy: { createdAt: 'desc' }, take: 1 } }
          }
        }
      })

      if (!competitor) {
        return NextResponse.json({ error: 'Competitor not found' }, { status: 404 })
      }

      const result = await monitor.monitorCompetitor(competitor)
      results = [{ ...result, duration: 0 }]
    } else {
      // Monitor all competitors in project
      results = await monitor.monitorProject(tenantId, projectId)
    }

    return NextResponse.json({ results })
  } catch (error) {
    console.error('Error monitoring competitors:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
