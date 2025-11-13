/**
 * Dead Letter Queue (DLQ) Service
 * M1.6: Manages failed targets and provides reporting/retry capabilities
 */

import { prisma, EventWriter } from '@calibr/db'
import type { RuleRun, RuleTarget } from '@calibr/db'
import { logger } from '@calibr/monitor'
import { DLQ_CONFIG } from './config'
import type { DLQEntry, DLQReport } from './types'
import { isRetryableError } from './backoff'

export class DLQService {
  /**
   * Drain the DLQ for a project
   * Generates a comprehensive report of failed targets
   */
  async drainDLQ(projectId: string): Promise<DLQReport> {
    logger.info(`[DLQ] Draining DLQ for project: ${projectId}`)

    // Find all failed targets for the project
    const failedTargets = await prisma().ruleTarget.findMany({
      where: {
        projectId,
        status: 'FAILED'
      },
      include: {
        RuleRun: {
          include: {
            PricingRule: true
          }
        }
      },
      orderBy: { lastAttempt: 'asc' },
      take: DLQ_CONFIG.batchSize
    })

    if (failedTargets.length === 0) {
      logger.info(`[DLQ] No failed targets found for project ${projectId}`)
      return {
        projectId,
        totalFailed: 0,
        byErrorType: {},
        recommendations: [],
        entries: []
      }
    }

    // Classify errors by type
    const byErrorType: Record<string, number> = {}
    const entries: DLQEntry[] = []

    for (const target of failedTargets) {
      const errorType = this.classifyError(target.errorMessage || 'Unknown error')
      byErrorType[errorType] = (byErrorType[errorType] || 0) + 1

      entries.push({
        target,
        run: target.RuleRun,
        failedAt: target.lastAttempt || target.updatedAt,
        errorType,
        retryable: this.isErrorRetryable(target.errorMessage || '')
      })
    }

    // Generate recommendations based on error patterns
    const recommendations = this.generateRecommendations(byErrorType, entries)

    const report: DLQReport = {
      projectId,
      totalFailed: failedTargets.length,
      byErrorType,
      recommendations,
      entries
    }

    // Write report to audit and event log
    await this.logReport(projectId, report)

    logger.info(`[DLQ] DLQ report generated for project ${projectId}`, {
      totalFailed: report.totalFailed,
      errorTypes: Object.keys(byErrorType).length
    })

    return report
  }

  /**
   * Retry failed targets
   * Can retry all failed targets or specific ones
   */
  async retryFailed(runId: string, targetIds?: string[]): Promise<RuleTarget[]> {
    logger.info(`[DLQ] Retrying failed targets for run: ${runId}`, {
      targetCount: targetIds?.length || 'all'
    })

    // Build query
    const where: any = {
      ruleRunId: runId,
      status: 'FAILED'
    }

    if (targetIds && targetIds.length > 0) {
      where.id = { in: targetIds }
    }

    // Find failed targets
    const failedTargets = await prisma().ruleTarget.findMany({ where })

    if (failedTargets.length === 0) {
      logger.info(`[DLQ] No failed targets found to retry for run ${runId}`)
      return []
    }

    // Filter for retryable errors only
    const retryableTargets = failedTargets.filter(target =>
      this.isErrorRetryable(target.errorMessage || '')
    )

    if (retryableTargets.length === 0) {
      logger.warn(`[DLQ] No retryable targets found for run ${runId}`)
      return []
    }

    // Reset targets to QUEUED status
    const retryableIds = retryableTargets.map(t => t.id)

    await prisma().ruleTarget.updateMany({
      where: { id: { in: retryableIds } },
      data: {
        status: 'QUEUED',
        attempts: 0,
        errorMessage: null,
        lastAttempt: null
      }
    })

    // Update run status if all targets were failed
    const run = await prisma().ruleRun.findUnique({
      where: { id: runId },
      include: {
        RuleTarget: true
      }
    })

    if (run && (run.status === 'FAILED' || run.status === 'PARTIAL')) {
      const allTargetsFailed = run.RuleTarget.every(t => t.status === 'FAILED')
      if (allTargetsFailed || run.status === 'PARTIAL') {
        await prisma().ruleRun.update({
          where: { id: runId },
          data: {
            status: 'QUEUED',
            errorMessage: null
          }
        })
      }
    }

    logger.info(`[DLQ] Queued ${retryableIds.length} targets for retry`)

    // Return the updated targets
    return prisma().ruleTarget.findMany({
      where: { id: { in: retryableIds } }
    })
  }

  /**
   * Get DLQ size for a project
   */
  async getDLQSize(projectId: string): Promise<number> {
    return prisma().ruleTarget.count({
      where: {
        projectId,
        status: 'FAILED'
      }
    })
  }

  /**
   * Get failed targets for a specific run
   */
  async getFailedTargets(runId: string): Promise<RuleTarget[]> {
    return prisma().ruleTarget.findMany({
      where: {
        ruleRunId: runId,
        status: 'FAILED'
      },
      orderBy: { lastAttempt: 'desc' }
    })
  }

  /**
   * Get stale DLQ entries (failed > 24 hours ago)
   */
  async getStaleEntries(projectId: string): Promise<RuleTarget[]> {
    const staleThreshold = new Date(Date.now() - DLQ_CONFIG.staleThreshold)

    return prisma().ruleTarget.findMany({
      where: {
        projectId,
        status: 'FAILED',
        lastAttempt: {
          lt: staleThreshold
        }
      },
      orderBy: { lastAttempt: 'asc' }
    })
  }

  /**
   * Classify error into a category
   */
  private classifyError(errorMessage: string): string {
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

  /**
   * Determine if an error is retryable
   */
  private isErrorRetryable(errorMessage: string): boolean {
    const errorType = this.classifyError(errorMessage)

    // Non-retryable error types
    const nonRetryable = ['NOT_FOUND', 'VALIDATION', 'AUTHORIZATION']

    if (nonRetryable.includes(errorType)) {
      return false
    }

    // All other errors are potentially retryable
    return true
  }

  /**
   * Generate recommendations based on error patterns
   */
  private generateRecommendations(
    byErrorType: Record<string, number>,
    entries: DLQEntry[]
  ): string[] {
    const recommendations: string[] = []
    const total = entries.length

    // Rate limit recommendations
    const rateLimitCount = byErrorType['RATE_LIMIT'] || 0
    if (rateLimitCount > 0) {
      const percentage = (rateLimitCount / total) * 100
      if (percentage > 20) {
        recommendations.push(
          `High rate limit errors (${percentage.toFixed(1)}%). Consider: ` +
          `1) Reducing worker concurrency, 2) Increasing backoff delays, 3) Implementing request batching.`
        )
      } else {
        recommendations.push(
          `${rateLimitCount} rate limit errors detected. ` +
          `These are retryable and should resolve with exponential backoff.`
        )
      }
    }

    // Network error recommendations
    const networkCount = byErrorType['NETWORK'] || 0
    if (networkCount > 0) {
      const percentage = (networkCount / total) * 100
      if (percentage > 10) {
        recommendations.push(
          `Significant network errors (${percentage.toFixed(1)}%). ` +
          `Check: 1) Connector health, 2) Network connectivity, 3) DNS resolution.`
        )
      }
    }

    // Authorization recommendations
    const authCount = byErrorType['AUTHORIZATION'] || 0
    if (authCount > 0) {
      recommendations.push(
        `${authCount} authorization errors (non-retryable). ` +
        `Action required: Verify connector credentials and access tokens.`
      )
    }

    // Not found recommendations
    const notFoundCount = byErrorType['NOT_FOUND'] || 0
    if (notFoundCount > 0) {
      recommendations.push(
        `${notFoundCount} not found errors (non-retryable). ` +
        `Products may have been deleted. Consider removing these targets.`
      )
    }

    // Validation recommendations
    const validationCount = byErrorType['VALIDATION'] || 0
    if (validationCount > 0) {
      recommendations.push(
        `${validationCount} validation errors (non-retryable). ` +
        `Review pricing rules and target configurations.`
      )
    }

    // Server error recommendations
    const serverErrorCount = byErrorType['SERVER_ERROR'] || 0
    if (serverErrorCount > 0) {
      recommendations.push(
        `${serverErrorCount} server errors detected. ` +
        `These are retryable. Monitor connector service health.`
      )
    }

    // Stale entries
    const staleCount = entries.filter(
      e => Date.now() - e.failedAt.getTime() > DLQ_CONFIG.staleThreshold
    ).length
    if (staleCount > 0) {
      recommendations.push(
        `${staleCount} stale entries (>24h old). ` +
        `Consider manual review or archival.`
      )
    }

    // Retryable entries
    const retryableCount = entries.filter(e => e.retryable).length
    if (retryableCount > 0) {
      recommendations.push(
        `${retryableCount} entries are retryable. ` +
        `Use the retry API to requeue these targets.`
      )
    }

    if (recommendations.length === 0) {
      recommendations.push('No specific recommendations. All errors appear to be edge cases.')
    }

    return recommendations
  }

  /**
   * Log DLQ report to event log and audit
   */
  private async logReport(projectId: string, report: DLQReport) {
    const project = await prisma().project.findUnique({
      where: { id: projectId }
    })

    if (!project) {
      logger.warn(`[DLQ] Project ${projectId} not found for logging`)
      return
    }

    const eventWriter = new EventWriter(prisma())

    // Write to event log
    await eventWriter.writeEventWithOutbox({
      eventKey: `dlq-report-${projectId}-${Date.now()}`,
      tenantId: project.tenantId,
      projectId,
      eventType: 'automation.dlq.report',
      payload: {
        projectId,
        totalFailed: report.totalFailed,
        byErrorType: report.byErrorType,
        recommendations: report.recommendations,
        timestamp: new Date().toISOString()
      },
      metadata: {
        entryCount: report.entries.length
      }
    })

    // Write to audit log
    await prisma().audit.create({
      data: {
        tenantId: project.tenantId,
        projectId,
        entity: 'DLQ',
        entityId: projectId,
        action: 'drain',
        actor: 'automation-runner',
        explain: {
          totalFailed: report.totalFailed,
          byErrorType: report.byErrorType,
          recommendations: report.recommendations
        } as any
      }
    })
  }

  /**
   * Purge old failed targets
   * Removes targets that have been in DLQ for > retention period
   */
  async purgeOldEntries(projectId: string, olderThanMs: number = 7 * 24 * 60 * 60 * 1000) {
    const threshold = new Date(Date.now() - olderThanMs)

    const result = await prisma().ruleTarget.deleteMany({
      where: {
        projectId,
        status: 'FAILED',
        lastAttempt: {
          lt: threshold
        }
      }
    })

    logger.info(`[DLQ] Purged ${result.count} old failed targets from project ${projectId}`)

    return result.count
  }
}

/**
 * Create a singleton DLQ service
 */
let dlqInstance: DLQService | null = null

export function getDLQService(): DLQService {
  if (!dlqInstance) {
    dlqInstance = new DLQService()
  }
  return dlqInstance
}
