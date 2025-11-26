/**
 * Dead Letter Queue Service - Manages failed targets and retry operations
 * M1.6: DLQ management with retry, reporting, and drain operations
 */

import { prisma } from '@calibr/db'
import type { RuleTarget, RuleRun } from '@calibr/db'
import type { DLQEntry, DLQReport } from './types'
import { DLQ_CONFIG } from './config'
import { isRetryableError } from './backoff'

export class DLQService {
  private prisma = prisma()

  /**
   * Get all failed targets (DLQ entries) for a project
   */
  async getFailedTargets(projectId: string, limit?: number): Promise<DLQEntry[]> {
    const targets = await this.prisma.ruleTarget.findMany({
      where: {
        projectId,
        status: 'FAILED',
      },
      include: {
        RuleRun: true,
      },
      orderBy: {
        updatedAt: 'desc',
      },
      take: limit || DLQ_CONFIG.batchSize,
    })

    return targets.map(target => this.mapToDLQEntry(target))
  }

  /**
   * Get failed targets for a specific run
   */
  async getFailedTargetsForRun(runId: string): Promise<DLQEntry[]> {
    const targets = await this.prisma.ruleTarget.findMany({
      where: {
        ruleRunId: runId,
        status: 'FAILED',
      },
      include: {
        RuleRun: true,
      },
    })

    return targets.map(target => this.mapToDLQEntry(target))
  }

  /**
   * Retry failed targets
   * @param runId - Rule run ID
   * @param targetIds - Optional specific target IDs to retry (if not provided, retries all failed targets)
   */
  async retryFailed(runId: string, targetIds?: string[]): Promise<RuleTarget[]> {
    const query = targetIds
      ? { id: { in: targetIds }, ruleRunId: runId, status: 'FAILED' as const }
      : { ruleRunId: runId, status: 'FAILED' as const }

    // Get targets to retry
    const targets = await this.prisma.ruleTarget.findMany({
      where: query,
    })

    // Reset targets to QUEUED status for retry
    const updatedTargets = await this.prisma.$transaction(
      targets.map(target =>
        this.prisma.ruleTarget.update({
          where: { id: target.id },
          data: {
            status: 'QUEUED',
            attempts: 0, // Reset attempts
            errorMessage: null,
            lastAttempt: null,
          },
        })
      )
    )

    // Update run status to QUEUED if it was FAILED or PARTIAL
    const run = await this.prisma.ruleRun.findUnique({
      where: { id: runId },
    })

    if (run && (run.status === 'FAILED' || run.status === 'PARTIAL')) {
      await this.prisma.ruleRun.update({
        where: { id: runId },
        data: {
          status: 'QUEUED',
          queuedAt: new Date(),
          errorMessage: null,
        },
      })
    }

    // Write audit event
    await this.writeRetryEvent(runId, updatedTargets.length)

    return updatedTargets
  }

  /**
   * Generate DLQ report for a project
   */
  async generateDLQReport(projectId: string): Promise<DLQReport> {
    const entries = await this.getFailedTargets(projectId)

    // Group by error type
    const byErrorType: Record<string, number> = {}
    entries.forEach(entry => {
      const errorType = this.categorizeError(entry.target.errorMessage || 'Unknown')
      byErrorType[errorType] = (byErrorType[errorType] || 0) + 1
    })

    // Generate recommendations
    const recommendations = this.generateRecommendations(entries, byErrorType)

    return {
      projectId,
      totalFailed: entries.length,
      byErrorType,
      recommendations,
      entries,
    }
  }

  /**
   * Drain DLQ - process and report on failed targets
   */
  async drainDLQ(projectId: string): Promise<DLQReport> {
    const report = await this.generateDLQReport(projectId)

    // Write DLQ report event
    await this.writeDLQReportEvent(projectId, report)

    return report
  }

  /**
   * Clean up stale DLQ entries (older than threshold)
   */
  async cleanupStale(projectId: string): Promise<number> {
    const staleThreshold = new Date(Date.now() - DLQ_CONFIG.staleThreshold)

    const result = await this.prisma.ruleTarget.deleteMany({
      where: {
        projectId,
        status: 'FAILED',
        updatedAt: {
          lt: staleThreshold,
        },
      },
    })

    return result.count
  }

  /**
   * Map RuleTarget to DLQEntry
   */
  private mapToDLQEntry(target: RuleTarget & { RuleRun: RuleRun }): DLQEntry {
    return {
      target,
      run: target.RuleRun,
      failedAt: target.updatedAt,
      errorType: this.categorizeError(target.errorMessage || 'Unknown'),
      retryable: isRetryableError({
        message: target.errorMessage || 'Unknown',
      }),
    }
  }

  /**
   * Categorize error into type
   */
  private categorizeError(errorMessage: string): string {
    const lowerMessage = errorMessage.toLowerCase()

    if (lowerMessage.includes('rate limit') || lowerMessage.includes('429')) {
      return 'rate_limit'
    }
    if (lowerMessage.includes('auth') || lowerMessage.includes('401') || lowerMessage.includes('403')) {
      return 'authentication'
    }
    if (lowerMessage.includes('not found') || lowerMessage.includes('404')) {
      return 'not_found'
    }
    if (lowerMessage.includes('network') || lowerMessage.includes('timeout')) {
      return 'network'
    }
    if (lowerMessage.includes('validation') || lowerMessage.includes('invalid')) {
      return 'validation'
    }
    if (lowerMessage.includes('connector')) {
      return 'connector_error'
    }

    return 'unknown'
  }

  /**
   * Generate recommendations based on DLQ analysis
   */
  private generateRecommendations(entries: DLQEntry[], byErrorType: Record<string, number>): string[] {
    const recommendations: string[] = []

    // Rate limit recommendations
    if (byErrorType.rate_limit > 0) {
      recommendations.push(
        `${byErrorType.rate_limit} rate limit errors detected. Consider reducing concurrency or adding delays between requests.`
      )
    }

    // Authentication recommendations
    if (byErrorType.authentication > 0) {
      recommendations.push(
        `${byErrorType.authentication} authentication errors detected. Verify connector credentials and refresh tokens.`
      )
    }

    // Not found recommendations
    if (byErrorType.not_found > 5) {
      recommendations.push(
        `${byErrorType.not_found} "not found" errors detected. Verify product/variant IDs are correct and products still exist in external system.`
      )
    }

    // Network recommendations
    if (byErrorType.network > 0) {
      recommendations.push(
        `${byErrorType.network} network errors detected. Check network connectivity and consider increasing timeout values.`
      )
    }

    // Validation recommendations
    if (byErrorType.validation > 0) {
      recommendations.push(
        `${byErrorType.validation} validation errors detected. Review pricing rules and ensure price values are within valid ranges.`
      )
    }

    // General retry recommendation
    const retryableCount = entries.filter(e => e.retryable).length
    if (retryableCount > 0) {
      recommendations.push(
        `${retryableCount} failed targets are retryable. Use the retry API to attempt reprocessing.`
      )
    }

    return recommendations
  }

  /**
   * Write retry event to audit log
   */
  private async writeRetryEvent(runId: string, targetCount: number): Promise<void> {
    const run = await this.prisma.ruleRun.findUnique({
      where: { id: runId },
    })

    if (!run) return

    await this.prisma.eventLog.create({
      data: {
        eventKey: `dlq:retry:${runId}:${Date.now()}`,
        tenantId: run.tenantId,
        projectId: run.projectId,
        eventType: 'automation.dlq.retry',
        payload: {
          runId,
          targetCount,
          timestamp: new Date().toISOString(),
        },
      },
    })
  }

  /**
   * Write DLQ report event to audit log
   */
  private async writeDLQReportEvent(projectId: string, report: DLQReport): Promise<void> {
    const project = await this.prisma.project.findUnique({
      where: { id: projectId },
    })

    if (!project) return

    await this.prisma.eventLog.create({
      data: {
        eventKey: `dlq:report:${projectId}:${Date.now()}`,
        tenantId: project.tenantId,
        projectId,
        eventType: 'automation.dlq.report',
        payload: {
          projectId,
          totalFailed: report.totalFailed,
          byErrorType: report.byErrorType,
          recommendations: report.recommendations,
          timestamp: new Date().toISOString(),
        },
      },
    })
  }
}
