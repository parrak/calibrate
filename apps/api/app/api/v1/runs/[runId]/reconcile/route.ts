/**
 * POST /api/v1/runs/:runId/reconcile
 * M1.6: Reconcile a rule run (verify external prices match intended prices)
 */

import { NextRequest, NextResponse } from 'next/server'
import { getReconciliationService } from '@calibr/automation-runner'
import { prisma } from '@calibr/db'
import { logger } from '@calibr/monitor'

export async function POST(
  request: NextRequest,
  { params }: { params: { runId: string } }
) {
  try {
    const { runId } = params

    logger.info(`[API] Reconciling rule run: ${runId}`)

    // Check if run exists and is in valid state
    const run = await prisma().ruleRun.findUnique({
      where: { id: runId }
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

    // Check if run is completed
    if (run.status !== 'APPLIED' && run.status !== 'PARTIAL') {
      return NextResponse.json(
        {
          success: false,
          error: `Cannot reconcile run in status: ${run.status}. Run must be APPLIED or PARTIAL.`
        },
        { status: 400 }
      )
    }

    // Get reconciliation service
    const reconciliation = getReconciliationService()

    // Perform reconciliation
    const report = await reconciliation.reconcileRun(runId)

    logger.info(`[API] Reconciliation completed for run: ${runId}`, {
      totalChecked: report.totalChecked,
      mismatches: report.mismatches
    })

    return NextResponse.json({
      success: true,
      data: {
        runId,
        totalChecked: report.totalChecked,
        mismatchCount: report.mismatches,
        mismatchRate: report.totalChecked > 0
          ? (report.mismatches / report.totalChecked) * 100
          : 0,
        mismatches: report.details,
        timestamp: report.timestamp
      }
    })
  } catch (error) {
    logger.error('[API] Error reconciling rule run', {
      error: error instanceof Error ? error.message : 'Unknown error',
      runId: params.runId
    })

    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to reconcile rule run'
      },
      { status: 500 }
    )
  }
}

/**
 * GET /api/v1/runs/:runId/reconcile
 * Get reconciliation history for a run
 */
export async function GET(
  request: NextRequest,
  { params }: { params: { runId: string } }
) {
  try {
    const { runId } = params

    const reconciliation = getReconciliationService()
    const history = await reconciliation.getReconciliationHistory(runId)

    return NextResponse.json({
      success: true,
      data: {
        runId,
        history
      }
    })
  } catch (error) {
    logger.error('[API] Error getting reconciliation history', {
      error: error instanceof Error ? error.message : 'Unknown error',
      runId: params.runId
    })

    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to get reconciliation history'
      },
      { status: 500 }
    )
  }
}
