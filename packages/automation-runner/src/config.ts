/**
 * Automation Runner Configuration
 * M0.5: Default configuration for automation runner
 */

import type { RulesWorkerConfig, BackoffOptions } from './types'

export const DEFAULT_WORKER_CONFIG: RulesWorkerConfig = {
  maxConcurrency: 5,
  pollInterval: 5000, // 5 seconds
  maxRetries: 3,
  enableReconciliation: true,
  reconciliationDelay: 300000 // 5 minutes
}

export const DEFAULT_BACKOFF_OPTIONS: BackoffOptions = {
  baseDelay: 2000, // 2 seconds
  maxDelay: 64000, // 64 seconds
  multiplier: 2,
  jitter: 0.2 // ±20%
}

export const RATE_LIMIT_BACKOFF_OPTIONS: BackoffOptions = {
  baseDelay: 16000, // 16 seconds
  maxDelay: 64000, // 64 seconds
  multiplier: 2,
  jitter: 0.2
}

/**
 * Circuit breaker configuration
 */
export const CIRCUIT_BREAKER_CONFIG = {
  /**
   * Number of consecutive failures before opening circuit
   */
  failureThreshold: 5,

  /**
   * Time to wait before attempting to close circuit (ms)
   */
  resetTimeout: 60000, // 1 minute

  /**
   * Number of consecutive failures of 429 errors before triggering
   */
  rateLimitThreshold: 3,

  /**
   * Time to pause worker after rate limit circuit break (ms)
   */
  rateLimitPause: 60000 // 1 minute
}

/**
 * DLQ configuration
 */
export const DLQ_CONFIG = {
  /**
   * Maximum number of targets to process in one drain operation
   */
  batchSize: 100,

  /**
   * Age threshold for stale DLQ entries (ms)
   */
  staleThreshold: 86400000, // 24 hours

  /**
   * Enable auto-retry for retryable errors
   */
  autoRetry: false
}

/**
 * Reconciliation configuration
 */
export const RECONCILIATION_CONFIG = {
  /**
   * Immediate reconciliation delay after run completion (ms)
   */
  immediateDelay: 300000, // 5 minutes

  /**
   * Delayed reconciliation check (ms)
   */
  delayedCheck: 3600000, // 1 hour

  /**
   * Maximum price difference allowed before flagging (cents)
   */
  maxDifferenceCents: 1,

  /**
   * Maximum percentage difference allowed (0-1)
   */
  maxDifferencePercent: 0.01, // 1%

  /**
   * Enable auto-retry on mismatch
   */
  autoRetryOnMismatch: false
}

/**
 * Metrics configuration
 */
export const METRICS_CONFIG = {
  /**
   * Enable detailed metrics collection
   */
  enabled: true,

  /**
   * Metrics collection interval (ms)
   */
  collectionInterval: 60000, // 1 minute

  /**
   * Metrics retention period (ms)
   */
  retentionPeriod: 604800000 // 7 days
}

/**
 * Get configuration from environment variables with defaults
 */
export function getWorkerConfig(): RulesWorkerConfig {
  return {
    maxConcurrency: parseInt(process.env.WORKER_MAX_CONCURRENCY || '5'),
    pollInterval: parseInt(process.env.WORKER_POLL_INTERVAL || '5000'),
    maxRetries: parseInt(process.env.WORKER_MAX_RETRIES || '3'),
    enableReconciliation: process.env.WORKER_ENABLE_RECONCILIATION !== 'false',
    reconciliationDelay: parseInt(
      process.env.WORKER_RECONCILIATION_DELAY || '300000'
    )
  }
}
