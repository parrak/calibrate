/**
 * Automation Runner Metrics
 * M1.6: Metrics collection and reporting for monitoring
 */

import type { RuleRun, RuleTarget } from '@calibr/db'
import type { RuleWorkerMetrics, RunResult } from './types'
import { prisma } from '@calibr/db'

/**
 * Collect metrics for a specific run
 */
export async function collectRunMetrics(runId: string): Promise<{
  duration: number
  successRate: number
  totalTargets: number
  appliedTargets: number
  failedTargets: number
}> {
  const run = await prisma.ruleRun.findUnique({
    where: { id: runId },
    include: {
      RuleTarget: true,
    },
  })

  if (!run) {
    throw new Error(`Run not found: ${runId}`)
  }

  const totalTargets = run.RuleTarget.length
  const appliedTargets = run.RuleTarget.filter(t => t.status === 'APPLIED').length
  const failedTargets = run.RuleTarget.filter(t => t.status === 'FAILED').length

  const duration = run.finishedAt && run.startedAt
    ? run.finishedAt.getTime() - run.startedAt.getTime()
    : 0

  const successRate = totalTargets > 0 ? (appliedTargets / totalTargets) * 100 : 0

  return {
    duration,
    successRate,
    totalTargets,
    appliedTargets,
    failedTargets,
  }
}

/**
 * Collect aggregate metrics for a project
 */
export async function collectWorkerMetrics(projectId: string, since?: Date): Promise<RuleWorkerMetrics> {
  const sinceDate = since || new Date(Date.now() - 24 * 60 * 60 * 1000) // Default: last 24 hours

  // Get all runs for the project since the given date
  const runs = await prisma.ruleRun.findMany({
    where: {
      projectId,
      createdAt: {
        gte: sinceDate,
      },
    },
    include: {
      RuleTarget: true,
    },
  })

  // Calculate metrics
  const runsProcessed = runs.filter(r => r.status === 'APPLIED' || r.status === 'PARTIAL' || r.status === 'FAILED').length

  let totalTargets = 0
  let targetsApplied = 0
  let targetsFailed = 0
  let retriesAttempted = 0
  let rate429Errors = 0
  let totalDuration = 0
  let completedRuns = 0

  for (const run of runs) {
    const runTargets = run.RuleTarget.length
    totalTargets += runTargets

    targetsApplied += run.RuleTarget.filter(t => t.status === 'APPLIED').length
    targetsFailed += run.RuleTarget.filter(t => t.status === 'FAILED').length

    // Count retries (attempts > 0)
    retriesAttempted += run.RuleTarget.reduce((sum, t) => sum + Math.max(0, t.attempts - 1), 0)

    // Count 429 errors (from error messages)
    rate429Errors += run.RuleTarget.filter(t =>
      t.errorMessage?.toLowerCase().includes('429') ||
      t.errorMessage?.toLowerCase().includes('rate limit')
    ).length

    // Calculate duration for completed runs
    if (run.finishedAt && run.startedAt) {
      totalDuration += run.finishedAt.getTime() - run.startedAt.getTime()
      completedRuns++
    }
  }

  const averageDuration = completedRuns > 0 ? totalDuration / completedRuns : 0
  const successRate = totalTargets > 0 ? (targetsApplied / totalTargets) * 100 : 0

  // Get DLQ size
  const dlqSize = await prisma.ruleTarget.count({
    where: {
      projectId,
      status: 'FAILED',
    },
  })

  return {
    runsProcessed,
    targetsApplied,
    targetsFailed,
    retriesAttempted,
    rate429Errors,
    averageDuration,
    successRate,
    dlqSize,
  }
}

/**
 * Record run metrics to event log
 */
export async function recordRunMetrics(run: RuleRun, result: RunResult): Promise<void> {
  await prisma.eventLog.create({
    data: {
      eventKey: `metrics:run:${run.id}:${Date.now()}`,
      tenantId: run.tenantId,
      projectId: run.projectId,
      eventType: 'automation.metrics.run',
      payload: {
        runId: run.id,
        ruleId: run.ruleId,
        status: result.status,
        totalTargets: result.totalTargets,
        appliedTargets: result.appliedTargets,
        failedTargets: result.failedTargets,
        duration: result.duration,
        successRate: (result.appliedTargets / result.totalTargets) * 100,
      },
      metadata: {
        timestamp: new Date().toISOString(),
      },
    },
  })
}

/**
 * Record DLQ metrics to event log
 */
export async function recordDLQMetrics(projectId: string, dlqSize: number): Promise<void> {
  const project = await prisma.project.findUnique({
    where: { id: projectId },
  })

  if (!project) return

  await prisma.eventLog.create({
    data: {
      eventKey: `metrics:dlq:${projectId}:${Date.now()}`,
      tenantId: project.tenantId,
      projectId,
      eventType: 'automation.metrics.dlq',
      payload: {
        projectId,
        dlqSize,
        timestamp: new Date().toISOString(),
      },
    },
  })
}

/**
 * Check if success rate is below threshold and return alert
 */
export function checkSuccessRateAlert(successRate: number): {
  alert: boolean
  severity: 'warning' | 'critical' | null
  message: string | null
} {
  if (successRate < 90) {
    return {
      alert: true,
      severity: 'critical',
      message: `Critical: Success rate is ${successRate.toFixed(1)}% (below 90%)`,
    }
  }

  if (successRate < 97) {
    return {
      alert: true,
      severity: 'warning',
      message: `Warning: Success rate is ${successRate.toFixed(1)}% (below 97%)`,
    }
  }

  return {
    alert: false,
    severity: null,
    message: null,
  }
}

/**
 * Check if DLQ size is above threshold and return alert
 */
export function checkDLQSizeAlert(dlqSize: number): {
  alert: boolean
  severity: 'warning' | 'critical' | null
  message: string | null
} {
  if (dlqSize > 100) {
    return {
      alert: true,
      severity: 'critical',
      message: `Critical: DLQ size is ${dlqSize} (above 100)`,
    }
  }

  if (dlqSize > 50) {
    return {
      alert: true,
      severity: 'warning',
      message: `Warning: DLQ size is ${dlqSize} (above 50)`,
    }
  }

  return {
    alert: false,
    severity: null,
    message: null,
  }
}
