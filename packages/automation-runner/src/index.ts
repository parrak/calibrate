/**
 * Automation Runner - Public API
 * M0.5: Core infrastructure for bulk pricing rule execution
 * M1.6: Worker queue execution with reconciliation and DLQ
 */

// Configuration
export {
  DEFAULT_WORKER_CONFIG,
  DEFAULT_BACKOFF_OPTIONS,
  RATE_LIMIT_BACKOFF_OPTIONS,
  CIRCUIT_BREAKER_CONFIG,
  DLQ_CONFIG,
  RECONCILIATION_CONFIG,
  METRICS_CONFIG,
  getWorkerConfig,
} from './config'

// Types
export type {
  RulesWorkerConfig,
  BackoffOptions,
  BackoffResult,
  RuleRunContext,
  TargetApplicationResult,
  RunResult,
  ReconciliationMismatch,
  ReconciliationReport,
  DLQEntry,
  DLQReport,
  RuleWorkerMetrics,
  ShopifyError,
  WorkerEvent,
  WorkerEventPayload,
  PriceConnector,
} from './types'

// Backoff utilities
export {
  calculateBackoff,
  handle429Error,
  isRetryableError,
  calculateNextRetry,
  sleep,
  retryWithBackoff,
  getRetrySchedule,
} from './backoff'

// Core worker
export {
  RulesWorker,
  getRulesWorker,
} from './rulesWorker'

// Reconciliation service
export {
  ReconciliationService,
  getReconciliationService,
} from './reconciliation'

// DLQ service
export {
  DLQService,
  getDLQService,
} from './dlq'

// Metrics
export {
  recordRunMetrics,
  recordDLQMetrics,
  record429Error,
  check429Burst,
  getWorkerMetrics,
  recordTargetMetrics,
  recordReconciliationMetrics,
  exportMetricsForGrafana,
} from './metrics'
