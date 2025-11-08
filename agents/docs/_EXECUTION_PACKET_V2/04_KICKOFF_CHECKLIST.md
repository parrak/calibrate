# Kickoff Checklist — First 30 Days (Milestone-Oriented)

## 🧱 Platform Team (Infra, Schema, RLS, Eventing, CI/CD)

### Milestone M0.1 — Core Schema

- [ ] Define Prisma models: Product, PriceVersion, DiscountPolicy, PriceChange, Event, Audit
- [ ] Generate JSON Schemas + semver registry (`/packages/db/schemas/`)
- [ ] Implement deterministic migrations and `pnpm migrate:check` CI step
- [ ] Add RLS policies and test fixtures for each tenant table
- [ ] Publish DTOs to `@calibr/types` via CI
- [ ] Create `pnpm test:db` pipeline validating migrations and RLS

### Milestone M0.2 — Event Bus / Outbox

- [ ] Add `event_log` and `outbox` tables
- [ ] Build append-only event writer with idempotent dedupe (event key + tenant)
- [ ] Implement retry/backoff worker
- [ ] Add dead-letter queue (`dlq_event_log`)
- [ ] Verify replay logic and connector subscriber consumption
- [ ] Integrate into `@calibr/monitor` for event latency metrics

### Monitoring & Observability

- [ ] Extend `@calibr/monitor` with request IDs, p95 latency, and connector health
- [ ] Set up alert policies:
  - [ ] p95 > 1.5s → Slack alert
  - [ ] 5xx > 2% daily → Ops email
  - [ ] Cron miss → PagerDuty alert
- [ ] Expose `/api/health` and `/api/metrics`
- [ ] Add synthetic probes for price-changes, analytics/overview, copilot/query

### Operational SLAs

- [ ] Maintain API p95 ≤ 1.0s read / ≤ 1.5s write
- [ ] Connector job success ≥ 98% daily
- [ ] Cron reliability ≥ 99% (alert on miss)
- [ ] Document error budget + escalation process

---

## 🔌 Connectors Team (Shopify Launch, Amazon Stub, Stripe Conditional)

### Milestone M0.3 — Shopify Connector (Live)

- [ ] Implement Shopify OAuth (App Bridge + REST Admin)
- [ ] Fetch Products/Variants → map to Product + PriceVersion
- [ ] Implement `applyPriceChange()` with write-back to Shopify
- [ ] Add health endpoint (`/api/integrations/shopify/health`)
- [ ] Add idempotent retry/backoff logic for price update jobs
- [ ] Record connector events to `event_log` (`shopify.sync.*`, `shopify.apply.*`)
- [ ] Add rate-limit guard (Shopify API limits)
- [ ] Add error surfacing → Console notifications

### Milestone M0.4 — Amazon Connector (Read-Only Stub)

- [ ] Implement SP-API OAuth scaffolding + LWA client
- [ ] Pull sample catalog (few SKUs) → stress test schema
- [ ] Add `AMAZON_CONNECTOR_ENABLED` feature flag
- [ ] Add ingest cron (manual run only in staging)
- [ ] Validate schema generality for future write paths

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

## ⚙️ Engine Team (Rules DSL, Apply/Rollback, Explainability)

### Milestone M1.1 — Pricing Engine MVP

- [ ] Build rules DSL (selector, transform, schedule)
- [ ] Support transforms: percentage, absolute, floors/ceilings
- [ ] Add dry-run → approve/apply → rollback lifecycle
- [ ] Store explain traces in `explain_trace` table
- [ ] Emit `pricechange.applied` + `audit_event` to `event_log`
- [ ] Write integration tests with deterministic diff fixtures
- [ ] Add rule simulation mode (preview without apply)

### Milestone M1.3 — Explainability & Audit

- [ ] Ensure all actions write Audit + ExplainTrace
- [ ] Add `/api/audit` endpoint for Console
- [ ] Integrate correlation IDs with `@calibr/monitor`
- [ ] Verify replay can fully reconstruct historical price change
- [ ] Generate sample audit reports for QA (2 tenants)

---

## 🖥️ Interface Team (Console, Site, Docs)

### Milestone M1.2 — Console MVP

- [ ] Create Catalog Table (filters, pagination, variant grouping)
- [ ] Build Rule Builder (selector + transform UI)
- [ ] Add Diff Preview Drawer (before/after + audit trail)
- [ ] Implement action buttons (Approve, Apply, Reject, Rollback)
- [ ] Add optimistic UI updates + status badges
- [ ] Integrate with `/api/v1/price-changes` + `/audit`
- [ ] Test via React Testing Library; snapshot diff coverage ≥ 80%

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

## 🧠 Copilot & Analytics Team (Read-Only Intelligence Layer)

### Milestone M1.4 — Copilot (Read-Only)

- [ ] Build `/copilot/query` endpoint
- [ ] Add schema-aware NL→SQL/GraphQL generation
- [ ] Implement RBAC enforcement & SQL injection guard
- [ ] Log queries + resolved schemas + tenant scope
- [ ] Integrate with Console → "Ask Copilot" drawer
- [ ] Add analytics digest cron job → daily summary
- [ ] Add anomaly detection (price spike/drop, margin compression, etc.)

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

## 👩‍💻 Human (PM / Governance / QA)

- [ ] Assign milestone owners in `/agents/docs/_EXECUTION_PACKET_V2/01_MILESTONES.md`
- [ ] Ensure DoR criteria met before any coding
- [ ] Validate acceptance gates per milestone
- [ ] Run weekly sync; tag blockers in `agents/tasks/in-progress/`
- [ ] Coordinate 5 early-access merchant testers (Shopify)
- [ ] Review Stripe connector gating after 3 months
- [ ] Approve `v0.3.9-stable` tag once all checklists hit 100%

---

## ✅ Completion Gates by Phase

| Phase | Gate | Key Artifacts |
|-------|------|---------------|
| M0.1–M0.2 | Schema + Event Bus stable | DB migrations pass, outbox live |
| M0.3–M1.1 | Shopify + Rules Engine live | Price change applied + audited |
| M1.2–M1.4 | Console + Copilot live | User completes end-to-end apply/query |
| Ready for Automation Runner | All SLAs green + audit complete | `/api/metrics` dashboard |
| Post-Validation | Stripe connector active | Collector "Go" threshold met |

---

## Environment & Tooling

- [ ] `pnpm setup` installs all workspaces; Turbo tasks defined.
- [ ] `.env.example` complete; validation script on prestart.
- [ ] CI pipeline: typecheck → build → test → migrate → package types → preview deploy.

## Schema & Security

- [ ] JSON Schemas authored with semver; Prisma migrations reproducible.
- [ ] RLS enabled; row‑level tests present.
- [ ] Service tokens + per‑connector secrets stored in vault.

## Eventing & Observability

- [ ] `event_log` + outbox created; replay and DLQ verified.
- [ ] `@calibr/monitor` hooked into API and connectors; request id propagation.

## Shopify Connector (Launch Scope)

- [ ] Ingest products/variants; map to `Product`/`PriceVersion`.
- [ ] Write‑back endpoint for price updates; idempotent; retry/backoff.
- [ ] Health endpoint; error surfacing to Console.

## Amazon (Read‑Only Stub)

- [ ] SP‑API OAuth scaffolding; basic catalog ingest (few SKUs).
- [ ] Feature flag OFF in production; used only for schema stress test.

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
