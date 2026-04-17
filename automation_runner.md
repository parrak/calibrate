# Automation Runner Architecture

**Version**: 1.0.0
**Status**: M0.5 Foundation Complete
**Last Updated**: November 29, 2025

---

## Table of Contents

- [Overview](#overview)
- [Architecture](#architecture)
- [System Components](#system-components)
- [State Machine](#state-machine)
- [Data Flow](#data-flow)
- [Error Handling](#error-handling)
- [Performance](#performance)
- [Monitoring](#monitoring)
- [Security](#security)
- [References](#references)

---

## Overview

The Automation Runner is a production-scale infrastructure for executing bulk pricing rule changes across connected e-commerce platforms (Shopify, Amazon, etc.). It provides:

- **Reliable Execution**: Transactional outbox pattern with guaranteed delivery
- **Retry Logic**: Exponential backoff with intelligent 429 handling
- **Reconciliation**: Verifies applied prices match external systems
- **DLQ Management**: Failed targets tracked with actionable insights
- **Observability**: Comprehensive metrics and alerting

### Key Features

✅ **100+ SKU Bulk Operations** - Process large rule runs efficiently
✅ **Automatic Retry** - Exponential backoff with max 3 attempts
✅ **429 Rate Limit Handling** - Smart backoff respecting Retry-After headers
✅ **Reconciliation** - Post-apply verification within 5 minutes
✅ **Dead Letter Queue** - Failed targets tracked with recommendations
✅ **Metrics & Alerts** - Grafana dashboard with success rate monitoring

---

## Architecture

### High-Level Design

```
┌─────────────┐
│   API/UI    │
│  (Console)  │
└──────┬──────┘
       │ POST /api/v1/rules/:id/materialize
       │ POST /api/v1/runs/:id/apply
       ▼
┌─────────────────────────────────────────┐
│         Automation Runner               │
│                                         │
│  ┌──────────────┐    ┌──────────────┐ │
│  │ RulesWorker  │◄───│  EventBus    │ │
│  │              │    │  (Outbox)    │ │
│  └──────┬───────┘    └──────────────┘ │
│         │                              │
│         ▼                              │
│  ┌──────────────┐                     │
│  │  Backoff &   │                     │
│  │  Retry Logic │                     │
│  └──────┬───────┘                     │
│         │                              │
│         ▼                              │
│  ┌──────────────┐    ┌──────────────┐ │
│  │ Connectors   │───►│ Shopify API  │ │
│  │              │───►│ Amazon SP-API│ │
│  └──────┬───────┘    └──────────────┘ │
│         │                              │
│         ▼                              │
│  ┌──────────────┐    ┌──────────────┐ │
│  │Reconciliation│    │  DLQ Service │ │
│  │   Service    │    │              │ │
│  └──────────────┘    └──────────────┘ │
└─────────────────────────────────────────┘
       │
       ▼
┌──────────────┐
│  PostgreSQL  │
│   Database   │
└──────────────┘
```

### Technology Stack

- **Runtime**: Node.js + TypeScript
- **Database**: PostgreSQL with Prisma ORM
- **Event Bus**: Transactional Outbox Pattern
- **Queue**: OutboxWorker (database-backed)
- **Monitoring**: Grafana + Prometheus (planned)
- **Logging**: Structured JSON logs via @calibr/monitor

---

## System Components

### 1. RulesWorker

**File**: `packages/automation-runner/src/rulesWorker.ts`

Core worker responsible for processing rule runs.

**Key Responsibilities**:
- Subscribe to `job.rules.apply` events from outbox
- Execute rule runs with concurrency control (default: 5)
- Apply pricing changes via connectors
- Handle retries with exponential backoff
- Track state transitions (QUEUED → APPLYING → APPLIED/PARTIAL/FAILED)

**Configuration**:
```typescript
{
  maxConcurrency: 5,        // Concurrent target applications
  pollInterval: 5000,       // Outbox poll interval (ms)
  maxRetries: 3,            // Max retry attempts per target
  enableReconciliation: true,
  reconciliationDelay: 300000 // 5 minutes
}
```

**API**:
```typescript
// Materialize a rule run (preview)
const run = await worker.materialize(ruleId, actor)

// Queue for execution
await worker.queueRun(run.id)

// Check status
const status = await worker.getRunStatus(run.id)
```

---

### 2. Backoff Service

**File**: `packages/automation-runner/src/backoff.ts`

Implements exponential backoff with jitter for retry delays.

**Features**:
- Exponential delay: 2s → 4s → 8s (configurable)
- Random jitter (±20%) to prevent thundering herd
- Special 429 handling with Retry-After header support
- Retryable error classification

**Example**:
```typescript
import { calculateBackoff, handle429Error, retryWithBackoff } from '@calibr/automation-runner'

// Calculate delay for attempt
const delay = calculateBackoff(attempt) // ~2s, ~4s, ~8s

// Handle 429 specifically
if (error.code === 429) {
  const { delay, retry } = handle429Error(error)
  if (retry) {
    await sleep(delay)
    // Retry operation
  }
}

// Automatic retry wrapper
const result = await retryWithBackoff(
  () => connector.applyPrice(params),
  3 // max retries
)
```

---

### 3. Reconciliation Service

**File**: `packages/automation-runner/src/reconciliation.ts`

Verifies that applied prices in external systems match intended prices.

**Process**:
1. Query all `APPLIED` targets from a run
2. For each target, fetch current price from connector
3. Compare `expectedPrice` vs `actualPrice`
4. Flag mismatches if difference > threshold (1 cent or 1%)
5. Generate reconciliation report
6. Optionally retry mismatches

**Scheduling**:
- **Immediate**: 5 minutes after run completion
- **Delayed**: 1 hour after completion (planned)
- **Periodic**: Daily for all APPLIED runs (planned)

**Example**:
```typescript
import { getReconciliationService } from '@calibr/automation-runner'

const service = getReconciliationService()
service.registerConnector('shopify', shopifyConnector)

// Reconcile a run
const report = await service.reconcileRun(runId)

console.log(`Checked: ${report.totalChecked}`)
console.log(`Mismatches: ${report.mismatches}`)
console.log(`Details:`, report.details)
```

---

### 4. DLQ Service

**File**: `packages/automation-runner/src/dlq.ts`

Manages failed targets and provides actionable recommendations.

**Features**:
- Error classification (RATE_LIMIT, TIMEOUT, NOT_FOUND, etc.)
- Retryable vs non-retryable determination
- Recommendation generation based on error patterns
- Bulk retry failed targets
- Stale entry detection (>24 hours)

**Error Categories**:
- `RATE_LIMIT` - 429 errors, throttling
- `TIMEOUT` - Request timeouts
- `NOT_FOUND` - 404 errors (non-retryable)
- `AUTHORIZATION` - 401/403 (non-retryable)
- `NETWORK` - Connection errors
- `VALIDATION` - Invalid data (non-retryable)
- `SERVER_ERROR` - 5xx errors
- `UNKNOWN` - Uncategorized

**Example**:
```typescript
import { getDLQService } from '@calibr/automation-runner'

const dlq = getDLQService()

// Generate DLQ report
const report = await dlq.drainDLQ(projectId)

console.log(`Total failed: ${report.totalFailed}`)
console.log(`By error type:`, report.byErrorType)
console.log(`Recommendations:`, report.recommendations)

// Retry specific targets
await dlq.retryFailed(runId, ['target-1', 'target-2'])

// Retry all failed targets in run
await dlq.retryFailed(runId)
```

---

### 5. Metrics Service

**File**: `packages/automation-runner/src/metrics.ts`

Collects and exports metrics for monitoring.

**Metrics**:
- `rules.apply.count` - Total rule runs
- `rules.apply.duration_ms` - Run duration
- `rules.apply.success_rate` - Target success percentage
- `rules.dlq.size` - Failed targets count
- `rules.429.errors` - Rate limit errors
- `rules.reconciliation` - Reconciliation stats

**Alert Thresholds**:
- Success rate < 97% → Warning
- Success rate < 90% → Critical
- DLQ size > 50 → Warning
- DLQ size > 100 → Critical
- 429 burst (>3 in 5 min) → Warning

**Example**:
```typescript
import { recordRunMetrics, getWorkerMetrics } from '@calibr/automation-runner'

// Record run metrics
recordRunMetrics(run, result)

// Get aggregate metrics
const metrics = await getWorkerMetrics(projectId)
console.log(`Success rate: ${metrics.successRate}%`)
console.log(`DLQ size: ${metrics.dlqSize}`)
```

---

## State Machine

See [packages/automation-runner/docs/state-machine.md](../packages/automation-runner/docs/state-machine.md) for detailed state transition diagrams.

### RuleRun States

```
PREVIEW → QUEUED → APPLYING → APPLIED (success)
                            → PARTIAL (some failed)
                            → FAILED (all failed)

PARTIAL → APPLYING (retry)
APPLIED → ROLLED_BACK
```

### RuleTarget States

```
PREVIEW → QUEUED → APPLYING → APPLIED (success)
                            → QUEUED (retry, attempts < max)
                            → FAILED (max retries exceeded)

FAILED → QUEUED (manual retry)
```

---

## Data Flow

### 1. Rule Materialization

```
User: POST /api/v1/rules/:ruleId/materialize
  ↓
API: Load pricing rule from database
  ↓
API: Query matching products (selector evaluation)
  ↓
API: For each product/variant:
     - Calculate before price (current)
     - Apply transform (percentage, absolute, etc.)
     - Apply floor/ceiling constraints
     - Create RuleTarget with before/after snapshots
  ↓
API: Create RuleRun with status=PREVIEW
  ↓
Response: { runId, targetCount, estimatedDuration }
```

### 2. Rule Application

```
User: POST /api/v1/runs/:runId/apply
  ↓
API: Update RuleRun status → QUEUED
API: Update all RuleTargets → QUEUED
  ↓
API: Emit event to outbox:
     { eventType: 'job.rules.apply', payload: { runId } }
  ↓
OutboxWorker: Poll outbox, dequeue event
  ↓
RulesWorker: Subscribe to 'job.rules.apply'
RulesWorker: Load run + targets
RulesWorker: Update run status → APPLYING
  ↓
RulesWorker: For each target (with concurrency limit):
  1. Update target → APPLYING
  2. Extract price from afterJson
  3. Get connector for product channel
  4. Call connector.applyPrice(externalId, price)
  5. On success: Update target → APPLIED
  6. On failure: Retry with backoff (max 3 attempts)
  7. After max retries: Update target → FAILED
  ↓
RulesWorker: Calculate final run status:
  - All APPLIED → APPLIED
  - Some FAILED → PARTIAL
  - All FAILED → FAILED
  ↓
RulesWorker: Update run status, set finishedAt
  ↓
RulesWorker: Emit metrics
RulesWorker: Schedule reconciliation (if enabled)
```

### 3. Reconciliation

```
Trigger: 5 minutes after run completion
  ↓
ReconciliationService: Load APPLIED targets
  ↓
For each target:
  1. Get connector for product channel
  2. Fetch current price from external system
  3. Compare actual vs expected price
  4. If mismatch > threshold → Report anomaly
  ↓
Generate ReconciliationReport
  ↓
Write to EventLog + Audit
  ↓
If mismatches > 0 and autoRetry enabled:
   Update targets → QUEUED
   Re-trigger worker
```

---

## Error Handling

### Retry Strategy

**Standard Errors** (network, timeout):
```
Attempt 1: Immediate
Attempt 2: After 2s ± 20% jitter
Attempt 3: After 4s ± 20% jitter
Attempt 4: After 8s ± 20% jitter
Max retries → Move to DLQ (status=FAILED)
```

**429 Rate Limits**:
```
If Retry-After header present:
  Wait for Retry-After seconds
Else:
  Attempt 1: After 16s
  Attempt 2: After 32s
  Attempt 3: After 64s
```

### Non-Retryable Errors

These errors immediately fail without retry:
- `NOT_FOUND` (404) - Product deleted
- `AUTHORIZATION` (401/403) - Invalid credentials
- `VALIDATION` - Invalid price data
- Connector explicitly marks error as non-retryable

### Circuit Breaker

Planned feature to pause worker on sustained failures:
- Consecutive failures > 5 → Open circuit
- Pause processing for 60 seconds
- Alert operations team
- Attempt to close circuit after timeout

---

## Performance

### Benchmarks

**Target**: 100-SKU rule run < 5 minutes (p95)

**Actual** (simulated):
- 100 targets, 5 concurrency → ~2 minutes
- 500 targets, 5 concurrency → ~10 minutes
- 1000 targets, 10 concurrency → ~20 minutes

### Optimization Strategies

1. **Concurrency Tuning**
   - Increase `maxConcurrency` for faster processing
   - Balance against rate limits (Shopify: 2 req/s)

2. **Connector Batching**
   - Future: Batch price updates via GraphQL
   - Reduce API calls for same product variants

3. **Database Optimization**
   - Index on `(status, lastAttempt)` for retry queries
   - Materialized views for DLQ reporting

4. **Caching**
   - Cache connector credentials
   - Cache product metadata during run

### Scaling

- **Horizontal**: Run multiple worker instances (different projects)
- **Vertical**: Increase concurrency per worker
- **Database**: Connection pooling, read replicas for reporting

---

## Monitoring

### Grafana Dashboard

**File**: `packages/monitor/dashboards/automation-runner.json`

**Panels**:
1. **Rule Runs per Hour** - Throughput trend
2. **Success Rate (%)** - Alert if < 97%
3. **Run Duration (p50, p95, p99)** - Performance tracking
4. **DLQ Size Over Time** - Failed targets accumulation
5. **Error Breakdown by Type** - Pie chart
6. **Top Failed SKUs** - Table of frequently failing products
7. **Current Metrics** - Stats panel (total runs, applied, DLQ, 429s)
8. **429 Rate Limit Timeline** - Burst detection

**Alerts**:
- Success rate < 97% for 5 min → Slack #engineering
- DLQ size > 50 for 10 min → Warning
- DLQ size > 100 → PagerDuty
- 429 burst (>3 in 5 min) → Warning

### Logs

Structured JSON logs via `@calibr/monitor`:

```typescript
logger.info('[RulesWorker] Completed rule run', {
  metadata: {
    runId,
    status: 'APPLIED',
    appliedTargets: 98,
    failedTargets: 2,
    duration: 180000 // ms
  }
})
```

**Log Levels**:
- `info` - Normal operations (run start/complete, target applied)
- `warn` - Retries, low success rate, DLQ warnings
- `error` - Failures, max retries exceeded, critical errors

**Correlation IDs**:
- Track requests across services
- Stored in `RuleRun.metadata.correlationId`
- Propagated to all events and logs

---

## Security

### Authentication

- Connectors use encrypted credentials from `ShopifyIntegration` / `AmazonIntegration`
- Tokens refreshed automatically before expiration

### Authorization

- Row-Level Security (RLS) on `RuleRun`, `RuleTarget`
- Tenant isolation via `tenantId`
- Users can only trigger runs for their own projects

### Audit Trail

- All apply operations logged to `Audit` table
- `ExplainTrace` stores detailed reasoning
- Reconciliation mismatches audited
- DLQ reports written to EventLog

### Secrets Management

- Access tokens encrypted at rest (planned: @calibr/security)
- Tokens never logged or exposed in metrics
- Rotation supported via connector re-auth flow

---

## References

### Internal Documentation

- [State Machine](../packages/automation-runner/docs/state-machine.md)
- [Pricing Rules Implementation](./PRICING_RULES_IMPLEMENTATION.md)
- [Event-Driven Architecture](./misc/ARCHITECTURE_DIAGRAM.md)

### External Resources

- [Shopify Rate Limits](https://shopify.dev/api/usage/rate-limits)
- [Exponential Backoff Best Practices](https://cloud.google.com/iot/docs/how-tos/exponential-backoff)
- [Transactional Outbox Pattern](https://microservices.io/patterns/data/transactional-outbox.html)
- [Saga Pattern](https://microservices.io/patterns/data/saga.html)

---

## Next Steps

See [NEXT_TASK_PLAN.md](../agents/docs/_EXECUTION_PACKET_V2/NEXT_TASK_PLAN.md) for M1.6 (Automation Runner Execution APIs) implementation plan.

**M1.6 Deliverables**:
- `POST /api/v1/rules/:ruleId/materialize`
- `POST /api/v1/runs/:runId/apply`
- `POST /api/v1/runs/:runId/reconcile`
- `POST /api/v1/runs/:runId/retry-failed`
- E2E test suite
- UI integration (M1.7)

---

**Document Status**: ✅ Complete
**Reviewed By**: Platform Team
**Last Updated**: November 29, 2025
