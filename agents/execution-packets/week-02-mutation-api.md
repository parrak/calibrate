# Week 2 Execution Packet: Mutation API + Policy Engine

**Tasks**: CAL-010 through CAL-018  
**Hours**: 18-21  
**Agent**: Claude Code (primary)  
**Dependencies**: Week 1 complete (CAL-001 to CAL-009)

---

## OBJECTIVE

Build the REST API for the mutation lifecycle and implement the policy evaluation engine. When done, developers can create mutations via API, run simulations, evaluate policies, and execute the full approve → apply → rollback flow.

---

## TASKS

### CAL-010: `POST /api/v1/mutations` — Create mutation

**File**: `apps/api/app/api/v1/mutations/route.ts`

Create endpoint to accept mutation proposals.

**Request body**:
```typescript
{
  domain: "DISCOUNT" | "PLAN_PRICE" | "PRICING",
  type: string,  // e.g. "discount_override"
  payload: Json, // domain-specific, validated per domain
  createdBy: string
}
```

**Logic**:
1. Validate domain and type
2. Call domain handler's `validatePayload()`
3. Create Mutation record with status=PROPOSED
4. Emit `mutation.created` audit event
5. Return mutation ID + initial state

**Done when**: Can POST a discount mutation with valid payload, get back mutation ID, see it in database with PROPOSED status.

---

### CAL-011: `GET /api/v1/mutations/:id` — Detail

**File**: `apps/api/app/api/v1/mutations/[id]/route.ts`

Return full mutation detail including all relations.

**Response includes**:
- Mutation record
- MutationItems (before/after state per entity)
- PolicyEvaluations (all policy checks)
- ApprovalSteps (approval chain state)
- ExplainTraces (human-readable narrative)
- AuditEvents (full history)
- OutcomeMetrics (expected vs actual)

**Done when**: GET returns complete nested object. RLS enforced (tenant-scoped).

---

### CAL-012: `GET /api/v1/mutations` — List + filter

**File**: `apps/api/app/api/v1/mutations/route.ts` (GET handler)

List mutations with filtering and pagination.

**Query params**:
- `status` (filter by MutationStatus)
- `domain` (filter by MutationDomain)
- `createdBy` (filter by user)
- `limit` (default 50, max 200)
- `cursor` (for pagination)

**Done when**: Can list mutations, filter by status, paginate through results. Tenant-scoped.

---

### CAL-013: `POST /mutations/:id/simulate`

**File**: `apps/api/app/api/v1/mutations/[id]/simulate/route.ts`

Run domain-specific simulation (structural, not predictive).

**Logic**:
1. Load mutation
2. Get domain handler for mutation.domain
3. Call `handler.simulate(mutation, items)`
4. Store result in `mutation.simulationResult`
5. Update status to SIMULATING → EVALUATED
6. Emit audit event

**Done when**: Discount mutation simulation returns revenue delta, margin impact, ARR exposure. Plan price simulation returns affected customer count, ARR at risk.

---

### CAL-014: `POST /mutations/:id/evaluate`

**File**: `apps/api/app/api/v1/mutations/[id]/evaluate/route.ts`

Run all applicable policies against the mutation.

**Logic**:
1. Load mutation + simulation result
2. Query active policies for mutation.domain
3. For each policy, evaluate against mutation payload + simulation
4. Create PolicyEvaluation records
5. Aggregate: if any policy returns BLOCK → mutation blocked. If any REQUIRE_APPROVAL → needs approval. Otherwise ALLOW.
6. Store aggregated result in `mutation.policyResult`
7. Update status to EVALUATED
8. If REQUIRE_APPROVAL, create ApprovalStep records per routing rules

**Done when**: Policy "max_discount_15_auto" triggers REQUIRE_APPROVAL for 22% discount. Approval step created for "finance" role.

---

### CAL-015: `POST /mutations/:id/approve`

**File**: `apps/api/app/api/v1/mutations/[id]/approve/route.ts`

Approve current approval step.

**Logic**:
1. Load mutation + approval steps
2. Find current pending step (lowest stepOrder with status=PENDING)
3. Verify requester has required role
4. Mark step as APPROVED, record decidedBy, decidedAt, decidedVia
5. If all steps approved → update mutation status to APPROVED
6. Emit `mutation.approved` audit event

**Done when**: Finance user can approve step 1. If multi-step, mutation stays AWAITING_APPROVAL until all steps done.

---

### CAL-016: `POST /mutations/:id/apply`

**File**: `apps/api/app/api/v1/mutations/[id]/apply/route.ts`

Execute the mutation (idempotent).

**Logic**:
1. Verify mutation status = APPROVED
2. Check idempotency: if already APPLIED, return success (no-op)
3. Update status to EXECUTING
4. Call domain handler's `apply(mutation)`
5. Handler writes changes (e.g., update customer discount in DB)
6. Handler returns rollback plan
7. Store rollback plan in `mutation.rollbackPlan`
8. Update status to APPLIED, record appliedAt, appliedBy
9. Create OutcomeMetric records per handler's `getOutcomeMetrics()`
10. Emit `mutation.applied` audit event

**Done when**: Discount mutation writes discount_percent to customer record. Rollback plan stored. Outcome metrics created with status=AWAITING.

---

### CAL-017: `POST /mutations/:id/rollback`

**File**: `apps/api/app/api/v1/mutations/[id]/rollback/route.ts`

Undo the mutation.

**Logic**:
1. Verify mutation status = APPLIED
2. Load rollback plan
3. Call domain handler's `rollback(mutation)`
4. Handler executes rollback (restore previous state)
5. Update status to ROLLED_BACK, record rolledBackAt, rollbackReason
6. Emit `mutation.rolled_back` audit event

**Done when**: Can rollback a discount mutation, customer discount_percent restored to original value.

---

### CAL-018: Policy engine — Evaluate guardrails

**File**: `packages/mutation-engine/src/PolicyEngine.ts` (new package)

Core policy evaluation logic.

**Interface**:
```typescript
class PolicyEngine {
  async evaluate(
    mutation: Mutation,
    simulation: SimulationResult,
    policies: Policy[]
  ): Promise<PolicyEvaluation[]>
}
```

**Policy types**:
1. **Threshold**: If field > threshold → action
2. **Role gate**: Require specific role approval
3. **Time window**: Block mutations outside allowed hours
4. **Hard block**: Always block (e.g., discount > 50%)

**Example policy config**:
```json
{
  "type": "threshold",
  "field": "discount_percent",
  "threshold": 15,
  "action": "REQUIRE_APPROVAL",
  "approver_role": "finance"
}
```

**Done when**: Can define policy, evaluate mutation against it, get ALLOW/WARN/REQUIRE_APPROVAL/BLOCK result with reason.

---

## ACCEPTANCE CRITERIA (WEEK 2 COMPLETE)

- [ ] Can create mutation via `POST /api/v1/mutations`
- [ ] Can simulate via `POST /mutations/:id/simulate`
- [ ] Can evaluate policies via `POST /mutations/:id/evaluate`
- [ ] Policy engine correctly triggers approval requirements
- [ ] Can approve via `POST /mutations/:id/approve`
- [ ] Can apply via `POST /mutations/:id/apply` (writes changes)
- [ ] Can rollback via `POST /mutations/:id/rollback` (restores state)
- [ ] Full audit trail captured in AuditEvent table
- [ ] All endpoints are tenant-scoped (RLS enforced)
- [ ] Integration test: create → simulate → evaluate → approve → apply → rollback

---

## DO NOT

- Do not build UI (that's Week 4)
- Do not add Slack integration (that's Week 5)
- Do not optimize for performance (premature)
- Do not add outcome tracking yet (that's Week 7-8)
- Do not reference Stripe internals

---

## NEXT

When all CAL-010 through CAL-018 are DONE, proceed to:  
`/agents/execution-packets/week-03-explain-audit.md`
