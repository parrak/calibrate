# Weeks 4-5 Execution Packet: Discount Flow + Slack Integration

**Tasks**: CAL-026 through CAL-037  
**Hours**: 30-36 (split across 2 weeks)  
**Agent**: Claude Code (backend), Cursor (Console UI)  
**Dependencies**: Week 3 complete (CAL-019 to CAL-025)

---

## OBJECTIVE

Build the complete discount override governance flow: domain handler, Console UI for creating and managing discount requests, and Slack integration for approval notifications. End with a polished Loom demo recording.

---

## WEEK 4: DISCOUNT DOMAIN + CONSOLE

### CAL-026: Discount domain handler

**File**: `packages/mutation-engine/src/domain/DiscountHandler.ts`

Complete implementation of all DomainHandler methods for discount domain.

**Methods**:
- `validatePayload()` — Ensure required fields present, types correct
- `simulate()` — Calculate revenue delta, margin impact, ARR exposure
- `explain()` — Generate human-readable narrative (from CAL-019)
- `apply()` — Write discount to customer record
- `rollback()` — Restore previous discount value
- `getOutcomeMetrics()` — Define metrics to track (deal_closed, margin_actual, retention_6mo)

**Done when**: All methods implemented, unit tested, integrated with mutation API.

---

### CAL-027: Discount simulation engine

**File**: `packages/mutation-engine/src/domain/DiscountSimulator.ts`

Structural simulation logic (not predictive forecasting).

**Inputs**:
- `customer_id`, `deal_value`, `discount_percent`, `margin_percent`

**Outputs**:
```typescript
{
  revenueDelta: number,        // negative (discount reduces revenue)
  marginBefore: number,        // current margin %
  marginAfter: number,         // post-discount margin %
  arrExposure: number,         // absolute ARR at risk
  guardrailFlags: GuardrailFlag[]
}
```

**Guardrail checks**:
- Discount > 50% → BLOCK
- Discount > 25% → WARN (high risk)
- Margin after < 30% → WARN (unprofitable)

**Done when**: Simulation returns accurate calculations. Guardrails trigger correctly.

---

### CAL-028: Discount policy templates

**File**: `packages/db/prisma/seeds/policies.ts`

Seed database with common discount policies.

**Templates**:
1. **max_discount_auto_approve**: discount_percent ≤ 15% → ALLOW
2. **requires_finance_above_15**: discount_percent > 15% → REQUIRE_APPROVAL (finance)
3. **requires_ceo_above_40**: discount_percent > 40% → REQUIRE_APPROVAL (finance, ceo)
4. **block_above_50**: discount_percent > 50% → BLOCK
5. **margin_floor**: margin_after < 30% → WARN

**Done when**: Seed script creates policies. Can query and evaluate them.

---

### CAL-029: Console — Mutation dashboard

**File**: `apps/console/app/p/[slug]/mutations/page.tsx`

List view of all mutations for the project.

**Features**:
- Table with columns: ID, Domain, Type, Status, Created By, Created At, Actions
- Filter by status (dropdown: All, Proposed, Awaiting Approval, Approved, Applied, Rejected)
- Filter by domain (dropdown: All, Discount, Plan Price, Pricing)
- Badge for "Needs Your Approval" (if current user has pending approval step)
- Click row → navigate to detail page
- Pagination (cursor-based)

**Done when**: User can see all mutations, filter, and navigate to detail.

---

### CAL-030: Console — Mutation detail page

**File**: `apps/console/app/p/[slug]/mutations/[id]/page.tsx`

Full detail view with all mutation data.

**Sections**:
1. **Header**: Status badge, domain, type, created by/at
2. **Payload**: Display domain-specific fields (customer, deal value, discount %)
3. **Simulation**: Revenue delta, margin before/after, ARR exposure
4. **Explain**: Summary + narrative (human-readable)
5. **Policy Checks**: List of evaluated policies with ALLOW/WARN/REQUIRE_APPROVAL/BLOCK
6. **Approval Chain**: Steps with status, assigned role, decided by/at
7. **Audit Trail**: Timeline of all events
8. **Actions**: Approve, Reject, Apply, Rollback buttons (role-gated)

**Done when**: Finance user can review discount request, see explain trace, approve/reject.

---

### CAL-031: Console — Create Discount Override form

**File**: `apps/console/app/p/[slug]/mutations/new/discount/page.tsx`

Form to create a new discount override mutation.

**Fields**:
- Customer (dropdown or search)
- Deal ID (optional text)
- Deal Value (ARR, number input)
- Current Margin % (number input)
- Requested Discount % (number input, 0-100)
- Justification (textarea, optional)

**Flow**:
1. User fills form
2. Click "Preview Impact"
3. Auto-runs simulation → shows revenue delta, margin impact, guardrail flags
4. If user confirms → POST /api/v1/mutations → creates mutation
5. Auto-runs evaluate → shows policy results
6. Redirect to mutation detail page

**Done when**: Sales rep can create discount request, see impact preview, submit for approval.

---

## WEEK 5: SLACK INTEGRATION + POLISH

### CAL-032: Slack app setup

**File**: `apps/api/lib/slack/SlackClient.ts`

Set up Slack app with required scopes and event subscriptions.

**Scopes needed**:
- `chat:write` (send messages)
- `users:read` (map Slack user to Calibrate user)
- `im:write` (DM approvers)

**Event subscriptions**:
- `message.im` (for slash commands, optional)

**OAuth flow**:
- Workspace installs Slack app
- Store bot token in tenant settings

**Done when**: Slack app installed in test workspace, bot token stored.

---

### CAL-033: Slack notification on approval_required

**File**: `apps/api/lib/slack/MutationNotifier.ts`

Send rich Slack message when mutation requires approval.

**Trigger**: `mutation:awaiting_approval` event  
**Recipient**: Users with required role

**Message format**:
```
🔔 Discount Approval Required

Customer: Acme Corp
Deal Value: $50,000 ARR
Requested Discount: 22%
Margin Impact: 65% → 58%
ARR Exposure: $11,000

Reason: Sales rep John Doe requested discount above 15% auto-approve threshold.

[View Details] [Approve] [Reject]
```

**Done when**: Finance users receive Slack DM when discount > 15% submitted.

---

### CAL-034: Slack action handler → API callback

**File**: `apps/api/app/api/webhooks/slack/actions/route.ts`

Handle Slack button clicks (Approve, Reject).

**Flow**:
1. Slack sends webhook when user clicks button
2. Verify Slack signature (security)
3. Map Slack user ID → Calibrate user ID
4. Call `POST /mutations/:id/approve` or `/mutations/:id/reject`
5. Update Slack message: "✅ Approved by @jane" or "❌ Rejected by @jane"
6. Send confirmation DM to requester

**Done when**: Finance user can approve discount from Slack. Mutation status updates. Requester notified.

---

### CAL-035: Discount flow edge cases

**File**: Various (tests + handlers)

Handle edge cases and error scenarios.

**Cases**:
1. **Multi-step approval**: 45% discount → manager approves → finance still pending → CEO approves → applied
2. **Rejection with reason**: Manager rejects with note "Margin too low" → requester sees reason
3. **Expiration**: Mutation pending 7 days → auto-expire → notify requester
4. **Concurrent approvals**: Two approvers click at same time → only first counts
5. **Rollback after apply**: Applied discount → customer complains → rollback → discount removed

**Done when**: All 5 edge cases handled gracefully with tests.

---

### CAL-036: Console — Notification preferences

**File**: `apps/console/app/p/[slug]/settings/notifications/page.tsx`

Configure which mutation events trigger Slack notifications.

**Settings**:
- [ ] Notify on approval required (role-based)
- [ ] Notify on approval granted
- [ ] Notify on rejection
- [ ] Notify on application
- [ ] Notify on rollback

**Done when**: User can toggle notification preferences. Settings respected.

---

### CAL-037: E2E test + Loom recording

**Files**: Test + recording

**Test scenario**:
1. Sales rep creates 22% discount request
2. System simulates impact
3. Policy engine requires finance approval
4. Finance user receives Slack notification
5. Finance user approves via Slack
6. System applies discount
7. Customer record updated
8. Outcome tracking begins

**Loom recording** (3-5 min):
- Show Console: create discount request
- Show simulation preview
- Show Slack notification
- Show approval via Slack
- Show mutation detail page (approved, applied)
- Show audit trail

**Done when**: E2E test passes. Loom recording uploaded and linked in README.

---

## ACCEPTANCE CRITERIA (WEEKS 4-5 COMPLETE)

- [ ] Discount domain handler fully implemented
- [ ] Console: mutation dashboard, detail page, create form
- [ ] Slack app installed and configured
- [ ] Slack notifications sent on approval_required
- [ ] Slack button actions (Approve/Reject) work
- [ ] Edge cases handled (multi-step, rejection, expiration, rollback)
- [ ] Notification preferences configurable
- [ ] E2E test passes
- [ ] Loom demo recorded and polished

---

## DO NOT

- Do not build plan price flow yet (Week 6)
- Do not build outcome tracking yet (Week 7-8)
- Do not add predictive ML or AI suggestions
- Do not reference Stripe internals

---

## NEXT

When all CAL-026 through CAL-037 are DONE, proceed to:  
`/agents/execution-packets/week-06-plan-price.md`
