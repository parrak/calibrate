# Calibr V2 Execution Packet — Internal Engineering Summary
_Last updated: February 3, 2026_

> [!WARNING]
> **STRATEGIC PIVOT** (February 13, 2026)
> 
> This execution packet has been superseded by the **agent directive structure**.
> 
> **Read these files first:**
> - `/agents/PIVOT.md` - Explains the strategic pivot from e-commerce to SaaS discount governance
> - `/agents/QUEUE.md` - 75 prioritized tasks (CAL-001 to CAL-075)
> - `/agents/ARCHITECTURE.md` - Complete system architecture and schema
> - `/agents/execution-packets/week-01-mutation-core.md` - Start here for implementation
> 
> This file is preserved for historical context and architectural reference.

---

## Purpose
Define the **technical execution plan** for Calibr V2 with an **e‑commerce wedge** (Shopify launch; Amazon read‑only stub), while preserving the long‑term **Composable Data OS** architecture.

## North Star
> Ship a **reliable bulk & rule-based pricing control plane** for Shopify first, with **explainability + governance**. Use the same primitives (schemas, event bus, audit) to extend to Amazon (read-only) and later Stripe/SaaS.

## Scope & Non‑Goals
- **In scope**: Shopify full read/write; rule engine; console; audit; outbox; RLS; Copilot read-only.
- **Limited**: Amazon = schema + read-only placeholder; no write/sync in MVP.
- **Out of scope (for now)**: Usage-based SaaS metering/fees, CPQ/Quote Desk, advanced forecasting.

## Architectural Tenets (must hold)
1. **Schema-first**: JSON Schema registry + Prisma models; semver; backward-compatible migrations.
2. **Event-first**: Append-only `event_log` + outbox; idempotent delivery; connector adapters subscribe.
3. **Explainability**: Every proposed/applied change emits `explain_trace` + `audit_event`.
4. **Multi-tenant**: RLS on all core tables; scoped API tokens; per-tenant connector secrets.
5. **Open surfaces**: REST/GraphQL; typed DTOs in `@calibr/types` (generated in CI).
6. **Governance**: Two-phase write (`preview -> approve/apply`) with rollback safety.

## Data Model (minimum viable)
- `Product(id, tenant_id, sku, title, tags[], channel_refs jsonb, active)`
- `PriceVersion(id, product_id, currency, unit_amount, compare_at?, valid_from, valid_to?)`
- `DiscountPolicy(id, tenant_id, type, rule_json, enabled)`
- `PriceChange(id, tenant_id, selector_json, transform_json, schedule_at?, state, created_by)`
- `Event(id, tenant_id, type, payload jsonb, created_at)`
- `Audit(id, tenant_id, entity, entity_id, action, actor, explain jsonb, created_at)`

## Connectors
- **Shopify (Launch)** ✅: Products/Variants ingest; price update write-back; health check; idempotent retries; rate-limit backoff. **PRODUCTION READY** — Enhanced with structured logging, OAuth improvements, and comprehensive test coverage (137 tests passing).
- **Amazon (Stub)** ✅: SP-API auth model + catalog ingest **only**; no write; marks schema generality. **VALIDATED** November 10, 2025 — 8/8 tests passing, acceptance report complete.
- **Competitor Monitoring** ✅: Full E2E system complete (Monitor ↔ Analytics ↔ Rules). **VALIDATED** January 11, 2025 — 100% complete with error monitoring and validation script.

## Copilot (Platform Feature)
- **Read-only** ✅: `/copilot/query` → NL→SQL/GraphQL with schema-aware RAG; scope by tenant; log generated query + sources. **COMPLETE** — 42+ tests, GPT-4 integration, RBAC, anomaly detection, console UI delivered (M1.4).
- **Propose + Apply** ✅: Copilot simulate → propose → approve/apply flow integrated with Automation Runner preview runs, RBAC, and Console actions. Demo tenant seeded for public enablement. **COMPLETE** — February 3, 2026 (PR #134).

## Security & Observability
- RLS policies tested; scoped service tokens; per-connector secrets vault.
- `@calibr/monitor`: request ids, p95, error %, connector health; structured logs with event correlation id.

## Recent Progress (November 2025)

### 🏆 Ready-For-Automation Gate — ✅ COMPLETE (November 26, 2025)
**Milestone Achievement: All 8 requirements met**
- ✅ Comprehensive staging validation completed
- ✅ 350+ automated tests passing across 14 packages
- ✅ 100% TypeScript type safety verified
- ✅ All connectors validated (Shopify, Amazon, Competitor Monitoring)
- ✅ Feature flags operational and tested
- ✅ Deployment configurations verified (Railway + Vercel)
- ✅ Automated validation script created (`scripts/validate-staging.sh`)
- ✅ Comprehensive acceptance report (`docs/STAGING_VALIDATION_ACCEPTANCE_REPORT.md`)
- **Status**: Platform ready for M1.8 (Automation Runner) and M1.9 (Copilot Simulation)

### Branding & Design System ✅
- **Calibrate Branding v1** deployed across all apps (site, console, docs)
- Teal color palette: L1 (#80D9D9), L2 (#00A3A3 - Primary), L3 (#008080 - Accent)
- Dynamic icon system with Next.js App Router (icon.tsx, apple-icon.tsx)
- Updated all "Calibr" references to "Calibrate" in visible text
- Light theme UI with improved accessibility (WCAG AA compliant)
- Branding guardrails documented for all public-facing assets (AGENTS.md, PROTOCOLS.md) — keep `themeColor` and palettes aligned with teal branding
- **Docs Design System Sync**: Migrated `apps/docs` typography to leverage native `next/font/local` tabular typography constraints and synced semantic CSS variables with the global platform token set. Local authentication environment restored via bcrypt-seeded mock users.

### Competitor Monitoring ✅
- **M0.6 E2E Complete**: January 11, 2025
- UI integration verified (Monitor ↔ Analytics ↔ Rules)
- Error rate < 1% validated across tenants
- Alert policies active for scrape failures
- Backend API complete with 31 tests, authentication enforced

### M1.6 — Automation Runner Safety Guardrails ✅
- **Safety Guardrails Implemented**: November 2025
- **Guardrail Policies**: Price Floor, Max Delta (%), and Velocity (max changes/day) limits.
- **RulesWorker Enforcement**: Logic integrated into execution path; runs fail if limits exceeded.
- **Validation**: Unit tests added (`rulesWorker.guardrails.test.ts`) and passed.
- **Schema**: `GuardrailPolicy` model added to Prisma.

### Pricing Rules & Engine ✅
- M1.1 Pricing Engine MVP: Complete rules DSL, preview, apply, rollback
- Enhanced pricing rules UI with database persistence
- Comprehensive test coverage (36 tests in pricing engine)
- Competitor rules integration (7 tests)

### Documentation & Developer Experience ✅
- Docs site modernization (PR #91): Stripe-inspired design, sidebar navigation
- Comprehensive accessibility improvements across all apps
- Enhanced error handling and user feedback
- Deployment documentation and validation tooling

### Strategic Focus (Next 4 Weeks)

**Goal:** Move from "Manual/Human-in-the-loop" to "Supervised Automation" with strict safety gates.

| Phase | Focus | Key Deliverables |
|---|---|---|
| **Phase 1** (Weeks 1-2) | Automation Safety + Stripe | Guardrails (Floor/Delta/Budget) ✅; Conflict Detect ✅; Stripe Ingestion 🚧 |
| **Phase 2** (Weeks 3-4) | Copilot Propose Mode | Chat → Simulation → Rule Builder flow; Impact Analysis |
| **Phase 3** (Weeks 5-6) | Pilot Launch | Live automation for 2-3 merchants; Daily digests |

---

## Recent Progress (February 2026)

### M1.8 — Copilot Propose + Automation Runner Preview/Apply ✅
- **End-to-end flow**: Copilot simulate → propose → approve/apply now integrated with Automation Runner preview runs.
- **RBAC**: Editor/Admin gating for propose/apply enforced via token auth.
- **Console UX**: “Approve & Apply Now” action wired to existing flows.
- **Demo seed**: Demo tenant populated with test data for public enablement.
- **Deployment**: Railway API deploy verified with smoke checks.
- **PR**: #134 (merged February 3, 2026).

### M1.9 — Copilot Feedback Loop ✅
- **Feedback**: Added `feedbackRating` and `feedbackComment` to `CopilotQueryLog`.
- **API**: New endpoint for submitting user feedback.
- **Status**: Completed February 2026 (PR #137).

### M1.8.1 — Automation Runner Worker Enablement ✅
- **Worker**: Outbox worker now starts RulesWorker and registers Shopify connectors per project.
- **Apply readiness**: RulesWorker resolves Shopify variant IDs from channelRefs for apply/reconcile. (PR #136)
- **Deployment hardening**: Worker health endpoint, ESM entrypoint alignment, and Debian-based image for Prisma reliability. (PR #140)
- **Lead Capture**: Replaced broken Tally placeholder with native Early Access form and Console management dashboard. (PR #141)
- **Safety**: Added Pre-flight Health Check gate to abort runs if connectors are unreachable.
- **Status**: COMPLETE — February 13, 2026.
### Stripe Integration ✅ (API Key Mode)
- **Schema & Config**: Added `StripeAccount`, `Transaction`, `StripeProductMap` models.
- **Backend**: Implemented `StripeService` (API Key) and `StripeSync` (Catalog, Transactions).
- **API**: Connect endpoints (`connect`, `sync`) and Webhooks live.
- **UI**: Stripe added to Connectors settings with Secure API Key Input Modal.
- **Docs**: Public documentation added for Restricted Key setup.

**Success Metrics**
- **Safety**: 0 incidents of "runaway" automation or price floor breaches.
- **Data Quality**: Stripe transactions mapped to SKUs for true margin analysis.
- **Realized Margin**: Analytics upgraded to calculate true realized margin from transaction data.
- **Dashboard**: Console upgraded to surface Revenue, Units Sold, and Top Sellers leaderboard.
- **Copilot Engagement**: 20% of sessions use "Simulation" feature.
- **Monetization**: Stripe integration live in Staging.
