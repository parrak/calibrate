/**
 * POST /api/v1/runs/:runId/apply
 * Queue a rule run for processing
 */

import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@calibr/db'
import { RulesWorker } from '@calibr/automation-runner'

export async function POST(
  req: NextRequest,
  { params }: { params: { runId: string } }
) {
  try {
    const runId = params.runId

    // Verify run exists
    const run = await prisma.ruleRun.findUnique({
      where: { id: runId },
    })

    if (!run) {
      return NextResponse.json(
        { error: 'Run not found' },
        { status: 404 }
      )
    }

    // Verify run is in a valid state for queuing
    if (run.status !== 'PREVIEW') {
      return NextResponse.json(
        { error: `Cannot queue run with status: ${run.status}` },
        { status: 400 }
      )
    }

    // Queue the run
    const worker = new RulesWorker()
    await worker.queueRun(runId)

    return NextResponse.json({
      runId,
      status: 'queued',
      queuedAt: new Date(),
    })
  } catch (error) {
    console.error('Error queueing run:', error)
    return NextResponse.json(
      {
        error: 'Failed to queue run',
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
