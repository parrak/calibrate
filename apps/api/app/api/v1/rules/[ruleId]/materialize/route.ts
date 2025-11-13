/**
 * POST /api/v1/rules/:ruleId/materialize
 * M1.6: Materialize a pricing rule run (create targets without applying)
 */

import { NextRequest, NextResponse } from 'next/server'
import { getRulesWorker } from '@calibr/automation-runner'
import { logger } from '@calibr/monitor'

export async function POST(
  request: NextRequest,
  { params }: { params: { ruleId: string } }
) {
  try {
    const { ruleId } = params

    // Get actor from request (would be from auth in production)
    const actor = request.headers.get('x-actor') || 'api'

    logger.info(`[API] Materializing rule run for rule: ${ruleId}`, { actor })

    // Get worker instance
    const worker = getRulesWorker()

    // Materialize the run
    const run = await worker.materialize(ruleId, actor)

    // Get target count
    const targetCount = await worker.getRunStatus(run.id)

    // Estimate duration (roughly 1 second per target with concurrency)
    const estimatedDuration = targetCount
      ? Math.ceil((targetCount.totalTargets * 1000) / 5)
      : 0

    logger.info(`[API] Materialized rule run: ${run.id}`, {
      ruleId,
      runId: run.id,
      targetCount: targetCount?.totalTargets
    })

    return NextResponse.json({
      success: true,
      data: {
        runId: run.id,
        ruleId,
        status: run.status,
        targetCount: targetCount?.totalTargets || 0,
        estimatedDuration,
        createdAt: run.createdAt
      }
    })
  } catch (error) {
    logger.error('[API] Error materializing rule run', {
      error: error instanceof Error ? error.message : 'Unknown error',
      ruleId: params.ruleId
    })

    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to materialize rule run'
      },
      { status: 500 }
    )
  }
}
