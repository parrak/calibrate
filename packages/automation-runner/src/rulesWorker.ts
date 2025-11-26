/**
 * Rules Worker - Core automation runner for processing pricing rule applications
 * M1.6: Worker execution layer with retry logic, DLQ, and reconciliation
 */

import { prisma } from '@calibr/db'
import type { RuleRun, RuleTarget, PricingRule, RuleRunStatus, RuleTargetStatus } from '@calibr/db'
import type {
  RulesWorkerConfig,
  RuleRunContext,
  TargetApplicationResult,
  RunResult,
  PriceConnector,
  WorkerEvent,
  WorkerEventPayload,
} from './types'
import { getWorkerConfig, CIRCUIT_BREAKER_CONFIG } from './config'
import {
  calculateBackoff,
  handle429Error,
  isRetryableError,
  retryWithBackoff,
} from './backoff'

/**
 * RulesWorker - Processes queued rule runs and applies pricing changes
 */
export class RulesWorker {
  private config: RulesWorkerConfig
  private isRunning = false
  private pollTimer?: NodeJS.Timeout
  private connectors: Map<string, PriceConnector> = new Map()
  private eventListeners: Map<WorkerEvent, Array<(payload: WorkerEventPayload) => void>> = new Map()
  private consecutiveFailures = 0
  private consecutive429Errors = 0
  private circuitBreakerOpen = false
  private prisma = prisma()

  constructor(config?: Partial<RulesWorkerConfig>) {
    this.config = { ...getWorkerConfig(), ...config }
  }

  /**
   * Register a price connector (Shopify, Amazon, etc.)
   */
  registerConnector(name: string, connector: PriceConnector): void {
    this.connectors.set(name.toLowerCase(), connector)
  }

  /**
   * Listen to worker events
   */
  on(event: WorkerEvent, listener: (payload: WorkerEventPayload) => void): void {
    if (!this.eventListeners.has(event)) {
      this.eventListeners.set(event, [])
    }
    this.eventListeners.get(event)!.push(listener)
  }

  /**
   * Emit worker event
   */
  private emit(eventType: WorkerEvent, data?: unknown): void {
    const payload: WorkerEventPayload = {
      eventType,
      timestamp: new Date(),
      ...data,
    }

    const listeners = this.eventListeners.get(eventType) || []
    listeners.forEach(listener => listener(payload))
  }

  /**
   * Start the worker (polling for queued runs)
   */
  async start(): Promise<void> {
    if (this.isRunning) {
      throw new Error('Worker already running')
    }

    this.isRunning = true
    this.emit('worker.started')

    // Start polling loop
    this.pollTimer = setInterval(() => {
      this.pollForQueuedRuns().catch(error => {
        this.emit('worker.error', { error: error.message })
      })
    }, this.config.pollInterval)

    // Process any queued runs immediately
    await this.pollForQueuedRuns()
  }

  /**
   * Stop the worker
   */
  async stop(): Promise<void> {
    this.isRunning = false

    if (this.pollTimer) {
      clearInterval(this.pollTimer)
      this.pollTimer = undefined
    }

    this.emit('worker.stopped')
  }

  /**
   * Poll database for queued runs and process them
   */
  private async pollForQueuedRuns(): Promise<void> {
    if (this.circuitBreakerOpen) {
      return // Skip polling if circuit breaker is open
    }

    try {
      const queuedRuns = await this.prisma.ruleRun.findMany({
        where: {
          status: 'QUEUED',
        },
        include: {
          PricingRule: true,
          RuleTarget: true,
        },
        orderBy: {
          queuedAt: 'asc',
        },
        take: 5, // Process max 5 runs concurrently
      })

      // Process runs concurrently
      await Promise.all(
        queuedRuns.map(run => this.processRun(run))
      )
    } catch (error) {
      this.emit('worker.error', { error: error instanceof Error ? error.message : 'Unknown error' })
    }
  }

  /**
   * Process a single rule run
   */
  private async processRun(run: RuleRun & { PricingRule: PricingRule; RuleTarget: RuleTarget[] }): Promise<RunResult> {
    const startTime = Date.now()

    try {
      // Update status to APPLYING
      await this.prisma.ruleRun.update({
        where: { id: run.id },
        data: {
          status: 'APPLYING',
          startedAt: new Date(),
        },
      })

      this.emit('run.started', { runId: run.id })

      // Process all targets
      const results = await this.applyTargets(run)

      // Determine final status
      const failedCount = results.filter(r => !r.success).length
      const successCount = results.filter(r => r.success).length

      let finalStatus: RuleRunStatus
      if (failedCount === 0) {
        finalStatus = 'APPLIED'
      } else if (successCount === 0) {
        finalStatus = 'FAILED'
      } else {
        finalStatus = 'PARTIAL'
      }

      // Update run with final status
      await this.prisma.ruleRun.update({
        where: { id: run.id },
        data: {
          status: finalStatus,
          finishedAt: new Date(),
        },
      })

      const duration = Date.now() - startTime
      const result: RunResult = {
        runId: run.id,
        status: finalStatus,
        totalTargets: run.RuleTarget.length,
        appliedTargets: successCount,
        failedTargets: failedCount,
        duration,
        results,
      }

      this.emit('run.completed', { runId: run.id, result })
      this.consecutiveFailures = 0 // Reset on success

      return result
    } catch (error) {
      // Critical error - mark run as FAILED
      await this.prisma.ruleRun.update({
        where: { id: run.id },
        data: {
          status: 'FAILED',
          finishedAt: new Date(),
          errorMessage: error instanceof Error ? error.message : 'Unknown error',
        },
      })

      this.consecutiveFailures++
      this.checkCircuitBreaker()

      this.emit('run.failed', { runId: run.id, error: error instanceof Error ? error.message : 'Unknown error' })

      throw error
    }
  }

  /**
   * Apply all targets in a run with concurrency control
   */
  private async applyTargets(run: RuleRun & { PricingRule: PricingRule; RuleTarget: RuleTarget[] }): Promise<TargetApplicationResult[]> {
    const results: TargetApplicationResult[] = []
    const targets = run.RuleTarget.filter(t => t.status === 'QUEUED' || t.status === 'PREVIEW')

    // Process targets with concurrency limit
    for (let i = 0; i < targets.length; i += this.config.maxConcurrency) {
      const batch = targets.slice(i, i + this.config.maxConcurrency)
      const batchResults = await Promise.all(
        batch.map(target => this.applyTarget(run, target))
      )
      results.push(...batchResults)
    }

    return results
  }

  /**
   * Apply a single target with retry logic
   */
  private async applyTarget(run: RuleRun & { PricingRule: PricingRule }, target: RuleTarget): Promise<TargetApplicationResult> {
    const startTime = Date.now()

    try {
      // Update status to APPLYING
      await this.prisma.ruleTarget.update({
        where: { id: target.id },
        data: {
          status: 'APPLYING',
          lastAttempt: new Date(),
          attempts: target.attempts + 1,
        },
      })

      this.emit('target.applying', { targetId: target.id, runId: run.id })

      // Extract price information from afterJson
      const afterData = target.afterJson as any
      const newPrice = afterData.unit_amount || afterData.amount || afterData.price
      const compareAtPrice = afterData.compare_at_price

      if (!newPrice) {
        throw new Error('No price found in afterJson')
      }

      // Determine connector based on product channel
      // For now, we'll use 'shopify' as default, but this should come from product metadata
      const connectorName = 'shopify' // TODO: Get from product.channelRefs or similar
      const connector = this.connectors.get(connectorName)

      if (!connector) {
        throw new Error(`Connector not found: ${connectorName}`)
      }

      // Apply price change with retry
      const result = await retryWithBackoff(
        async () => {
          return await connector.applyPrice({
            externalId: target.variantId || target.productId,
            variantId: target.variantId || undefined,
            price: newPrice,
            currency: afterData.currency || 'USD',
          })
        },
        this.config.maxRetries,
        {
          onRetry: async (attempt, error) => {
            this.emit('target.retry', {
              targetId: target.id,
              runId: run.id,
              attempt,
              error: error instanceof Error ? error.message : 'Unknown error',
            })

            // Update attempt count
            await this.prisma.ruleTarget.update({
              where: { id: target.id },
              data: {
                attempts: target.attempts + attempt + 1,
                lastAttempt: new Date(),
                errorMessage: error instanceof Error ? error.message : 'Unknown error',
              },
            })

            // Handle 429 errors specially
            if (error && typeof error === 'object' && 'code' in error && error.code === 429) {
              this.consecutive429Errors++
              if (this.consecutive429Errors >= CIRCUIT_BREAKER_CONFIG.rateLimitThreshold) {
                await this.openCircuitBreaker()
              }
            }
          },
        }
      )

      if (!result.success) {
        throw new Error(result.error || 'Price application failed')
      }

      // Update target status to APPLIED
      await this.prisma.ruleTarget.update({
        where: { id: target.id },
        data: {
          status: 'APPLIED',
          appliedAt: new Date(),
          errorMessage: null,
        },
      })

      this.emit('target.applied', { targetId: target.id, runId: run.id })
      this.consecutive429Errors = 0 // Reset on success

      return {
        targetId: target.id,
        success: true,
        externalId: result.externalId,
        appliedPrice: newPrice,
        duration: Date.now() - startTime,
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error'
      const retryable = isRetryableError(error)

      // Determine if we should retry or mark as FAILED
      if (target.attempts + 1 >= this.config.maxRetries || !retryable) {
        // Max retries exceeded or non-retryable error - mark as FAILED
        await this.prisma.ruleTarget.update({
          where: { id: target.id },
          data: {
            status: 'FAILED',
            errorMessage,
          },
        })

        this.emit('target.failed', { targetId: target.id, runId: run.id, error: errorMessage })
        this.emit('dlq.added', { targetId: target.id, runId: run.id, error: errorMessage })
      } else {
        // Retryable - mark back as QUEUED for next attempt
        await this.prisma.ruleTarget.update({
          where: { id: target.id },
          data: {
            status: 'QUEUED',
            errorMessage,
          },
        })

        this.emit('target.retry', { targetId: target.id, runId: run.id, error: errorMessage })
      }

      return {
        targetId: target.id,
        success: false,
        error: errorMessage,
        duration: Date.now() - startTime,
      }
    }
  }

  /**
   * Materialize targets for a rule (create RuleTarget records without applying)
   */
  async materializeTargets(ruleId: string, tenantId: string, projectId: string): Promise<RuleRun> {
    // Get the rule
    const rule = await this.prisma.pricingRule.findUnique({
      where: { id: ruleId },
    })

    if (!rule) {
      throw new Error(`Rule not found: ${ruleId}`)
    }

    // Create RuleRun
    const run = await this.prisma.ruleRun.create({
      data: {
        tenantId,
        projectId,
        ruleId,
        status: 'PREVIEW',
      },
    })

    // TODO: Implement selector evaluation to find matching products/SKUs
    // For now, this is a placeholder that would need to integrate with
    // the selector engine to find matching products

    // This would typically:
    // 1. Parse rule.selectorJson to find matching criteria
    // 2. Query products/SKUs that match the selector
    // 3. Apply transform from rule.transformJson to calculate new prices
    // 4. Create RuleTarget records for each match

    return run
  }

  /**
   * Queue a run for processing
   */
  async queueRun(runId: string): Promise<void> {
    await this.prisma.ruleRun.update({
      where: { id: runId },
      data: {
        status: 'QUEUED',
        queuedAt: new Date(),
      },
    })

    this.emit('run.queued', { runId })
  }

  /**
   * Open circuit breaker (pause worker)
   */
  private async openCircuitBreaker(): Promise<void> {
    this.circuitBreakerOpen = true
    this.emit('worker.error', { error: 'Circuit breaker opened due to consecutive failures' })

    // Reset after timeout
    setTimeout(() => {
      this.circuitBreakerOpen = false
      this.consecutive429Errors = 0
      this.consecutiveFailures = 0
    }, CIRCUIT_BREAKER_CONFIG.resetTimeout)
  }

  /**
   * Check if circuit breaker should be opened
   */
  private checkCircuitBreaker(): void {
    if (this.consecutiveFailures >= CIRCUIT_BREAKER_CONFIG.failureThreshold) {
      this.openCircuitBreaker()
    }
  }
}
