# Operational SLAs and Error Budgets

**Document Version**: 1.0
**Last Updated**: 2025-11-09
**Owner**: Platform Team

---

## Overview

This document defines the Service Level Agreements (SLAs), Service Level Objectives (SLOs), and Error Budgets for the Calibr platform. These metrics ensure platform reliability and guide operational decisions.

## SLA Definitions

### API Performance SLAs

#### Read Operations
- **SLO**: p95 latency ≤ 1.0 second
- **SLA**: p95 latency ≤ 1.5 seconds (99.5% of the time)
- **Measurement Window**: 24 hours (rolling)
- **Error Budget**: 0.5% of requests can exceed 1.5s

**Endpoints Covered**:
- `GET /api/v1/catalog`
- `GET /api/v1/price-changes`
- `GET /api/v1/analytics/:projectId`
- `GET /api/v1/competitors`

**Alert Thresholds**:
- **Warning**: p95 > 1.5s for 5 minutes
- **Critical**: p95 > 3.0s for 2 minutes

#### Write Operations
- **SLO**: p95 latency ≤ 1.5 seconds
- **SLA**: p95 latency ≤ 2.0 seconds (99.5% of the time)
- **Measurement Window**: 24 hours (rolling)
- **Error Budget**: 0.5% of requests can exceed 2.0s

**Endpoints Covered**:
- `POST /api/v1/price-changes`
- `POST /api/v1/price-changes/:id/apply`
- `POST /api/v1/price-changes/:id/approve`
- `POST /api/v1/competitors`

**Alert Thresholds**:
- **Warning**: p95 > 2.0s for 5 minutes
- **Critical**: p95 > 3.0s for 2 minutes

### Error Rate SLA

- **SLO**: 5xx error rate ≤ 1.0% daily
- **SLA**: 5xx error rate ≤ 2.0% daily (99.5% of the time)
- **Measurement Window**: 24 hours (rolling)
- **Error Budget**: 2% of requests can return 5xx errors

**Alert Thresholds**:
- **Warning**: Error rate > 2% for 15 minutes
- **Critical**: Error rate > 5% for 5 minutes

**Exclusions**:
- Client errors (4xx) do not count against this SLA
- Planned maintenance windows
- Third-party API failures (Shopify, Amazon down)

### Availability SLA

- **SLO**: 99.9% uptime (monthly)
- **SLA**: 99.5% uptime (monthly)
- **Measurement**: Health check success rate (`/api/health/comprehensive`)
- **Allowed Downtime**: ~3.6 hours per month

**Alert Thresholds**:
- **Critical**: Health check fails for 2 consecutive minutes
- **Critical**: Any component status = "unhealthy" for 5 minutes

---

## Event Bus SLAs

### Event Processing Success Rate

- **SLO**: 99% of events processed successfully (no DLQ)
- **SLA**: 95% of events processed successfully
- **Measurement Window**: 24 hours (rolling)
- **Error Budget**: 5% of events can fail and enter retry/DLQ

**Alert Thresholds**:
- **Warning**: Failure rate > 5% for 10 minutes
- **Critical**: Failure rate > 10% for 5 minutes

### Event Processing Latency

- **SLO**: p95 latency ≤ 1.0 second (creation to processing)
- **SLA**: p95 latency ≤ 2.0 seconds
- **Measurement Window**: 1 hour (rolling)
- **Error Budget**: 5% of events can exceed 2.0s

**Alert Thresholds**:
- **Warning**: p95 > 2.0s for 10 minutes
- **Critical**: p95 > 5.0s for 5 minutes

### Outbox Backlog

- **SLO**: 95th percentile pending event age ≤ 1 minute
- **SLA**: No pending events older than 5 minutes
- **Measurement**: Oldest pending event timestamp
- **Error Budget**: 5% of time can have events > 5 minutes old

**Alert Thresholds**:
- **Warning**: Oldest pending > 5 minutes
- **Critical**: Oldest pending > 15 minutes OR pending count > 5000

### Dead Letter Queue (DLQ)

- **SLO**: DLQ size ≤ 10 events
- **SLA**: DLQ size ≤ 100 events
- **Measurement**: Count of events in `dlq_event_log`
- **Error Budget**: DLQ can grow to 100 before incident

**Alert Thresholds**:
- **Warning**: DLQ count > 10 events
- **Critical**: DLQ count > 100 events

---

## Connector SLAs

### Connector Job Success Rate

- **SLO**: 99% success rate daily
- **SLA**: 98% success rate daily
- **Measurement Window**: 24 hours (rolling)
- **Error Budget**: 2% of connector operations can fail

**Alert Thresholds**:
- **Warning**: Success rate < 98% for 30 minutes
- **Critical**: Success rate < 90% for 10 minutes

### Connector Health Status

- **SLO**: All connectors "healthy" 95% of the time
- **SLA**: No connectors "down" for > 10 minutes
- **Measurement**: Connector health check status

**Alert Thresholds**:
- **Warning**: Connector status = "degraded"
- **Critical**: Connector status = "down"

### Connector Sync Latency

- **SLO**: Sync operations complete within 30 seconds
- **SLA**: Sync operations complete within 60 seconds
- **Measurement**: Time from sync trigger to completion

**Alert Thresholds**:
- **Warning**: p95 sync time > 60s
- **Critical**: p95 sync time > 120s

---

## Cron Reliability SLA

- **SLO**: 100% cron job execution success
- **SLA**: 99% cron job execution success (monthly)
- **Measurement**: Cron job heartbeat/completion events
- **Error Budget**: 1% of scheduled runs can be missed

**Alert Thresholds**:
- **Critical**: Cron job missed (no heartbeat within 2x schedule interval)

**Covered Cron Jobs**:
- Outbox worker processing loop
- Analytics aggregation
- Connector sync schedules
- Alert policy checks

---

## Error Budget Policy

### Budget Calculation

Error budget is the acceptable amount of unreliability before action is required.

**Formula**:
```
Error Budget = (1 - SLA%) × Total Requests
```

**Example** (API Error Rate):
- SLA: 98% success (2% error budget)
- Monthly requests: 1,000,000
- Error budget: 20,000 failed requests

### Budget Consumption Tracking

Track error budget consumption in real-time:

```
Budget Remaining = Error Budget - Actual Errors
Budget % Remaining = (Budget Remaining / Error Budget) × 100
```

### Budget Exhaustion Response

| Budget Remaining | Action |
|------------------|--------|
| 75-100% | Normal operations. Continue feature development. |
| 50-75% | Review recent changes. Increase monitoring. |
| 25-50% | **Code freeze** on risky changes. Focus on reliability. |
| 10-25% | **Feature freeze**. Only critical bugs and reliability fixes. |
| 0-10% | **Incident declared**. All hands on deck. Stop all feature work. |

### Budget Reset

Error budgets reset:
- **Daily SLAs**: Every 24 hours (rolling window)
- **Monthly SLAs**: First day of each month
- **After major incidents**: May extend window to recover budget

---

## Escalation Process

### Severity Levels

#### P0 - Critical
**Definition**: Complete service outage or data loss risk

**Examples**:
- API returning 5xx on all requests
- Database unreachable
- Event bus completely stopped
- All connectors down

**Response**:
- Page on-call engineer immediately
- Assemble incident team within 15 minutes
- Post incident updates every 30 minutes
- Executive notification within 1 hour

**SLA**: Acknowledge within 5 minutes, mitigate within 1 hour

#### P1 - High
**Definition**: Major functionality degraded but service partially operational

**Examples**:
- API p95 > 3s for 10+ minutes
- Single connector down > 30 minutes
- DLQ > 100 events
- Error rate > 5%

**Response**:
- Notify on-call engineer
- Assemble team within 30 minutes
- Post updates every 2 hours
- Resolve within 4 hours

**SLA**: Acknowledge within 15 minutes, resolve within 4 hours

#### P2 - Medium
**Definition**: Isolated feature impacted or performance degradation

**Examples**:
- API p95 > 1.5s
- Connector degraded
- Outbox backlog growing
- DLQ > 10 events

**Response**:
- Create ticket for on-call rotation
- Investigate within 2 hours
- Resolve within 24 hours

**SLA**: Acknowledge within 1 hour, resolve within 24 hours

#### P3 - Low
**Definition**: Minor issue with workaround available

**Examples**:
- Non-critical metrics missing
- Documentation outdated
- UI cosmetic issues

**Response**:
- Add to backlog
- Resolve within 1 week

**SLA**: Acknowledge within 1 business day, resolve within 7 days

### On-Call Rotation

- **Primary on-call**: 24/7 coverage, 1-week rotation
- **Secondary on-call**: Backup for P0/P1 incidents
- **Escalation**: If no response within SLA acknowledge time, escalate to secondary

**Contact Methods**:
1. PagerDuty alert
2. Phone call
3. SMS
4. Slack mention

### Incident Communication

**Channels**:
- **Internal**: `#incidents` Slack channel
- **Status Page**: status.calibr.com (public)
- **Email**: Affected customers notified within 2 hours

**Templates**:
- Incident declaration
- Hourly updates
- Resolution notice
- Post-mortem (within 5 business days)

---

## Monitoring and Alerting

### Metrics Collection

All metrics are collected via:
- **API**: `/api/metrics/enhanced` (JSON or Prometheus format)
- **Health**: `/api/health/comprehensive`
- **Frequency**: Every 30 seconds

### Alert Routing

```
Alert Severity → Channels
──────────────────────────
Critical       → PagerDuty + Slack (#alerts) + Email (on-call)
Warning        → Slack (#alerts)
Info           → Slack (#monitoring)
```

### Alert Policies

See `packages/monitor/src/alerts.ts` for policy definitions:
- API latency (p95 > 1.5s)
- Error rate (> 2%)
- Event bus failures (> 5%)
- DLQ growth (> 10 events)
- Connector health (degraded/down)
- Memory usage (> 80%)

### Dashboards

**Grafana Dashboards**:
- **API Performance**: Latency, throughput, errors
- **Event Bus**: Event counts, latency, DLQ size
- **Connectors**: Health, success rates, operations
- **Resources**: Memory, CPU, database

**Access**: https://grafana.calibr.com

---

## SLA Review Process

### Monthly Review

**When**: First Monday of each month
**Attendees**: Platform team, Engineering manager, CTO (for critical breaches)

**Agenda**:
1. Review SLA compliance (last 30 days)
2. Analyze error budget consumption
3. Identify top 3 reliability issues
4. Action items for improvement
5. Update SLA targets (if needed)

### Quarterly Review

**When**: End of each quarter
**Attendees**: All engineering teams, Product, Leadership

**Agenda**:
1. Review annual SLA trends
2. Customer impact analysis
3. Error budget policy effectiveness
4. SLA target adjustments
5. Infrastructure investment priorities

### SLA Adjustments

SLA targets can be adjusted quarterly based on:
- Actual performance trends
- Customer feedback
- Business requirements
- Industry benchmarks

**Approval Required**: Engineering Director + CTO

---

## Compliance and Reporting

### Internal Reporting

**Weekly**:
- SLA dashboard shared in `#engineering`
- Top 3 reliability concerns highlighted

**Monthly**:
- SLA compliance report to leadership
- Error budget burn-down charts
- Incident summary and trends

### Customer Reporting

**SLA Credits**:
- If monthly SLA not met, customers receive service credits
- Credit calculation: 10% of monthly fee per 0.5% SLA miss

**Transparency**:
- Public status page shows uptime
- Incident post-mortems shared (anonymized)

---

## Appendix

### Calculation Examples

#### API Latency SLA Compliance

```
Target: p95 ≤ 1.5s
Measured: p95 = 1.35s over 24 hours

Compliance: ✅ PASS (1.35s < 1.5s)
Error Budget Used: 0% (within target)
```

#### Error Rate SLA Compliance

```
Target: ≤ 2% error rate
Total Requests: 100,000
Failed Requests: 1,500 (1.5%)

Compliance: ✅ PASS (1.5% < 2%)
Error Budget Remaining: 25% ((2000 - 1500) / 2000)
```

#### DLQ SLA Breach

```
Target: ≤ 10 events in DLQ
Measured: 15 events

Compliance: ⚠️ WARNING (15 > 10)
Action: Investigate and resolve within 4 hours
```

### Glossary

- **SLA** (Service Level Agreement): Commitment to customers
- **SLO** (Service Level Objective): Internal target (stricter than SLA)
- **SLI** (Service Level Indicator): Measured metric
- **Error Budget**: Acceptable unreliability before action required
- **p95**: 95th percentile (95% of requests faster than this)
- **DLQ**: Dead Letter Queue (failed events after max retries)
- **Outbox**: Transactional outbox for event delivery

### References

- [Google SRE Book - SLOs](https://sre.google/sre-book/service-level-objectives/)
- [Monitoring & Observability Package](/packages/monitor/README.md)
- [Event Bus Documentation](/packages/db/src/eventing/README.md)
- [Alert Policies](/packages/monitor/src/alerts.ts)

---

**Document Approval**:
- Platform Team Lead: ✅
- Engineering Manager: ✅
- CTO: ✅

**Next Review Date**: 2025-12-01
