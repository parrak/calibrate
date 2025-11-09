# Event Bus System

This package implements a robust event bus system using the Transactional Outbox pattern for reliable event delivery.

## Architecture

The event bus consists of three main components:

### 1. EventLog (Append-Only Event Store)
- Stores all events with idempotent dedupe via `eventKey + tenantId`
- Supports versioning and correlation IDs for tracing
- Enables event replay for recovery and connector synchronization

### 2. Outbox (Transactional Outbox Pattern)
- Ensures atomic event publishing with domain changes
- Implements retry logic with exponential backoff
- Tracks event processing status and error handling

### 3. Dead Letter Queue (DLQ)
- Stores events that failed after max retries
- Allows manual intervention and retry
- Provides visibility into systemic issues

## Usage

### Writing Events

```typescript
import { PrismaClient } from '@prisma/client'
import { EventWriter } from '@calibr/db/eventing'

const prisma = new PrismaClient()
const eventWriter = new EventWriter(prisma)

// Write a simple event
const eventId = await eventWriter.writeEvent({
  eventKey: 'product-123-updated',
  tenantId: 'tenant-abc',
  projectId: 'project-xyz',
  eventType: 'product.updated',
  payload: {
    productId: '123',
    changes: { price: 29.99 }
  },
  correlationId: 'request-456'
})

// Write event with outbox (for async processing)
const { eventLogId, outboxId } = await eventWriter.writeEventWithOutbox({
  eventKey: 'price-change-789',
  tenantId: 'tenant-abc',
  eventType: 'pricechange.applied',
  payload: {
    changeId: '789',
    affectedProducts: 50
  }
})
```

### Processing Events (Outbox Worker)

```typescript
import { OutboxWorker } from '@calibr/db/eventing'

const worker = new OutboxWorker(prisma, {
  pollIntervalMs: 5000, // Poll every 5 seconds
  retryConfig: {
    maxRetries: 5,
    initialDelayMs: 1000,
    maxDelayMs: 60000,
    backoffMultiplier: 2
  }
})

// Subscribe to event types
worker.subscribe({
  eventTypes: ['product.updated', 'product.created'],
  handler: async (event) => {
    console.log('Processing product event:', event)
    // Sync to connector, update cache, etc.
  }
})

// Start processing
worker.start()

// Stop when done
// worker.stop()
```

### Replaying Events

```typescript
import { EventReplay } from '@calibr/db/eventing'

const replay = new EventReplay(prisma)

// Subscribe to replayed events
replay.subscribe({
  eventTypes: ['product.*'],
  handler: async (event) => {
    console.log('Replaying event:', event)
  }
})

// Replay events for a tenant
const processedCount = await replay.replay({
  tenantId: 'tenant-abc',
  eventTypes: ['product.updated', 'product.created'],
  fromDate: new Date('2025-01-01'),
  toDate: new Date('2025-01-31')
})

console.log(`Replayed ${processedCount} events`)
```

### Event Metrics

```typescript
import { recordEventMetric, getEventBusStats } from '@calibr/monitor'

// Record event processing metric
recordEventMetric({
  timestamp: Date.now(),
  eventId: 'evt-123',
  eventType: 'product.updated',
  tenantId: 'tenant-abc',
  latencyMs: 150,
  retryCount: 0,
  status: 'success'
})

// Get statistics
const stats = getEventBusStats(60 * 60 * 1000) // Last hour
console.log('Event bus stats:', {
  totalEvents: stats.totalEvents,
  averageLatency: stats.averageLatency,
  p95Latency: stats.p95Latency,
  successRate: stats.successRate,
  throughput: stats.throughput
})
```

## Event Types Naming Convention

Use a hierarchical naming scheme:

- `{resource}.{action}` - e.g., `product.created`, `product.updated`
- `{service}.{resource}.{action}` - e.g., `shopify.product.synced`
- `{domain}.{event}` - e.g., `pricechange.applied`, `audit.recorded`

## Idempotency

Events are deduplicated using `eventKey + tenantId`:

- Use a unique, stable key per logical event (e.g., `product-${productId}-updated-${timestamp}`)
- For operations that can happen multiple times, include a sequence number
- The same event key will never create duplicate entries in EventLog

## Retry Strategy

Failed events are retried with exponential backoff:

1. Initial delay: 1 second
2. Backoff multiplier: 2x
3. Max delay: 60 seconds
4. Max retries: 5 (configurable)
5. After max retries → moved to DLQ

## Monitoring

Key metrics to monitor:

- **Event latency** (p50, p95, p99) - Time from creation to processing
- **Throughput** - Events processed per second
- **Success rate** - Percentage of events processed successfully
- **Retry rate** - Percentage of events requiring retries
- **DLQ size** - Number of failed events requiring manual intervention

## Best Practices

1. **Always use correlation IDs** for tracing multi-step operations
2. **Keep payloads small** - Store references, not large objects
3. **Design for idempotency** - Subscribers should handle duplicate events
4. **Monitor DLQ** - Set up alerts for events entering the DLQ
5. **Test replay** - Ensure subscribers can handle replayed events
6. **Use transactions** - Write events in the same transaction as domain changes

## Database Schema

See `packages/db/prisma/schema.prisma` for the complete schema definition.

## Migration

Run migrations with:

```bash
pnpm prisma migrate deploy
```

## Testing

Run tests with:

```bash
pnpm test src/eventing
```
