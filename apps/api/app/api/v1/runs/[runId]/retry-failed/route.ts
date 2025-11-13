/**
 * POST /api/v1/runs/:runId/retry-failed
 * M1.6: Retry failed targets in a rule run
 */

import { NextRequest, NextResponse } from 'next/server'
import { getDLQService, getRulesWorker } from '@calibr/automation-runner'
import { prisma } from '@calibr/db'
import { logger } from '@calibr/monitor'

export async function POST(
  request: NextRequest,
  { params }: { params: { runId: string } }
) {
  try {
    const { runId } = params

    // Parse request body for optional target IDs
    let targetIds: string[] | undefined
    try {
      const body = await request.json()
      targetIds = body.targetIds
    } catch {
      // No body or invalid JSON - retry all failed targets
    }

    logger.info(`[API] Retrying failed targets for run: ${runId}`, {
      targetCount: targetIds?.length || 'all'
    })

    // Check if run exists
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

    // Get DLQ service
    const dlq = getDLQService()

    // Retry failed targets
    const retriedTargets = await dlq.retryFailed(runId, targetIds)

    if (retriedTargets.length === 0) {
      return NextResponse.json(
        {
          success: false,
          error: 'No retryable failed targets found'
        },
        { status: 400 }
      )
    }

    // If any targets were retried, queue the run for reprocessing
    const worker = getRulesWorker()
    await worker.queueRun(runId)

    logger.info(`[API] Retried ${retriedTargets.length} failed targets for run: ${runId}`)

    return NextResponse.json({
      success: true,
      data: {
        runId,
        retriedCount: retriedTargets.length,
        targets: retriedTargets.map(t => ({
          id: t.id,
          productId: t.productId,
          skuId: t.skuId,
          previousError: t.errorMessage,
          status: t.status,
          attempts: t.attempts
        }))
      }
    })
  } catch (error) {
    logger.error('[API] Error retrying failed targets', {
      error: error instanceof Error ? error.message : 'Unknown error',
      runId: params.runId
    })

    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to retry failed targets'
      },
      { status: 500 }
    )
  }
}

/**
 * GET /api/v1/runs/:runId/retry-failed
 * Get failed targets for a run
 */
export async function GET(
  request: NextRequest,
  { params }: { params: { runId: string } }
) {
  try {
    const { runId } = params

    const dlq = getDLQService()
    const failedTargets = await dlq.getFailedTargets(runId)

    // Classify targets by retryability
    const retryable = failedTargets.filter(t => {
      const errorType = classifyError(t.errorMessage || '')
      return !['NOT_FOUND', 'VALIDATION', 'AUTHORIZATION'].includes(errorType)
    })

    const nonRetryable = failedTargets.filter(t => {
      const errorType = classifyError(t.errorMessage || '')
      return ['NOT_FOUND', 'VALIDATION', 'AUTHORIZATION'].includes(errorType)
    })

    return NextResponse.json({
      success: true,
      data: {
        runId,
        total: failedTargets.length,
        retryable: retryable.length,
        nonRetryable: nonRetryable.length,
        targets: failedTargets.map(t => ({
          id: t.id,
          productId: t.productId,
          skuId: t.skuId,
          errorMessage: t.errorMessage,
          errorType: classifyError(t.errorMessage || ''),
          attempts: t.attempts,
          lastAttempt: t.lastAttempt,
          retryable: retryable.some(rt => rt.id === t.id)
        }))
      }
    })
  } catch (error) {
    logger.error('[API] Error getting failed targets', {
      error: error instanceof Error ? error.message : 'Unknown error',
      runId: params.runId
    })

    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to get failed targets'
      },
      { status: 500 }
    )
  }
}

/**
 * Classify error type
 */
function classifyError(errorMessage: string): string {
  const msg = errorMessage.toLowerCase()

  if (msg.includes('rate limit') || msg.includes('429') || msg.includes('throttle')) {
    return 'RATE_LIMIT'
  }
  if (msg.includes('timeout') || msg.includes('timed out')) {
    return 'TIMEOUT'
  }
  if (msg.includes('not found') || msg.includes('404')) {
    return 'NOT_FOUND'
  }
  if (msg.includes('unauthorized') || msg.includes('401') || msg.includes('403')) {
    return 'AUTHORIZATION'
  }
  if (msg.includes('network') || msg.includes('connection') || msg.includes('econnreset')) {
    return 'NETWORK'
  }
  if (msg.includes('validation') || msg.includes('invalid')) {
    return 'VALIDATION'
  }
  if (msg.includes('500') || msg.includes('internal server')) {
    return 'SERVER_ERROR'
  }

  return 'UNKNOWN'
}
