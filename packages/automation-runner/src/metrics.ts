/**
 * Automation Runner Metrics
 * M1.6: Collects and records metrics for monitoring and alerting
 */

import { prisma } from '@calibr/db'
import { logger } from '@calibr/monitor'
import type { RuleRun } from '@calibr/db'
import type { RuleWorkerMetrics, RunResult } from './types'

/**
 * Record metrics for a rule run
 */
export function recordRunMetrics(run: RuleRun, result?: RunResult) {
  // Calculate duration if completed
  let duration: number | undefined
  if (run.queuedAt && run.finishedAt) {
    duration = run.finishedAt.getTime() - run.queuedAt.getTime()
  }

  // Calculate success rate if result provided
  let successRate: number | undefined
  if (result) {
    successRate = result.totalTargets > 0
      ? (result.appliedTargets / result.totalTargets) * 100
      : 0
  }

  // Log metrics as structured data for export to Prometheus/Grafana
  logger.info('[Metrics] Rule run completed', {
    metadata: {
      metric: 'rules.apply',
      runId: run.id,
      tenantId: run.tenantId,
      projectId: run.projectId,
      ruleId: run.ruleId,
      status: run.status,
      duration,
      successRate,
      appliedTargets: result?.appliedTargets,
      failedTargets: result?.failedTargets,
      totalTargets: result?.totalTargets
    }
  })

  // Warn if success rate is low
  if (successRate !== undefined && successRate < 97) {
    logger.warn('[Metrics] Low success rate detected', {
      metadata: {
        metric: 'rules.apply.low_success_rate',
        runId: run.id,
        successRate,
        threshold: 97,
        appliedTargets: result?.appliedTargets,
        failedTargets: result?.failedTargets,
        totalTargets: result?.totalTargets
      }
    })
  }
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

  logger.info('[Metrics] DLQ size recorded', {
    metadata: {
      metric: 'rules.dlq.size',
      tenantId: project.tenantId,
      projectId,
      dlqSize
    }
  })

  // Alert if DLQ size is high
  if (dlqSize >= 50) {
    const severity = dlqSize >= 100 ? 'CRITICAL' : 'WARNING'

    logger.warn(`[Metrics] High DLQ size: ${dlqSize}`, {
      metadata: {
        metric: 'rules.dlq.high_size',
        tenantId: project.tenantId,
        projectId,
        dlqSize,
        threshold: dlqSize >= 100 ? 100 : 50,
        severity
      }
    })
  }
}

/**
 * Record 429 rate limit error
 */
export function record429Error(runId: string, targetId: string, tenantId: string, projectId: string) {
  logger.warn('[Metrics] Rate limit (429) error', {
    metadata: {
      metric: 'rules.429.error',
      tenantId,
      projectId,
      runId,
      targetId
    }
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
      logger.error('[Metrics] Rate limit burst detected', new Error(`${recentErrors} 429 errors in 5 minutes`), {
        metadata: {
          metric: 'rules.429.burst',
          tenantId: project.tenantId,
          projectId,
          errorCount: recentErrors,
          timeWindow: '5m'
        }
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
  const logLevel = success ? 'info' : 'warn'
  const message = success
    ? '[Metrics] Target applied successfully'
    : '[Metrics] Target application failed'

  logger[logLevel](message, {
    metadata: {
      metric: 'rules.apply.target',
      tenantId,
      projectId,
      runId,
      targetId,
      success,
      duration,
      errorType
    }
  })
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

  logger.info('[Metrics] Reconciliation completed', {
    metadata: {
      metric: 'rules.reconciliation',
      tenantId,
      projectId,
      runId,
      totalChecked,
      mismatchCount,
      mismatchRate
    }
  })

  if (mismatchCount > 0) {
    logger.warn(`[Metrics] Price mismatches detected: ${mismatchCount} of ${totalChecked}`, {
      metadata: {
        metric: 'rules.reconciliation.mismatches',
        tenantId,
        projectId,
        runId,
        mismatchCount,
        totalChecked,
        mismatchRate
      }
    })
  }
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
