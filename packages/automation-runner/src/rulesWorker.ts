/**
 * Rules Worker — Core worker for bulk pricing rule execution
 * M1.6: Consumes outbox events and applies pricing rules
 */

import { prisma, EventWriter, OutboxWorker } from '@calibr/db'
import type { EventPayload, RuleRun, RuleTarget, GuardrailPolicy, Prisma } from '@calibr/db'
import { logger } from '@calibr/monitor'
import {
  calculateBackoff,
  handle429Error,
  isRetryableError,
  sleep
} from './backoff'
import {
  calculatePriceDiff,
  evaluateSelector,
  type Selector as EngineSelector,
  type TransformDefinition as EngineTransformDefinition
} from '@calibr/pricing-engine'
import { registerGauge, setGauge } from '@calibr/monitor'
import { DEFAULT_WORKER_CONFIG } from './config'
import type {
  RulesWorkerConfig,
  RuleRunContext,
  TargetApplicationResult,
  RunResult,
  WorkerEvent,
  WorkerEventPayload,
  PriceConnector
} from './types'
import { createId } from '@paralleldrive/cuid2'

export class RulesWorker {
  private config: RulesWorkerConfig
  private outboxWorker?: OutboxWorker
  private isRunning: boolean = false
  private connectors: Map<string, PriceConnector> = new Map()
  private eventEmitter?: (event: WorkerEventPayload) => void

  constructor(config?: Partial<RulesWorkerConfig>) {
    this.config = { ...DEFAULT_WORKER_CONFIG, ...config }
  }

  /**
   * Register a connector for a specific channel
   */
  registerConnector(channel: string, connector: PriceConnector) {
    this.connectors.set(channel, connector)
    logger.info(`[RulesWorker] Registered connector: ${channel}`)
  }

  /**
   * Set event emitter for worker events
   */
  setEventEmitter(emitter: (event: WorkerEventPayload) => void) {
    this.eventEmitter = emitter
  }

  /**
   * Emit worker event
   */
  private emitEvent(eventType: WorkerEvent, data?: unknown, runId?: string, targetId?: string) {
    if (this.eventEmitter) {
      this.eventEmitter({
        eventType,
        timestamp: new Date(),
        runId,
        targetId,
        data
      })
    }
  }

  /**
   * Start the worker
   */
  async start() {
    if (this.isRunning) {
      logger.warn('[RulesWorker] Worker already running')
      return
    }

    this.isRunning = true

    // Initialize outbox worker
    this.outboxWorker = new OutboxWorker(prisma(), {
      pollIntervalMs: this.config.pollInterval,
      retryConfig: {
        maxRetries: this.config.maxRetries,
        initialDelayMs: 2000,
        maxDelayMs: 64000,
        backoffMultiplier: 2
      }
    })

    // Subscribe to job.rules.apply events
    this.outboxWorker.subscribe({
      eventTypes: ['job.rules.apply'],
      handler: async (event) => {
        await this.handleApplyJob(event)
      }
    })

    // Start the outbox worker
    this.outboxWorker.start()

    // Register metrics
    registerGauge('worker_queue_depth', 'Number of jobs in the worker queue', ['queue'])
    setGauge('worker_queue_depth', 0, { queue: 'rules' })

    this.emitEvent('worker.started')
    logger.info('[RulesWorker] Started successfully', { metadata: { config: this.config } })
  }

  private toJson(value: unknown): Prisma.InputJsonValue {
    return JSON.parse(JSON.stringify(value)) as Prisma.InputJsonValue
  }

  /**
   * Stop the worker
   */
  async stop() {
    if (!this.isRunning) {
      return
    }

    this.isRunning = false

    if (this.outboxWorker) {
      this.outboxWorker.stop()
    }

    this.emitEvent('worker.stopped')
    logger.info('[RulesWorker] Stopped successfully')
  }

  /**
   * Handle job.rules.apply event from outbox
   */
  private async handleApplyJob(event: EventPayload) {
    const { runId } = event.payload as { runId: string }

    logger.info(`[RulesWorker] Processing rule run: ${runId}`, {
      correlationId: event.correlationId
    })

    try {
      // Load the rule run
      const run = await prisma().ruleRun.findUnique({
        where: { id: runId },
        include: {
          PricingRule: true,
          RuleTarget: {
            where: {
              OR: [
                { status: 'QUEUED' },
                { status: 'PREVIEW' }
              ]
            }
          }
        }
      })

      if (!run) {
        throw new Error(`Rule run ${runId} not found`)
      }

      if (!run.PricingRule) {
        throw new Error(`Pricing rule not found for run ${runId}`)
      }

      // Fetch guardrail policy
      const guardrailPolicy = await prisma().guardrailPolicy.findUnique({
        where: { projectId: run.projectId }
      })

      // Create context
      const context: RuleRunContext = {
        run,
        rule: run.PricingRule,
        targets: run.RuleTarget,
        actor: 'automation-runner',
        correlationId: event.correlationId,
        guardrailPolicy
      }

      // Execute the run
      const result = await this.executeRun(context)

      logger.info(`[RulesWorker] Completed rule run: ${runId}`, {
        metadata: {
          status: result.status,
          appliedTargets: result.appliedTargets,
          failedTargets: result.failedTargets,
          duration: result.duration
        }
      })

      this.emitEvent('run.completed', result, runId)
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error'

      logger.error(
        `[RulesWorker] Failed to process rule run: ${runId}`,
        error instanceof Error ? error : undefined,
        { correlationId: event.correlationId }
      )

      // Update run status to FAILED
      await prisma().ruleRun.update({
        where: { id: runId },
        data: {
          status: 'FAILED',
          finishedAt: new Date(),
          errorMessage
        }
      })

      this.emitEvent('run.failed', { error: errorMessage }, runId)
      this.emitEvent('worker.error', { error: errorMessage, runId })
    }
  }

  /**
   * Execute a rule run
   */
  private async executeRun(context: RuleRunContext): Promise<RunResult> {
    const { run, targets, guardrailPolicy } = context
    const startTime = Date.now()

    this.emitEvent('run.started', { targetCount: targets.length }, run.id)

    // M1.6: Check Velocity Guardrail (Max Changes Per Day)
    if (guardrailPolicy?.maxChangesPerDay && guardrailPolicy.enabled) {
      const todayStart = new Date()
      todayStart.setHours(0, 0, 0, 0)

      const changesToday = await prisma().ruleTarget.count({
        where: {
          projectId: run.projectId,
          status: 'APPLIED',
          appliedAt: { gte: todayStart }
        }
      })

      if (changesToday + targets.length > guardrailPolicy.maxChangesPerDay) {
        const error = `Daily velocity limit exceeded (${changesToday + targets.length} > ${guardrailPolicy.maxChangesPerDay})`
        logger.warn(`[RulesWorker] ${error}`, { metadata: { runId: run.id } })

        // Fail the run immediately
        await prisma().ruleRun.update({
          where: { id: run.id },
          data: {
            status: 'FAILED',
            finishedAt: new Date(),
            errorMessage: error
          }
        })

        this.emitEvent('run.failed', { error }, run.id)
        return {
          runId: run.id,
          status: 'FAILED',
          totalTargets: targets.length,
          appliedTargets: 0,
          failedTargets: targets.length,
          duration: Date.now() - startTime,
          results: []
        }
      }
    }

    // Update run status to APPLYING
    await prisma().ruleRun.update({
      where: { id: run.id },
      data: {
        status: 'APPLYING',
        startedAt: new Date()
      }
    })

    // Apply targets with concurrency control
    const results = await this.applyTargetsConcurrently(context)

    // Calculate final status
    const appliedTargets = results.filter(r => r.success).length
    const failedTargets = results.filter(r => !r.success).length
    const duration = Date.now() - startTime

    let finalStatus: 'APPLIED' | 'PARTIAL' | 'FAILED'
    if (failedTargets === 0) {
      finalStatus = 'APPLIED'
    } else if (appliedTargets > 0) {
      finalStatus = 'PARTIAL'
    } else {
      finalStatus = 'FAILED'
    }

    // Update run status
    await prisma().ruleRun.update({
      where: { id: run.id },
      data: {
        status: finalStatus,
        finishedAt: new Date()
      }
    })

    const result: RunResult = {
      runId: run.id,
      status: finalStatus,
      totalTargets: targets.length,
      appliedTargets,
      failedTargets,
      duration,
      results
    }

    return result
  }

  /**
   * Apply targets with concurrency control
   */
  private async applyTargetsConcurrently(context: RuleRunContext): Promise<TargetApplicationResult[]> {
    const { targets } = context
    const results: TargetApplicationResult[] = []
    const maxConcurrency = this.config.maxConcurrency

    // Process in batches with concurrency limit
    for (let i = 0; i < targets.length; i += maxConcurrency) {
      const batch = targets.slice(i, i + maxConcurrency)
      const batchResults = await Promise.all(
        batch.map(target => this.applyTarget(context, target))
      )
      results.push(...batchResults)
    }

    return results
  }

  /**
   * Apply a single target with retry logic
   */
  private async applyTarget(
    context: RuleRunContext,
    target: RuleTarget
  ): Promise<TargetApplicationResult> {
    const startTime = Date.now()

    this.emitEvent('target.applying', { targetId: target.id }, context.run.id, target.id)

    let attempts = target.attempts
    let lastError: Error | undefined

    while (attempts < this.config.maxRetries) {
      try {
        // Update target status to APPLYING
        await prisma().ruleTarget.update({
          where: { id: target.id },
          data: {
            status: 'APPLYING',
            lastAttempt: new Date(),
            attempts: attempts + 1
          }
        })

        // Extract price information from afterJson
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const afterData = target.afterJson as any
        const newPrice = afterData.unit_amount || afterData.price
        const currency = afterData.currency || 'USD'

        // Get product/variant information
        const product = await prisma().product.findUnique({
          where: { id: target.productId }
        })

        if (!product) {
          throw new Error(`Product ${target.productId} not found`)
        }

        // Get the appropriate connector
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const channelRefs = product.channelRefs as any
        const channel = channelRefs?.channel || 'shopify'
        const connector = this.connectors.get(channel)

        if (!connector) {
          throw new Error(`No connector registered for channel: ${channel}`)
        }

        // M1.6: Check Guardrails
        if (context.guardrailPolicy && context.guardrailPolicy.enabled) {
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          this.checkGuardrails(context.guardrailPolicy, target, newPrice, target.beforeJson as any)
        }

        // Apply the price change via connector
        const externalId = channelRefs?.external_id || channelRefs?.externalId
        const variantId = target.variantId || undefined

        const applyResult = await connector.applyPrice({
          externalId,
          variantId,
          price: newPrice,
          currency
        })

        if (!applyResult.success) {
          throw new Error(applyResult.error || 'Failed to apply price')
        }

        // Update target status to APPLIED
        await prisma().ruleTarget.update({
          where: { id: target.id },
          data: {
            status: 'APPLIED',
            appliedAt: new Date()
          }
        })

        const duration = Date.now() - startTime

        this.emitEvent('target.applied', { duration }, context.run.id, target.id)

        return {
          targetId: target.id,
          success: true,
          externalId: applyResult.externalId,
          appliedPrice: newPrice,
          duration
        }
      } catch (error) {
        lastError = error as Error
        attempts++

        // Check if error is retryable
        if (!isRetryableError(lastError)) {
          break
        }

        // Handle 429 specifically
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        if ((lastError as any).code === 429 || (lastError as any).statusCode === 429) {
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
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

    logger.error(
      `[RulesWorker] Failed to apply target ${target.id}`,
      lastError instanceof Error ? lastError : undefined,
      {
        metadata: {
          attempts,
          runId: context.run.id
        }
      }
    )

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

    const selector = normalizeSelector(rule.selectorJson)
    const transform = normalizeTransform(rule.transformJson)

    // Get matching products based on selector
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

    let matched = 0
    let wouldChange = 0
    let totalDeltaCents = 0

    // Create rule run
    const run = await prisma().ruleRun.create({
      data: {
        id: createId(),
        tenantId: rule.tenantId,
        projectId: rule.projectId,
        ruleId: rule.id,
        status: 'PREVIEW',
        queuedAt: null,
        scheduledFor: rule.scheduleAt ?? null,
        explainJson: this.toJson({
          selector,
          transform
        }),
        metadata: {
          actor,
          createdBy: actor
        }
      }
    })

    // Create targets for each product
    const targets = []

    for (const product of products) {
      for (const sku of product.Sku) {
        const attributes =
          sku.attributes && typeof sku.attributes === 'object' && !Array.isArray(sku.attributes)
            ? (sku.attributes as Record<string, unknown>)
            : {}

        const activePrices = sku.Price.filter((p) => p.status === 'ACTIVE')
        const pricesToUse = activePrices.length > 0 ? activePrices : sku.Price
        for (const price of pricesToUse) {
          const priceAmount = price.amount / 100
          const context = {
            skuCode: sku.code,
            tags: product.tags || [],
            price: priceAmount,
            currency: price.currency,
            productId: product.id,
            productName: product.name,
            productCode: product.code,
            ...attributes
          }

          if (!evaluateSelector(selector, context)) {
            continue
          }

          matched += 1

          const diff = calculatePriceDiff(priceAmount, transform)
          if (diff.delta === 0) {
            continue
          }

          const beforePrice = price.amount
          const afterPrice = Math.round(diff.to * 100)
          totalDeltaCents += Math.round(Math.abs(diff.delta) * 100)
          wouldChange += 1

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
              fromPrice: beforePrice,
              toPrice: afterPrice,
              status: 'PREVIEW',
              attempts: 0
            }
          })

          targets.push(target)
        }
      }
    }

    await prisma().ruleRun.update({
      where: { id: run.id },
      data: {
        explainJson: this.toJson({
          selector,
          transform,
          matched,
          wouldChange,
          totalDeltaCents
        })
      }
    })

    logger.info(`[RulesWorker] Materialized rule run ${run.id}`, {
      metadata: {
        ruleId,
        targetCount: targets.length
      }
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
  /**
   * Check guardrails for a single target
   */
  private checkGuardrails(
    policy: GuardrailPolicy,
    target: RuleTarget,
    newPrice: number,
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    beforeData: any
  ) {
    if (!beforeData) return

    const currentPrice = Number(beforeData.unit_amount || beforeData.price || 0)

    // 1. Price Floor (Absolute)
    if (policy.minPriceCents && newPrice < policy.minPriceCents) {
      throw new Error(`Guardrail violation: Price ${newPrice} is below floor ${policy.minPriceCents}`)
    }

    // 2. Max Increase %
    if (policy.maxPriceIncreasePct && newPrice > currentPrice) {
      if (currentPrice > 0) {
        const increasePct = ((newPrice - currentPrice) / currentPrice) * 100
        if (increasePct > policy.maxPriceIncreasePct) {
          throw new Error(`Guardrail violation: Price increase ${increasePct.toFixed(2)}% exceeds limit ${policy.maxPriceIncreasePct}%`)
        }
      }
    }

    // 3. Max Decrease %
    if (policy.maxPriceDecreasePct && newPrice < currentPrice) {
      if (currentPrice > 0) {
        const decreasePct = ((currentPrice - newPrice) / currentPrice) * 100
        if (decreasePct > policy.maxPriceDecreasePct) {
          throw new Error(`Guardrail violation: Price decrease ${decreasePct.toFixed(2)}% exceeds limit ${policy.maxPriceDecreasePct}%`)
        }
      }
    }
  }
}

function normalizeSelector(value: unknown): EngineSelector {
  if (value && typeof value === 'object' && 'predicates' in (value as Record<string, unknown>)) {
    return value as EngineSelector
  }

  return {
    predicates: [{ type: 'all' }],
    operator: 'AND'
  }
}

function normalizeTransform(value: unknown): EngineTransformDefinition {
  if (value && typeof value === 'object' && 'transform' in (value as Record<string, unknown>)) {
    return value as EngineTransformDefinition
  }

  const legacy = value as { op?: string; value?: number; factor?: number; floor?: number; ceiling?: number; maxPctDelta?: number }
  const op = legacy?.op ?? 'percent'

  let transform: EngineTransformDefinition['transform']
  if (op === 'absolute') {
    transform = { type: 'absolute', value: legacy.value ?? 0 }
  } else if (op === 'set') {
    transform = { type: 'set', value: legacy.value ?? 0 }
  } else if (op === 'multiply') {
    transform = { type: 'multiply', factor: legacy.factor ?? 1 }
  } else {
    transform = { type: 'percentage', value: legacy.value ?? 0 }
  }

  const constraints =
    legacy?.floor !== undefined || legacy?.ceiling !== undefined || legacy?.maxPctDelta !== undefined
      ? {
          floor: legacy.floor,
          ceiling: legacy.ceiling,
          maxPctDelta: legacy.maxPctDelta
        }
      : undefined

  return { transform, constraints }
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
