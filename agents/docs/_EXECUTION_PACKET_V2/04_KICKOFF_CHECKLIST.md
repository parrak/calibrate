# Kickoff Checklist — Next 30 Days (Execution Packet V2 Continuation)

> **⚠️ IMPORTANT FOR AGENTS AND EXECUTORS**
>
> **This file is the SINGLE SOURCE OF TRUTH for tracking milestone progress.**
>
> When completing tasks:
> 1. **UPDATE THIS FILE DIRECTLY** by marking tasks as `[x]` when completed
> 2. **DO NOT create separate tracking documents** (completion summaries are for documentation only, not tracking)
> 3. **COMMIT AND PUSH** your updates immediately after completing each milestone
> 4. **REFERENCE** completion summary documents (like `M0.X_COMPLETION_SUMMARY.md`) when updating, but track progress HERE
>
> This ensures all team members and agents have a single, up-to-date view of project progress.

---

## 🧱 Platform Team (Infrastructure / Schema / Eventing / CI & SLAs)

### Milestone M0.1 — Core Schema

- [x] Define Prisma models: Product, PriceVersion, DiscountPolicy, PriceChange, Event, Audit
- [x] Generate JSON Schemas + semver registry (`/packages/db/schemas/`)
- [x] Implement deterministic migrations and `pnpm migrate:check` CI step
- [x] Add RLS policies and test fixtures for each tenant table
- [x] Publish DTOs to `@calibr/types` via CI
- [x] Create `pnpm test:db` pipeline validating migrations and RLS

### Milestone M0.2 — Event Bus / Outbox

- [x] Add `event_log` and `outbox` tables
- [x] Build append-only event writer with idempotent dedupe (event key + tenant)
- [x] Implement retry/backoff worker
- [x] Add dead-letter queue (`dlq_event_log`)
- [x] Verify replay logic and connector subscriber consumption
- [x] Integrate into `@calibr/monitor` for event latency metrics

### Milestone M0.1 → M0.2 ✅ COMPLETE
Schema + Event Bus stable.

### Milestone M0.5 — Automation Runner Foundation 🚀 NEW
- [ ] Extend `RuleRun` + `RuleTarget` models → state machine (`queued → applying → applied | failed`)
- [ ] Add worker queue (`rulesWorker.ts`) consuming outbox `job.rules.apply`
- [ ] Implement exponential backoff / jitter / 429 handling
- [ ] Reconciliation pass verifying external price = intended price
- [ ] DLQ drain job + aggregate report → `audit_event`
- [ ] Add metrics: `rules.apply.count`, `duration_ms`, `success_rate`, `dlq.size`
- [ ] Alert policies: success < 97% / DLQ > threshold / Shopify 429 burst
- [ ] Publish Grafana dashboard panel → `/api/metrics`

### Acceptance
- [ ] 100-SKU rule runs < 5 min p95 end-to-end  
- [ ] Partial failures recoverable via "Retry Failed" API  
- [ ] All apply events audited + idempotent

### Monitoring & Observability

- [x] Extend `@calibr/monitor` with request IDs, p95 latency, and connector health
- [x] Set up alert policies:
  - [x] p95 > 1.5s → Slack alert
  - [x] 5xx > 2% daily → Ops email
  - [x] Cron miss → PagerDuty alert
- [x] Expose `/api/health` and `/api/metrics`
- [x] Add synthetic probes for price-changes, analytics/overview, copilot/query

### Operational SLAs

- [x] Maintain API p95 ≤ 1.0s read / ≤ 1.5s write
- [x] Connector job success ≥ 98% daily
- [x] Cron reliability ≥ 99% (alert on miss)
- [x] Document error budget + escalation process

---

## 🔌 Connectors Team (Shopify Launch / Amazon Read-Only / Monitoring)

### Milestone M0.3 — Shopify Connector (Live)

- [x] Implement Shopify OAuth (App Bridge + REST Admin)
- [x] Fetch Products/Variants → map to Product + PriceVersion
- [x] Implement `applyPriceChange()` with write-back to Shopify
- [x] Add health endpoint (`/api/integrations/shopify/health`) with rate-limit telemetry, Zod validation, and sanitized shop summary response
- [x] Add idempotent retry/backoff logic for price update jobs with structured attempt logging
- [x] Record connector events to `event_log` (`shopify.sync.*`, `shopify.apply.*`)
- [x] Add rate-limit guard (Shopify API limits)
- [x] Add error surfacing → Console notifications

### M0.3 Shopify Connector ✅ Live  

### Milestone M0.4 — Amazon Connector (Read-Only Stub) ✅ COMPLETE

- [x] Implement SP-API OAuth scaffolding + LWA client
- [x] Pull sample catalog (few SKUs) → stress test schema
- [x] Add `AMAZON_CONNECTOR_ENABLED` feature flag
- [x] Add ingest cron (manual run only in staging)
- [x] Validate schema generality for future write paths
- [x] **VALIDATION COMPLETE** — All 8 tests passing (November 10, 2025)
- [x] Create acceptance report (`M0.4_ACCEPTANCE_REPORT.md`)
- [x] Update documentation and environment configuration

### M0.4 Amazon Connector ✅ Validated  

### M0.6 — Competitor Monitoring E2E ✅ (Option A Chosen)
- [x] Backend API tests complete (12 tests, auth 401 verified)
- [x] Manual API testing + integration in PR checks
- [x] Auth enforcement on GET/POST endpoints
- [ ] UI integration testing (CompetitorMonitor ↔ Analytics ↔ Rules)
- [ ] End-to-end verification (ingest → normalize → visualize)
- [ ] Error rate < 1% per 24 h across two tenants
- [ ] Add alert hook to `@calibr/monitor` for scrape failures
- [ ] Update docs → mark Competitor Monitoring **Green**

### Competitor Monitoring (Testing & Verification)

- [x] API endpoints implemented with `withSecurity` wrapper
- [x] Fixed CompetitorMonitor component to use projectSlug
- [x] Fixed CompetitorRules component with createRule API integration
- [x] Added security headers to all competitor endpoints
- [x] Created manual API test script (`scripts/test-competitor-api.ps1`)
- [x] Unit tests passing (31 tests in competitor-monitoring package)
- [x] Manual API testing completed — Automated test suite added
- [x] Authentication requirement added to GET and POST `/api/v1/competitors` endpoints
- [x] Comprehensive test coverage: 12 tests covering GET/POST endpoints, validation, and authentication (401 responses)
- [x] Tests integrated into PR checks via Turborepo pipeline
- [ ] UI integration testing (CompetitorMonitor, Analytics, Rules)
- [ ] End-to-end flow verification

### Milestone M1.5 (Conditional) — Stripe Connector

- [ ] Only active after SaaS Validation "Go" signal
- [ ] Implement OAuth (Connect Standard)
- [ ] Sync Products/Prices, PaymentIntents, and BalanceTransactions
- [ ] Map to internal entities via StripeProductMap, Transaction
- [ ] Verify webhook signatures + idempotency
- [ ] Build "Connectors → Stripe" UI in Console
- [ ] Add metrics: sync latency, error %, backlog size
- [ ] Add feature flag `STRIPE_CONNECT_ENABLED`

---

## ⚙️ Engine Team (Rules DSL / Apply / Rollback / Automation Runner)

### Milestone M1.1 — Pricing Engine MVP

- [x] Build rules DSL (selector, transform, schedule)
- [x] Support transforms: percentage, absolute, floors/ceilings
- [x] Add dry-run → approve/apply → rollback lifecycle
- [x] Store explain traces in `explain_trace` table
- [x] Emit `pricechange.applied` + `audit_event` to `event_log`
- [x] Write integration tests with deterministic diff fixtures
- [x] Add rule simulation mode (preview without apply)

### M1.1 Pricing Engine ✅ Complete  

### Milestone M1.3 — Explainability & Audit

- [ ] Ensure all actions write Audit + ExplainTrace
- [ ] Add `/api/audit` endpoint for Console
- [ ] Integrate correlation IDs with `@calibr/monitor`
- [ ] Verify replay can fully reconstruct historical price change
- [ ] Generate sample audit reports for QA (2 tenants)

### M1.3 Explainability & Audit (Extend)
- [ ] Verify every apply writes Audit + ExplainTrace  
- [ ] `/api/audit` endpoint wired with pagination + filters  
- [ ] Sample audit report for 2 tenants generated  

### M1.6 — Automation Runner Execution Layer NEW
- [ ] Implement `job.rule.materialize`, `job.rule.apply.batch`, `job.rule.reconcile`
- [ ] Add `POST /api/v1/runs/:runId/retry-failed`
- [ ] End-to-end worker test (100 targets, retry path covered)
- [ ] Metrics → `@calibr/monitor`; alert thresholds wired
- [ ] Docs: "Automation Runner Architecture" (`docs/automation_runner.md`)

---

## 🖥️ Interface Team (Console / Site / Docs)

### Milestone M1.2 — Console MVP

- [ ] Create Catalog Table (filters, pagination, variant grouping)
- [ ] Build Rule Builder (selector + transform UI)
- [ ] Add Diff Preview Drawer (before/after + audit trail)
- [ ] Implement action buttons (Approve, Apply, Reject, Rollback)
- [ ] Add optimistic UI updates + status badges
- [ ] Integrate with `/api/v1/price-changes` + `/audit`
- [ ] Test via React Testing Library; snapshot diff coverage ≥ 80%

### M1.2 Console MVP (In Progress)
- [ ] Catalog Table (filters, pagination, variant grouping)
- [ ] Rule Builder (selector + transform UI)
- [ ] Diff Preview Drawer (before/after + audit)
- [ ] Action buttons (Approve, Apply, Reject, Rollback)
- [ ] Optimistic updates + status badges + audit drawer

### M1.7 — Automation Runner UI Enhancements NEW
- [ ] Add "Retry Failed" control in Runs table
- [ ] Add "Explain" tab displaying transform and audit trace
- [ ] Show apply progress indicator via SSE or polling
- [ ] Toasts reflect server statuses (queued/applied/failed)
- [ ] Snapshot test coverage ≥ 85%

### UI Theming & Usability

- [ ] Roll out Light Theme (shared tokens)
- [ ] Ensure WCAG AA contrast and Lighthouse ≥ 90
- [ ] Unify styles across Console, Site, Docs
- [ ] Add guided tour for first-time users

### Site / Docs / SaaS Validation

- [ ] Deploy passive SaaS collector page `/saas`
- [ ] Add SEO posts ("Stop hard-coding pricing", etc.)
- [ ] Track UTM → `saaS_interest` table
- [ ] Configure Plausible/PostHog tracking
- [ ] Weekly export firmographics → internal report
- [ ] Activate Stripe connector when validation "Go" triggered

---

## 🧠 Copilot & Analytics Team (Read-Only → Simulation)

### Milestone M1.4 — Copilot (Read-Only)

- [ ] Build `/copilot/query` endpoint
- [ ] Add schema-aware NL→SQL/GraphQL generation
- [ ] Implement RBAC enforcement & SQL injection guard
- [ ] Log queries + resolved schemas + tenant scope
- [ ] Integrate with Console → "Ask Copilot" drawer
- [ ] Add analytics digest cron job → daily summary
- [ ] Add anomaly detection (price spike/drop, margin compression, etc.)

### M1.4 Copilot Read-Only ✅ Baseline Complete

### M1.8 — Copilot Simulation NEW
- [ ] Build `POST /api/v1/copilot/simulate` (read-only, schema validated)
- [ ] Build `POST /api/v1/copilot/propose` → persist disabled PricingRule + preview run
- [ ] Add modal "Ask Copilot" → show Proposed Rule + Preview Summary
- [ ] "Open in Rule Builder" handoff to Console
- [ ] Log full prompt, scope, and SQL for audit
- [ ] Red-team prompt tests (denylist, injection, scope abuse)
- [ ] Add Copilot section in docs (`docs/copilot_simulation.md`)

### Acceptance
- [ ] NL prompt → proposal → preview → manual approve/apply path works E2E  
- [ ] No writes occur without human approval  
- [ ] All Copilot actions audited and logged

### Analytics Pipeline

- [ ] Aggregate daily snapshots (`packages/analytics`)
- [ ] Expose `/api/v1/analytics/:projectId/overview`
- [ ] Integrate Shopify and Amazon (read-only) data sources
- [ ] Add margin, top SKUs, price change frequency
- [ ] Add visualizations in Console dashboard
- [ ] Add weekly insight digest + trend detection
- [ ] Verify cron stability and performance

### AI Explainability & Digest

- [ ] Enhance rationale explainer with business impact layer
- [ ] Add confidence scoring + reasoning tree
- [ ] Merge Stripe transaction metrics once connector active
- [ ] Add anomaly alerts → Slack/email
- [ ] Generate "weekly digest" PDF for test tenants

---

## 👩‍💻 Human / Governance / QA (PM Oversight)

- [ ] Assign milestone owners in `/agents/docs/_EXECUTION_PACKET_V2/01_MILESTONES.md`
- [ ] Ensure DoR criteria met before any coding
- [ ] Validate acceptance gates per milestone
- [ ] Run weekly sync; tag blockers in `agents/tasks/in-progress/`
- [ ] Coordinate 5 early-access merchant testers (Shopify)
- [ ] Review Stripe connector gating after 3 months
- [ ] Approve `v0.3.9-stable` tag once all checklists hit 100%
- [ ] Confirm Competitor Monitoring marked Green in gate report  
- [ ] Approve Automation Runner design doc → merged in repo  
- [ ] Run weekly sync on Automation Runner & Copilot PR status  
- [ ] Coordinate 2 staging tenants + 1 canary merchant for Automation Runner test  
- [ ] Validate Ready-for-Automation Gate criteria below  

---

## ✅ Completion Gates / Readiness Matrix

| Phase | Gate | Key Artifacts |
|:--|:--|:--|
| M0.1–M0.2 | Schema + Event Bus stable | DB migrations pass, outbox live |
| M0.1–M0.4 | Schema + Connectors Green | Outbox + Shopify/Amazon live |
| M0.3–M1.1 | Shopify + Rules Engine live | Price change applied + audited |
| M1.1–M1.3 | Rules Engine + Explainability Green | Price change audited |
| M1.2–M1.4 | Console + Copilot live | User completes end-to-end apply/query |
| M1.5–M1.8 | Automation Runner + Copilot Sim Green | Worker metrics + Copilot proposal demo |
| Ready for Automation Runner | All SLAs green + audit complete | `/api/metrics` dashboard |
| Ready for Automation Runner Gate | All SLAs green + 100-SKU test pass | `/api/metrics` dashboard snapshot |
| Post-Validation | Stripe connector active | Collector "Go" threshold met |

---

## 📦 Operational Reminders

- [ ] CI pipeline = typecheck → build → test → migrate → package types → preview deploy  
- [ ] `.env.example` validated in prestart hook  
- [ ] `pnpm setup` bootstraps dev in < 5 min  
- [ ] Synthetic probes monitor price-changes, analytics, copilot, competitor feeds  
- [ ] Error budget: 5xx < 2% / Connector success ≥ 98% / Cron ≥ 99%  

## Environment & Tooling

- [ ] `pnpm setup` installs all workspaces; Turbo tasks defined.
- [ ] `.env.example` complete; validation script on prestart.
- [ ] CI pipeline: typecheck → build → test → migrate → package types → preview deploy.

## Schema & Security

- [x] JSON Schemas authored with semver; Prisma migrations reproducible.
- [x] RLS enabled; row‑level tests present.
- [ ] Service tokens + per‑connector secrets stored in vault.

## Eventing & Observability

- [x] `event_log` + outbox created; replay and DLQ verified.
- [x] `@calibr/monitor` hooked into API and connectors; request id propagation.

## Shopify Connector (Launch Scope)

- [ ] Ingest products/variants; map to `Product`/`PriceVersion`.
- [ ] Write‑back endpoint for price updates; idempotent; retry/backoff.
- [ ] Health endpoint; error surfacing to Console.

## Amazon (Read‑Only Stub)

- [x] SP‑API OAuth scaffolding; basic catalog ingest (few SKUs).
- [x] Feature flag OFF in production; used only for schema stress test.

## Engine & Console

- [ ] Rules DSL covers %, absolute, floor/ceiling; selector predicates working.
- [ ] Preview → approve/apply → rollback lifecycle wired.
- [ ] Console: catalog table, rule builder, diff preview, audit drawer.

## Copilot (Read‑Only)

- [ ] `/copilot/query` returns results with logged SQL/GraphQL + scopes.
- [ ] RAG over schemas enabled; denylist patterns enforced.

## Acceptance Gate (Ready for Automation Runner)

- [ ] Apply/rollback reliable; audit/explain intact.
- [ ] Connectors stable under backoff; surfaced in health page.

---

**Next Review Window:** after Automation Runner PR #3 and Copilot Simulation PR #2 merge, or 30 days (whichever first).
