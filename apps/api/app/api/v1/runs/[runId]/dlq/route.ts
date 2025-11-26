/**
 * GET /api/v1/runs/:runId/dlq
 * Get failed targets (DLQ entries) for a specific run
 */

import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@calibr/db'

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ runId: string }> }
) {
  try {
    const { runId } = await params

    // Verify run exists
    const run = await prisma().ruleRun.findUnique({
      where: { id: runId },
    })

    if (!run) {
      return NextResponse.json(
        { error: 'Run not found' },
        { status: 404 }
      )
    }

    // Get failed targets for this run
    const failedTargets = await prisma().ruleTarget.findMany({
      where: {
        ruleRunId: runId,
        status: 'FAILED',
      },
    })

    return NextResponse.json({
      runId,
      totalFailed: failedTargets.length,
      entries: failedTargets.map((entry: any) => ({
        targetId: entry.id,
        skuId: entry.skuId,
        productId: entry.productId,
        variantId: entry.variantId,
        errorMessage: entry.errorMessage,
        failedAt: entry.updatedAt,
        attempts: entry.attempts,
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
