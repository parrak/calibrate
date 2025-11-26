/**
 * POST /api/v1/runs/:runId/retry-failed
 * Retry failed targets in a run
 */

import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@calibr/db'
import { DLQService } from '@calibr/automation-runner'

export async function POST(
  req: NextRequest,
  { params }: { params: { runId: string } }
) {
  try {
    const runId = params.runId
    const body = await req.json().catch(() => ({}))
    const targetIds: string[] | undefined = body.targetIds

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

    // Verify run has failed targets
    if (run.status !== 'FAILED' && run.status !== 'PARTIAL') {
      return NextResponse.json(
        { error: `Cannot retry run with status: ${run.status}` },
        { status: 400 }
      )
    }

    // Retry failed targets
    const dlqService = new DLQService()
    const retried = await dlqService.retryFailed(runId, targetIds)

    return NextResponse.json({
      runId,
      retriedCount: retried.length,
      targets: retried.map(t => ({
        id: t.id,
        skuId: t.skuId,
        status: t.status,
        previousError: t.errorMessage,
      })),
    })
  } catch (error) {
    console.error('Error retrying failed targets:', error)
    return NextResponse.json(
      {
        error: 'Failed to retry targets',
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
