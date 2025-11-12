# Calibr V2 Execution Packet — Internal Engineering Summary
_Last updated: November 11, 2025_

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
- **Shopify (Launch)** ✅: Products/Variants ingest; price update write-back; health check; idempotent retries; rate-limit backoff. **PRODUCTION READY** — Enhanced with structured logging, OAuth improvements, and comprehensive test coverage.
- **Amazon (Stub)** ✅: SP-API auth model + catalog ingest **only**; no write; marks schema generality. **VALIDATED** November 10, 2025 — 8/8 tests passing, acceptance report complete.
- **Competitor Monitoring** 🟡: Backend API complete with 12 tests, authentication enforced, manual testing passed. **UI integration testing in progress**.

## Copilot (Platform Feature)
- **Read-only** ✅: `/copilot/query` → NL→SQL/GraphQL with schema-aware RAG; scope by tenant; log generated query + sources. **COMPLETE** — 42+ tests, GPT-4 integration, RBAC, anomaly detection, console UI delivered (M1.4).
- **Next**: Simulation proposals (no execution) once Automation Runner lands (M1.8).

## Security & Observability
- RLS policies tested; scoped service tokens; per-connector secrets vault.
- `@calibr/monitor`: request ids, p95, error %, connector health; structured logs with event correlation id.

## Recent Progress (November 2025)
### Branding & Design System ✅
- **Calibrate Branding v1** deployed across all apps (site, console, docs)
- Teal color palette: L1 (#80D9D9), L2 (#00A3A3 - Primary), L3 (#008080 - Accent)
- Dynamic icon system with Next.js App Router (icon.tsx, apple-icon.tsx)
- Updated all "Calibr" references to "Calibrate" in visible text
- Light theme UI with improved accessibility (WCAG AA compliant)

### Competitor Monitoring 🟡
- Backend API complete: 12 tests, authentication enforced (GET/POST endpoints)
- Manual testing validated, integrated into PR checks
- **In Progress**: UI integration testing (CompetitorMonitor ↔ Analytics ↔ Rules)

### Pricing Rules & Engine ✅
- M1.1 Pricing Engine MVP: Complete rules DSL, preview, apply, rollback
- Enhanced pricing rules UI with database persistence
- Comprehensive test coverage (779+ tests in pricing-rules.test.ts)

### Documentation & Developer Experience ✅
- Docs site modernization (PR #91): Stripe-inspired design, sidebar navigation
- Comprehensive accessibility improvements across all apps
- Enhanced error handling and user feedback

