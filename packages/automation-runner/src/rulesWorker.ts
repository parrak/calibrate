/**
 * Rules Worker — Core worker for bulk pricing rule execution
 * M1.6: Consumes outbox events and applies pricing rules
 */

import { prisma, EventWriter, OutboxWorker } from '@calibr/db'
import type { EventPayload } from '@calibr/db/src/eventing/types'
import type { EventPayload } from '@calibr/db/src/eventing/types'
import type { EventPayload } from '@calibr/db/src/eventing/types'
import { logger } from '@calibr/monitor'
import {
  calculateBackoff,
  handle429Error,
  isRetryableError,
  sleep
        if ((lastError as any).code === 429 || (lastError as any).statusCode === 429) {
          const backoffResult = handle429Error(lastError as any)
          if (backoffResult.retry && attempts < this.config.maxRetries) {
            logger.warn(`[RulesWorker] Rate limit hit for target ${target.id}, retrying after ${backoffResult.delay}ms`)
            await sleep(backoffResult.delay)
            continue
          }
        }

        // Regular retry with backoff
        if (attempts < this.config.maxRetries) {
          const delay = calculateBackoff(attempts)
          logger.warn(`[RulesWorker] Retrying target ${target.id} after ${delay}ms (attempt ${attempts}/${this.config.maxRetries})`)

          this.emitEvent('target.retry', { attempt: attempts, delay }, context.run.id, target.id)

          await sleep(delay)
        }
      }
    }

    // Max retries exceeded or non-retryable error
    const errorMessage = lastError?.message || 'Unknown error'

    await prisma().ruleTarget.update({
      where: { id: target.id },
      data: {
        status: 'FAILED',
        errorMessage,
        attempts
      }
    })

    const duration = Date.now() - startTime

    this.emitEvent('target.failed', { error: errorMessage }, context.run.id, target.id)

    logger.error(`[RulesWorker] Failed to apply target ${target.id}`, {
      error: errorMessage,
      attempts,
      runId: context.run.id
    })

    return {
      targetId: target.id,
      success: false,
      error: errorMessage,
      duration
    }
  }

  /**
   * Materialize a rule run (create targets without applying)
   */
  async materialize(ruleId: string, actor: string = 'automation-runner'): Promise<RuleRun> {
    const rule = await prisma().pricingRule.findUnique({
      where: { id: ruleId }
    })

    if (!rule) {
      throw new Error(`Pricing rule ${ruleId} not found`)
    }

    // Get matching products based on selector
    // For now, simplified - get all active products in the project
    const products = await prisma().product.findMany({
      where: {
        tenantId: rule.tenantId,
        projectId: rule.projectId,
        active: true
      },
      include: {
        Sku: {
          include: {
            Price: true
          }
        }
      }
    })

    // Create rule run
    const run = await prisma().ruleRun.create({
      data: {
        id: createId(),
        tenantId: rule.tenantId,
        projectId: rule.projectId,
        ruleId: rule.id,
        status: 'PREVIEW',
        queuedAt: null,
        metadata: {
          actor,
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
