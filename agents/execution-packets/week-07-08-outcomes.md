# Weeks 7-8 Execution Packet: Outcome Tracking

**Tasks**: CAL-044 through CAL-054  
**Hours**: 33-36 (split across 2 weeks)  
**Agent**: Claude Code (backend), Cursor (Console dashboards)  
**Dependencies**: Week 6 complete (CAL-038 to CAL-043)

---

## OBJECTIVE

Build the "Expected vs. Realized" outcome tracking system — the killer feature that makes Calibrate indispensable to finance leaders. Track what was promised vs. what actually happened for every mutation, with variance analysis and performance metrics.

---

## WEEK 7: OUTCOME DATA MODEL + INGESTION

### CAL-044: Outcome tracking data model

**File**: Review `packages/db/prisma/schema.prisma` (OutcomeMetric already defined in Week 1)

Verify OutcomeMetric table supports all use cases.

**Key fields**:
- `mutationId` — which mutation this tracks
- `metricName` — e.g., "deal_closed", "margin_actual", "churn_6mo"
- `expectedValue` — what simulation predicted
- `actualValue` — what really happened
- `variance` — (actual - expected) / expected
- `observationStart` / `observationEnd` — time window
- `status` — AWAITING, TRACKING, COMPLETE, REVIEWED
- `source` — where actual data came from (stripe_webhook, manual, crm_sync)

**Done when**: Schema supports discount outcomes (deal closed, margin) and plan price outcomes (churn, expansion ARR).

---

### CAL-045: Outcome data ingestion API

**File**: `apps/api/app/api/v1/outcomes/[mutationId]/record/route.ts`

Endpoint to record actual outcome data.

**Request body**:
```typescript
{
  metricName: string,
  actualValue: Json,
  observedAt: string,  // ISO 8601
  source: string
}
```

**Logic**:
1. Load OutcomeMetric for this mutation + metricName
2. Verify observation window (observedAt within start/end)
3. Update actualValue, observedAt, source
4. Calculate variance
5. Update status to COMPLETE
6. Emit `outcome.recorded` audit event

**Done when**: Can POST actual outcome data, variance auto-calculated.

---

### CAL-046: Variance calculation engine

**File**: `packages/mutation-engine/src/OutcomeAnalyzer.ts`

Calculate variance and flag significant misses.

**Variance formula**:
```typescript
variance = (actualValue - expectedValue) / expectedValue
```

**Significance thresholds**:
- Variance > 20% → flag as "significant miss"
- Variance > 50% → flag as "critical miss"
- Variance < -20% → flag as "significant beat"

**Aggregate metrics**:
- Average variance by approver
- Average variance by rep
- Average variance by domain

**Done when**: Variance calculated correctly. Significant misses flagged.

---

### CAL-047: Webhook receiver for external outcomes

**File**: `apps/api/app/api/webhooks/outcomes/route.ts`

Accept outcome data from external systems (Stripe, CRM, etc.).

**Use cases**:
1. **Stripe webhook**: `invoice.payment_succeeded` → record deal_closed=true
2. **CRM webhook**: Opportunity closed → record deal_value_actual
3. **Manual CSV upload**: Bulk import outcome data

**Security**:
- Verify webhook signature (HMAC)
- Rate limit per tenant

**Done when**: Can receive Stripe webhook, map to mutation, record outcome.

---

### CAL-048: Outcome status lifecycle

**File**: `packages/mutation-engine/src/OutcomeManager.ts`

Manage outcome metric lifecycle.

**States**:
- **AWAITING**: Mutation applied, waiting for observation window to start
- **TRACKING**: In observation window, waiting for actual data
- **COMPLETE**: Actual data recorded, variance calculated
- **REVIEWED**: Finance leader marked as reviewed

**Transitions**:
- AWAITING → TRACKING (when observationStart reached)
- TRACKING → COMPLETE (when actual data recorded)
- COMPLETE → REVIEWED (when user marks reviewed)

**Auto-transitions**:
- Cron job runs daily, moves AWAITING → TRACKING if observationStart passed
- If observationEnd passed and still TRACKING → flag as "missing data"

**Done when**: Outcome metrics transition through states correctly.

---

### CAL-049: Seed data — Realistic mutations with outcomes

**File**: `packages/db/prisma/seeds/demo-mutations.ts`

Create 20 discount mutations + 3 plan price mutations with realistic outcomes.

**Discount examples**:
1. 15% discount, expected margin 60%, actual 61% → +1.7% variance (beat)
2. 22% discount, expected deal_closed=true, actual=true → 0% variance (on target)
3. 30% discount, expected margin 55%, actual 48% → -12.7% variance (miss)

**Plan price examples**:
1. Pro plan +20%, expected churn 15%, actual 12% → -20% variance (beat)
2. Enterprise plan +30%, expected churn 25%, actual 35% → +40% variance (critical miss)

**Done when**: Demo tenant has 23 mutations with outcomes for realistic dashboard.

---

## WEEK 8: OUTCOME DASHBOARDS

### CAL-050: Console — Outcome Dashboard

**File**: `apps/console/app/p/[slug]/outcomes/page.tsx`

Main outcome tracking dashboard.

**Sections**:
1. **Active Tracking** (status=TRACKING)
   - List of mutations currently in observation window
   - Days remaining until observationEnd
2. **Recent Completions** (status=COMPLETE, last 30 days)
   - Mutation, expected, actual, variance
   - Color-coded: green (beat), yellow (on target), red (miss)
3. **Aggregate Stats**
   - Total mutations tracked
   - Average variance (all time)
   - Significant misses count
   - Critical misses count

**Done when**: Finance leader sees at-a-glance view of outcome tracking health.

---

### CAL-051: Console — Mutation outcome detail

**File**: `apps/console/app/p/[slug]/mutations/[id]/outcomes/page.tsx` (or section in detail)

Timeline view of expected vs. actual for a single mutation.

**Display**:
- Mutation summary (who, what, when)
- Expected outcomes (from simulation)
- Observation window (start → end)
- Actual outcomes (when recorded)
- Variance per metric
- Timeline visualization (expected vs actual over time)

**Actions**:
- Mark as reviewed
- Add note (e.g., "Churn higher due to competitor pricing")

**Done when**: User can drill into single mutation, see full outcome story.

---

### CAL-052: Console — Rep/Approver performance view

**File**: `apps/console/app/p/[slug]/outcomes/performance/page.tsx`

**THE VIEW FINANCE LEADERS BUY FOR.**

**Table columns**:
- Rep / Approver Name
- Mutations Count
- Avg Variance
- Significant Misses
- Critical Misses
- Trend (last 30 days vs. prior 30 days)

**Filters**:
- By domain (discount, plan price)
- By time range (last 30d, 90d, all time)

**Insights**:
- "John Doe approved 12 discounts with avg variance -8% (beats expectations)"
- "Jane Smith's plan price changes have 35% avg variance (misses expectations)"

**Done when**: Finance VP can see which reps/approvers are accurate vs. optimistic.

---

### CAL-053: Console — Cohort analysis for plan prices

**File**: `apps/console/app/p/[slug]/outcomes/cohorts/page.tsx`

Compare grandfathered vs. new price cohorts.

**Metrics**:
- Retention rate (grandfathered vs. affected)
- Expansion ARR (upsells within each cohort)
- Churn rate (actual vs. expected)

**Visualization**:
- Cohort retention curves
- ARR waterfall (expected → actual)

**Done when**: User can see if grandfathering policy reduced churn as expected.

---

### CAL-054: Export — Outcome reports as CSV

**File**: `apps/api/app/api/v1/outcomes/export/route.ts`

Export outcome data for QBR presentations.

**Formats**:
- CSV (for Excel)
- JSON (for custom analysis)

**Columns**:
- Mutation ID, Domain, Type, Created By, Created At
- Expected values (all metrics)
- Actual values (all metrics)
- Variance (all metrics)
- Status, Reviewed

**Done when**: Finance leader can export data, create custom charts for board meetings.

---

## ACCEPTANCE CRITERIA (WEEKS 7-8 COMPLETE)

- [ ] Outcome data model supports discount + plan price metrics
- [ ] Can record actual outcomes via API
- [ ] Variance calculated automatically
- [ ] Webhook receiver accepts external outcome data
- [ ] Outcome status lifecycle works (AWAITING → TRACKING → COMPLETE → REVIEWED)
- [ ] Demo tenant has 23 mutations with realistic outcomes
- [ ] Console: Outcome dashboard shows active tracking + recent completions
- [ ] Console: Mutation outcome detail with timeline
- [ ] Console: Rep/approver performance view (the killer feature)
- [ ] Console: Cohort analysis for plan prices
- [ ] CSV export works

---

## DO NOT

- Do not build predictive ML models (use actual data only)
- Do not add AI-powered forecasting
- Do not reference Stripe internals

---

## NEXT

When all CAL-044 through CAL-054 are DONE, proceed to:  
`/agents/execution-packets/week-09-10-demo-outreach.md`
