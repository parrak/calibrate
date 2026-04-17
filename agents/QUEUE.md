# CALIBRATE — Agent Task Queue

**Last updated**: February 13, 2026
**Current phase**: Week 1 — Mutation Core

---

## HOW TO USE THIS FILE

This is the master task queue. Each task has:
- **ID**: Reference in commits and PRs (e.g., `[CAL-001]`)
- **Status**: `TODO` | `IN_PROGRESS` | `DONE` | `BLOCKED`
- **Packet**: Link to detailed execution packet with specs
- **Dependencies**: What must be done first
- **Agent hint**: Which agent tool is best suited (CC = Claude Code, CU = Cursor, GE = Gemini)

Agents: pick the next `TODO` task where all dependencies are `DONE`. Update status when starting and completing.

---

## PHASE 1: MUTATION CORE (Weeks 1-3)

### Week 1: Schema + Object Model

| ID | Task | Status | Hours | Deps | Agent | Notes |
|----|------|--------|-------|------|-------|-------|
| CAL-001 | Define `Mutation` table in Prisma schema | TODO | 3 | — | CC | See ARCHITECTURE.md §3.2 for full schema |
| CAL-002 | Define `MutationItem` table | TODO | 2 | CAL-001 | CC | Before/after state per affected entity |
| CAL-003 | Define `Policy` table | TODO | 2 | CAL-001 | CC | Type, domain, threshold, action |
| CAL-004 | Define `PolicyEvaluation` table | TODO | 1 | CAL-003 | CC | Links policy → mutation |
| CAL-005 | Define `ApprovalStep` table | TODO | 2 | CAL-001 | CC | Multi-step approval chain state |
| CAL-006 | Define `OutcomeMetric` table | TODO | 2 | CAL-001 | CC | Expected vs actual tracking |
| CAL-007 | Define `ExplainTrace` model | TODO | 1 | CAL-001 | CC | Summary, narrative, factors |
| CAL-008 | Run migration, verify RLS | TODO | 2 | CAL-001 thru CAL-007 | CC | `pnpm migrate` succeeds. Existing tests pass. |
| CAL-009 | Update `@calibr/types` with new interfaces | TODO | 2 | CAL-008 | CC | Mutation, MutationItem, Policy, Outcome TS types |

**Week 1 acceptance**: `pnpm migrate` succeeds. New tables exist. Types compile. Existing tests still pass.

---

### Week 2: Mutation API + Policy Engine

| ID | Task | Status | Hours | Deps | Agent | Notes |
|----|------|--------|-------|------|-------|-------|
| CAL-010 | `POST /api/v1/mutations` — create | TODO | 3 | CAL-009 | CC | Validates schema per domain, creates in PROPOSED status |
| CAL-011 | `GET /api/v1/mutations/:id` — detail | TODO | 1 | CAL-010 | CC | Includes items, evaluations, approval chain, audit |
| CAL-012 | `GET /api/v1/mutations` — list + filter | TODO | 2 | CAL-010 | CC | Pagination, tenant-scoped, filter by status/domain |
| CAL-013 | `POST /mutations/:id/simulate` | TODO | 3 | CAL-010 | CC | Domain-specific handler. Structural, not predictive. |
| CAL-014 | `POST /mutations/:id/evaluate` | TODO | 3 | CAL-010, CAL-003 | CC | Run all applicable policies, store results |
| CAL-015 | `POST /mutations/:id/approve` | TODO | 2 | CAL-014 | CC | Check approval chain, record decision, advance state |
| CAL-016 | `POST /mutations/:id/apply` | TODO | 2 | CAL-015 | CC | Idempotent execution, log each step, record rollback plan |
| CAL-017 | `POST /mutations/:id/rollback` | TODO | 2 | CAL-016 | CC | Execute rollback plan, audit trail, reason |
| CAL-018 | Policy engine: evaluate guardrails | TODO | 3 | CAL-003, CAL-010 | CC | Configurable rules against mutation payload |

**Week 2 acceptance**: Full lifecycle via API. Create discount mutation → simulate → policy check → approve → apply → rollback. All with audit trail.

---

### Week 3: Explain Traces + Audit + Approval Routing

| ID | Task | Status | Hours | Deps | Agent | Notes |
|----|------|--------|-------|------|-------|-------|
| CAL-019 | Explain trace gen: discount mutations | TODO | 3 | CAL-013 | CC | Human-readable narrative from simulation data |
| CAL-020 | Explain trace gen: plan price mutations | TODO | 2 | CAL-013 | CC | Affected customers, ARR exposure narrative |
| CAL-021 | Approval routing logic | TODO | 3 | CAL-018 | CC | Auto-approve if within thresholds, route by role if above |
| CAL-022 | Audit event emission for every state transition | TODO | 2 | CAL-010 | CC | Reuse existing audit_event infra |
| CAL-023 | Webhook/notification hooks (prep for Slack) | TODO | 2 | CAL-022 | CC | Event emitter for mutation lifecycle events |
| CAL-024 | Integration tests: full lifecycle | TODO | 3 | CAL-010 thru CAL-023 | CC | Happy path + edge cases |
| CAL-025 | Extract existing pricing as domain handler | TODO | 2 | CAL-010 | CC | Backward compat with existing pricing engine |

**Week 3 acceptance**: Developer can create a discount mutation via API, see explain trace, watch it route through approval, inspect full audit trail.

---

## PHASE 2: DOMAIN FLOWS (Weeks 4-6)

### Week 4: Discount Domain + Console

| ID | Task | Status | Hours | Deps | Agent | Notes |
|----|------|--------|-------|------|-------|-------|
| CAL-026 | Discount domain handler (simulate, explain, apply, rollback) | TODO | 4 | CAL-025 | CC | See ARCHITECTURE.md §3.3 for handler interface |
| CAL-027 | Discount simulation engine | TODO | 3 | CAL-026 | CC | Revenue delta, margin delta, ARR exposure. Structural only. |
| CAL-028 | Discount policy templates | TODO | 2 | CAL-018 | CC | max_discount_auto_approve, requires_finance_above, etc. |
| CAL-029 | Console: Mutation dashboard | TODO | 4 | CAL-012 | CU | List view, filterable by status/domain. Badge for "needs approval." |
| CAL-030 | Console: Mutation detail page | TODO | 4 | CAL-011 | CU | Diff, explain, simulation, policy, approval chain, audit |
| CAL-031 | Console: Create Discount Override form | TODO | 3 | CAL-010 | CU | Auto-runs simulation + policy on submit |

### Week 5: Slack + Polish

| ID | Task | Status | Hours | Deps | Agent | Notes |
|----|------|--------|-------|------|-------|-------|
| CAL-032 | Slack app setup | TODO | 2 | — | CC | Bot token, event subscriptions, OAuth |
| CAL-033 | Slack notification on approval_required | TODO | 3 | CAL-023, CAL-032 | CC | Rich message with Approve/Reject buttons |
| CAL-034 | Slack action handler → API callback | TODO | 3 | CAL-033 | CC | Button press → approve/reject with Slack user attribution |
| CAL-035 | Discount flow edge cases | TODO | 3 | CAL-026 | CC | Multi-step approval, rejection with reason, expiration |
| CAL-036 | Console: notification preferences | TODO | 2 | CAL-032 | CU | Configure which events → Slack |
| CAL-037 | E2E test + Loom recording | TODO | 3 | ALL above | — | Record complete discount lifecycle walkthrough |

### Week 6: Plan Price Change Flow

| ID | Task | Status | Hours | Deps | Agent | Notes |
|----|------|--------|-------|------|-------|-------|
| CAL-038 | Plan price domain handler | TODO | 4 | CAL-025 | CC | Affected customers, ARR at risk, expected uplift |
| CAL-039 | Plan price simulation engine | TODO | 3 | CAL-038 | CC | Cohort breakdown, grandfathering logic |
| CAL-040 | Plan price policy templates | TODO | 2 | CAL-018 | CC | max_increase_%, requires_ceo_above, min_notice_period |
| CAL-041 | Console: Plan Price Change form | TODO | 3 | CAL-038 | CU | Plan selection, grandfathering policy, simulation preview |
| CAL-042 | Console: affected customer preview | TODO | 3 | CAL-039 | CU | Cohort breakdown, ARR exposure by group |
| CAL-043 | Integration test: plan price lifecycle | TODO | 2 | CAL-038 thru CAL-042 | CC | Prove same lifecycle, different domain logic |

**Phase 2 acceptance**: Two domains running on one engine. Same governance, same audit, different business logic. Discount flow has Slack. Loom demo recorded.

---

## PHASE 3: OUTCOME TRACKING (Weeks 7-8)

| ID | Task | Status | Hours | Deps | Agent | Notes |
|----|------|--------|-------|------|-------|-------|
| CAL-044 | Outcome tracking data model | TODO | 3 | CAL-006 | CC | Per-mutation observation window, expected vs actual |
| CAL-045 | Outcome data ingestion API | TODO | 4 | CAL-044 | CC | `POST /outcomes/:mutationId/record` |
| CAL-046 | Variance calculation engine | TODO | 3 | CAL-045 | CC | actual - expected, flag significant misses |
| CAL-047 | Webhook receiver for external outcomes | TODO | 3 | CAL-045 | CC | Accept from Stripe, CRM, custom sources |
| CAL-048 | Outcome status lifecycle | TODO | 2 | CAL-044 | CC | awaiting → tracking → complete → reviewed |
| CAL-049 | Seed data: realistic mutations with outcomes | TODO | 2 | CAL-044 | CC | 20 discounts + 3 plan changes with outcomes for demo |
| CAL-050 | Console: Outcome Dashboard | TODO | 5 | CAL-046 | CU | Active tracking, recent completions, aggregate stats |
| CAL-051 | Console: Mutation outcome detail | TODO | 3 | CAL-046 | CU | Timeline: expected vs actual over time |
| CAL-052 | Console: Rep/approver performance view | TODO | 3 | CAL-046 | CU | Avg variance by approver — the view finance leaders buy |
| CAL-053 | Console: Cohort analysis for plan prices | TODO | 3 | CAL-039, CAL-046 | CU | Grandfathered vs. new price cohort comparison |
| CAL-054 | Export: outcome reports as CSV | TODO | 2 | CAL-050 | CC | For QBR presentations |

**Phase 3 acceptance**: Finance leader can see every mutation, what was expected, what happened, and who made the call.

---

## PHASE 4: DEMO + OUTREACH (Weeks 9-10)

| ID | Task | Status | Hours | Deps | Agent | Notes |
|----|------|--------|-------|------|-------|-------|
| CAL-055 | Demo tenant setup ("NovaCRM") | TODO | 3 | CAL-049 | CC | 500 customers, 3 plans, 6 months history |
| CAL-056 | Demo script: Discount Override (3 min) | TODO | 2 | CAL-037 | — | Exact clicks, explain trace, Slack approval |
| CAL-057 | Demo script: Plan Price Change (3 min) | TODO | 2 | CAL-043 | — | Proposal, cohort preview, outcome view |
| CAL-058 | Demo script: "The Story" (2 min opener) | TODO | 2 | — | — | "$340K in unapproved discounts" narrative |
| CAL-059 | Record Loom demo (8-10 min) | TODO | 3 | CAL-055 thru CAL-058 | — | Professional quality. Primary outbound asset. |
| CAL-060 | Landing page rewrite | TODO | 3 | — | CU | Strip e-commerce. New: discount governance + plan pricing |
| CAL-061 | Outreach templates (3 variants) | TODO | 2 | — | — | VP Finance, Head of RevOps, CRO at series B-C SaaS |
| CAL-062 | Build target list: 50 companies | TODO | 3 | — | — | Series B-C, $5-30M ARR, B2B SaaS |
| CAL-063 | Send 30 personalized outreach | TODO | 4 | CAL-059, CAL-061, CAL-062 | — | LinkedIn + email |
| CAL-064 | Run 5-8 discovery calls | TODO | 6 | CAL-063 | — | 30 min each. Pain → demo → next steps. |
| CAL-065 | Document feedback | TODO | 2 | CAL-064 | — | Structured: pain confirmed, objections, willingness |

---

## PHASE 5: DESIGN PARTNERS (Weeks 11-12)

| ID | Task | Status | Hours | Deps | Agent | Notes |
|----|------|--------|-------|------|-------|-------|
| CAL-066 | Onboarding flow: guided setup | TODO | 4 | CAL-029 | CU | Create workspace → configure policies → invite team |
| CAL-067 | Data import: customer/plan CSV | TODO | 3 | CAL-010 | CC | Seeds simulation engine |
| CAL-068 | Policy configuration UI | TODO | 3 | CAL-028 | CU | Configure thresholds, approval chains, guardrails |
| CAL-069 | Onboard partner 1 | TODO | 4 | CAL-066 | — | Hands-on walkthrough |
| CAL-070 | Onboard partner 2 | TODO | 3 | CAL-066 | — | Capture differences in workflow |
| CAL-071 | Fix top 3 issues from partners | TODO | 6 | CAL-069 | CC/CU | Whatever they say is broken |
| CAL-072 | Onboard partner 3 | TODO | 3 | CAL-066 | — | Third data point |
| CAL-073 | Measure: mutations created, approvals, rollbacks | TODO | 2 | CAL-069 | CC | Weekly active mutations is the metric |
| CAL-074 | Begin real outcome tracking | TODO | 2 | CAL-045, CAL-069 | CC | Connect to partner revenue data |
| CAL-075 | Week 12 State of Play memo | TODO | 2 | ALL | — | Honest PMF assessment |

---

## RUNNING TOTALS

| Phase | Tasks | Est. Hours | Target Weeks |
|-------|-------|-----------|-------------|
| Phase 1: Mutation Core | CAL-001 to CAL-025 | ~48-54 | Weeks 1-3 |
| Phase 2: Domain Flows | CAL-026 to CAL-043 | ~51-57 | Weeks 4-6 |
| Phase 3: Outcome Tracking | CAL-044 to CAL-054 | ~33-36 | Weeks 7-8 |
| Phase 4: Demo + Outreach | CAL-055 to CAL-065 | ~32-36 | Weeks 9-10 |
| Phase 5: Design Partners | CAL-066 to CAL-075 | ~32-36 | Weeks 11-12 |
| **TOTAL** | **75 tasks** | **~196-219** | **12 weeks** |
