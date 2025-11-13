/**
 * Rules Worker — Core worker for bulk pricing rule execution
 * M1.6: Consumes outbox events and applies pricing rules
 */

import { prisma, EventWriter, OutboxWorker } from '@calibr/db'
import type { EventPayload } from '@calibr/db/src/eventing/types'
import { logger } from '@calibr/monitor'
import {
  calculateBackoff,
  handle429Error,
  isRetryableError,
  sleep
          createdBy: actor
        }
      }
    })

    // Create targets for each product
    const transform = rule.transformJson as Record<string, unknown>
    const targets = []

    for (const product of products) {
      for (const sku of product.Sku) {
        for (const price of sku.Price) {
          const beforePrice = price.amount
          let afterPrice = beforePrice

          // Apply transform
          if (transform.op === 'percent') {
            afterPrice = Math.round(beforePrice * (1 + transform.value / 100))
          } else if (transform.op === 'absolute') {
            afterPrice = beforePrice + transform.value
          }

          // Apply floor/ceiling
          if (transform.floor && afterPrice < transform.floor) {
            afterPrice = transform.floor
          }
          if (transform.ceiling && afterPrice > transform.ceiling) {
            afterPrice = transform.ceiling
          }

          const target = await prisma().ruleTarget.create({
            data: {
              id: createId(),
              tenantId: rule.tenantId,
              projectId: rule.projectId,
              ruleRunId: run.id,
              productId: product.id,
              variantId: null,
              skuId: sku.id,
              beforeJson: {
                currency: price.currency,
                unit_amount: beforePrice,
                price: beforePrice
              },
              afterJson: {
                currency: price.currency,
                unit_amount: afterPrice,
                price: afterPrice
              },
              status: 'PREVIEW',
              attempts: 0
            }
          })

          targets.push(target)
        }
      }
    }

    logger.info(`[RulesWorker] Materialized rule run ${run.id}`, {
      ruleId,
      targetCount: targets.length
    })

    return run
  }

  /**
   * Queue a rule run for application
   */
  async queueRun(runId: string): Promise<void> {
    // Update run status to QUEUED
    await prisma().ruleRun.update({
      where: { id: runId },
      data: {
        status: 'QUEUED',
        queuedAt: new Date()
      }
    })

    // Update all targets to QUEUED
    await prisma().ruleTarget.updateMany({
      where: { ruleRunId: runId, status: 'PREVIEW' },
      data: { status: 'QUEUED' }
    })

    // Emit event to outbox
    const run = await prisma().ruleRun.findUnique({
      where: { id: runId }
    })

    if (!run) {
      throw new Error(`Rule run ${runId} not found`)
    }

    const eventWriter = new EventWriter(prisma())
    await eventWriter.writeEventWithOutbox({
      eventKey: `job-rules-apply-${runId}`,
      tenantId: run.tenantId,
      projectId: run.projectId || undefined,
      eventType: 'job.rules.apply',
      payload: { runId },
      metadata: { queuedAt: new Date().toISOString() }
    })

    this.emitEvent('run.queued', { runId }, runId)

    logger.info(`[RulesWorker] Queued rule run ${runId}`)
  }

  /**
   * Get run status
   */
  async getRunStatus(runId: string) {
    const run = await prisma().ruleRun.findUnique({
      where: { id: runId },
      include: {
        RuleTarget: true
      }
    })

    if (!run) {
      return null
    }

    const totalTargets = run.RuleTarget.length
    const appliedTargets = run.RuleTarget.filter(t => t.status === 'APPLIED').length
    const failedTargets = run.RuleTarget.filter(t => t.status === 'FAILED').length
    const pendingTargets = run.RuleTarget.filter(
      t => t.status === 'PREVIEW' || t.status === 'QUEUED' || t.status === 'APPLYING'
    ).length

    return {
      runId: run.id,
      status: run.status,
      totalTargets,
      appliedTargets,
      failedTargets,
      pendingTargets,
      queuedAt: run.queuedAt,
      startedAt: run.startedAt,
      finishedAt: run.finishedAt,
      errorMessage: run.errorMessage
    }
  }
}

/**
 * Create a singleton worker instance
 */
let workerInstance: RulesWorker | null = null

export function getRulesWorker(config?: Partial<RulesWorkerConfig>): RulesWorker {
  if (!workerInstance) {
    workerInstance = new RulesWorker(config)
  }
  return workerInstance
}
