/**
 * Analytics Aggregation Endpoint
 *
 * POST /api/v1/analytics/aggregate
 * Triggers daily snapshot aggregation (for cron jobs)
 */

import { NextRequest, NextResponse } from 'next/server'
import { withSecurity } from '@/lib/security-headers'
import { aggregateDailySnapshots } from '../../../../../../../packages/analytics/index'

export const runtime = 'nodejs'

/**
 * POST /api/v1/analytics/aggregate
 *
 * Body:
 * - projectIds?: string[] (optional - aggregate specific projects)
 * - includeSales?: boolean
 * - includeCompetitorData?: boolean
 */
export const POST = withSecurity(async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    const { projectIds, includeSales, includeCompetitorData } = body

    console.log('[Analytics] Starting aggregation...', {
      projectIds: projectIds?.length || 'all',
      includeSales,
      includeCompetitorData,
    })

    const result = await aggregateDailySnapshots({
      projectIds,
      includeSales,
      includeCompetitorData,
    })

    console.log('[Analytics] Aggregation complete:', result)

    return NextResponse.json(result, { status: 200 })
  } catch (error) {
    console.error('[Analytics API] Aggregation error:', error)
    return NextResponse.json(
      {
        error: 'Failed to aggregate snapshots',
        message: error instanceof Error ? error.message : 'Unknown error',
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
