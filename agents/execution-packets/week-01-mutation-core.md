# Week 1 Execution Packet: Mutation Core Schema

**Tasks**: CAL-001 through CAL-009
**Hours**: 15-18
**Agent**: Claude Code (primary)
**Dependencies**: None — this is the starting point

---

## OBJECTIVE

Create the domain-agnostic mutation data model that replaces pricing-specific tables as the core abstraction. When done, `pnpm migrate` succeeds, new TypeScript types compile, and all existing tests still pass.

---

## TASKS

### CAL-001: Define `Mutation` table

**File**: `packages/db/prisma/schema.prisma`

Add the `Mutation` model. See `ARCHITECTURE.md §3.2` for full schema.

Key fields:
- `id`, `tenantId`, `domain` (enum: DISCOUNT, PLAN_PRICE, PRICING)
- `status` (enum with 13 states, default PROPOSED)
- `payload` (Json — domain-specific, validated at application layer)
- `simulationResult`, `policyResult`, `rollbackPlan`, `outcomeExpected`, `outcomeActual` (all Json?)
- `createdBy`, `appliedBy`, `appliedAt`, `rolledBackAt`, `rollbackReason`
- `idempotencyKey` (unique, for safe retries)
- `expiresAt` (optional TTL for pending mutations)

Indexes: `[tenantId, status]`, `[tenantId, domain]`, `[tenantId, createdAt]`

**Done when**: Schema compiles. `pnpm prisma validate` passes.

---

### CAL-002: Define `MutationItem` table

Each mutation affects one or more entities. `MutationItem` captures the before/after state per entity.

Fields: `entityType` (customer, plan, subscription), `entityId`, `fieldName`, `beforeValue`, `afterValue`, `deltaValue`, `metadata`

Relation: `Mutation` has many `MutationItem`

**Done when**: Relation compiles. Can express "this discount mutation affects customer X, changing discount_percent from 0 to 22."

---

### CAL-003: Define `Policy` table

Reusable guardrails, not mutation-specific.

Fields: `tenantId`, `domain`, `name`, `description`, `type` (threshold, role_gate, time_window, hard_block), `config` (Json), `priority`, `active`

Index: `[tenantId, domain, active]`

**Done when**: Can express "For DISCOUNT domain, if discount_percent > 15, require finance approval."

---

### CAL-004: Define `PolicyEvaluation` table

Records the result of evaluating a specific policy against a specific mutation.

Fields: `mutationId`, `policyId`, `action` (ALLOW, WARN, REQUIRE_APPROVAL, BLOCK), `reason`, `inputs`

Relations: belongs to Mutation, belongs to Policy

**Done when**: Can record "Policy 'max_discount_auto_approve' evaluated mutation X → REQUIRE_APPROVAL because 22 > 15."

---

### CAL-005: Define `ApprovalStep` table

Multi-step approval chain.

Fields: `mutationId`, `stepOrder`, `role`, `assignedTo`, `status` (PENDING, APPROVED, REJECTED, EXPIRED), `decidedBy`, `decidedAt`, `decidedVia` (console, slack, api), `reason`

Unique constraint: `[mutationId, stepOrder]`

**Done when**: Can express "Step 1: Manager approved at 2:30pm via Slack. Step 2: Finance VP pending."

---

### CAL-006: Define `OutcomeMetric` table

Tracks expected vs. actual results per mutation.

Fields: `mutationId`, `metricName`, `expectedValue`, `actualValue`, `variance`, `observedAt`, `observationStart`, `observationEnd`, `status` (AWAITING, TRACKING, COMPLETE, REVIEWED), `source`

**Done when**: Can express "For mutation X, expected deal_closed=true. Actual: true. Expected margin=62%. Actual: 61.3%. Variance: -0.7pp."

---

### CAL-007: Define `ExplainTrace` model

Human-readable narrative attached to every mutation.

Fields: `mutationId`, `summary` (one-line), `narrative` (paragraph), `factors` (Json array), `generatedAt`

**Done when**: Can store "Rep requested 22% discount. Policy allows 15% auto. Override requires Finance. Margin: 65%→58%. ARR exposure: $3,150."

---

### CAL-008: Run migration and verify

```bash
cd packages/db
pnpm prisma migrate dev --name add-mutation-lifecycle
pnpm prisma generate
```

Then:
```bash
# From repo root
pnpm build
pnpm test
```

**Done when**: Migration applies cleanly. `prisma generate` produces client. `pnpm build` succeeds. All existing tests pass (pricing engine, connectors, security, monitoring).

**If existing tests fail**: Document which tests fail and why. Do NOT modify existing tests to make them pass — flag for human review.

---

### CAL-009: Update `@calibr/types`

In `packages/types/`, add TypeScript interfaces that match the Prisma models:

```typescript
// New file: packages/types/src/mutation.ts

export interface Mutation { ... }
export interface MutationItem { ... }
export interface Policy { ... }
export interface PolicyEvaluation { ... }
export interface ApprovalStep { ... }
export interface ExplainTrace { ... }
export interface OutcomeMetric { ... }

// Domain-specific payload types
export interface DiscountPayload {
  customer_id: string;
  customer_name: string;
  deal_id?: string;
  deal_value: number;         // ARR or deal size
  discount_percent: number;   // requested discount
  margin_percent: number;     // current margin
  justification?: string;     // rep's reason
}

export interface PlanPricePayload {
  plan_id: string;
  plan_name: string;
  current_price: number;
  new_price: number;
  effective_date: string;     // ISO 8601
  grandfathering_policy: 'none' | 'lock_3mo' | 'lock_6mo' | 'lock_12mo' | 'forever';
  notification_days?: number; // days before effective
}

// Simulation result types
export interface DiscountSimulation {
  revenue_delta: number;
  margin_before: number;
  margin_after: number;
  arr_exposure: number;
  guardrail_flags: GuardrailFlag[];
}

export interface PlanPriceSimulation {
  affected_customer_count: number;
  grandfathered_customer_count: number;
  arr_at_risk: number;
  expected_uplift: number;
  net_delta: number;
  churn_estimate_percent: number;
}

export interface GuardrailFlag {
  policy_name: string;
  triggered: boolean;
  action: 'ALLOW' | 'WARN' | 'REQUIRE_APPROVAL' | 'BLOCK';
  message: string;
}
```

Re-export from `packages/types/src/index.ts`.

**Done when**: `pnpm build` succeeds. Types can be imported from `@calibr/types` in other packages.

---

## ACCEPTANCE CRITERIA (WEEK 1 COMPLETE)

- [ ] `pnpm prisma migrate dev` applies cleanly
- [ ] `pnpm prisma generate` succeeds
- [ ] `pnpm build` succeeds across all packages
- [ ] All existing tests pass (0 regressions)
- [ ] New types importable: `import { Mutation, DiscountPayload } from '@calibr/types'`
- [ ] Can manually insert a Mutation row via Prisma Studio or seed script
- [ ] RLS verified: mutations scoped to tenant

---

## DO NOT

- Do not modify existing pricing engine logic (it still works)
- Do not create API routes (that's Week 2)
- Do not build UI (that's Week 4)
- Do not optimize for performance (premature)
- Do not add MCP tooling
- Do not reference Stripe internals or IP

---

## NEXT

When all CAL-001 through CAL-009 are DONE, proceed to:
`/agents/execution-packets/week-02-mutation-api.md`
