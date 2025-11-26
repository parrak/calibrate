/**
 * POST /api/v1/runs/:runId/reconcile
 * Reconcile a completed run (verify applied prices match external systems)
 * TODO: Implement full reconciliation service integration
 */

import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@calibr/db'

export async function POST(
  _req: NextRequest,
  { params }: { params: Promise<{ runId: string }> }
) {
  try {
    const { runId } = await params

    // Verify run exists
    const run = await prisma().ruleRun.findUnique({
      where: { id: runId },
      include: {
        RuleTarget: true,
      },
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

    // Get applied targets
    const appliedTargets = run.RuleTarget.filter((t: any) => t.status === 'APPLIED')

    // TODO: Implement full reconciliation with connector integration
    // For now, just return a simple summary
    return NextResponse.json({
      runId,
      totalChecked: appliedTargets.length,
      mismatches: 0,
      details: [],
      timestamp: new Date(),
      note: 'Full reconciliation service integration pending',
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
