import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@calibr/db'
import { CompetitorMonitor } from '@calibrate/competitor-monitoring'
import { withSecurity } from '@/lib/security-headers'

const db = () => prisma()

export const POST = withSecurity(async (request: NextRequest) => {
  try {
    const body = await request.json()
    const { projectSlug, competitorId } = body

    if (!projectSlug && !competitorId) {
      return NextResponse.json({ error: 'Missing projectSlug or competitorId' }, { status: 400 })
    }

    const monitor = new CompetitorMonitor(db())

    let results
    if (competitorId) {
      // Monitor specific competitor
      const competitor = await db().competitor.findUnique({
        where: { id: competitorId },
        include: {
          CompetitorProduct: {
            where: { isActive: true },
            include: { CompetitorPrice: { orderBy: { createdAt: 'desc' }, take: 1 } }
          }
        }
      })

      if (!competitor) {
        return NextResponse.json({ error: 'Competitor not found' }, { status: 404 })
      }

      const result = await monitor.monitorCompetitor(competitor)
      results = [{ ...result, duration: 0 }]
    } else {
      // Monitor all competitors in project - resolve projectSlug first
      const project = await db().project.findUnique({
        where: { slug: projectSlug }
      })

      if (!project) {
        return NextResponse.json({ error: 'Project not found' }, { status: 404 })
      }

      results = await monitor.monitorProject(project.tenantId, project.id)
    }

    return NextResponse.json({ results })
  } catch (error) {
    console.error('Error monitoring competitors:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
})
