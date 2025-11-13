/**
 * POST /api/v1/runs/:runId/apply
 * M1.6: Queue a rule run for application
 */

import { NextRequest, NextResponse } from 'next/server'
import { getRulesWorker } from '@calibr/automation-runner'
import { prisma } from '@calibr/db'
import { logger } from '@calibr/monitor'

export async function POST(
  request: NextRequest,
  { params }: { params: { runId: string } }
) {
  try {
    const { runId } = params

    logger.info(`[API] Queuing rule run for application: ${runId}`)

    // Check if run exists and is in valid state
    const run = await prisma().ruleRun.findUnique({
      where: { id: runId },
      include: {
        RuleTarget: true
      }
    })

    if (!run) {
      return NextResponse.json(
        {
          success: false,
          error: 'Rule run not found'
        },
        { status: 404 }
      )
    }

    // Check if run is in valid state (PREVIEW or FAILED/PARTIAL for retry)
    const validStates = ['PREVIEW', 'FAILED', 'PARTIAL']
    if (!validStates.includes(run.status)) {
      return NextResponse.json(
        {
          success: false,
          error: `Cannot apply run in status: ${run.status}. Valid states: ${validStates.join(', ')}`
        },
        { status: 400 }
      )
    }

    // Get worker instance
    const worker = getRulesWorker()

    // Queue the run
    await worker.queueRun(runId)

    // Get queue position (simplified - would need proper queue implementation)
    const queuePosition = await getQueuePosition(runId)

    logger.info(`[API] Queued rule run: ${runId}`, {
      queuePosition,
      targetCount: run.RuleTarget.length
    })

    return NextResponse.json({
      success: true,
      data: {
        runId,
        status: 'queued',
        queuePosition,
        targetCount: run.RuleTarget.length,
        queuedAt: new Date().toISOString()
      }
    })
  } catch (error) {
    logger.error('[API] Error queuing rule run', {
      error: error instanceof Error ? error.message : 'Unknown error',
      runId: params.runId
    })

    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to queue rule run'
      },
      { status: 500 }
    )
  }
}

/**
 * Get queue position for a run (simplified implementation)
 */
async function getQueuePosition(runId: string): Promise<number> {
  // Count queued runs before this one
  const run = await prisma().ruleRun.findUnique({
    where: { id: runId },
    select: { queuedAt: true }
  })

  if (!run?.queuedAt) {
    return 1
  }

  const position = await prisma().ruleRun.count({
    where: {
      status: 'QUEUED',
      queuedAt: {
        lt: run.queuedAt
      }
    }
  })

  return position + 1
}

/**
 * GET /api/v1/runs/:runId/apply
 * Get run application status
 */
export async function GET(
  request: NextRequest,
  { params }: { params: { runId: string } }
) {
  try {
    const { runId } = params

    const worker = getRulesWorker()
    const status = await worker.getRunStatus(runId)

    if (!status) {
      return NextResponse.json(
        {
          success: false,
          error: 'Rule run not found'
        },
        { status: 404 }
      )
    }

    return NextResponse.json({
      success: true,
      data: status
    })
  } catch (error) {
    logger.error('[API] Error getting run status', {
      error: error instanceof Error ? error.message : 'Unknown error',
      runId: params.runId
    })

    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to get run status'
      },
      { status: 500 }
    )
  }
}
