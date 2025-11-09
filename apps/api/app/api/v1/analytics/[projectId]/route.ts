/**
 * Analytics Overview Endpoint
 *
 * GET /api/v1/analytics/:projectId/overview
 * Returns analytics dashboard data for a project
 */

import { NextRequest, NextResponse } from 'next/server'
import { withSecurity } from '@/lib/security-headers'
import { prisma } from '@calibr/db'
import { getAnalyticsOverview } from '../../../../../../../packages/analytics/index'

export const runtime = 'nodejs'

/**
 * GET /api/v1/analytics/:projectId
 * 
 * Accepts either projectId or project slug
 *
 * Query params:
 * - days: number of days to analyze (default: 30)
 */
export const GET = withSecurity(async function GET(
  req: NextRequest,
  context?: { params?: Promise<{ projectId: string }> }
) {
  try {
    if (!context?.params) {
      return NextResponse.json({ error: 'Missing projectId or project slug parameter' }, { status: 400 })
    }
    const { projectId: projectIdOrSlug } = await context.params
    const { searchParams } = new URL(req.url)
    const days = parseInt(searchParams.get('days') || '30', 10)

    // Validate days parameter
    if (days < 1 || days > 365) {
      return NextResponse.json(
        { error: 'Days must be between 1 and 365' },
        { status: 400 }
      )
    }

    // Resolve projectId - check if it's a slug first
    let resolvedProjectId = projectIdOrSlug
    const project = await prisma().project.findFirst({
      where: {
        OR: [
          { id: projectIdOrSlug },
          { slug: projectIdOrSlug }
        ]
      }
    })

    if (!project) {
      return NextResponse.json(
        { error: 'Project not found' },
        { status: 404 }
      )
    }

    resolvedProjectId = project.id

    // Get analytics overview
    const overview = await getAnalyticsOverview(resolvedProjectId, days)

    return NextResponse.json(overview, { status: 200 })
  } catch (error) {
    console.error('[Analytics API] Error:', error)
    return NextResponse.json(
      { 
        error: 'Failed to fetch analytics',
        message: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    )
  }
})

/**
 * OPTIONS handler for CORS preflight
 */
export const OPTIONS = withSecurity(async () => {
  return new NextResponse(null, { status: 204 })
})
