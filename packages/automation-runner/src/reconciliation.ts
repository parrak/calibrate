/**
 * Reconciliation Service
 * M1.6: Verifies that external prices match intended prices after application
 */

import { prisma, EventWriter } from '@calibr/db'
import type { RuleRun, RuleTarget } from '@calibr/db'
import { logger } from '@calibr/monitor'
import { RECONCILIATION_CONFIG } from './config'
import type { ReconciliationMismatch, ReconciliationReport, PriceConnector } from './types'

export class ReconciliationService {
  private connectors: Map<string, PriceConnector> = new Map()

  /**
   * Register a connector for reconciliation
   */
  registerConnector(channel: string, connector: PriceConnector) {
    this.connectors.set(channel, connector)
    logger.info(`[Reconciliation] Registered connector: ${channel}`)
  }

  /**
   * Reconcile a rule run
   * Verifies that external prices match intended prices
   */
  async reconcileRun(runId: string): Promise<ReconciliationReport> {
    logger.info(`[Reconciliation] Starting reconciliation for run: ${runId}`)

    const run = await prisma().ruleRun.findUnique({
      where: { id: runId },
      include: {
        RuleTarget: {
          where: { status: 'APPLIED' }
        }
      }
    })

    if (!run) {
      throw new Error(`Rule run ${runId} not found`)
    }

    const targets = run.RuleTarget
    const mismatches: ReconciliationMismatch[] = []
    let checked = 0

    // Check each applied target
    for (const target of targets) {
      try {
        const mismatch = await this.reconcileTarget(target)
        checked++

        if (mismatch) {
          mismatches.push(mismatch)
        }
      } catch (error) {
        logger.error(`[Reconciliation] Error reconciling target ${target.id}`, {
          error: error instanceof Error ? error.message : 'Unknown error'
        })
      }
    }

    const report: ReconciliationReport = {
      runId,
      totalChecked: checked,
      mismatches: mismatches.length,
      details: mismatches,
      timestamp: new Date()
    }

    // Log report to event log
    await this.logReport(run, report)

    // If there are mismatches, log warning
    if (mismatches.length > 0) {
      logger.warn(`[Reconciliation] Found ${mismatches.length} price mismatches for run ${runId}`, {
        mismatchRate: ((mismatches.length / checked) * 100).toFixed(2) + '%'
      })
    } else {
      logger.info(`[Reconciliation] All prices reconciled successfully for run ${runId}`)
    }

    return report
  }

  /**
   * Reconcile a single target
   * Returns mismatch details if prices don't match
   */
  private async reconcileTarget(target: RuleTarget): Promise<ReconciliationMismatch | null> {
    // Get product and connector info
    const product = await prisma().product.findUnique({
      where: { id: target.productId }
    })

    if (!product) {
      logger.warn(`[Reconciliation] Product ${target.productId} not found for target ${target.id}`)
      return null
    }

    const channelRefs = product.channelRefs as Record<string, unknown>
    const channel = channelRefs?.channel || 'shopify'
    const connector = this.connectors.get(channel)

    if (!connector) {
      logger.warn(`[Reconciliation] No connector for channel ${channel}, skipping target ${target.id}`)
      return null
    }

    // Fetch current external price
    const externalId = channelRefs?.external_id || channelRefs?.externalId
    if (!externalId) {
      logger.warn(`[Reconciliation] No external ID for product ${product.id}, skipping`)
      return null
    }

    try {
      const externalPrice = await connector.fetchPrice(externalId)

      // Get expected price from target
      const afterData = target.afterJson as Record<string, unknown>
      const expectedPrice = afterData.unit_amount || afterData.price

      // Check if prices match (allow small difference for rounding)
      const difference = Math.abs(externalPrice.price - expectedPrice)
      const percentageDiff = (difference / expectedPrice) * 100

      const maxDiffCents = RECONCILIATION_CONFIG.maxDifferenceCents
      const maxDiffPercent = RECONCILIATION_CONFIG.maxDifferencePercent * 100

      if (difference > maxDiffCents && percentageDiff > maxDiffPercent) {
        // Price mismatch detected
        return {
          targetId: target.id,
          skuId: target.skuId || '',
          expectedPrice,
          actualPrice: externalPrice.price,
          difference,
          percentageDiff
        }
      }

      return null // Prices match
    } catch (error) {
      logger.error(`[Reconciliation] Failed to fetch external price for target ${target.id}`, {
        error: error instanceof Error ? error.message : 'Unknown error'
      })
      return null
    }
  }

  /**
   * Log reconciliation report to event log
   */
  private async logReport(run: RuleRun, report: ReconciliationReport) {
    const eventWriter = new EventWriter(prisma())

    await eventWriter.writeEventWithOutbox({
      eventKey: `reconciliation-${run.id}-${Date.now()}`,
      tenantId: run.tenantId,
      projectId: run.projectId || undefined,
      eventType: 'automation.reconciliation.completed',
      payload: {
        runId: run.id,
        totalChecked: report.totalChecked,
        mismatchCount: report.mismatches,
        mismatchRate: (report.mismatches / report.totalChecked) * 100,
        timestamp: report.timestamp.toISOString()
      },
      metadata: {
        mismatches: report.details.map(m => ({
          targetId: m.targetId,
          skuId: m.skuId,
          difference: m.difference,
          percentageDiff: m.percentageDiff
        }))
      }
    })

    // Also write to audit log
    await prisma().audit.create({
      data: {
        tenantId: run.tenantId,
        projectId: run.projectId || undefined,
        entity: 'RuleRun',
        entityId: run.id,
        action: 'reconcile',
        actor: 'automation-runner',
        explain: {
          totalChecked: report.totalChecked,
          mismatchCount: report.mismatches,
          mismatches: report.details
        } as any
      }
    })
  }

  /**
   * Schedule reconciliation for a run
   * Called after run completes successfully
   */
  async scheduleReconciliation(runId: string, delayMs?: number) {
    const delay = delayMs ?? RECONCILIATION_CONFIG.immediateDelay

    logger.info(`[Reconciliation] Scheduling reconciliation for run ${runId} in ${delay}ms`)

    // In a real implementation, this would use a job queue or cron
    // For now, we'll use setTimeout as a simple implementation
    setTimeout(async () => {
      try {
        await this.reconcileRun(runId)
      } catch (error) {
        logger.error(`[Reconciliation] Failed scheduled reconciliation for run ${runId}`, {
          error: error instanceof Error ? error.message : 'Unknown error'
        })
      }
    }, delay)
  }

  /**
   * Retry failed targets that had reconciliation mismatches
   * Optionally auto-retry if configured
   */
  async retryMismatches(runId: string, autoRetry: boolean = false): Promise<number> {
    if (!autoRetry && !RECONCILIATION_CONFIG.autoRetryOnMismatch) {
      logger.info(`[Reconciliation] Auto-retry disabled for run ${runId}`)
      return 0
    }

    const report = await this.reconcileRun(runId)

    if (report.mismatches === 0) {
      return 0
    }

    // Get the mismatched targets
    const targetIds = report.details.map(m => m.targetId)

    // Update targets back to QUEUED for retry
    await prisma().ruleTarget.updateMany({
      where: {
        id: { in: targetIds },
        ruleRunId: runId
      },
      data: {
        status: 'QUEUED',
        attempts: 0,
        errorMessage: 'Reconciliation mismatch - retrying'
      }
    })

    logger.info(`[Reconciliation] Queued ${targetIds.length} targets for retry due to reconciliation mismatches`)

    return targetIds.length
  }

  /**
   * Get reconciliation history for a run
   */
  async getReconciliationHistory(runId: string) {
    const events = await prisma().eventLog.findMany({
      where: {
        eventType: 'automation.reconciliation.completed',
        payload: {
          path: ['runId'],
          equals: runId
        }
      },
      orderBy: { createdAt: 'desc' }
    })

    return events.map(e => ({
      timestamp: e.createdAt,
      report: e.payload as any
    }))
  }
}

/**
 * Create a singleton reconciliation service
 */
let reconciliationInstance: ReconciliationService | null = null

export function getReconciliationService(): ReconciliationService {
  if (!reconciliationInstance) {
    reconciliationInstance = new ReconciliationService()
  }
  return reconciliationInstance
}
