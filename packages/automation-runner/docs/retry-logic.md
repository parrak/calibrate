# Retry Logic

**Version**: 1.0.0
**Status**: M0.5 Foundation
**Last Updated**: December 6, 2025

---

## Overview

The Automation Runner implements sophisticated retry logic to handle transient failures when applying price changes to external systems (Shopify, Amazon, Stripe). This document details the retry strategy, backoff algorithms, and error handling patterns.

---

## Retry Parameters

### Configuration

```typescript
export const RETRY_CONFIG = {
  MAX_RETRIES: 3,              // Maximum retry attempts per target
  BASE_DELAY: 2000,            // Initial delay (2 seconds)
  MAX_DELAY: 64000,            // Maximum delay (64 seconds)
  MULTIPLIER: 2,               // Exponential multiplier
  JITTER: 0.2,                 // Random jitter (±20%)
  RATE_LIMIT_BASE: 16000,      // 429 base delay (16 seconds)
  RATE_LIMIT_MAX: 64000        // 429 max delay (64 seconds)
} as const
```

---

## Exponential Backoff

### Standard Retry Schedule

For typical transient errors (network timeouts, temporary service unavailability):

```
Attempt 1: 2s  (2000ms ± 20% jitter) → [1.6s - 2.4s]
Attempt 2: 4s  (4000ms ± 20% jitter) → [3.2s - 4.8s]
Attempt 3: 8s  (8000ms ± 20% jitter) → [6.4s - 9.6s]
After max:  → FAILED, move to DLQ
```

### Implementation

```typescript
function calculateDelay(attempt: number, config = RETRY_CONFIG): number {
  // Exponential: baseDelay * (multiplier ^ attempt)
  const exponentialDelay = config.BASE_DELAY * Math.pow(config.MULTIPLIER, attempt)

  // Cap at max delay
  const delay = Math.min(exponentialDelay, config.MAX_DELAY)

  // Add jitter: ±20%
  const jitterAmount = delay * config.JITTER
  const jitter = (Math.random() * 2 - 1) * jitterAmount

  return Math.floor(delay + jitter)
}
```

---

## Jitter Calculation

### Why Jitter?

Prevents **thundering herd** problem where multiple failed requests retry simultaneously, overwhelming the target system.

### Jitter Formula

```
jitter = ±20% of delay
final_delay = base_delay + random(-20%, +20%)
```

### Example

```typescript
// Attempt 1: 2000ms base delay
const jitter = 2000 * 0.2 = 400ms
const range = [1600ms, 2400ms]
const actual = 2000 + random(-400, +400)
```

---

## Rate Limit Handling (429 Errors)

### Detection

```typescript
function isRateLimitError(error: any): boolean {
  return (
    error.statusCode === 429 ||
    error.code === 'THROTTLED' ||
    error.code === 'RATE_LIMITED'
  )
}
```

### Backoff Strategy

1. **Check `Retry-After` Header**: If present, use the value from the API
2. **Fallback to Exponential Backoff**: If no header, use longer delays (16s, 32s, 64s)

```
429 Error Detected
  ↓
Check Retry-After header
  ↓ (if present)
Wait for Retry-After seconds
  ↓ (if absent)
Exponential backoff: 16s → 32s → 64s
```

### Implementation

```typescript
async function handle429Error(
  error: ShopifyError,
  attempt: number
): Promise<number> {
  // Prefer Retry-After header
  const retryAfter = error.headers?.['retry-after']
  if (retryAfter) {
    const seconds = parseInt(retryAfter, 10)
    return seconds * 1000 // Convert to ms
  }

  // Fallback to exponential backoff with longer delays
  const exponentialDelay = RETRY_CONFIG.RATE_LIMIT_BASE * Math.pow(2, attempt)
  const delay = Math.min(exponentialDelay, RETRY_CONFIG.RATE_LIMIT_MAX)

  // Add jitter
  const jitterAmount = delay * RETRY_CONFIG.JITTER
  const jitter = (Math.random() * 2 - 1) * jitterAmount

  return Math.floor(delay + jitter)
}
```

---

## Error Classification

### Retryable Errors

Errors that should trigger retry logic:

```typescript
const RETRYABLE_ERROR_CODES = [
  // Network errors
  'ECONNRESET',
  'ETIMEDOUT',
  'ENOTFOUND',

  // HTTP errors
  408, // Request Timeout
  429, // Too Many Requests
  500, // Internal Server Error
  502, // Bad Gateway
  503, // Service Unavailable
  504, // Gateway Timeout

  // Shopify-specific
  'THROTTLED',
  'TEMPORARILY_UNAVAILABLE'
] as const

function isRetryableError(error: any): boolean {
  return (
    RETRYABLE_ERROR_CODES.includes(error.code) ||
    RETRYABLE_ERROR_CODES.includes(error.statusCode)
  )
}
```

### Non-Retryable Errors

Errors that should immediately fail:

```typescript
const NON_RETRYABLE_ERROR_CODES = [
  // Client errors
  400, // Bad Request
  401, // Unauthorized
  403, // Forbidden
  404, // Not Found
  422, // Unprocessable Entity

  // Business logic errors
  'INVALID_PRICE',
  'PRODUCT_NOT_FOUND',
  'VARIANT_ARCHIVED',
  'PERMISSION_DENIED'
] as const

function isNonRetryableError(error: any): boolean {
  return (
    NON_RETRYABLE_ERROR_CODES.includes(error.code) ||
    NON_RETRYABLE_ERROR_CODES.includes(error.statusCode)
  )
}
```

---

## Retry Workflow

### Decision Tree

```
Target execution fails
  ↓
Is error retryable?
  ├─ No → FAILED (move to DLQ)
  └─ Yes
      ↓
  Is 429 error?
      ├─ Yes → Use 429 backoff (16s, 32s, 64s)
      └─ No  → Use standard backoff (2s, 4s, 8s)
          ↓
  attempts < MAX_RETRIES?
      ├─ Yes → QUEUED (schedule retry)
      └─ No  → FAILED (move to DLQ)
```

### Implementation

```typescript
async function handleTargetFailure(
  target: RuleTarget,
  error: Error
): Promise<void> {
  // Non-retryable → immediate failure
  if (isNonRetryableError(error)) {
    await updateTarget(target.id, {
      status: 'FAILED',
      errorMessage: error.message,
      attempts: target.attempts + 1
    })
    return
  }

  // Max retries → failure
  if (target.attempts >= RETRY_CONFIG.MAX_RETRIES) {
    await updateTarget(target.id, {
      status: 'FAILED',
      errorMessage: `Max retries (${RETRY_CONFIG.MAX_RETRIES}) exceeded: ${error.message}`,
      attempts: target.attempts + 1
    })
    return
  }

  // Calculate delay
  const delay = isRateLimitError(error)
    ? await handle429Error(error, target.attempts)
    : calculateDelay(target.attempts)

  // Schedule retry
  await updateTarget(target.id, {
    status: 'QUEUED',
    attempts: target.attempts + 1,
    lastAttempt: new Date(),
    errorMessage: error.message
  })

  await scheduleRetry(target.id, delay)
}
```

---

## Dead Letter Queue (DLQ)

### When Targets Enter DLQ

1. **Max Retries Exceeded**: After 3 failed attempts with retryable errors
2. **Non-Retryable Error**: Immediate failure (auth, validation, etc.)
3. **Timeout**: Processing exceeds timeout threshold

### DLQ Query

```typescript
// All targets in DLQ
const dlqTargets = await prisma.ruleTarget.findMany({
  where: {
    status: 'FAILED'
  },
  include: {
    RuleRun: true
  }
})
```

### DLQ Operations

```typescript
// Manual retry from DLQ
async function retryFromDLQ(targetId: string): Promise<void> {
  const target = await prisma.ruleTarget.findUnique({
    where: { id: targetId }
  })

  if (target.status !== 'FAILED') {
    throw new Error('Target is not in DLQ')
  }

  // Reset for retry
  await prisma.ruleTarget.update({
    where: { id: targetId },
    data: {
      status: 'QUEUED',
      attempts: 0, // Reset attempt counter
      lastAttempt: null,
      errorMessage: null
    }
  })

  await queueTarget(targetId)
}
```

---

## Metrics & Monitoring

### Key Metrics

| Metric | Description | Alert Threshold |
|:-------|:------------|:----------------|
| `retry.count` | Total retry attempts | > 100/min (warning) |
| `retry.429.count` | Rate limit retries | > 10/min (warning) |
| `retry.exhausted` | Targets moved to DLQ | > 5/min (critical) |
| `retry.delay_ms` | Average retry delay | > 30000ms (info) |

### Example Monitoring

```typescript
// Increment retry counter
metrics.increment('retry.count', 1, {
  error_type: error.code,
  attempt: target.attempts,
  run_id: target.ruleRunId
})

// Track 429 errors
if (isRateLimitError(error)) {
  metrics.increment('retry.429.count', 1, {
    service: 'shopify',
    delay_ms: delay
  })
}

// Alert on DLQ entries
if (target.attempts >= MAX_RETRIES) {
  metrics.increment('retry.exhausted', 1, {
    run_id: target.ruleRunId,
    final_error: error.code
  })
}
```

---

## Best Practices

### 1. Always Check Error Type

```typescript
// ✅ Good: Classify errors
if (isNonRetryableError(error)) {
  // Fail immediately
} else if (isRateLimitError(error)) {
  // Use 429 backoff
} else {
  // Standard retry
}

// ❌ Bad: Retry everything
await retry(target) // May retry auth errors indefinitely
```

### 2. Log Retry Attempts

```typescript
logger.info('Retrying target', {
  targetId: target.id,
  attempt: target.attempts + 1,
  maxRetries: MAX_RETRIES,
  delay,
  error: error.message
})
```

### 3. Circuit Breaker for 429 Bursts

```typescript
if (consecutive429Count > 5) {
  // Pause worker
  await pauseWorker(60000)

  // Alert
  await alertOps({
    message: 'Circuit breaker triggered',
    service: 'shopify',
    consecutive429: consecutive429Count
  })
}
```

---

## References

- [Exponential Backoff and Jitter](https://aws.amazon.com/blogs/architecture/exponential-backoff-and-jitter/)
- [Shopify Rate Limits](https://shopify.dev/api/usage/rate-limits)
- [Azure Retry Pattern](https://learn.microsoft.com/en-us/azure/architecture/patterns/retry)

---

**Next**: See [state-machine.md](./state-machine.md) for full state machine design
