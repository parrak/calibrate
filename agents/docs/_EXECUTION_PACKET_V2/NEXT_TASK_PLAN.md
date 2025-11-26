# Next Task Plan — Q4 2025 / Q1 2026
**Generated**: November 11, 2025
**Status**: 🟢 Foundation Complete — Ready for Automation Phase
**Master Branch**: Up to date (a8a10d2)

---

## Executive Summary

With **8/8 foundation milestones complete** and the Calibrate branding deployed, we're ready to focus on **production-scale automation** and **remaining integration work**. This plan prioritizes completing Competitor Monitoring E2E, implementing the Automation Runner foundation, and preparing for v0.4.0 public beta.

### Current State
- ✅ **Foundation**: All core milestones complete (M0.1-M0.4, M1.1-M1.4)
- ✅ **Branding**: Calibrate v1 deployed across all apps
- ✅ **Testing**: 900+ tests, 100% pass rate
- 🟡 **Competitor Monitoring**: 70% complete (backend done, UI testing pending)
- 📋 **Automation Runner**: Not started (critical for production scale)

### Next 30 Days Goals
1. **Complete M0.6** - Competitor Monitoring E2E (Week 1)
2. **Start M0.5** - Automation Runner Foundation (Week 1-3)
3. **Production Monitoring** - Grafana, alerts, synthetic probes (Week 2-3)
4. **Begin M1.6** - Automation Runner Execution Layer (Week 4)

---

## Priority 1: Complete Competitor Monitoring E2E (M0.6) 🔴

**Status**: 70% complete
**Owner**: Interface Team
**Timeline**: Week 1 (3-5 days)
**Blocking**: Ready-for-Automation Gate (7/8 → 8/8)

### Why This Matters
- Last remaining foundation milestone
- Unlocks Ready-for-Automation Gate
- Required for competitive pricing features
- Merchant-requested feature

### Tasks

#### 1.1 UI Integration Testing
**Estimate**: 2 days

- [ ] **CompetitorMonitor Component Tests**
  - Test competitor addition flow
  - Test competitor price display
  - Test error handling (network errors, API failures)
  - Test authentication states (logged in/out)
  - Verify proper API token passing

- [ ] **Analytics Integration**
  - Test CompetitorMonitor → Analytics data flow
  - Verify market position indicators (lowest/highest/middle)
  - Test price spread analysis display
  - Verify competitor price comparisons per product

- [ ] **Rules Integration**
  - Test CompetitorMonitor → Rules flow
  - Verify "Beat Competition by X%" rule creation
  - Test rule preview with competitor data
  - Test rule application using competitor prices

**Files to Test**:
- `apps/console/components/CompetitorMonitor.tsx`
- `apps/console/components/CompetitorMonitor.test.tsx`
- `apps/console/app/p/[slug]/competitors/analytics/page.tsx`
- `apps/console/app/p/[slug]/rules/page.tsx`

**Success Criteria**:
- All UI integration tests passing
- No console errors during flows
- Proper loading states
- Clear error messages

#### 1.2 End-to-End Flow Verification
**Estimate**: 1 day

- [ ] **Ingest → Normalize → Visualize Flow**
  - Add competitor via UI
  - Verify scraping job triggered
  - Confirm price data normalized in database
  - Check analytics dashboard updates
  - Verify competitor rules can use data

- [ ] **Manual Testing Checklist**
  ```
  Test Case 1: Add Shopify Competitor
  - [ ] Navigate to Competitors page
  - [ ] Click "Add Competitor"
  - [ ] Enter Shopify product URL
  - [ ] Verify competitor created
  - [ ] Check price scraping initiated
  - [ ] Confirm data appears in Analytics

  Test Case 2: Create Competitor Rule
  - [ ] Navigate to Rules page
  - [ ] Create "Beat Competition by 5%" rule
  - [ ] Select competitor as reference
  - [ ] Preview rule impact
  - [ ] Verify suggested prices correct

  Test Case 3: Error Handling
  - [ ] Test invalid competitor URL
  - [ ] Test scraping failure
  - [ ] Test unauthorized access
  - [ ] Verify error messages clear
  ```

#### 1.3 Error Rate Validation
**Estimate**: 1 day

- [ ] **Monitor Error Rates**
  - Set up error tracking for competitor endpoints
  - Run tests across 2 test tenants
  - Monitor for 24 hours
  - Verify error rate < 1%

- [ ] **Add Alert Hook**
  - Integrate with `@calibr/monitor` package
  - Add alert for scrape failures
  - Configure thresholds:
    - Warning: 3 consecutive failures
    - Critical: 5 consecutive failures or error rate > 2%
  - Test alert delivery (Slack/email)

**Files to Modify**:
- `packages/competitor-monitoring/scraper.ts`
- `packages/monitor/src/alerts.ts`

#### 1.4 Documentation Update
**Estimate**: 0.5 days

- [ ] Update kickoff checklist
  - Mark M0.6 tasks as complete
  - Update Competitor Monitoring status to **Green**

- [ ] Update milestones document
  - Mark M0.6 as complete
  - Update Ready-for-Automation Gate status (8/8)

- [ ] Update NOVEMBER_2025_PROGRESS.md
  - Add M0.6 completion entry
  - Update metrics

**Files to Update**:
- `agents/docs/_EXECUTION_PACKET_V2/04_KICKOFF_CHECKLIST.md`
- `agents/docs/_EXECUTION_PACKET_V2/01_MILESTONES.md`
- `agents/docs/_EXECUTION_PACKET_V2/NOVEMBER_2025_PROGRESS.md`

### Acceptance Criteria
- [x] Backend API complete (12 tests passing)
- [x] Authentication enforced
- [ ] UI integration tests passing
- [ ] End-to-end flow verified
- [ ] Error rate < 1% over 24h
- [ ] Alert hook integrated
- [ ] Documentation updated
- [ ] Status: **Green**

---

## Priority 2: Automation Runner Foundation (M0.5) 🔴

**Status**: Not started
**Owner**: Platform Team
**Timeline**: Week 1-3 (2 weeks)
**Blocking**: M1.6 Automation Runner Execution

### Why This Matters
- **Critical** for production-scale automation
- Required for bulk price changes (100+ SKUs)
- Enables reliable retry/recovery
- Foundation for M1.6, M1.7, M1.8

### Phase 1: Database Schema & Models (Days 1-2)

#### 2.1 Extend Database Models
**Estimate**: 1 day

- [ ] **Extend `RuleRun` Model**
  ```prisma
  model RuleRun {
    id          String   @id @default(cuid())
    tenantId    String
    projectId   String
    ruleId      String
    state       RuleRunState @default(QUEUED)
    queuedAt    DateTime @default(now())
    startedAt   DateTime?
    completedAt DateTime?
    failedAt    DateTime?
    error       String?
    metadata    Json?

    // Relations
    tenant      Tenant   @relation(fields: [tenantId])
    project     Project  @relation(fields: [projectId])
    rule        PricingRule @relation(fields: [ruleId])
    targets     RuleTarget[]

    @@index([tenantId, state])
    @@index([projectId, state])
    @@index([queuedAt])
  }

  enum RuleRunState {
    QUEUED
    APPLYING
    APPLIED
    FAILED
    PARTIAL
  }
  ```

- [ ] **Create `RuleTarget` Model**
  ```prisma
  model RuleTarget {
    id          String   @id @default(cuid())
    runId       String
    skuId       String
    state       TargetState @default(PENDING)
    fromPrice   Int
    toPrice     Int
    attempts    Int      @default(0)
    lastAttempt DateTime?
    error       String?
    appliedAt   DateTime?

    // Relations
    run         RuleRun  @relation(fields: [runId])
    sku         Sku      @relation(fields: [skuId])

    @@index([runId, state])
    @@index([state, lastAttempt])
  }

  enum TargetState {
    PENDING
    APPLYING
    APPLIED
    FAILED
  }
  ```

- [ ] **Create Migration**
  ```bash
  pnpm --filter @calibr/db prisma migrate dev --name add_automation_runner_models
  ```

**Files to Create/Modify**:
- `packages/db/prisma/schema.prisma`
- `packages/db/prisma/migrations/*/migration.sql`

#### 2.2 State Machine Design
**Estimate**: 0.5 days

- [ ] **Document State Transitions**
  ```
  RuleRun States:
  QUEUED → APPLYING → APPLIED (all targets succeeded)
  QUEUED → APPLYING → PARTIAL (some targets failed)
  QUEUED → APPLYING → FAILED (critical error)
  PARTIAL → APPLYING (retry failed targets)
  FAILED → APPLYING (retry all)

  RuleTarget States:
  PENDING → APPLYING → APPLIED (success)
  PENDING → APPLYING → FAILED (error, retries < max)
  APPLYING → FAILED (error, retries >= max)
  FAILED → APPLYING (manual retry)
  ```

- [ ] **Define Retry Logic**
  - Max retries per target: 3
  - Backoff strategy: Exponential (2s, 4s, 8s)
  - Jitter: ±20% to avoid thundering herd
  - 429 handling: Exponential backoff (16s, 32s, 64s)
  - DLQ after max retries

**Files to Create**:
- `packages/automation-runner/docs/state-machine.md`
- `packages/automation-runner/docs/retry-logic.md`

### Phase 2: Worker Queue Implementation (Days 3-7)

#### 2.3 Create Worker Queue
**Estimate**: 2 days

- [ ] **Create `rulesWorker.ts`**
  ```typescript
  // packages/automation-runner/src/rulesWorker.ts

  import { EventWriter, OutboxWorker } from '@calibr/db/eventing'
  import { applyPriceChangeEnhanced } from '@calibr/pricing-engine'

  export class RulesWorker {
    private worker: OutboxWorker

    async start() {
      // Subscribe to job.rules.apply events
      this.worker.subscribe('job.rules.apply', this.handleApplyJob)
      await this.worker.start()
    }

    private async handleApplyJob(event: JobEvent) {
      const run = await this.createRuleRun(event)
      await this.materializeTargets(run)
      await this.applyTargets(run)
    }

    private async materializeTargets(run: RuleRun) {
      // Create RuleTarget for each SKU
      const skus = await this.getMatchingSKUs(run.rule)
      await prisma.ruleTarget.createMany({
        data: skus.map(sku => ({
          runId: run.id,
          skuId: sku.id,
          fromPrice: sku.price,
          toPrice: this.calculateNewPrice(sku, run.rule),
          state: 'PENDING'
        }))
      })
    }

    private async applyTargets(run: RuleRun) {
      const targets = await this.getPendingTargets(run.id)

      for (const target of targets) {
        try {
          await this.applyTarget(target)
        } catch (error) {
          await this.handleError(target, error)
        }
      }

      await this.finalizeRun(run)
    }

    private async applyTarget(target: RuleTarget) {
      await prisma.ruleTarget.update({
        where: { id: target.id },
        data: { state: 'APPLYING', lastAttempt: new Date() }
      })

      // Apply price change via connector
      await applyPriceChangeEnhanced({
        priceChangeId: target.priceChangeId,
        actor: 'automation-runner',
        correlationId: target.runId
      })

      await prisma.ruleTarget.update({
        where: { id: target.id },
        data: { state: 'APPLIED', appliedAt: new Date() }
      })
    }

    private async handleError(target: RuleTarget, error: Error) {
      const attempts = target.attempts + 1

      if (attempts >= MAX_RETRIES) {
        // Move to DLQ
        await this.moveToDLQ(target, error)
        await prisma.ruleTarget.update({
          where: { id: target.id },
          data: { state: 'FAILED', attempts, error: error.message }
        })
      } else {
        // Schedule retry
        const delay = this.calculateBackoff(attempts)
        await prisma.ruleTarget.update({
          where: { id: target.id },
          data: {
            state: 'PENDING',
            attempts,
            error: error.message,
            lastAttempt: new Date()
          }
        })
      }
    }
  }
  ```

**Files to Create**:
- `packages/automation-runner/src/rulesWorker.ts`
- `packages/automation-runner/src/types.ts`
- `packages/automation-runner/src/config.ts`

#### 2.4 Exponential Backoff & 429 Handling
**Estimate**: 1 day

- [ ] **Implement Backoff Strategy**
  ```typescript
  // packages/automation-runner/src/backoff.ts

  export function calculateBackoff(
    attempt: number,
    options: BackoffOptions = DEFAULT_OPTIONS
  ): number {
    const { baseDelay, maxDelay, multiplier, jitter } = options

    // Exponential: baseDelay * (multiplier ^ attempt)
    const delay = Math.min(
      baseDelay * Math.pow(multiplier, attempt),
      maxDelay
    )

    // Add jitter: ±20%
    const jitterAmount = delay * jitter
    const jitterRange = Math.random() * jitterAmount * 2 - jitterAmount

    return Math.floor(delay + jitterRange)
  }

  export function handle429Error(error: ShopifyError): BackoffResult {
    if (error.code === 429) {
      // Shopify rate limit hit
      const retryAfter = error.headers['retry-after'] // seconds

      if (retryAfter) {
        return { delay: retryAfter * 1000, retry: true }
      }

      // Exponential backoff: 16s, 32s, 64s
      return {
        delay: calculateBackoff(error.attempt, {
          baseDelay: 16000,
          multiplier: 2,
          maxDelay: 64000
        }),
        retry: true
      }
    }

    return { retry: false }
  }
  ```

**Files to Create**:
- `packages/automation-runner/src/backoff.ts`
- `packages/automation-runner/src/backoff.test.ts`

#### 2.5 Reconciliation Pass
**Estimate**: 1 day

- [ ] **Implement Reconciliation**
  ```typescript
  // packages/automation-runner/src/reconciliation.ts

  export class ReconciliationService {
    async reconcileRun(runId: string) {
      const targets = await this.getAppliedTargets(runId)

      for (const target of targets) {
        const externalPrice = await this.fetchExternalPrice(target)

        if (externalPrice !== target.toPrice) {
          // Price mismatch!
          await this.reportMismatch(target, externalPrice)

          // Optionally retry
          await this.scheduleRetry(target)
        }
      }
    }

    private async fetchExternalPrice(target: RuleTarget): Promise<number> {
      const sku = await prisma.sku.findUnique({
        where: { id: target.skuId },
        include: { product: true }
      })

      // Fetch from connector
      const connector = this.getConnector(sku.product.channel)
      const externalData = await connector.fetchPrice(sku.externalId)

      return externalData.price
    }

    private async reportMismatch(
      target: RuleTarget,
      externalPrice: number
    ) {
      // Log to audit
      await eventWriter.writeEvent({
        tenantId: target.run.tenantId,
        eventType: 'automation.reconciliation.mismatch',
        payload: {
          targetId: target.id,
          expectedPrice: target.toPrice,
          actualPrice: externalPrice,
          difference: externalPrice - target.toPrice
        },
        metadata: { severity: 'warning' }
      })
    }
  }
  ```

**Files to Create**:
- `packages/automation-runner/src/reconciliation.ts`
- `packages/automation-runner/src/reconciliation.test.ts`

### Phase 3: DLQ & Metrics (Days 8-10)

#### 2.6 DLQ Drain Job
**Estimate**: 1 day

- [ ] **Create DLQ Handler**
  ```typescript
  // packages/automation-runner/src/dlq.ts

  export class DLQService {
    async drainDLQ(projectId: string) {
      const failedTargets = await prisma.ruleTarget.findMany({
        where: {
          run: { projectId },
          state: 'FAILED'
        },
        orderBy: { lastAttempt: 'asc' },
        take: 100
      })

      const report = {
        total: failedTargets.length,
        byErrorType: this.groupByError(failedTargets),
        recommendations: this.generateRecommendations(failedTargets)
      }

      // Write to audit
      await eventWriter.writeEvent({
        tenantId: failedTargets[0].run.tenantId,
        eventType: 'automation.dlq.report',
        payload: report
      })

      return report
    }

    async retryFailed(runId: string, targetIds?: string[]) {
      const query = targetIds
        ? { id: { in: targetIds }, runId }
        : { runId, state: 'FAILED' }

      await prisma.ruleTarget.updateMany({
        where: query,
        data: {
          state: 'PENDING',
          error: null,
          attempts: 0
        }
      })

      // Trigger worker to process
      await this.triggerWorker(runId)
    }
  }
  ```

**Files to Create**:
- `packages/automation-runner/src/dlq.ts`
- `packages/automation-runner/src/dlq.test.ts`

#### 2.7 Metrics & Monitoring
**Estimate**: 1 day

- [ ] **Add Automation Metrics**
  ```typescript
  // packages/automation-runner/src/metrics.ts

  import { recordMetric } from '@calibr/monitor'

  export function recordRunMetrics(run: RuleRun) {
    recordMetric('rules.apply.count', {
      value: 1,
      tags: {
        tenantId: run.tenantId,
        state: run.state
      }
    })

    if (run.completedAt) {
      const duration = run.completedAt.getTime() - run.queuedAt.getTime()
      recordMetric('rules.apply.duration_ms', {
        value: duration,
        tags: { tenantId: run.tenantId }
      })
    }

    // Success rate
    const successRate = this.calculateSuccessRate(run)
    recordMetric('rules.apply.success_rate', {
      value: successRate,
      tags: { tenantId: run.tenantId }
    })
  }

  export function recordDLQMetrics(projectId: string) {
    const dlqSize = await prisma.ruleTarget.count({
      where: {
        run: { projectId },
        state: 'FAILED'
      }
    })

    recordMetric('rules.dlq.size', {
      value: dlqSize,
      tags: { projectId }
    })
  }
  ```

- [ ] **Configure Alert Policies**
  - Success rate < 97% → Warning
  - Success rate < 90% → Critical
  - DLQ size > 50 → Warning
  - DLQ size > 100 → Critical
  - Shopify 429 burst (>3 in 5 min) → Warning

**Files to Create**:
- `packages/automation-runner/src/metrics.ts`
- `packages/monitor/src/alerts/automation.ts`

#### 2.8 Grafana Dashboard
**Estimate**: 0.5 days

- [ ] **Create Dashboard Panel**
  - Rule runs per hour
  - Average duration (p50, p95, p99)
  - Success rate trend
  - DLQ size over time
  - Error breakdown by type
  - Top failed SKUs

- [ ] **Export Dashboard JSON**
  - Save to `packages/monitor/dashboards/automation-runner.json`
  - Document panel queries

**Files to Create**:
- `packages/monitor/dashboards/automation-runner.json`
- `packages/monitor/docs/dashboard-setup.md`

### Phase 4: Testing & Documentation (Days 11-14)

#### 2.9 Integration Tests
**Estimate**: 2 days

- [ ] **Create Test Suite**
  ```typescript
  // packages/automation-runner/tests/integration.test.ts

  describe('Automation Runner Integration', () => {
    it('should apply rule to 100 SKUs successfully', async () => {
      // Create test rule
      const rule = await createTestRule({
        transform: { type: 'percentage', value: 10 }
      })

      // Create 100 test SKUs
      await createTestSKUs(100)

      // Trigger automation
      const run = await rulesWorker.applyRule(rule)

      // Wait for completion
      await waitForRun(run.id, { timeout: 300000 }) // 5 min

      // Verify results
      const targets = await getRunTargets(run.id)
      expect(targets.filter(t => t.state === 'APPLIED')).toHaveLength(100)
    })

    it('should handle partial failures with retry', async () => {
      // Mock connector to fail 10 targets
      mockConnector.applyPrice.mockImplementation((skuId) => {
        if (testFailureSKUs.includes(skuId)) {
          throw new Error('Connector error')
        }
        return { success: true }
      })

      // Run automation
      const run = await rulesWorker.applyRule(rule)
      await waitForRun(run.id)

      // Verify partial state
      expect(run.state).toBe('PARTIAL')

      // Retry failed
      await dlqService.retryFailed(run.id)
      await waitForRun(run.id)

      // Should succeed after retry
      expect(run.state).toBe('APPLIED')
    })

    it('should handle 429 rate limits gracefully', async () => {
      // Mock 429 error
      mockConnector.applyPrice.mockRejectedValueOnce({
        code: 429,
        headers: { 'retry-after': '2' }
      })

      const startTime = Date.now()
      await rulesWorker.applyRule(rule)
      const endTime = Date.now()

      // Should have delayed
      expect(endTime - startTime).toBeGreaterThan(2000)
    })
  })
  ```

**Files to Create**:
- `packages/automation-runner/tests/integration.test.ts`
- `packages/automation-runner/tests/fixtures.ts`
- `packages/automation-runner/tests/mocks.ts`

#### 2.10 Documentation
**Estimate**: 1 day

- [ ] **Architecture Document**
  - System overview
  - State machine diagrams
  - Sequence diagrams (apply flow, retry flow, reconciliation)
  - Error handling strategy
  - Monitoring & alerting setup

- [ ] **API Documentation**
  - Worker API reference
  - Configuration options
  - Event types
  - Metrics reference

- [ ] **Runbook**
  - Deployment steps
  - Operational procedures
  - Troubleshooting guide
  - Common issues & solutions

**Files to Create**:
- `docs/automation_runner.md`
- `packages/automation-runner/README.md`
- `packages/automation-runner/docs/runbook.md`

### Acceptance Criteria
- [ ] Database models extended with state machine
- [ ] Worker queue consuming outbox events
- [ ] Exponential backoff implemented
- [ ] 429 handling with rate limit detection
- [ ] Reconciliation pass verifying prices
- [ ] DLQ drain job operational
- [ ] Metrics exported to `@calibr/monitor`
- [ ] Alert policies configured
- [ ] Grafana dashboard published
- [ ] **Performance**: 100-SKU rule runs < 5 min p95
- [ ] **Reliability**: Partial failures recoverable via API
- [ ] **Auditability**: All apply events audited + idempotent
- [ ] Documentation complete

---

## Priority 3: Production Monitoring Setup 🟡

**Status**: Partial
**Owner**: Platform Team
**Timeline**: Week 2-3 (1 week)
**Blocking**: Production readiness

### Why This Matters
- Essential for production operations
- Enables proactive issue detection
- Required for SLA compliance
- Supports incident response

### Tasks

#### 3.1 Grafana Dashboard Setup
**Estimate**: 2 days

- [ ] **Create Main Dashboard**
  - API request rates (per endpoint)
  - Response times (p50, p95, p99)
  - Error rates (4xx, 5xx)
  - Connector health (Shopify, Amazon)
  - Event bus metrics (throughput, latency)
  - Database query performance
  - Worker queue status

- [ ] **Configure Data Sources**
  - Connect to `/api/metrics` endpoint
  - Set up refresh intervals
  - Configure retention policies

**Files to Create**:
- `packages/monitor/dashboards/main.json`
- `packages/monitor/docs/grafana-setup.md`

#### 3.2 Alert Configuration
**Estimate**: 1 day

- [ ] **API Alerts**
  - p95 > 1.5s → Slack #engineering (Warning)
  - p95 > 3.0s → PagerDuty (Critical)
  - 5xx rate > 2% (daily) → Email ops-team
  - 5xx rate > 5% (hourly) → PagerDuty

- [ ] **Connector Alerts**
  - Shopify success rate < 98% → Slack #engineering
  - Shopify success rate < 95% → PagerDuty
  - Amazon scrape failure → Email (Warning)
  - Competitor scrape failure (3 consecutive) → Slack

- [ ] **Worker Alerts**
  - DLQ size > 50 → Warning
  - DLQ size > 100 → Critical
  - Cron miss → PagerDuty

**Files to Modify**:
- `packages/monitor/src/alerts.ts`
- `packages/monitor/src/config.ts`

#### 3.3 Synthetic Probes
**Estimate**: 2 days

- [ ] **Create Health Check Endpoints**
  ```typescript
  // apps/api/app/api/health/route.ts
  export async function GET() {
    const checks = await Promise.allSettled([
      checkDatabase(),
      checkShopifyConnector(),
      checkEventBus(),
      checkWorkerQueue()
    ])

    const status = checks.every(c => c.status === 'fulfilled')
      ? 'healthy'
      : 'degraded'

    return Response.json({
      status,
      timestamp: new Date().toISOString(),
      checks: formatChecks(checks)
    })
  }
  ```

- [ ] **Set Up Probes**
  - `/api/health` (every 1 min)
  - `/api/v1/price-changes` (every 5 min)
  - `/api/v1/analytics/overview` (every 10 min)
  - `/api/v1/copilot` (every 15 min)
  - `/api/v1/competitors` (every 15 min)

- [ ] **Configure Probe Service**
  - Use UptimeRobot / Pingdom / internal service
  - Set up alerting for probe failures
  - Track uptime SLA (target: 99.9%)

**Files to Create**:
- `apps/api/app/api/health/route.ts`
- `apps/api/app/api/health/detailed/route.ts`
- `packages/monitor/src/probes.ts`

### Acceptance Criteria
- [ ] Grafana dashboard deployed with all panels
- [ ] Alert policies configured and tested
- [ ] Synthetic probes monitoring critical endpoints
- [ ] Probe alerts working (tested with manual failures)
- [ ] Documentation updated with monitoring runbook
- [ ] SLA targets documented and tracked

---

## Priority 4: Automation Runner Execution (M1.6) 🟡

**Status**: Not started
**Owner**: Engine Team
**Timeline**: Week 4 (contingent on M0.5 completion)
**Blocking**: M1.7 UI, M1.8 Copilot Simulation

### Why This Matters
- Builds on M0.5 foundation
- Exposes automation capabilities via API
- Enables Console UI integration
- Required for merchant self-service

### Tasks

#### 4.1 Job Execution APIs
**Estimate**: 3 days

- [ ] **Implement `job.rule.materialize`**
  ```typescript
  // POST /api/v1/rules/:ruleId/materialize
  // Creates RuleRun + RuleTargets without applying
  export async function POST(req: Request) {
    const { ruleId } = await req.json()

    const run = await rulesWorker.materialize(ruleId)

    return Response.json({
      runId: run.id,
      targetCount: run.targets.length,
      estimatedDuration: estimateDuration(run.targets.length)
    })
  }
  ```

- [ ] **Implement `job.rule.apply.batch`**
  ```typescript
  // POST /api/v1/runs/:runId/apply
  // Triggers actual price changes
  export async function POST(req: Request) {
    const { runId } = req.params

    // Queue for processing
    await rulesWorker.queueRun(runId)

    return Response.json({
      runId,
      status: 'queued',
      queuePosition: await getQueuePosition(runId)
    })
  }
  ```

- [ ] **Implement `job.rule.reconcile`**
  ```typescript
  // POST /api/v1/runs/:runId/reconcile
  // Verifies applied prices match external systems
  export async function POST(req: Request) {
    const { runId } = req.params

    const report = await reconciliationService.reconcileRun(runId)

    return Response.json(report)
  }
  ```

**Files to Create**:
- `apps/api/app/api/v1/rules/[ruleId]/materialize/route.ts`
- `apps/api/app/api/v1/runs/[runId]/apply/route.ts`
- `apps/api/app/api/v1/runs/[runId]/reconcile/route.ts`

#### 4.2 Retry Failed API
**Estimate**: 1 day

- [ ] **Implement Retry Endpoint**
  ```typescript
  // POST /api/v1/runs/:runId/retry-failed
  export async function POST(req: Request) {
    const { runId } = req.params
    const { targetIds } = await req.json() // optional

    const retried = await dlqService.retryFailed(runId, targetIds)

    return Response.json({
      retriedCount: retried.length,
      targets: retried.map(t => ({
        id: t.id,
        skuId: t.skuId,
        previousError: t.error,
        status: 'queued'
      }))
    })
  }
  ```

**Files to Create**:
- `apps/api/app/api/v1/runs/[runId]/retry-failed/route.ts`

#### 4.3 End-to-End Worker Tests
**Estimate**: 2 days

- [ ] **Create E2E Test Suite**
  - 100-target run with all successes
  - Partial failures with automatic retry
  - Manual retry via API
  - Reconciliation after apply
  - 429 rate limit handling
  - DLQ drain and reporting

**Files to Create**:
- `packages/automation-runner/tests/e2e.test.ts`

#### 4.4 Metrics Integration
**Estimate**: 1 day

- [ ] Wire metrics to `@calibr/monitor`
- [ ] Configure alert thresholds
- [ ] Add to Grafana dashboard

### Acceptance Criteria
- [ ] All three job execution APIs implemented
- [ ] Retry failed API working
- [ ] E2E tests passing (100 targets, retry path)
- [ ] Metrics exported and monitored
- [ ] Alert thresholds configured
- [ ] Documentation complete

---

## Secondary Priorities (Weeks 4-8)

### M1.7 — Automation Runner UI Enhancements 🟢
**Timeline**: Week 5-6

- [ ] Add "Retry Failed" control in Runs table
- [ ] Add "Explain" tab displaying transform and audit trace
- [ ] Show apply progress indicator via SSE or polling
- [ ] Toasts reflect server statuses (queued/applied/failed)
- [ ] Snapshot test coverage ≥ 85%

### M1.8 — Copilot Simulation 🟢
**Timeline**: Week 7-8

- [ ] Build `POST /api/v1/copilot/simulate` (read-only, schema validated)
- [ ] Build `POST /api/v1/copilot/propose` → persist disabled PricingRule + preview run
- [ ] Add modal "Ask Copilot" → show Proposed Rule + Preview Summary
- [ ] "Open in Rule Builder" handoff to Console
- [ ] Log full prompt, scope, and SQL for audit
- [ ] Red-team prompt tests (denylist, injection, scope abuse)
- [ ] Add Copilot section in docs (`docs/copilot_simulation.md`)

### M1.3 Extend — Enhanced Explainability 🟢
**Timeline**: Ongoing

- [ ] Verify every apply writes Audit + ExplainTrace
- [ ] `/api/audit` endpoint wired with pagination + filters
- [ ] Sample audit report for 2 tenants generated

### Analytics Pipeline 🟢
**Timeline**: Ongoing

- [ ] Aggregate daily snapshots (`packages/analytics`)
- [ ] Expose `/api/v1/analytics/:projectId/overview`
- [ ] Integrate Shopify and Amazon (read-only) data sources
- [ ] Add margin, top SKUs, price change frequency
- [ ] Add visualizations in Console dashboard
- [ ] Add weekly insight digest + trend detection
- [ ] Verify cron stability and performance

---

## Conditional: Stripe Connector (M1.5) 🔵

**Status**: Awaiting "Go" signal
**Timeline**: TBD (after SaaS validation)

### Trigger
- SaaS collector page deployed (`/saas`)
- Minimum threshold met (e.g., 50 sign-ups)
- Product team approval

### Tasks
- [ ] Implement OAuth (Connect Standard)
- [ ] Sync Products/Prices, PaymentIntents, BalanceTransactions
- [ ] Map to internal entities via StripeProductMap, Transaction
- [ ] Verify webhook signatures + idempotency
- [ ] Build "Connectors → Stripe" UI in Console
- [ ] Add metrics: sync latency, error %, backlog size
- [ ] Add feature flag `STRIPE_CONNECT_ENABLED`

---

## Technical Debt & Infrastructure

### High Priority
- [ ] **Service Tokens**: Implement vault for per-connector secrets
- [ ] **RLS Policies**: Add to EventLog, Outbox, DlqEventLog
- [ ] **Event Schema Validation**: JSON Schema registry for event payloads
- [ ] **Production Metrics Backend**: Replace in-memory with Redis/TimescaleDB
- [ ] **Outbox Worker Deployment**: Separate service with health checks

### Medium Priority
- [ ] **Event Versioning**: Migrate old event formats
- [ ] **Event Archival**: Move old events to cold storage
- [ ] **Performance Benchmarks**: Measure write/replay throughput
- [ ] **CI/CD Pipeline**: Full automation (typecheck → build → test → migrate → deploy)

### Low Priority
- [ ] **`.env.example` Validation**: Prestart hook to validate environment
- [ ] **Developer Onboarding**: Comprehensive setup documentation
- [ ] **API Documentation**: OpenAPI spec generation and publication

---

## Success Metrics & KPIs

### Week 1
- [ ] M0.6 Competitor Monitoring E2E complete (8/8 foundation milestones)
- [ ] M0.5 Automation Runner schema designed and implemented
- [ ] Worker queue initial implementation started

### Week 2
- [ ] M0.5 Automation Runner foundation complete
- [ ] Production monitoring setup started
- [ ] Grafana dashboard deployed

### Week 3
- [ ] Production monitoring complete (dashboards, alerts, probes)
- [ ] M1.6 Automation Runner execution APIs started
- [ ] Performance benchmarks passing (100-SKU < 5 min p95)

### Week 4
- [ ] M1.6 Automation Runner execution complete
- [ ] E2E tests passing
- [ ] Ready for M1.7 UI enhancements

### 30-Day Goals
- ✅ 9/9 milestones complete (M0.1-M0.6, M1.1-M1.4, M1.6)
- ✅ Production monitoring operational
- ✅ Automation runner foundation ready
- ✅ Performance SLAs met
- ✅ Documentation up to date

---

## Risk Assessment

### High Risk 🔴
1. **Automation Runner Complexity**
   - Risk: State machine bugs, race conditions
   - Mitigation: Comprehensive testing, staged rollout

2. **Performance at Scale**
   - Risk: 100+ SKU runs exceed 5 min target
   - Mitigation: Early benchmarking, optimization sprints

### Medium Risk 🟡
3. **Shopify Rate Limits**
   - Risk: 429 errors during bulk operations
   - Mitigation: Intelligent backoff, burst detection

4. **Competitor Scraping Reliability**
   - Risk: External site changes break scrapers
   - Mitigation: Robust error handling, fallback strategies

### Low Risk 🟢
5. **Monitoring Setup**
   - Risk: Alert fatigue, misconfigured thresholds
   - Mitigation: Iterative tuning, runbook documentation

---

## Dependencies & Blockers

### Current Blockers
- None (all foundation work complete)

### Dependencies
- M1.6 depends on M0.5 (Automation Runner Foundation)
- M1.7 depends on M1.6 (Execution APIs for UI)
- M1.8 depends on M1.6 (Copilot needs automation capabilities)

### External Dependencies
- Grafana Cloud account (or self-hosted instance)
- Alerting service (Slack, PagerDuty)
- Synthetic monitoring service (UptimeRobot, Pingdom)

---

## Team Assignments

### Platform Team
- **Owner**: M0.5 Automation Runner Foundation
- **Owner**: Production Monitoring Setup
- **Support**: M1.6 Automation Runner Execution

### Interface Team
- **Owner**: M0.6 Competitor Monitoring E2E (completion)
- **Owner**: M1.7 Automation Runner UI (future)
- **Support**: M0.5 (UI integration planning)

### Engine Team
- **Owner**: M1.6 Automation Runner Execution
- **Support**: M0.5 (worker logic)
- **Owner**: M1.8 Copilot Simulation (future)

### Copilot Team
- **Owner**: M1.8 Copilot Simulation (future)
- **Support**: Analytics pipeline enhancements

---

## Communication & Coordination

### Daily Standup
- Time: 10:00 AM
- Format: Async in Slack #engineering
- Template:
  - Yesterday: What I completed
  - Today: What I'm working on
  - Blockers: Any impediments

### Weekly Sync
- Time: Fridays 2:00 PM
- Attendees: All team leads + PM
- Agenda:
  - Milestone progress review
  - Blocker resolution
  - Next week planning
  - Risk assessment

### Milestone Reviews
- Trigger: On milestone completion
- Format: Document + demo
- Approver: Engineering lead + PM

---

## Next Steps

### Immediate (This Week)
1. **Assign owners** to M0.6 and M0.5 tasks
2. **Create tracking board** (GitHub Projects or similar)
3. **Set up coordination channel** (#automation-runner)
4. **Schedule kickoff meeting** for M0.5

### Short Term (Next 2 Weeks)
1. **Complete M0.6** Competitor Monitoring E2E
2. **Implement M0.5** database models and worker queue
3. **Set up production monitoring** infrastructure

### Medium Term (Weeks 3-4)
1. **Complete M0.5** with all acceptance criteria met
2. **Deploy monitoring** to production
3. **Begin M1.6** execution APIs

---

## Appendix

### Related Documents
- [00_EXEC_SUMMARY.md](./00_EXEC_SUMMARY.md) - Executive summary
- [01_MILESTONES.md](./01_MILESTONES.md) - Milestone definitions
- [04_KICKOFF_CHECKLIST.md](./04_KICKOFF_CHECKLIST.md) - Task tracking
- [NOVEMBER_2025_PROGRESS.md](./NOVEMBER_2025_PROGRESS.md) - Recent progress
- [OPERATIONAL_SLAS.md](./OPERATIONAL_SLAS.md) - SLA definitions

### References
- [Event-Driven Architecture](https://martinfowler.com/articles/201701-event-driven.html)
- [Saga Pattern](https://microservices.io/patterns/data/saga.html)
- [Circuit Breaker Pattern](https://martinfowler.com/bliki/CircuitBreaker.html)
- [Rate Limiting Strategies](https://cloud.google.com/architecture/rate-limiting-strategies-techniques)

---

**Document Status**: 🟢 READY FOR EXECUTION
**Next Review**: November 18, 2025 (weekly sync)
**Last Updated**: November 11, 2025
