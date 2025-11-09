# Calibr Outbox Worker

Standalone service for processing outbox events with retry/backoff logic.

## Overview

The Outbox Worker implements the Transactional Outbox pattern for reliable event delivery. It:

- Polls the `Outbox` table for pending events
- Executes registered event handlers
- Retries failed events with exponential backoff
- Moves failed events to DLQ after max retries
- Records event metrics for monitoring

## Running Locally

```bash
# Development mode (auto-reload)
pnpm dev

# Production mode
pnpm start
```

## Configuration

Environment variables:

- `DATABASE_URL` - PostgreSQL connection string (required)
- `OUTBOX_POLL_INTERVAL_MS` - How often to check for pending events (default: 5000)
- `OUTBOX_MAX_RETRIES` - Max retry attempts before DLQ (default: 5)
- `OUTBOX_INITIAL_DELAY_MS` - Initial retry delay (default: 1000)
- `OUTBOX_MAX_DELAY_MS` - Max retry delay cap (default: 60000)
- `OUTBOX_BACKOFF_MULTIPLIER` - Exponential backoff multiplier (default: 2)
- `LOG_LEVEL` - Logging level: debug, info, warn, error (default: info)
- `SERVICE_NAME` - Service name for logs (default: calibr-outbox-worker)

## Deployment

### Docker

```bash
# Build
docker build -t calibr-outbox-worker -f Dockerfile ../..

# Run
docker run -e DATABASE_URL=postgresql://... calibr-outbox-worker
```

### Railway

Deploy using Railway template:

```bash
railway up
```

Configuration is read from `railway.json`.

### Kubernetes

```yaml
apiVersion: apps/v1
kind: Deployment
metadata:
  name: calibr-outbox-worker
spec:
  replicas: 1
  selector:
    matchLabels:
      app: calibr-outbox-worker
  template:
    metadata:
      labels:
        app: calibr-outbox-worker
    spec:
      containers:
      - name: worker
        image: calibr-outbox-worker:latest
        env:
        - name: DATABASE_URL
          valueFrom:
            secretKeyRef:
              name: calibr-secrets
              key: database-url
        - name: OUTBOX_POLL_INTERVAL_MS
          value: "5000"
        resources:
          requests:
            memory: "256Mi"
            cpu: "250m"
          limits:
            memory: "512Mi"
            cpu: "500m"
        livenessProbe:
          exec:
            command:
            - node
            - -e
            - require('http').get('http://localhost:3001/health')
          initialDelaySeconds: 30
          periodSeconds: 30
```

## Event Subscribers

Register event handlers in `outbox-worker.ts`:

```typescript
worker.subscribe({
  eventTypes: ['shopify.sync.product'],
  handler: async (event) => {
    // Handle Shopify product sync
    console.log('Processing', event)
  }
})
```

## Monitoring

### Health Check

The worker performs periodic health checks:

- Database connectivity
- DLQ size (fails if > 100 events)

Logs metrics every minute:

- Total outbox events
- Pending/processing/completed/failed counts
- DLQ count

### Metrics

Event processing metrics are recorded to `@calibr/monitor`:

- Event latency
- Success/failure rates
- Retry counts

Access via `/api/metrics/enhanced` endpoint.

## Graceful Shutdown

The worker handles `SIGTERM` and `SIGINT` gracefully:

1. Stops polling for new events
2. Waits for in-flight events to complete
3. Disconnects from database
4. Exits with code 0

## Troubleshooting

### Events stuck in PENDING

Check worker logs for errors. Possible causes:

- Worker not running
- Database connection issues
- Event handler throwing errors

### DLQ growing

Events in the DLQ have exceeded max retries. Check:

- Event payload validity
- Downstream service availability
- Handler logic errors

Manually retry from DLQ:

```typescript
const outboxId = await worker.retryFromDlq(dlqEventId)
```

### High memory usage

- Reduce `OUTBOX_POLL_INTERVAL_MS`
- Scale horizontally (multiple worker instances)
- Check for memory leaks in handlers

## Best Practices

1. **Idempotent handlers** - Handlers should be safe to retry
2. **Fast handlers** - Keep handler logic quick; offload heavy work
3. **Monitoring** - Set up alerts for DLQ growth and failed events
4. **Scaling** - Run multiple workers for high throughput
5. **Testing** - Test handlers with synthetic events before production

## Development

### Adding New Subscribers

1. Import handler logic
2. Register subscriber in `outbox-worker.ts`
3. Test with synthetic events
4. Deploy

### Testing

Create test events:

```typescript
import { EventWriter } from '@calibr/db/eventing'

const writer = new EventWriter(prisma)

await writer.writeEventWithOutbox({
  eventKey: 'test-event-1',
  tenantId: 'tenant-123',
  eventType: 'test.event',
  payload: { data: 'test' }
})
```

Worker will process automatically.

## Production Checklist

- [ ] Set DATABASE_URL
- [ ] Configure retry settings
- [ ] Set up monitoring/alerts
- [ ] Configure log aggregation
- [ ] Set resource limits (memory/CPU)
- [ ] Test graceful shutdown
- [ ] Set up horizontal scaling (if needed)
- [ ] Document incident response
