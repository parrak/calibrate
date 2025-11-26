/**
 * GET /api/v1/runs/:runId/dlq
 * Get failed targets (DLQ entries) for a specific run
 */

import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@calibr/db'
import { DLQService } from '@calibr/automation-runner'

export async function GET(
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

    // Get DLQ entries for this run
    const dlqService = new DLQService()
    const entries = await dlqService.getFailedTargetsForRun(runId)

    return NextResponse.json({
      runId,
      totalFailed: entries.length,
      entries: entries.map(entry => ({
        targetId: entry.target.id,
        skuId: entry.target.skuId,
        productId: entry.target.productId,
        variantId: entry.target.variantId,
        errorType: entry.errorType,
        errorMessage: entry.target.errorMessage,
        failedAt: entry.failedAt,
        retryable: entry.retryable,
        attempts: entry.target.attempts,
      })),
    })
  } catch (error) {
    console.error('Error fetching DLQ entries:', error)
    return NextResponse.json(
      {
        error: 'Failed to fetch DLQ entries',
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
        'Access-Control-Allow-Methods': 'GET, OPTIONS',
        'Access-Control-Allow-Headers': 'Content-Type, Authorization',
      },
    }
  )
}
