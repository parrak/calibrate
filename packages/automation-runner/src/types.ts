/**
 * Automation Runner Types
 * M0.5: Type definitions for automation runner components
 */

import type { RuleRun, RuleTarget, PricingRule } from '@calibr/db'

export interface RulesWorkerConfig {
  /**
   * Maximum number of concurrent target applications
   * @default 5
   */
  maxConcurrency: number

  /**
   * Polling interval for checking queued runs (ms)
   * @default 5000 (5 seconds)
   */
  pollInterval: number

  /**
   * Maximum number of retry attempts per target
   * @default 3
   */
  maxRetries: number

  /**
   * Enable reconciliation after run completion
   * @default true
   */
  enableReconciliation: boolean

  /**
   * Reconciliation delay after completion (ms)
   * @default 300000 (5 minutes)
   */
  reconciliationDelay: number
}

export interface BackoffOptions {
  /**
   * Base delay in milliseconds
   * @default 2000 (2 seconds)
   */
  baseDelay: number

  /**
   * Maximum delay in milliseconds
   * @default 64000 (64 seconds)
   */
  maxDelay: number

  /**
   * Exponential multiplier
   * @default 2
   */
  multiplier: number

  /**
   * Random jitter percentage (0-1)
   * @default 0.2 (±20%)
   */
  jitter: number
}

export interface BackoffResult {
  /**
   * Delay in milliseconds before next retry
   */
  delay: number

  /**
   * Whether to retry the operation
   */
  retry: boolean
}

export interface RuleRunContext {
  run: RuleRun
  rule: PricingRule
  targets: RuleTarget[]
  actor: string
  correlationId?: string
}

export interface TargetApplicationResult {
  targetId: string
  success: boolean
  error?: string
  externalId?: string
  appliedPrice?: number
  duration: number
}

export interface RunResult {
  runId: string
  status: 'APPLIED' | 'PARTIAL' | 'FAILED'
  totalTargets: number
  appliedTargets: number
  failedTargets: number
  duration: number
  results: TargetApplicationResult[]
}

export interface ReconciliationMismatch {
  targetId: string
  skuId: string
  expectedPrice: number
  actualPrice: number
  difference: number
  percentageDiff: number
}

export interface ReconciliationReport {
  runId: string
  totalChecked: number
  mismatches: number
  details: ReconciliationMismatch[]
  timestamp: Date
}

export interface DLQEntry {
  target: RuleTarget
  run: RuleRun
  failedAt: Date
  errorType: string
  retryable: boolean
}

export interface DLQReport {
  projectId: string
  totalFailed: number
  byErrorType: Record<string, number>
  recommendations: string[]
  entries: DLQEntry[]
}

export interface RuleWorkerMetrics {
  runsProcessed: number
  targetsApplied: number
  targetsFailed: number
  retriesAttempted: number
  rate429Errors: number
  averageDuration: number
  successRate: number
  dlqSize: number
}

/**
 * Shopify-specific error interface
 */
export interface ShopifyError extends Error {
  code?: number | string
  statusCode?: number
  headers?: Record<string, string>
  attempt?: number
  retryable?: boolean
}

/**
 * Worker event types
 */
export type WorkerEvent =
  | 'run.queued'
  | 'run.started'
  | 'run.completed'
  | 'run.failed'
  | 'target.applying'
  | 'target.applied'
  | 'target.failed'
  | 'target.retry'
  | 'reconciliation.started'
  | 'reconciliation.completed'
  | 'dlq.added'
  | 'worker.started'
  | 'worker.stopped'
  | 'worker.error'

export interface WorkerEventPayload {
  eventType: WorkerEvent
  timestamp: Date
  runId?: string
  targetId?: string
  data?: unknown
}

/**
 * Connector interface for applying prices
 */
export interface PriceConnector {
  /**
   * Connector name (e.g., 'shopify', 'amazon')
   */
  name: string

  /**
   * Apply price change to external system
   */
  applyPrice(params: {
    externalId: string
    variantId?: string
    price: number
    currency: string
  }): Promise<{success: boolean; externalId?: string; error?: string}>

  /**
   * Fetch current price from external system
   */
  fetchPrice(externalId: string): Promise<{price: number; currency: string}>

  /**
   * Check if connector is healthy
   */
  isHealthy(): Promise<boolean>
}
