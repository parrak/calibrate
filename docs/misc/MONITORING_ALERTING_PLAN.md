# Monitoring & Alerting Plan

**Owner:** Agent C
**Priority:** HIGH
**Status:** Planning → Implementation

---

## Overview

This document outlines the monitoring and alerting strategy for Calibrate's production environment. The goal is to detect issues before users are impacted and respond quickly when problems occur.

---

## Monitoring Objectives

### Primary Goals
1. **Availability:** Ensure services are accessible 99.9% of the time
2. **Performance:** Maintain response times within SLA
3. **Errors:** Detect and alert on error rate spikes
4. **Security:** Identify suspicious activity and breaches
5. **Business Metrics:** Track user engagement and platform health

### Key Metrics (Golden Signals)
- **Latency:** How long requests take
- **Traffic:** Number of requests per second
- **Errors:** Rate of failed requests
- **Saturation:** Resource utilization (CPU, memory, disk)

---

## Current Monitoring (Built-in)

### Railway (API Service)

**Available Metrics:**
- CPU usage (%)
- Memory usage (MB)
- Network traffic (in/out)
- Deployment status
- Build logs
- Application logs

**Access:** https://railway.app/project/calibr-api/metrics

**Limitations:**
- ❌ No custom metrics
- ❌ No alerting (manual check only)
- ❌ Limited retention (7 days)
- ❌ No distributed tracing

### Vercel (Console Application)

**Available Metrics:**
- Bandwidth usage
- Function executions
- Function duration
- Cache hit rate
- Edge requests
- Build status

**Access:** https://vercel.com/dashboard/analytics

**Limitations:**
- ❌ No application-level errors
- ❌ Limited free tier alerts
- ❌ No custom events

---

## Proposed Monitoring Stack

### Phase 1: Essential (Immediate)

#### 1. Application Logging
**Tool:** Console + Railway/Vercel native logging

**Implementation:**
```typescript
// packages/logging/src/logger.ts

import winston from 'winston'

export const logger = winston.createLogger({
  level: process.env.LOG_LEVEL || 'info',
  format: winston.format.combine(
    winston.format.timestamp(),
    winston.format.errors({ stack: true }),
    winston.format.json()
  ),
  defaultMeta: {
    service: process.env.SERVICE_NAME || 'api',
    environment: process.env.NODE_ENV || 'development'
  },
  transports: [
    new winston.transports.Console({
      format: winston.format.combine(
        winston.format.colorize(),
        winston.format.simple()
      )
    })
  ]
})

// Usage
logger.info('User logged in', { userId: 'xxx' })
logger.error('Database connection failed', { error })
logger.warn('Rate limit approaching', { ip: '1.2.3.4' })
```

**Log Levels:**
- `error`: System failures, exceptions
- `warn`: Degraded performance, approaching limits
- `info`: Normal operations, user actions
- `debug`: Detailed diagnostic info
- `verbose`: Very detailed (development only)

**Structured Logging Format:**
```json
{
  "timestamp": "2025-10-27T10:00:00.000Z",
  "level": "error",
  "service": "api",
  "environment": "production",
  "message": "Failed to sync platform",
  "context": {
    "platform": "shopify",
    "projectId": "xxx",
    "userId": "yyy",
    "error": "Connection timeout"
  },
  "stack": "Error: Connection timeout\n  at ..."
}
```

---

#### 2. Health Check Endpoints
**Location:** API service

**Endpoints:**
```typescript
// GET /api/health
{
  status: 'healthy' | 'degraded' | 'down',
  timestamp: string,
  uptime: number,
  version: string
}

// GET /api/health/detailed
{
  status: 'healthy',
  checks: {
    database: { status: 'up', latency: 5 },
    redis: { status: 'up', latency: 2 },
    externalApi: { status: 'degraded', latency: 3000 }
  },
  resources: {
    memory: { used: 100, total: 512, percentage: 20 },
    cpu: { percentage: 15 },
    disk: { used: 1024, total: 10240, percentage: 10 }
  }
}
```

**Health Check Monitors:**
- Railway built-in health check (port listening)
- External uptime monitor (UptimeRobot - free tier)
- Internal cron job (every 5 minutes)

---

#### 3. Uptime Monitoring
**Tool:** UptimeRobot (Free tier)

**Monitors:**
- API: https://api.calibr.lat/api/health (every 5 min)
- Console: https://console.calibr.lat (every 5 min)
- Marketing: https://calibr.lat (every 5 min)
- Docs: https://docs.calibr.lat (every 5 min)

**Alerts:**
- Email on downtime
- Email on slow response (> 5s)

**Setup:**
```bash
# Sign up at https://uptimerobot.com
# Add 4 monitors (HTTP)
# Set alert contacts (email)
# Enable public status page
```

---

### Phase 2: Enhanced (Next Month)

#### 4. Error Tracking
**Tool:** Sentry (Recommended)

**Features:**
- Real-time error tracking
- Stack traces with source maps
- User context (who experienced error)
- Breadcrumbs (events leading to error)
- Release tracking
- Performance monitoring

**Integration:**
```typescript
// apps/api/lib/sentry.ts
import * as Sentry from '@sentry/node'

Sentry.init({
  dsn: process.env.SENTRY_DSN,
  environment: process.env.NODE_ENV,
  release: process.env.RAILWAY_GIT_COMMIT_SHA,
  tracesSampleRate: 0.1, // 10% of transactions
  integrations: [
    new Sentry.Integrations.Http({ tracing: true }),
    new Sentry.Integrations.Prisma({ client: prisma })
  ]
})

// Capture errors
try {
  await dangerousOperation()
} catch (error) {
  Sentry.captureException(error, {
    tags: { operation: 'platform-sync' },
    user: { id: userId },
    extra: { platform, projectId }
  })
}
```

**Console Integration:**
```typescript
// apps/console/app/error.tsx
'use client'

import * as Sentry from '@sentry/nextjs'

export default function Error({ error }: { error: Error }) {
  Sentry.captureException(error)
  return <ErrorPage />
}
```

**Cost:** Free tier (5k events/month) → $29/month (50k events)

---

#### 5. Application Performance Monitoring (APM)
**Tool:** Sentry Performance or DataDog

**Metrics:**
- API endpoint latency (p50, p95, p99)
- Database query performance
- External API calls (Shopify, Amazon)
- Function execution times
- Slow transactions (> 1s)

**Traces:**
```
HTTP Request: POST /api/platforms/shopify/sync
├─ Database: findUnique (5ms)
├─ Shopify API: GET /products (850ms) ← SLOW
├─ Database: createMany (15ms)
└─ Response (900ms total)
```

**Alerts:**
- p95 latency > 2s
- Database queries > 500ms
- External API failures > 10%

---

#### 6. Custom Metrics
**Tool:** StatsD + Grafana Cloud (Free tier)

**Business Metrics:**
```typescript
// packages/metrics/src/index.ts
import { StatsD } from 'node-statsd'

const statsd = new StatsD({
  host: process.env.STATSD_HOST,
  port: 8125
})

// Track events
statsd.increment('user.login')
statsd.increment('platform.connected', { platform: 'shopify' })
statsd.increment('price.updated')
statsd.histogram('sync.duration', syncDuration)
statsd.gauge('integrations.active', activeCount)
```

**Dashboards:**
- User activity (logins, signups)
- Platform connections (Shopify, Amazon)
- Sync operations (success rate, duration)
- Price changes (applied, rejected)
- API usage (requests per endpoint)

---

### Phase 3: Advanced (Future)

#### 7. Log Aggregation
**Tool:** Logtail or Better Stack

**Features:**
- Centralized log storage
- Search and filtering
- Log correlation across services
- Anomaly detection
- Long-term retention

**Query Examples:**
```sql
-- Find all errors in last hour
level:error timestamp:[now-1h TO now]

-- Find slow database queries
message:"slow query" duration:>1000

-- Find failed authentication attempts
event:"auth.failed" user.ip:*
```

---

#### 8. Synthetic Monitoring
**Tool:** Checkly or Datadog Synthetics

**Scenarios:**
- User login flow
- Platform connection (OAuth)
- Product sync
- Price update
- API endpoint tests

**Runs:** Every 5 minutes from multiple regions

---

#### 9. Real User Monitoring (RUM)
**Tool:** LogRocket or Sentry Session Replay

**Captures:**
- User sessions (video replay)
- Console errors
- Network requests
- Performance metrics
- User frustration signals (rage clicks)

**Privacy:** Sanitize sensitive data (passwords, tokens)

---

## Alerting Strategy

### Alert Channels

**Immediate (P0/P1):**
- PagerDuty (phone call, SMS)
- Slack (#alerts channel)
- Email (on-call engineer)

**Standard (P2/P3):**
- Slack (#monitoring channel)
- Email digest (daily)

---

### Alert Rules

#### Critical (P0) - Immediate Response

**Service Down**
```yaml
Condition: Health check returns 5xx for 2 consecutive minutes
Alert: "🚨 API is DOWN - health check failed"
Action: Page on-call engineer
```

**Database Connection Lost**
```yaml
Condition: Database connection errors > 10 in 1 minute
Alert: "🚨 Database connection lost"
Action: Page on-call engineer
```

**Error Spike**
```yaml
Condition: Error rate > 10% of requests for 5 minutes
Alert: "🚨 Error spike detected"
Action: Page on-call engineer
```

---

#### High (P1) - Urgent

**High Latency**
```yaml
Condition: p95 latency > 5s for 10 minutes
Alert: "⚠️ API latency degraded"
Action: Slack + Email
```

**Memory Leak**
```yaml
Condition: Memory usage > 90% for 15 minutes
Alert: "⚠️ Memory usage critical"
Action: Slack + Email
```

**Failed Syncs**
```yaml
Condition: Platform sync failure rate > 50% for 30 minutes
Alert: "⚠️ Platform syncs failing"
Action: Slack + Email
```

---

#### Medium (P2) - Important

**Slow Queries**
```yaml
Condition: Database queries > 1s (count > 10 in 1 hour)
Alert: "⚠️ Slow database queries detected"
Action: Slack
```

**External API Errors**
```yaml
Condition: Shopify/Amazon API errors > 20% for 1 hour
Alert: "⚠️ External API issues"
Action: Slack
```

---

#### Low (P3) - Informational

**Deployment Success**
```yaml
Condition: New deployment completed
Alert: "✅ Deployment successful"
Action: Slack #deployments
```

**Daily Summary**
```yaml
Condition: Every day at 9am
Alert: "📊 Daily metrics summary"
Action: Email
```

---

## Dashboards

### 1. Operations Dashboard

**Panels:**
- Service status (up/down indicators)
- Request rate (requests/sec)
- Error rate (%)
- p50/p95/p99 latency
- Active users
- Database connections

**Audience:** On-call engineers, DevOps

---

### 2. Business Dashboard

**Panels:**
- User signups (daily)
- Active projects
- Platform connections (Shopify, Amazon)
- Syncs completed (24h)
- Price changes applied (24h)
- Revenue impact (if applicable)

**Audience:** Product team, management

---

### 3. Platform Health Dashboard

**Per Platform (Shopify, Amazon):**
- Connection status
- Sync success rate
- API error rate
- Average sync duration
- Last successful sync timestamp

**Audience:** Support team, engineers

---

## Runbook Integration

### Alert → Runbook Linking

Each alert includes link to relevant runbook:

```
🚨 Database connection lost

Runbook: https://docs.calibr.lat/runbooks/database-connection
Recent Changes: Deployment #123 (10 minutes ago)
Logs: https://railway.app/logs?filter=database
```

### Common Runbooks

1. **API Service Down**
   - Check Railway status
   - Check recent deployments
   - Review logs for errors
   - Rollback if needed

2. **Database Connection Lost**
   - Check database status
   - Check connection pool
   - Restart API if needed
   - Investigate connection leaks

3. **High Error Rate**
   - Identify error type (5xx, 4xx)
   - Check recent deployments
   - Review error logs
   - Rollback or hotfix

---

## Implementation Checklist

### Week 1: Foundation
- [ ] Set up structured logging (Winston)
- [ ] Add health check endpoints
- [ ] Configure UptimeRobot monitors
- [ ] Create Slack #alerts channel

### Week 2: Error Tracking
- [ ] Set up Sentry account
- [ ] Integrate Sentry into API
- [ ] Integrate Sentry into Console
- [ ] Configure alert rules

### Week 3: Metrics
- [ ] Define key business metrics
- [ ] Implement custom metrics (StatsD)
- [ ] Create operations dashboard
- [ ] Create business dashboard

### Week 4: Alerting
- [ ] Configure PagerDuty (or similar)
- [ ] Define on-call rotation
- [ ] Document alert escalation
- [ ] Create runbooks

---

## Cost Estimate

### Free Tier (Minimum)
- UptimeRobot: $0 (50 monitors)
- Railway logs: $0 (built-in)
- Vercel analytics: $0 (hobby tier)
- **Total: $0/month**

### Recommended Tier
- Sentry: $29/month (50k events)
- Better Stack: $15/month (logs)
- UptimeRobot Pro: $7/month (advanced)
- **Total: ~$50/month**

### Enterprise Tier (Future)
- DataDog: $15/host/month
- PagerDuty: $21/user/month
- LogRocket: $99/month
- **Total: ~$150-200/month**

---

## Success Metrics

### Monitoring Health
- Mean time to detect (MTTD): < 5 minutes
- Mean time to resolve (MTTR): < 1 hour
- Alert noise: < 5 false alerts per week
- Alert response: 100% acknowledged within 15 minutes

### System Health
- Uptime: 99.9% (< 43 minutes downtime/month)
- API latency p95: < 2s
- Error rate: < 0.1%
- Database query performance: p95 < 500ms

---

## Continuous Improvement

### Weekly Review
- Review alerts triggered
- Identify false positives (tune thresholds)
- Check dashboard accuracy
- Update runbooks

### Monthly Review
- Analyze trends (getting better/worse?)
- Review MTTR improvements
- Update SLAs/SLOs
- Plan capacity scaling

### Quarterly Review
- Evaluate monitoring tools
- Assess cost vs value
- Plan new monitoring features
- Update this document

---

**Document Status:** Complete - Ready for Implementation
**Priority:** HIGH
**Estimated Effort:** 2-3 weeks for Phase 1 & 2
**Owner:** Agent C

Generated with Claude Code
Co-Authored-By: Claude <noreply@anthropic.com>
