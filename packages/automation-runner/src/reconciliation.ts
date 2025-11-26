/**
 * Reconciliation Service - Validates applied prices match external systems
 * M1.6: Price reconciliation with mismatch detection and reporting
 */

import { prisma } from '@calibr/db'
import type { PrismaClient, RuleTarget } from '@calibr/db'
import type {
  ReconciliationMismatch,
  ReconciliationReport,
  PriceConnector,
} from './types'
import { RECONCILIATION_CONFIG } from './config'

export class ReconciliationService {
  private connectors: Map<string, PriceConnector> = new Map()
  private prisma: PrismaClient

  constructor(prismaClient?: PrismaClient) {
    this.prisma = prismaClient ?? prisma()
  }

  /**
   * Register a price connector for reconciliation
   */
  registerConnector(name: string, connector: PriceConnector): void {
    this.connectors.set(name.toLowerCase(), connector)
  }

  /**
   * Reconcile a completed rule run
   * Verifies that applied prices in database match external systems
   */
  async reconcileRun(runId: string): Promise<ReconciliationReport> {
    const targets = await this.getAppliedTargets(runId)
    const mismatches: ReconciliationMismatch[] = []

    for (const target of targets) {
      try {
        const externalPrice = await this.fetchExternalPrice(target)
        const expectedPrice = this.extractExpectedPrice(target)

        if (externalPrice !== null && expectedPrice !== null) {
          const difference = externalPrice - expectedPrice
          const percentageDiff = (difference / expectedPrice) * 100

          // Check if mismatch exceeds threshold
          if (
            Math.abs(difference) > RECONCILIATION_CONFIG.maxDifferenceCents ||
            Math.abs(percentageDiff) > RECONCILIATION_CONFIG.maxDifferencePercent * 100
          ) {
            mismatches.push({
              targetId: target.id,
              skuId: target.skuId || '',
              expectedPrice,
              actualPrice: externalPrice,
              difference,
              percentageDiff,
            })

            // Write audit event for mismatch
            await this.reportMismatch(target, externalPrice, expectedPrice, difference)
          }
        }
      } catch (error) {
        // Log error but continue reconciliation
        console.error(`Reconciliation error for target ${target.id}:`, error)
      }
    }

    const report: ReconciliationReport = {
      runId,
      totalChecked: targets.length,
      mismatches: mismatches.length,
      details: mismatches,
      timestamp: new Date(),
    }

    // Emit reconciliation event
    await this.writeReconciliationEvent(runId, report)

    return report
  }

  /**
   * Get all applied targets from a run
   */
  private async getAppliedTargets(runId: string): Promise<RuleTarget[]> {
    return await this.prisma.ruleTarget.findMany({
      where: {
        ruleRunId: runId,
        status: 'APPLIED',
      },
    })
  }

  /**
   * Fetch current price from external system
   */
  private async fetchExternalPrice(target: RuleTarget): Promise<number | null> {
    // Determine connector (for now, defaulting to shopify)
    // TODO: Get connector type from product metadata
    const connectorName = 'shopify'
    const connector = this.connectors.get(connectorName)

    if (!connector) {
      throw new Error(`Connector not found: ${connectorName}`)
    }

    try {
      const externalId = target.variantId || target.productId
      const priceData = await connector.fetchPrice(externalId)
      return priceData.price
    } catch (error) {
      console.error(`Failed to fetch price for target ${target.id}:`, error)
      return null
    }
  }

  /**
   * Extract expected price from target's afterJson
   */
  private extractExpectedPrice(target: RuleTarget): number | null {
    try {
      const afterData = target.afterJson as Record<string, unknown>
      const priceCandidates = [
        afterData.unit_amount,
        afterData.amount,
        afterData.price,
      ]

      const price = priceCandidates.find(
        (value): value is number => typeof value === 'number'
      )

      return price ?? null
    } catch {
      return null
    }
  }

  /**
   * Report reconciliation mismatch to audit log
   */
  private async reportMismatch(
    target: RuleTarget,
    actualPrice: number,
    expectedPrice: number,
    difference: number
  ): Promise<void> {
    // Write to EventLog for audit trail
    await this.prisma.eventLog.create({
      data: {
        eventKey: `reconciliation:mismatch:${target.id}:${Date.now()}`,
        tenantId: target.tenantId,
        projectId: target.projectId,
        eventType: 'automation.reconciliation.mismatch',
        payload: {
          targetId: target.id,
          ruleRunId: target.ruleRunId,
          expectedPrice,
          actualPrice,
          difference,
          percentageDiff: (difference / expectedPrice) * 100,
        },
        metadata: {
          severity: 'warning',
          timestamp: new Date().toISOString(),
        },
      },
    })
  }

  /**
   * Write reconciliation completion event
   */
  private async writeReconciliationEvent(runId: string, report: ReconciliationReport): Promise<void> {
    const run = await this.prisma.ruleRun.findUnique({
      where: { id: runId },
    })

    if (!run) return

    await this.prisma.eventLog.create({
      data: {
        eventKey: `reconciliation:complete:${runId}:${Date.now()}`,
        tenantId: run.tenantId,
        projectId: run.projectId,
        eventType: 'automation.reconciliation.completed',
        payload: {
          runId,
          totalChecked: report.totalChecked,
          mismatches: report.mismatches,
          timestamp: report.timestamp.toISOString(),
        },
        metadata: {
          mismatchCount: report.mismatches,
          accuracy: ((report.totalChecked - report.mismatches) / report.totalChecked) * 100,
        },
      },
    })
  }

  /**
   * Schedule reconciliation for a run
   * Immediate: 5 minutes after completion
   * Delayed: 1 hour after completion
   */
  async scheduleReconciliation(runId: string): Promise<void> {
    // Immediate reconciliation
    setTimeout(async () => {
      try {
        await this.reconcileRun(runId)
      } catch (error) {
        console.error(`Immediate reconciliation failed for run ${runId}:`, error)
      }
    }, RECONCILIATION_CONFIG.immediateDelay)

    // Delayed reconciliation
    setTimeout(async () => {
      try {
        await this.reconcileRun(runId)
      } catch (error) {
        console.error(`Delayed reconciliation failed for run ${runId}:`, error)
      }
    }, RECONCILIATION_CONFIG.delayedCheck)
  }
}
