# Week 6 Execution Packet: Plan Price Change Flow

**Tasks**: CAL-038 through CAL-043  
**Hours**: 16-19  
**Agent**: Claude Code (backend), Cursor (Console UI)  
**Dependencies**: Weeks 4-5 complete (CAL-026 to CAL-037)

---

## OBJECTIVE

Prove the mutation lifecycle is domain-agnostic by building a second domain: plan price changes. Same governance engine, different business logic. When done, SaaS founders can propose plan price increases with cohort analysis, grandfathering policies, and approval workflows.

---

## TASKS

### CAL-038: Plan price domain handler

**File**: `packages/mutation-engine/src/domain/PlanPriceHandler.ts`

Complete implementation of DomainHandler for plan price changes.

**Payload schema**:
```typescript
interface PlanPricePayload {
  plan_id: string;
  plan_name: string;
  current_price: number;
  new_price: number;
  effective_date: string;  // ISO 8601
  grandfathering_policy: 'none' | 'lock_3mo' | 'lock_6mo' | 'lock_12mo' | 'forever';
  notification_days?: number;
}
```

**Methods**:
- `validatePayload()` — Ensure plan exists, price > 0, effective_date in future
- `simulate()` — Calculate affected customers, ARR impact, churn estimate
- `explain()` — Generate cohort breakdown narrative (from CAL-020)
- `apply()` — Update plan price, create grandfathering records
- `rollback()` — Restore previous price
- `getOutcomeMetrics()` — Track churn_actual, expansion_arr, retention_6mo

**Done when**: All methods implemented, unit tested, integrated.

---

### CAL-039: Plan price simulation engine

**File**: `packages/mutation-engine/src/domain/PlanPriceSimulator.ts`

Structural simulation (not predictive churn modeling).

**Logic**:
1. Query all active subscriptions on this plan
2. Group by cohort:
   - **Grandfathered**: Locked at current price per policy
   - **Affected**: Will see price increase
3. Calculate ARR impact:
   - `affected_arr = affected_count * (new_price - current_price) * 12`
   - `grandfathered_arr = grandfathered_count * current_price * 12`
4. Estimate churn (simple heuristic):
   - 0-10% increase → 5% churn
   - 10-20% increase → 15% churn
   - 20-30% increase → 25% churn
   - >30% increase → 40% churn
5. Net ARR delta = (affected_arr * (1 - churn_rate)) - (churn_count * current_price * 12)

**Output**:
```typescript
{
  affected_customer_count: number,
  grandfathered_customer_count: number,
  arr_at_risk: number,
  expected_uplift: number,
  net_delta: number,
  churn_estimate_percent: number
}
```

**Done when**: Simulation returns accurate cohort breakdown and ARR calculations.

---

### CAL-040: Plan price policy templates

**File**: `packages/db/prisma/seeds/policies.ts` (add to existing)

Seed policies for plan price domain.

**Templates**:
1. **max_increase_20_auto**: price_increase_percent ≤ 20% → ALLOW
2. **requires_ceo_above_20**: price_increase_percent > 20% → REQUIRE_APPROVAL (ceo)
3. **min_notice_30_days**: effective_date < 30 days from now → WARN
4. **block_above_50**: price_increase_percent > 50% → BLOCK

**Done when**: Policies seeded, evaluated correctly.

---

### CAL-041: Console — Plan Price Change form

**File**: `apps/console/app/p/[slug]/mutations/new/plan-price/page.tsx`

Form to create plan price change mutation.

**Fields**:
- Plan (dropdown: Pro, Enterprise, etc.)
- Current Price (read-only, auto-filled)
- New Price (number input)
- Effective Date (date picker, must be future)
- Grandfathering Policy (dropdown: None, 3mo, 6mo, 12mo, Forever)
- Notification Days (number input, default 30)

**Flow**:
1. User selects plan → current price auto-fills
2. User enters new price → % increase calculated
3. Click "Preview Impact"
4. Auto-runs simulation → shows cohort breakdown, ARR impact, churn estimate
5. If user confirms → POST /api/v1/mutations → creates mutation
6. Auto-runs evaluate → shows policy results
7. Redirect to mutation detail page

**Done when**: Founder can create plan price change, see cohort impact, submit for approval.

---

### CAL-042: Console — Affected customer preview

**File**: `apps/console/app/p/[slug]/mutations/[id]/customers/page.tsx` (or section in detail page)

Show which customers are affected by plan price change.

**Table columns**:
- Customer Name
- Current Plan
- Current Price
- New Price
- Status (Grandfathered / Affected)
- ARR Impact

**Filters**:
- Show all / Show grandfathered only / Show affected only

**Done when**: User can see full customer list, understand who's grandfathered, who's affected.

---

### CAL-043: Integration test — Plan price lifecycle

**File**: `apps/api/tests/integration/plan-price-lifecycle.test.ts`

End-to-end test for plan price domain.

**Scenario**:
1. Create plan price mutation (Pro: $99 → $129, 30% increase)
2. Simulate → 240 affected, 60 grandfathered, $86K net ARR
3. Evaluate → requires CEO approval (>20% increase)
4. CEO approves
5. Apply → plan price updated, grandfathering records created
6. Verify: plan.price = 129, grandfathered customers still see $99

**Done when**: Test passes. Proves second domain works on same engine.

---

## ACCEPTANCE CRITERIA (WEEK 6 COMPLETE)

- [ ] Plan price domain handler fully implemented
- [ ] Simulation returns cohort breakdown and ARR impact
- [ ] Console: plan price change form with preview
- [ ] Console: affected customer list
- [ ] Integration test passes
- [ ] Two domains (discount + plan price) running on one mutation engine
- [ ] Same governance, audit, approval flows for both domains

---

## DO NOT

- Do not build outcome tracking yet (Week 7-8)
- Do not add predictive churn modeling (use simple heuristics)
- Do not reference Stripe internals

---

## NEXT

When all CAL-038 through CAL-043 are DONE, proceed to:  
`/agents/execution-packets/week-07-08-outcomes.md`
