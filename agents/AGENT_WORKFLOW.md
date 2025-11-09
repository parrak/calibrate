This document has moved. See:

This document defines how the Calibrate project is collaboratively developed across three autonomous agents:

- Agent A (Cursor): Infrastructure, developer experience, CI/CD, and deployment orchestration.
- Agent B (Codex): Core product implementation covering the pricing engine, connectors, API, and the Price Changes MVP.
- Agent C (Claude Code): AI, analytics, forecasting, and intelligent automation for growth and expansion phases.

Each agent works independently but adheres to shared contracts, schemas, and milestones.

---

## 📚 Documentation Structure

**Key Documentation Locations:**
- **Learnings & Bug Fixes:** `agents/learnings/` - Consolidated learnings, bug fixes, setup guides
- **Agent History:** `agents/history/` - Key completion summaries and milestones
- **Agent Plans:** `agents/plans/` - Per-agent plans and tasks
- **Context Notes:** `agents/context/notes.md` - Shared context and summaries
- **Task Management:** `agents/tasks/` - Task inbox, in-progress, and done files

**Quick Reference:**
- Bug fixes: `agents/learnings/bug-fixes/`
- Setup guides: `agents/learnings/setup-guides/`
- Deployment: `agents/learnings/deployment/`
- Troubleshooting: `agents/learnings/troubleshooting/`

---

## Project Overview

Calibrate is an AI-ready pricing automation platform for commerce systems. It synchronizes price data across marketplaces (Shopify, Amazon, and others), applies guardrail policies, and progressively evolves toward AI-driven pricing intelligence.

### Monorepo Structure

```
calibrate/
|- packages/
|  |- db/
|  |- pricing-engine/
|  |- connectors/
|  |- security/
|  |- ui/
|  |- analytics/          # added by Claude Code
|  '- monitor/             # added by Agent A (Jan 3, 2025)
'- apps/
   |- api/
   |- console/
   |- site/
   '- docs/
```

---

## Agent A - Cursor (Infrastructure and Developer Experience)

### Mission
Deliver and maintain the foundational developer environment, CI/CD, and deployment infrastructure enabling seamless collaboration for Agents B and C.

### Primary Objectives
1. Workspace integrity
   - Maintain pnpm plus Turborepo pipelines.
   - Synchronize tsconfig, TypeScript references, and shared types.
   - Enforce lint and format via ESLint and Prettier.
2. Database and environment
   - Manage Prisma migrations and seeds.
   - Keep .env files consistent; add validation script.
   - Create a migration CI step (`pnpm migrate:check`).
3. Deployment
   - Deploy API on Fly.io or Railway.
   - Deploy Site and Console on Vercel (preview builds per PR).
   - Centralize secrets: `DATABASE_URL`, `WEBHOOK_SECRET`, `NEXT_PUBLIC_API_BASE`.
4. Developer experience and observability
   - Create `pnpm dev:all` to run API plus Console plus Site concurrently.
   - ✅ **COMPLETE (Jan 3, 2025)** - Add request logging (`@calibr/monitor`) and error tracing.
     - Created `@calibr/monitor` package with structured logging, performance monitoring, and error tracking
     - Integrated into API via `withSecurity` middleware with automatic request/response logging
     - Performance metrics tracking per endpoint (response time, status codes)
     - X-Request-ID header propagation for distributed tracing
     - Added 15 comprehensive tests covering all monitoring features
     - CI updated to build monitor package before typecheck and tests
   - Generate OpenAPI or ts-rest types into `@calibr/types` for the frontend.

### Deliverables
- ✅ **COMPLETE (Jan 3, 2025)** - One-step bootstrap (`pnpm setup`) - Added pnpm setup script
- Working preview deployments
- Shared generated API types
- CI pipeline validating migrations plus tests
- ✅ **COMPLETE (Jan 3, 2025)** - Request monitoring and observability (`@calibr/monitor` package)

### Definition of Done
- Development environment reproducible in under five minutes
- All build targets compile cleanly
- Preview deploys auto-build per PR

---

## Agent B - Codex (Core Product)

### Mission
Implement the full Price Changes MVP and core pricing workflow APIs while maintaining production-grade reliability and testing.

### MVP Phase (v0.2)
1. API endpoints
   - `GET /api/v1/price-changes` (list plus filters plus pagination)
   - `POST /api/v1/price-changes/:id/(approve|apply|reject|rollback)`
2. Console page
   - `/p/[slug]/price-changes`
   - Table view plus filters plus search plus cursor pagination
   - Detail drawer with price diff plus policy checks plus context
   - Action buttons (Approve, Apply, Reject, Rollback) with optimistic updates
3. RBAC
   - VIEWER -> read-only
   - EDITOR -> approve or reject
   - ADMIN -> apply or rollback
4. Testing
   - Supertest integration plus React Testing Library UI tests.

### Post-MVP Growth (v0.3 to v0.5)
- ✅ **COMPLETE (Jan 3, 2025)** - Shopify connector write-back (REST Admin API).
  - Integrated Shopify connector into price change apply flow (PR #19)
  - Live Shopify connector now called when applying price changes
  - Records variant metadata and surfaces connector errors with tests
  - Fixed Shopify sync SSL error (PR #15)
- Policy templates (max delta percent, floor or ceiling, daily limit).
- Notifications (Slack plus email) on large deltas.
- Connector retries plus idempotent event queue.
- ✅ **COMPLETE (Jan 3, 2025)** - UX improvements (PR #23, #22)
  - Early access page with guided tour component
  - Shared theme tokens for consistent design system
  - Fixed UI contrast issues with black text on dark backgrounds
  - Enhanced monitoring middleware error handling

### Deliverables
- End-to-end Price Changes flow functional.
- Comprehensive API docs (`/apps/docs`).
- CI green on integration plus UI tests.

### Definition of Done
- All actions return correct HTTP codes.
- Console reflects live state updates.
- Data consistent across tenants and connectors.

---

## Agent C - Claude Code (AI and Analytics)  — **Status: Growth Phase complete (Jan 2–6, 2025)**

### Mission
Build Calibrate's intelligence layer including AI pricing suggestions, analytics dashboards, forecasting, and merchant insights.

### Growth Phase (v0.3 to v0.6) - Complete
1. AI Pricing Assist - complete
   - Created `packages/ai-engine` with `suggestPrice()` method.
   - Inputs: SKU history, competitor data, sales velocity, cost data.
  - Outputs: `{ delta, confidence, rationale, reasoning }`.
   - Integrated into `pricing-engine` with nineteen passing tests.
   - Console UI: `AIPriceSuggest` component with confidence scoring.
   - Ready for production with configurable weights and constraints.

2. Analytics Module - complete
   - Created `packages/analytics` for daily snapshot aggregation.
   - API: `GET /api/v1/analytics/:projectId/overview` with trends.
   - API: `POST /api/v1/analytics/aggregate` for cron jobs.
   - Console dashboard at `/p/[slug]/analytics` with full UI.
   - Vercel cron configured (daily at midnight).
   - Script: `pnpm aggregate:analytics` for manual runs.
   - Metrics: SKUs, price changes, margins, trends, top performers.

3. Policy Insight Copilot - complete
   - `/api/v1/assistant/query` with GPT-4 integration.
   - LLM-powered natural language to SQL generation (OpenAI SDK).
   - Pattern-matching fallback when API key unavailable.
   - Security: SQL injection protection, project-scoped queries.
   - Queries: price explanations, what-if simulations, margin analysis.
   - Response format: answer, data, SQL, suggestions.

### Expansion Phase (v0.7 to v1.0) - Ready to start
- Inventory-aware pricing (merge stock signals).
- Demand forecasting (Prophet or XGBoost).
- Merchant Intelligence Suite (margin heatmaps, elasticity).
- ✅ **COMPLETE (Jan 3, 2025)** - AI Copilot explaining price changes (PR #21, #17).
  - Completed AI Copilot console UI with full-featured chat interface
  - New AI Assistant page at `/p/[slug]/assistant` for natural language pricing queries
  - AIExplanation component integrated into price change detail drawer
  - Features: message history, suggested questions, data viewer, SQL inspection, follow-up suggestions
  - Integrated with existing `/api/v1/assistant/query` endpoint
  - Authentication-aware with graceful fallback messaging
- CPQ extension for B2B self-serve quoting.

### Deliverables - All complete
- AI engine plus analytics packages deployed with twenty-six passing tests.
- Analytics dashboard live with key metrics.
- Copilot query endpoint returning accurate insights.
- ✅ **COMPLETE (Jan 3, 2025)** - Console UI integration complete - AI Copilot UI added with full chat interface.
- Cron jobs scheduled for daily aggregation.

### Definition of Done - All criteria met
- AI module suggests valid price deltas with explainability.
- Analytics jobs run nightly (Vercel cron configured).
- Dashboard visualizations accurate within tolerance.

### Recent Highlights

**January 6, 2025:**
- Analytics & AI improvements (Agent C - Claude Code)
  - Added comprehensive anomaly detection system with 4 detection types (price spikes/drops, volume spikes, margin compression, competitor divergence)
  - Created weekly insights digest generator with automated recommendations and performance analysis
  - Enhanced AI rationale explainer with multi-layered explanations, business impact analysis, and visual indicators
  - New APIs: `detectAnomalies()`, `generateWeeklyDigest()`, `explainSuggestion()`
  - All features ready for production integration
  - Updated CHANGELOG.md and AGENT_WORKFLOW.md with completion status

**January 3, 2025:**
- `c9a3ee5` - PR #20: Infrastructure setup and monitor package (Agent A)
  - Created `@calibr/monitor` package for request logging and performance tracking
  - Integrated monitoring into API with `withSecurity` middleware
  - Added pnpm setup script
  - Fixed TypeScript build errors and CI issues
- `e36587d` - PR #23: UX refresh features (Agent B)
  - Added early access page, guided tour component, and shared theme tokens
- `7f59b98` - PR #22: UI contrast fixes (Agent B)
  - Fixed black text on dark backgrounds
  - Enhanced monitoring middleware error handling
- `b12ec15` - PR #21: AI Copilot UI completion (Agent C)
  - Completed AI Assistant page with chat interface
  - AIExplanation component integrated into price changes
- `2aafafb` - PR #19: Shopify price apply integration (Agent B)
  - Integrated Shopify connector into price change apply flow
  - Live connector calls with variant metadata recording
- `5d06413` - PR #18: Infrastructure setup monitor (part of #20)
- `495626f` - PR #17: AI Copilot UI (part of #21)
- `5c98a30` - PR #16: Documentation consolidation (Agent A)
- `636981d` - PR #15: Shopify sync SSL error fix (Agent B)

**January 2, 2025:**
- `48b45e2` - AI Pricing Engine (nineteen tests).
- `bf2f7fb` - Analytics Module (seven tests).
- `d77ff61` - Policy Insight Copilot.
- `f9d1aa7` - Console UI Integration plus Cron Jobs plus GPT-4 Integration.

### Documentation
See `docs/project-management/AGENT_C_AI_ANALYTICS_COMPLETE.md`

---

## Coordination and Interfaces

| Responsibility | Agent | Notes |
|----------------|--------|-------|
| Infra / CI / Deploy | Cursor | Maintains build pipelines and environments |
| Core Product and Connectors | Codex | Implements APIs and console |
| AI and Analytics | Claude Code | Consumes stable APIs |

### Shared Contracts
- `PriceChangeDTO` type (common schema).
- `Event`, `Project`, and `Membership` tables.
- Common environment structure (`DATABASE_URL`, `WEBHOOK_SECRET`, `NEXT_PUBLIC_API_BASE`).

### Handoff Rules
1. Cursor provides infrastructure plus API type generation.
2. Codex finalizes API and console flows (MVP).
3. Claude Code extends analytics and AI features built on Codex APIs.
4. Cursor adds jobs and cron infrastructure for Claude's analytics.

All agents commit to `develop`; Cursor manages preview deployments.

---

## Milestones and Accountability

| Phase | Lead Agent | Definition of Done | Status |
|--------|-------------|--------------------|--------|
| MVP (v0.2) | Codex | Price Changes workflow complete end-to-end | ✅ **Near Complete** - Shopify connector write-back complete (Jan 3, 2025) |
| Growth (v0.3 to v0.6) | Claude Code | AI Assist plus Analytics Dashboard live | ✅ **Complete** (Jan 2-3, 2025) - AI Copilot UI added (Jan 3) |
| Expansion (v0.7 to v1.0) | Shared | Inventory plus Forecasting plus Copilot complete | 🔄 **In Progress** - AI Copilot UI complete (Jan 3, 2025) |

---

## Summary

- Agent A (Cursor): Infrastructure, developer experience, CI, deploy.
- Agent B (Codex): Core pricing MVP, connectors, policies.
- Agent C (Claude Code): AI, analytics, forecasting, copilot.

All agents must re-read this file before each major merge cycle. Cursor ensures `develop` is always stable and deployable.

---

## 📆 Next Steps — January 2025 Roadmap

### 🎯 Highest-Leverage Goals (Next 14 Days)

> **Note:** Multi-agent roadmap updates now live here instead of `CHANGELOG.md` so release notes stay focused on shipped product changes.

**1. Production Validation (Phase-3 Completion)**

- Owners: Codex + Claude Code  
- Validate Shopify & Amazon end-to-end (price change → apply → analytics → AI rationale).  
- Artifact: `reports/phase3_validation.md` with pass/fail and screenshots.

**2. Monitoring & Alerts**

- Owner: Cursor  
- Add synthetics for `/api/health`, `/api/v1/price-changes`, `/api/v1/analytics/overview`.  
- Create alerts: p95 > 1 s, error > 2 %, connector failure, cron miss.  
- Output: `ops/monitoring.md` (alert policy + runbook link).

**3. Authentication Cleanup**

- Owner: Codex
- Fix NextAuth v5 import/build issues; ensure bearer-token flow works end-to-end.
- Remove temporary `CONSOLE_INTERNAL_TOKEN` fallback; document required envs.
  - ✅ `POST /api/auth/session` now wraps with `withSecurity`, enforces the `x-console-auth` header, and surfaces misconfigured environments with a 500 error instead of silently issuing tokens.
  - ✅ Session tokens now normalize provided roles and default to the least-privileged `viewer` role so missing metadata no longer escalates users to admin.

**4. Docs Refresh**

- Owner: Codex  
- Update README + Docs to reflect live connectors + AI features.  
- Add Quickstart: *Create project → Connect Shopify/Amazon → Approve one AI suggestion* (< 10 min).  
- Remove "in planning" language.

**5. CHANGELOG Hygiene**

- Owner: Cursor  
- Move multi-agent strategy text out of `CHANGELOG.md` to this file.  
- Keep CHANGELOG entries concise and semantic-versioned.

---

### 📦 Short Sprint Backlog (2–4 Weeks)

| Focus | Owner | Outcome |
|--------|--------|----------|
| Amazon retry/idempotency | Codex | Reliable SP-API feed submission |
| Rate limiting & abuse guard | Cursor | 429 structured responses |
| OpenAPI + Types publish | Cursor | `/api/docs` and `@calibr/types@next` |
| Dashboard heartbeat cards | Codex | Live metrics in Console dashboard |
| AI rationale clarity | Claude Code | ✅ **COMPLETE** - Enhanced explainer, weekly insights digest, anomaly detection |

---

### 👥 Agent Assignments

- **Cursor (Agent A)** — Infra, monitoring, OpenAPI generation, changelog cleanup.
- **Codex (Agent B)** — Connector validation, auth, docs refresh, dashboard polish.
- **Claude Code (Agent C)** — ✅ **COMPLETE (Jan 6, 2025)** - Analytics reliability, anomaly flags, insight summaries, enhanced AI explanations.
- **Human (PM)** — Recruit 5–10 early-access testers; manage onboarding and case studies.

---

### 🧭 Milestones

| Milestone | Definition of Done | Target Tag |
|------------|-------------------|-------------|
| Validation & Stabilization | E2E passes, alerts live, docs refreshed | `v0.3.9-stable` |
| Public Beta | ≥ 5 live merchants, < 2 % connector error, 3 case studies | `v0.4.0-public-beta` |

---

### ✅ Acceptance Gate for v0.3.9-stable

- [ ] Shopify & Amazon E2E validation report approved  
- [ ] Alerts/health checks live  
- [ ] Docs updated + Quickstart works in < 10 min  
- [ ] Console dashboard shows live metrics  
- [ ] ≥ 2 early-access users have approved & applied AI suggestions

---

### 🧠 After v0.3.9

Start **Inventory-Aware Pricing**, **Experimentation Mode**, and deeper **Copilot simulations** as the `v0.4.x` track.

---

## 🧾 Definition of Ready (DoR) for any new work
Before an agent starts coding, the task must include:
- **Contract snippet** in `contracts/<issue>.md` (DTOs, request/response, errors).
- **Env & secrets** listed (if any).
- **Acceptance criteria** (bullet list, measurable).
- **Owner** and **milestone tag** (e.g., `v0.3.9`).

## 🧪 Operational SLAs
- **API p95 latency:** ≤ 1.0s (read), ≤ 1.5s (mutations).
- **Connector job success:** ≥ 98% daily.
- **Cron reliability:** ≥ 99% run success with alert on miss.
- **Error budget:** API 5xx < 2% per day.

Cursor owns alerting; Codex/Claude own remediation within business hours.

---

## 🎨 UI Theming Rollout (Light Theme)
**Goal:** Notion-style light theme for Site, Console, Docs with shared tokens.
- **Owner:** Codex (build) + Cursor (tokens, release)
- **Scope:** `apps/{site,console,docs}/app/globals.css` and `packages/ui`
- **Acceptance:** WCAG AA contrast; screenshots for hero, console dashboard, docs prose; Lighthouse ≥ 90 desktop.

---

## 💳 Stripe Integration Plan (MVP → Growth)

### Objectives
1) **Connect Stripe** via OAuth (Connect Standard)  
2) **Sync/Create Catalog** (Products & Prices)  
3) **Ingest Transactions** (intents/charges + fees/net via BalanceTransactions)  
4) **Pricing insights** from conversion data  
5) **Unified UI** with Shopify/Amazon/Stripe in one view

### Data Model Additions (Prisma)
- `StripeAccount` (projectId, stripeAccountId, livemode, status, createdAt)
- `ConnectorSyncState` (projectId, source: 'stripe'|'shopify'|'amazon', cursor JSON)
- `StripeWebhookEvent` (id, type, payloadHash, processedAt, status)
- `StripeProductMap` (projectId, stripeProductId → Product.id)
- `StripePriceMap` (projectId, stripePriceId → Price.id)
- `Transaction` (projectId, source, externalId, amount, currency, status, feeAmount, netAmount, productId?, skuId?, createdAt)

> Reuse `Event` for audit logs: `stripe.sync.started`, `stripe.webhook.received`, `transaction.created`.

### API Endpoints
**OAuth**
- `GET /api/integrations/stripe/oauth/start`
- `GET /api/integrations/stripe/oauth/callback`
- `POST /api/integrations/stripe/disconnect`

**Webhooks**
- `POST /api/integrations/stripe/webhook`  
  Subscribe: `product.*`, `price.*`, `payment_intent.*`, `charge.*`, `balance.available`

**Sync Jobs**
- `POST /api/integrations/stripe/sync/catalog` → upsert Products/Prices + Maps
- `POST /api/integrations/stripe/sync/transactions?since=…` → PaymentIntents/Charges + BalanceTransactions → `Transaction`

**Catalog Write (optional MVP+):**
- `POST /api/integrations/stripe/products`
- `POST /api/integrations/stripe/prices`

**Analytics**
- `GET /api/v1/analytics/:projectId/conversion-overview`
- `GET /api/v1/analytics/:projectId/sku/:id/conversion-curve`

### Processing Rules
- All Stripe calls include `Stripe-Account` header (per connected merchant).
- Webhooks are verified (Stripe signing secret) and **idempotent** (use event id + payload hash).
- Backfills use `ConnectorSyncState.cursor` for pagination checkpoints.
- Map Stripe Product/Price to internal Product/Price, then attach `Transaction` rows to mapped SKUs when possible.

### Console UI
- **Settings → Connectors:** add Stripe row (connect/disconnect, last sync).
- **Catalog:** show Stripe badges + mismatch hints.
- **Transactions (new):** table of Stripe payments (gross, fees, net, SKU, status).
- **Analytics Overview:** merge Shopify/Amazon/Stripe into unified cards with source filters.
- **Price Change Drawer:** show recent Stripe conversion for the SKU (e.g., "2.4% @ $29").

### Security & Compliance
- PCI: **read-only**, never store card data.
- Secrets: `STRIPE_CLIENT_ID`, `STRIPE_CLIENT_SECRET`, `STRIPE_WEBHOOK_SECRET` (env validation by Cursor).
- Feature flag: `STRIPE_CONNECT_ENABLED`.

### Work Split
- **Agent A (Cursor):** OAuth app config, secrets, webhook signature verify util, job queue, observability (`stripe.*` events), alerts.
- **Agent B (Codex):** OAuth routes, webhook handler, mappers + sync jobs, Console Connectors + Transactions UI, optional catalog write.
- **Agent C (Claude Code):** Add Stripe `Transaction` to analytics pipeline, conversion curves per SKU, incorporate into AI rationale and weekly digest.
- **Human:** Test with a Stripe demo account; recruit 2–3 early-access Stripe-only users.

### Acceptance (Stripe MVP "Done")
- Merchant can connect Stripe; catalog appears with badges.
- Transactions page shows recent payments with fees & net.
- Analytics overview includes Stripe totals; source filters work.
- Webhooks verified & idempotent; backfill handles ≥10k records.
- Docs include a **10-minute Stripe Quickstart**.

### Milestones
| Milestone | DoD | Owner | Tag |
|---|---|---|---|
| Connect + Read | OAuth, catalog sync, transactions ingest, webhooks OK, UI visible | A+B | `v0.3.10` |
| Unified Analytics | Conversion overview + SKU curves, AI rationale cites Stripe | C+B | `v0.3.11` |
| Catalog Write | Create/Update Product/Price in Stripe from Console | B | `v0.3.12` |
