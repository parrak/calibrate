# Automation Runner Operational Runbook

**Version**: 1.0.0
**Audience**: Platform Team, DevOps, On-Call Engineers
**Last Updated**: November 29, 2025

---

## Table of Contents

- [Quick Reference](#quick-reference)
- [Deployment](#deployment)
- [Monitoring](#monitoring)
- [Common Issues](#common-issues)
- [Troubleshooting](#troubleshooting)
- [Maintenance](#maintenance)
- [Emergency Procedures](#emergency-procedures)

---

## Quick Reference

### Key Metrics

| Metric | Normal | Warning | Critical | Action |
|:-------|:-------|:--------|:---------|:-------|
| Success Rate | > 97% | 90-97% | < 90% | Investigate DLQ, check connectors |
| DLQ Size | < 20 | 20-50 | > 50 | Drain DLQ, check error patterns |
| 429 Errors | < 1/hour | 1-3/5min | > 3/5min | Reduce concurrency, check rate limits |
| Run Duration (p95) | < 5 min | 5-10 min | > 10 min | Check connector health, increase concurrency |

### Critical Endpoints

- **Health Check**: `GET /api/health`
- **Worker Status**: `GET /api/v1/automation/status`
- **DLQ Report**: `GET /api/v1/automation/dlq/:projectId`
- **Metrics**: `GET /api/metrics`

### Emergency Contacts

- **Platform Team**: #platform-team (Slack)
- **On-Call**: PagerDuty rotation
- **Escalation**: engineering-leads@calibr.io

---

## Deployment

### Prerequisites

```bash
# Required environment variables
DATABASE_URL="postgresql://..."
WORKER_MAX_CONCURRENCY=5
WORKER_POLL_INTERVAL=5000
WORKER_MAX_RETRIES=3
WORKER_ENABLE_RECONCILIATION=true
WORKER_RECONCILIATION_DELAY=300000
```

### Deployment Steps

#### 1. Database Migration

```bash
# Run from repository root
pnpm --filter @calibr/db prisma migrate deploy
```

**Verify**:
```sql
-- Check that new columns exist
SELECT column_name, data_type
FROM information_schema.columns
WHERE table_name = 'RuleRun'
  AND column_name IN ('queuedAt', 'metadata');

SELECT column_name, data_type
FROM information_schema.columns
WHERE table_name = 'RuleTarget'
  AND column_name IN ('attempts', 'lastAttempt', 'appliedAt', 'skuId');
```

#### 2. Build Packages

```bash
# Build automation-runner package
pnpm --filter @calibr/automation-runner build

# Build dependent packages
pnpm --filter @calibr/api build
```

#### 3. Deploy API

```bash
# Railway deployment
railway up --service api

# Or Vercel deployment
vercel --prod
```

#### 4. Start Worker

**Option A: Standalone Worker Process**

```bash
# Create worker startup script
# File: apps/worker/index.ts

import { getRulesWorker } from '@calibr/automation-runner'
import { getShopifyConnector } from '@calibr/shopify-connector'
import { getAmazonConnector } from '@calibr/amazon-connector'

const worker = getRulesWorker()

// Register connectors
worker.registerConnector('shopify', getShopifyConnector())
worker.registerConnector('amazon', getAmazonConnector())

// Start worker
await worker.start()

console.log('Automation worker started successfully')

// Graceful shutdown
process.on('SIGTERM', async () => {
  console.log('Received SIGTERM, shutting down gracefully')
  await worker.stop()
  process.exit(0)
})
```

**Option B: Integrated with API**

```typescript
// apps/api/lib/startup.ts
import { getRulesWorker } from '@calibr/automation-runner'

export async function startWorker() {
  const worker = getRulesWorker()
  // ... register connectors
  await worker.start()
}
```

#### 5. Verify Deployment

```bash
# Check health endpoint
curl https://api.calibr.io/api/health

# Check worker is processing
curl https://api.calibr.io/api/v1/automation/status

# Expected response:
{
  "status": "running",
  "uptime": 3600,
  "queueSize": 0,
  "processing": 0
}
```

### Rollback Procedure

```bash
# 1. Stop worker (if standalone)
kill -SIGTERM <worker_pid>

# 2. Revert API deployment
railway rollback --service api
# or
vercel rollback

# 3. Rollback database migration (if needed)
pnpm --filter @calibr/db prisma migrate resolve --rolled-back <migration_name>

# 4. Restart worker with previous version
# ...
```

---

## Monitoring

### Grafana Dashboard

**URL**: `https://grafana.calibr.io/d/automation-runner`

**Key Panels**:
1. **Success Rate** - Must stay > 97%
2. **DLQ Size** - Monitor for growth
3. **Run Duration** - Track p95 < 5 min
4. **429 Errors** - Watch for bursts

### Alert Configuration

**Slack Notifications** (#engineering):
- Success rate drops below 97% for 5 minutes
- DLQ size exceeds 50 for 10 minutes
- 429 burst detected (>3 in 5 minutes)

**PagerDuty Alerts** (Critical):
- Success rate drops below 90%
- DLQ size exceeds 100
- Worker crashes/stops responding

### Log Monitoring

```bash
# View worker logs (Railway)
railway logs --service api --filter "RulesWorker"

# View worker logs (Vercel)
vercel logs --filter "RulesWorker"

# Grep for errors
railway logs | grep "ERROR" | grep "RulesWorker"

# Track specific run
railway logs | grep "runId: run-abc123"
```

---

## Common Issues

### Issue 1: Low Success Rate (< 97%)

**Symptoms**:
- Grafana alert: "Success Rate Below 97%"
- Increasing DLQ size
- User complaints about failed price updates

**Diagnosis**:
```bash
# Check DLQ for error patterns
curl https://api.calibr.io/api/v1/automation/dlq/:projectId

# Look for error types
# Expected response:
{
  "totalFailed": 25,
  "byErrorType": {
    "RATE_LIMIT": 15,
    "TIMEOUT": 5,
    "NOT_FOUND": 3,
    "NETWORK": 2
  },
  "recommendations": [...]
}
```

**Resolution**:

1. **High Rate Limits** (byErrorType.RATE_LIMIT > 20%):
   ```bash
   # Reduce worker concurrency
   railway env set WORKER_MAX_CONCURRENCY=3
   railway restart --service api
   ```

2. **Network/Timeout Errors**:
   ```bash
   # Check connector health
   curl https://api.calibr.io/api/platforms/shopify/health

   # Increase timeout if needed
   railway env set CONNECTOR_TIMEOUT=30000
   railway restart --service api
   ```

3. **Authorization Errors**:
   ```bash
   # Refresh connector tokens
   # Navigate to Console → Integrations → Reconnect
   ```

4. **Not Found Errors** (products deleted):
   ```bash
   # Archive stale products
   psql $DATABASE_URL -c "
     UPDATE \"Product\"
     SET active = false
     WHERE id IN (
       SELECT DISTINCT \"productId\"
       FROM \"RuleTarget\"
       WHERE status = 'FAILED'
         AND \"errorMessage\" LIKE '%not found%'
     )
   "
   ```

---

### Issue 2: DLQ Size Growing

**Symptoms**:
- Grafana panel shows DLQ size > 50
- DLQ size alert triggered

**Diagnosis**:
```bash
# Get DLQ report
curl https://api.calibr.io/api/v1/automation/dlq/:projectId

# Check stale entries (>24h old)
curl https://api.calibr.io/api/v1/automation/dlq/:projectId/stale
```

**Resolution**:

1. **Retry Retryable Errors**:
   ```bash
   # Retry all failed targets for a run
   curl -X POST https://api.calibr.io/api/v1/runs/:runId/retry-failed
   ```

2. **Archive Non-Retryable**:
   ```sql
   -- Mark non-retryable targets as archived
   UPDATE "RuleTarget"
   SET status = 'FAILED', "errorMessage" = 'Archived: Non-retryable error'
   WHERE status = 'FAILED'
     AND "errorMessage" LIKE ANY(ARRAY['%not found%', '%unauthorized%', '%validation%'])
     AND "lastAttempt" < NOW() - INTERVAL '7 days';
   ```

3. **Purge Old Entries**:
   ```typescript
   // Via DLQ service
   import { getDLQService } from '@calibr/automation-runner'

   const dlq = getDLQService()
   const purged = await dlq.purgeOldEntries(projectId, 7 * 24 * 60 * 60 * 1000) // 7 days
   console.log(`Purged ${purged} old entries`)
   ```

---

### Issue 3: 429 Rate Limit Burst

**Symptoms**:
- Grafana alert: "429 Burst: >3 errors in 5 minutes"
- Shopify/Amazon requests failing
- Slow rule execution

**Diagnosis**:
```bash
# Check recent 429 errors
railway logs --since 5m | grep "429"

# Check worker concurrency
railway env | grep WORKER_MAX_CONCURRENCY
```

**Resolution**:

1. **Immediate**: Reduce Concurrency
   ```bash
   railway env set WORKER_MAX_CONCURRENCY=2
   railway restart --service api
   ```

2. **Medium-term**: Implement Circuit Breaker
   ```typescript
   // In worker config
   {
     circuitBreaker: {
       enabled: true,
       rateLimitThreshold: 3,
       pauseDuration: 60000 // 1 minute
     }
   }
   ```

3. **Long-term**: Batch Requests
   ```typescript
   // Use GraphQL bulk operations for Shopify
   // Update connector to batch price updates
   ```

---

### Issue 4: Worker Not Processing

**Symptoms**:
- Runs stuck in QUEUED state
- No logs from RulesWorker
- Worker status endpoint returns error

**Diagnosis**:
```bash
# Check if worker is running
ps aux | grep "worker"

# Check worker logs
railway logs --filter "worker.started"

# Check database connection
psql $DATABASE_URL -c "SELECT 1"

# Check outbox events
psql $DATABASE_URL -c "
  SELECT COUNT(*), status
  FROM \"Outbox\"
  WHERE \"eventType\" = 'job.rules.apply'
  GROUP BY status
"
```

**Resolution**:

1. **Worker Crashed**:
   ```bash
   # Restart worker
   railway restart --service api

   # Check for crash logs
   railway logs --since 1h | grep "ERROR\|FATAL"
   ```

2. **Database Connection Lost**:
   ```bash
   # Check database health
   railway status --service database

   # Restart API (re-establishes connection)
   railway restart --service api
   ```

3. **Outbox Events Stuck**:
   ```sql
   -- Reset stuck outbox events
   UPDATE "Outbox"
   SET status = 'PENDING', "retryCount" = 0, "nextRetryAt" = NOW()
   WHERE status = 'PROCESSING'
     AND "updatedAt" < NOW() - INTERVAL '10 minutes';
   ```

---

## Troubleshooting

### Debugging a Failed Run

```bash
# 1. Get run details
psql $DATABASE_URL -c "
  SELECT id, status, \"queuedAt\", \"startedAt\", \"finishedAt\", \"errorMessage\"
  FROM \"RuleRun\"
  WHERE id = 'run-abc123'
"

# 2. Get failed targets
psql $DATABASE_URL -c "
  SELECT id, \"productId\", status, attempts, \"errorMessage\"
  FROM \"RuleTarget\"
  WHERE \"ruleRunId\" = 'run-abc123'
    AND status = 'FAILED'
  LIMIT 10
"

# 3. Check audit trail
psql $DATABASE_URL -c "
  SELECT action, actor, explain, \"createdAt\"
  FROM \"Audit\"
  WHERE entity = 'RuleRun'
    AND \"entityId\" = 'run-abc123'
  ORDER BY \"createdAt\" DESC
"

# 4. Check events
psql $DATABASE_URL -c "
  SELECT \"eventType\", payload, \"createdAt\"
  FROM \"EventLog\"
  WHERE payload::jsonb @> '{\"runId\": \"run-abc123\"}'::jsonb
  ORDER BY \"createdAt\" DESC
"
```

### Performance Profiling

```bash
# Check slow runs
psql $DATABASE_URL -c "
  SELECT
    id,
    EXTRACT(EPOCH FROM (\"finishedAt\" - \"queuedAt\")) AS duration_seconds,
    (SELECT COUNT(*) FROM \"RuleTarget\" WHERE \"ruleRunId\" = r.id) AS target_count
  FROM \"RuleRun\" r
  WHERE status IN ('APPLIED', 'PARTIAL', 'FAILED')
    AND \"finishedAt\" IS NOT NULL
  ORDER BY duration_seconds DESC
  LIMIT 10
"

# Check target distribution
psql $DATABASE_URL -c "
  SELECT
    status,
    COUNT(*) as count,
    AVG(attempts) as avg_attempts
  FROM \"RuleTarget\"
  WHERE \"ruleRunId\" = 'run-abc123'
  GROUP BY status
"
```

### Network Connectivity

```bash
# Test Shopify connectivity
curl -I https://admin.shopify.com/

# Test Amazon SP-API
curl -I https://sellingpartnerapi-na.amazon.com/

# Check DNS resolution
dig admin.shopify.com
dig sellingpartnerapi-na.amazon.com

# Check from worker environment
railway run --service api -- curl -I https://admin.shopify.com/
```

---

## Maintenance

### Daily Tasks

1. **Check Dashboard** (5 min)
   - Review success rate trend
   - Check DLQ size
   - Verify no active alerts

2. **Review Logs** (5 min)
   ```bash
   railway logs --since 24h | grep "ERROR" | wc -l
   ```

### Weekly Tasks

1. **DLQ Cleanup** (15 min)
   ```typescript
   import { getDLQService } from '@calibr/automation-runner'

   const dlq = getDLQService()

   // For each project
   for (const projectId of projectIds) {
     const report = await dlq.drainDLQ(projectId)
     console.log(`Project ${projectId}: ${report.totalFailed} failed targets`)

     // Review recommendations
     report.recommendations.forEach(rec => console.log(`- ${rec}`))
   }
   ```

2. **Performance Review** (30 min)
   - Check p95 duration trend
   - Review slow runs
   - Optimize if needed

3. **Database Maintenance** (15 min)
   ```sql
   -- Archive old runs (>90 days)
   UPDATE "RuleRun"
   SET status = 'ROLLED_BACK'
   WHERE "createdAt" < NOW() - INTERVAL '90 days'
     AND status IN ('APPLIED', 'PARTIAL', 'FAILED');

   -- Vacuum tables
   VACUUM ANALYZE "RuleRun";
   VACUUM ANALYZE "RuleTarget";
   ```

### Monthly Tasks

1. **Security Review** (1 hour)
   - Rotate connector credentials
   - Review access logs
   - Update dependencies

2. **Capacity Planning** (1 hour)
   - Project growth in rule runs
   - Estimate database growth
   - Plan scaling needs

---

## Emergency Procedures

### Worker Crash Recovery

```bash
# 1. Identify crash time
railway logs --since 4h | grep "FATAL\|crashed"

# 2. Check if runs were interrupted
psql $DATABASE_URL -c "
  SELECT id, status, \"startedAt\", \"updatedAt\"
  FROM \"RuleRun\"
  WHERE status = 'APPLYING'
    AND \"updatedAt\" < NOW() - INTERVAL '30 minutes'
"

# 3. Reset interrupted runs
psql $DATABASE_URL -c "
  UPDATE \"RuleRun\"
  SET status = 'QUEUED', \"startedAt\" = NULL
  WHERE status = 'APPLYING'
    AND \"updatedAt\" < NOW() - INTERVAL '30 minutes'
"

# 4. Restart worker
railway restart --service api

# 5. Monitor recovery
railway logs --filter "RulesWorker" --follow
```

### Database Connection Loss

```bash
# 1. Check database health
railway status --service database

# 2. Check connection pool
psql $DATABASE_URL -c "
  SELECT count(*), state
  FROM pg_stat_activity
  WHERE datname = current_database()
  GROUP BY state
"

# 3. Kill idle connections if needed
psql $DATABASE_URL -c "
  SELECT pg_terminate_backend(pid)
  FROM pg_stat_activity
  WHERE datname = current_database()
    AND state = 'idle'
    AND state_change < NOW() - INTERVAL '10 minutes'
"

# 4. Restart API
railway restart --service api
```

### Mass Failure Event

If >50% of targets fail:

```bash
# 1. Stop worker immediately
railway env set WORKER_DISABLE_POLLING=true
railway restart --service api

# 2. Investigate root cause
# - Check connector health
# - Review error messages
# - Check external service status

# 3. Fix root cause
# (e.g., refresh credentials, fix connector bug)

# 4. Re-enable worker
railway env set WORKER_DISABLE_POLLING=false
railway restart --service api

# 5. Retry failed targets
curl -X POST https://api.calibr.io/api/v1/runs/:runId/retry-failed
```

---

## Appendices

### A. Environment Variables

| Variable | Default | Description |
|:---------|:--------|:------------|
| `WORKER_MAX_CONCURRENCY` | 5 | Max concurrent target applications |
| `WORKER_POLL_INTERVAL` | 5000 | Outbox poll interval (ms) |
| `WORKER_MAX_RETRIES` | 3 | Max retry attempts per target |
| `WORKER_ENABLE_RECONCILIATION` | true | Enable post-apply reconciliation |
| `WORKER_RECONCILIATION_DELAY` | 300000 | Reconciliation delay (ms) |
| `WORKER_DISABLE_POLLING` | false | Disable worker polling (emergency) |

### B. Database Queries

**Find runs by status**:
```sql
SELECT * FROM "RuleRun" WHERE status = 'PARTIAL' ORDER BY "createdAt" DESC LIMIT 10;
```

**Find failed targets for a run**:
```sql
SELECT * FROM "RuleTarget" WHERE "ruleRunId" = 'run-abc' AND status = 'FAILED';
```

**Count targets by status**:
```sql
SELECT status, COUNT(*) FROM "RuleTarget" GROUP BY status;
```

**Recent reconciliation reports**:
```sql
SELECT * FROM "EventLog" WHERE "eventType" = 'automation.reconciliation.completed' ORDER BY "createdAt" DESC LIMIT 10;
```

### C. Useful Commands

```bash
# Tail worker logs
railway logs --filter "RulesWorker" --follow

# Check worker metrics
curl https://api.calibr.io/api/v1/automation/metrics

# Manually reconcile a run
curl -X POST https://api.calibr.io/api/v1/runs/:runId/reconcile

# Get DLQ report
curl https://api.calibr.io/api/v1/automation/dlq/:projectId

# Retry all failed targets
curl -X POST https://api.calibr.io/api/v1/runs/:runId/retry-failed
```

---

**Document Status**: ✅ Complete
**Maintained By**: Platform Team
**Last Updated**: November 29, 2025
