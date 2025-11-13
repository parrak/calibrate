/**
 * Automation Runner Metrics
 * M1.6: Collects and records metrics for monitoring and alerting
 */

import { prisma } from '@calibr/db'
import { recordPerformanceMetric, recordErrorMetric } from '@calibr/monitor'
import { logger } from '@calibr/monitor'
import type { RuleRun } from '@calibr/db'
import type { RuleWorkerMetrics, RunResult } from './types'

/**
 * Record metrics for a rule run
 */
export function recordRunMetrics(run: RuleRun, result?: RunResult) {
  const tags = {
    tenantId: run.tenantId,
    projectId: run.projectId,
    ruleId: run.ruleId,
    status: run.status
  }

  // Record run count
  recordPerformanceMetric({
    operation: 'rules.apply.count',
    durationMs: 0, // Counter metric
    success: run.status === 'APPLIED',
    tags,
    metadata: {
      runId: run.id,
      status: run.status
    }
  })

  // Record duration if completed
  if (run.queuedAt && run.finishedAt) {
    const duration = run.finishedAt.getTime() - run.queuedAt.getTime()

    recordPerformanceMetric({
      operation: 'rules.apply.duration_ms',
      durationMs: duration,
      success: run.status === 'APPLIED' || run.status === 'PARTIAL',
      tags,
      metadata: {
        runId: run.id,
        duration
      }
    })
  }

  // Record success rate
  if (result) {
    const successRate = result.totalTargets > 0
      ? (result.appliedTargets / result.totalTargets) * 100
      : 0

    recordPerformanceMetric({
      operation: 'rules.apply.success_rate',
      durationMs: successRate, // Using durationMs field to store percentage
      success: successRate >= 97, // Success if ≥ 97%
      tags: {
        ...tags,
        targetCount: result.totalTargets.toString()
      },
      metadata: {
        runId: run.id,
        successRate,
        appliedTargets: result.appliedTargets,
        failedTargets: result.failedTargets,
        totalTargets: result.totalTargets
      }
    })

    // Record error if success rate is low
    if (successRate < 97) {
      recordErrorMetric({
        operation: 'rules.apply',
        errorType: 'LOW_SUCCESS_RATE',
        errorMessage: `Success rate ${successRate.toFixed(2)}% is below threshold (97%)`,
        tags,
        metadata: {
          runId: run.id,
          successRate,
          threshold: 97
        }
      })
    }
  }

  logger.info('[Metrics] Recorded run metrics', {
    runId: run.id,
    status: run.status,
    tags
  })
}

/**
 * Record metrics for DLQ size
 */
export async function recordDLQMetrics(projectId: string) {
  // Count failed targets in DLQ
  const dlqSize = await prisma().ruleTarget.count({
    where: {
      projectId,
      status: 'FAILED'
    }
  })

  const project = await prisma().project.findUnique({
    where: { id: projectId }
  })

  if (!project) {
    return
  }

  const tags = {
    tenantId: project.tenantId,
    projectId
  }

  // Record DLQ size
  recordPerformanceMetric({
    operation: 'rules.dlq.size',
    durationMs: dlqSize, // Using durationMs field to store count
    success: dlqSize < 50, // Success if DLQ size is manageable
    tags,
    metadata: {
      dlqSize
    }
  })

  // Alert if DLQ size is high
  if (dlqSize >= 50) {
    const severity = dlqSize >= 100 ? 'CRITICAL' : 'WARNING'

    recordErrorMetric({
      operation: 'rules.dlq',
      errorType: 'HIGH_DLQ_SIZE',
      errorMessage: `DLQ size ${dlqSize} exceeds threshold`,
      tags: {
        ...tags,
        severity
      },
      metadata: {
        dlqSize,
        threshold: dlqSize >= 100 ? 100 : 50
      }
    })
  }

  logger.debug('[Metrics] Recorded DLQ metrics', {
    projectId,
    dlqSize
  })
}

/**
 * Record 429 rate limit error
 */
export function record429Error(runId: string, targetId: string, tenantId: string, projectId: string) {
  const tags = {
    tenantId,
    projectId,
    runId
  }

  recordErrorMetric({
    operation: 'rules.apply.target',
    errorType: 'RATE_LIMIT_429',
    errorMessage: 'Shopify rate limit (429) encountered',
    tags,
    metadata: {
      runId,
      targetId
    }
  })

  logger.warn('[Metrics] Recorded 429 rate limit error', {
    runId,
    targetId
  })
}

/**
 * Check for 429 burst (>3 errors in 5 minutes)
 */
export async function check429Burst(projectId: string): Promise<boolean> {
  const fiveMinutesAgo = new Date(Date.now() - 5 * 60 * 1000)

  // Count 429 errors in the last 5 minutes
  // Note: In a real implementation, this would query a metrics store
  // For now, we'll use audit logs as a proxy

  const recentErrors = await prisma().audit.count({
    where: {
      projectId,
      action: 'error',
      createdAt: { gte: fiveMinutesAgo },
      explain: {
        path: ['errorType'],
        equals: 'RATE_LIMIT_429'
      }
    }
  })

  const isBurst = recentErrors > 3

  if (isBurst) {
    const project = await prisma().project.findUnique({
      where: { id: projectId }
    })

    if (project) {
      recordErrorMetric({
        operation: 'rules.429.burst',
        errorType: '429_BURST',
        errorMessage: `Rate limit burst detected: ${recentErrors} errors in 5 minutes`,
        tags: {
          tenantId: project.tenantId,
          projectId
        },
        metadata: {
          errorCount: recentErrors,
          timeWindow: '5m'
        }
      })

      logger.warn('[Metrics] Rate limit burst detected', {
        projectId,
        errorCount: recentErrors
      })
    }
  }

  return isBurst
}

/**
 * Get aggregate worker metrics
 */
export async function getWorkerMetrics(projectId?: string): Promise<RuleWorkerMetrics> {
  const where: Record<string, unknown> = projectId ? { projectId } : {}

  // Get run statistics
  const [totalRuns, _successfulRuns, _failedRuns, _partialRuns] = await Promise.all([
    prisma().ruleRun.count({ where }),
    prisma().ruleRun.count({ where: { ...where, status: 'APPLIED' } }),
    prisma().ruleRun.count({ where: { ...where, status: 'FAILED' } }),
    prisma().ruleRun.count({ where: { ...where, status: 'PARTIAL' } })
  ])

  // Get target statistics
  const [totalTargets, appliedTargets, failedTargets] = await Promise.all([
    prisma().ruleTarget.count({ where }),
    prisma().ruleTarget.count({ where: { ...where, status: 'APPLIED' } }),
    prisma().ruleTarget.count({ where: { ...where, status: 'FAILED' } })
  ])

  // Calculate average duration
  const completedRuns = await prisma().ruleRun.findMany({
    where: {
      ...where,
      status: { in: ['APPLIED', 'PARTIAL', 'FAILED'] },
      queuedAt: { not: null },
      finishedAt: { not: null }
    },
    select: {
      queuedAt: true,
      finishedAt: true
    }
  })

  let averageDuration = 0
  if (completedRuns.length > 0) {
    const totalDuration = completedRuns.reduce((sum, run) => {
      if (run.queuedAt && run.finishedAt) {
        return sum + (run.finishedAt.getTime() - run.queuedAt.getTime())
      }
      return sum
    }, 0)
    averageDuration = totalDuration / completedRuns.length
  }

  // Calculate success rate
  const successRate = totalTargets > 0 ? (appliedTargets / totalTargets) * 100 : 0

  // Get DLQ size
  const dlqSize = failedTargets

  // Get retry count (approximate from attempts)
  const targetsWithRetries = await prisma().ruleTarget.findMany({
    where: {
      ...where,
      attempts: { gt: 1 }
    },
    select: { attempts: true }
  })

  const retriesAttempted = targetsWithRetries.reduce((sum, t) => sum + (t.attempts - 1), 0)

  // Approximate 429 errors (would be better with proper metrics store)
  const rate429Errors = 0 // Placeholder - would need metrics store

  return {
    runsProcessed: totalRuns,
    targetsApplied: appliedTargets,
    targetsFailed: failedTargets,
    retriesAttempted,
    rate429Errors,
    averageDuration,
    successRate,
    dlqSize
  }
}

/**
 * Record target-level metrics
 */
export function recordTargetMetrics(
  targetId: string,
  runId: string,
  tenantId: string,
  projectId: string,
  success: boolean,
  duration: number,
  errorType?: string
) {
  const tags = {
    tenantId,
    projectId,
    runId,
    success: success.toString()
  }

  recordPerformanceMetric({
    operation: 'rules.apply.target',
    durationMs: duration,
    success,
    tags,
    metadata: {
      targetId,
      runId,
      errorType
    }
  })

  if (!success && errorType) {
    recordErrorMetric({
      operation: 'rules.apply.target',
      errorType,
      errorMessage: `Target application failed: ${errorType}`,
      tags,
      metadata: {
        targetId,
        runId
      }
    })
  }
}

/**
 * Record reconciliation metrics
 */
export function recordReconciliationMetrics(
  runId: string,
  tenantId: string,
  projectId: string,
  totalChecked: number,
  mismatchCount: number
) {
  const mismatchRate = totalChecked > 0 ? (mismatchCount / totalChecked) * 100 : 0

  const tags = {
    tenantId,
    projectId,
    runId
  }

  recordPerformanceMetric({
    operation: 'rules.reconciliation',
    durationMs: mismatchRate, // Using durationMs to store percentage
    success: mismatchCount === 0,
    tags,
    metadata: {
      runId,
      totalChecked,
      mismatchCount,
      mismatchRate
    }
  })

  if (mismatchCount > 0) {
    recordErrorMetric({
      operation: 'rules.reconciliation',
      errorType: 'PRICE_MISMATCH',
      errorMessage: `${mismatchCount} price mismatches detected (${mismatchRate.toFixed(2)}%)`,
      tags,
      metadata: {
        runId,
        mismatchCount,
        totalChecked,
        mismatchRate
      }
    })
  }

  logger.info('[Metrics] Recorded reconciliation metrics', {
    runId,
    totalChecked,
    mismatchCount,
    mismatchRate
  })
}

/**
 * Export metrics to Prometheus/Grafana format
 */
export function exportMetricsForGrafana(metrics: RuleWorkerMetrics) {
  return {
    'rules_apply_count': metrics.runsProcessed,
    'rules_apply_duration_ms_avg': metrics.averageDuration,
    'rules_apply_success_rate': metrics.successRate,
    'rules_apply_targets_applied': metrics.targetsApplied,
    'rules_apply_targets_failed': metrics.targetsFailed,
    'rules_apply_retries_attempted': metrics.retriesAttempted,
    'rules_429_errors': metrics.rate429Errors,
    'rules_dlq_size': metrics.dlqSize
  }
}
