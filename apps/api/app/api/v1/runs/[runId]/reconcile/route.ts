/**
 * POST /api/v1/runs/:runId/reconcile
 * Reconcile a completed run (verify applied prices match external systems)
 */

import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@calibr/db'
import { ReconciliationService } from '@calibr/automation-runner'

export async function POST(
  req: NextRequest,
  { params }: { params: { runId: string } }
) {
  try {
    const db = prisma()
    const runId = params.runId

    // Verify run exists
    const run = await db.ruleRun.findUnique({
      where: { id: runId },
    })

    if (!run) {
      return NextResponse.json(
        { error: 'Run not found' },
        { status: 404 }
      )
    }

    // Verify run is completed
    if (run.status !== 'APPLIED' && run.status !== 'PARTIAL') {
      return NextResponse.json(
        { error: `Cannot reconcile run with status: ${run.status}` },
        { status: 400 }
      )
    }

    // Perform reconciliation
    const reconciliationService = new ReconciliationService()
    // TODO: Register connectors based on project configuration
    // For now, this would need connector registration

    const report = await reconciliationService.reconcileRun(runId)

    return NextResponse.json({
      runId,
      totalChecked: report.totalChecked,
      mismatches: report.mismatches,
      details: report.details,
      timestamp: report.timestamp,
    })
  } catch (error) {
    console.error('Error reconciling run:', error)
    return NextResponse.json(
      {
        error: 'Failed to reconcile run',
        details: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    )
  }
}

export async function OPTIONS(req: NextRequest) {
  return NextResponse.json(
    {},
    {
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'POST, OPTIONS',
        'Access-Control-Allow-Headers': 'Content-Type, Authorization',
      },
    }
  )
}
