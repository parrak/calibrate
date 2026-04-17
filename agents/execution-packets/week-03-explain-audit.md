# Week 3 Execution Packet: Explain Traces + Audit + Approval Routing

**Tasks**: CAL-019 through CAL-025  
**Hours**: 15-18  
**Agent**: Claude Code (primary)  
**Dependencies**: Week 2 complete (CAL-010 to CAL-018)

---

## OBJECTIVE

Add human-readable explanations for every mutation, comprehensive audit trails, and intelligent approval routing. Extract existing pricing engine as a domain handler for backward compatibility.

---

## TASKS

### CAL-019: Explain trace generation — Discount mutations

**File**: `packages/mutation-engine/src/domain/DiscountHandler.ts`

Implement `explain()` method for discount domain.

**Input**: Mutation + SimulationResult  
**Output**: ExplainTrace

**Example output**:
```typescript
{
  summary: "22% discount requested. Policy allows 15% auto-approve. Finance approval required.",
  narrative: "Sales rep requested 22% discount for customer Acme Corp on $50K ARR deal. Current margin: 65%. Post-discount margin: 58%. ARR exposure: $11,000. Policy 'max_discount_auto_approve' triggered because 22% > 15% threshold. Requires finance approval before execution.",
  factors: [
    { factor: "discount_percent", value: 22, weight: "high", direction: "negative" },
    { factor: "deal_value", value: 50000, weight: "high", direction: "neutral" },
    { factor: "margin_delta", value: -7, weight: "medium", direction: "negative" }
  ]
}
```

**Done when**: Every discount mutation has a clear, non-technical explanation a finance VP can understand.

---

### CAL-020: Explain trace generation — Plan price mutations

**File**: `packages/mutation-engine/src/domain/PlanPriceHandler.ts`

Implement `explain()` method for plan price domain.

**Example output**:
```typescript
{
  summary: "Pro plan price increase from $99 to $129. Affects 240 customers. Expected uplift: $86K ARR.",
  narrative: "Proposed 30% price increase on Pro plan effective March 1, 2026. 240 active customers affected. Grandfathering policy: lock current price for 3 months. Expected: 180 customers accept increase ($64.8K uplift), 50 customers churn ($59.4K loss), 10 customers downgrade ($7.2K loss). Net ARR impact: +$86K. Churn estimate: 20.8%.",
  factors: [
    { factor: "price_increase_percent", value: 30, weight: "high", direction: "positive" },
    { factor: "affected_customers", value: 240, weight: "high", direction: "neutral" },
    { factor: "churn_estimate", value: 20.8, weight: "high", direction: "negative" }
  ]
}
```

**Done when**: Plan price mutations explain cohort breakdown, ARR exposure, churn estimates.

---

### CAL-021: Approval routing logic

**File**: `packages/mutation-engine/src/ApprovalRouter.ts`

Intelligent routing based on policy evaluation results.

**Logic**:
1. If all policies return ALLOW → auto-approve (no approval steps)
2. If any policy returns BLOCK → reject immediately
3. If policies return REQUIRE_APPROVAL → create approval chain

**Routing rules** (configurable per tenant):
```typescript
{
  "discount_percent > 15": ["manager"],
  "discount_percent > 25": ["manager", "finance"],
  "discount_percent > 40": ["manager", "finance", "ceo"],
  "plan_price_increase > 20%": ["finance", "ceo"]
}
```

**Done when**: 22% discount creates 2-step approval (manager → finance). 45% discount creates 3-step (manager → finance → CEO).

---

### CAL-022: Audit event emission for every state transition

**File**: `packages/mutation-engine/src/MutationManager.ts`

Ensure every mutation state change emits an audit event.

**Events to emit**:
- `mutation.created`
- `mutation.simulated`
- `mutation.evaluated`
- `mutation.approved` (per approval step)
- `mutation.rejected`
- `mutation.applied`
- `mutation.rolled_back`
- `mutation.expired`
- `policy.evaluated` (per policy)

**Audit event structure**:
```typescript
{
  tenantId: string,
  mutationId: string,
  eventType: string,
  actor: string,      // user ID or "system"
  actorType: string,  // "user", "system", "agent", "slack"
  payload: Json,      // event-specific data
  metadata: {
    ip?: string,
    userAgent?: string,
    sessionId?: string
  }
}
```

**Done when**: Every mutation action creates an audit event. Can reconstruct full history from events.

---

### CAL-023: Webhook/notification hooks (prep for Slack)

**File**: `packages/mutation-engine/src/EventEmitter.ts`

Event bus for mutation lifecycle events.

**Interface**:
```typescript
class MutationEventEmitter {
  on(event: string, handler: (data: any) => Promise<void>): void
  emit(event: string, data: any): Promise<void>
}
```

**Events**:
- `mutation:awaiting_approval` → trigger Slack notification
- `mutation:approved` → notify requester
- `mutation:applied` → log to monitoring
- `mutation:rolled_back` → alert ops

**Done when**: Can register handlers for mutation events. Week 5 will use this for Slack integration.

---

### CAL-024: Integration tests — Full lifecycle

**File**: `apps/api/tests/integration/mutation-lifecycle.test.ts`

End-to-end test covering happy path + edge cases.

**Test cases**:
1. **Auto-approve path**: 10% discount → simulate → evaluate → auto-approved → apply
2. **Single approval**: 22% discount → simulate → evaluate → awaiting approval → manager approves → apply
3. **Multi-step approval**: 45% discount → manager approves → finance approves → CEO approves → apply
4. **Rejection**: 22% discount → manager rejects → status=REJECTED
5. **Rollback**: Applied mutation → rollback → state restored
6. **Expiration**: Mutation pending for 7 days → auto-expire
7. **Idempotency**: Apply same mutation twice → second is no-op

**Done when**: All 7 test cases pass. Audit trail verified for each.

---

### CAL-025: Extract existing pricing as domain handler

**File**: `packages/mutation-engine/src/domain/PricingHandler.ts`

Wrap existing `@calibr/pricing-engine` as a domain handler for backward compatibility.

**Purpose**: Existing pricing rules (Shopify bulk pricing) still work, now as a domain within the mutation system.

**Implementation**:
```typescript
class PricingHandler implements DomainHandler {
  domain = MutationDomain.PRICING;
  
  validatePayload(payload: unknown): ValidationResult {
    // Delegate to existing pricing-engine validation
  }
  
  simulate(mutation: Mutation): Promise<SimulationResult> {
    // Call existing pricing-engine preview logic
  }
  
  apply(mutation: Mutation): Promise<ApplyResult> {
    // Call existing pricing-engine apply logic
  }
  
  // ... other methods
}
```

**Done when**: Existing pricing rules can be executed via mutation API. No breaking changes to existing pricing-engine consumers.

---

## ACCEPTANCE CRITERIA (WEEK 3 COMPLETE)

- [ ] Every mutation has an ExplainTrace (discount + plan price)
- [ ] Approval routing creates correct approval chains based on thresholds
- [ ] All state transitions emit audit events
- [ ] Event emitter ready for Slack integration (Week 5)
- [ ] Integration tests pass (7 scenarios)
- [ ] Existing pricing engine works as a domain handler
- [ ] Developer can inspect full audit trail via API
- [ ] Non-technical user can understand explain traces

---

## DO NOT

- Do not build Slack integration yet (Week 5)
- Do not build Console UI yet (Week 4)
- Do not add outcome tracking yet (Week 7-8)
- Do not reference Stripe internals

---

## NEXT

When all CAL-019 through CAL-025 are DONE, proceed to:  
`/agents/execution-packets/week-04-05-discount-flow.md`
