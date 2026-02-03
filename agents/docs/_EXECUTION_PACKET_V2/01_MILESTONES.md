# Milestones — V2 (E‑Comm Focus)
_Milestone-based; no calendars. Each milestone unlocks the next._

## Legend
- Owners: **Platform** (infra/schema), **Connectors**, **Engine**, **Interface**, **Copilot**
- Types: [NR] = No‑regrets platform layer, [MW] = Market‑wedge specific

---

### M0.1 — Core Schema Validated [NR] — Owners: Platform
**Goals**
- JSON Schema registry + Prisma models for `Product`, `PriceVersion`, `DiscountPolicy`, `PriceChange`, `Event`, `Audit`.
- Deterministic migrations; seed data; RLS policies.

**Success**
- `pnpm test:db` passes with RLS on; schema semver tagged; DTOs published to `@calibr/types`.

---

### M0.2 — Event Bus (Append‑Only + Outbox) [NR] — Owners: Platform
**Goals**
- `event_log` + outbox tables; idempotent publisher; retry/backoff; dead‑letter queue.

**Success**
- Synthetic events flow through outbox; replay works; connector adapters consume.

---

### M0.3 — Shopify Connector (Read/Write) [MW] — Owners: Connectors
**Goals**
- Ingest products/variants; write price updates; health endpoints; rate‑limit handling.

**Success**
- Real tenant ingest; write-back applies a single price change and surfaces audit.
- ✅ Shopify apply flow hardened with retries, sanitized health telemetry, and structured event logging (Agent B — Codex).

---

### M0.4 — Amazon Connector (Read‑Only Stub) [NR→MW later] — Owners: Connectors ✅ COMPLETE
**Goals**
- SP‑API auth scaffolding; catalog ingest for schema stress test (no write).

**Success**
- Sample Amazon catalog rows visible in console; no write paths; flags disabled in prod.
- ✅ SP-API OAuth scaffolding implemented with LWA client
- ✅ Catalog ingest cron endpoint with database persistence
- ✅ Feature flag system (`AMAZON_CONNECTOR_ENABLED`) operational
- ✅ All 8 unit tests passing (100% pass rate)
- ✅ Database schema validated for multi-connector support
- ✅ Dry-run mode operational for safe testing without credentials
- ✅ Write path support confirmed (price feeds, competitive pricing)
- ✅ Comprehensive acceptance report created (`M0.4_ACCEPTANCE_REPORT.md`)

**Completed:** November 10, 2025 (M0.4)

---

### M0.6 — Competitor Monitoring E2E [MW] — Owners: Interface ✅ COMPLETE
**Goals**
- E2E competitor tracking; UI integration; analytics dashboard; error monitoring.

**Success**
- ✅ Backend API complete with 12 tests and auth enforcement
- ✅ UI integration complete (Monitor ↔ Analytics ↔ Rules)
- ✅ End-to-end flow verified (Ingest → Normalize → Visualize)
- ✅ Error rate < 1% verified with validation script
- ✅ Alert hooks integrated for scrape failures
- ✅ Documentation updated and status marked Green

**Completed:** January 11, 2025 (M0.6)

---

### M1.1 — Pricing Engine MVP (Rules) [MW] — Owners: Engine
**Goals**
- Rule DSL: selector (predicate) + transform (%, absolute, floors/ceilings); schedule; dry‑run.
- `preview -> approve/apply -> rollback` lifecycle; idempotent apply.

**Success**
- Merchant executes a rule-based bulk price change with explain traces + audit events.

---

### M1.2 — Console (Catalog + Rules) [MW] — Owners: Interface
**Goals**
- Catalog table (filters/search); rule builder; diff preview; action bar; status/audit drawer.

**Success**
- End-to-end UX from rule creation to apply/rollback; reflects live state.
- ✅ Complete Console MVP delivered with 46+ tests (PR #53).

---

### M1.3 — Explainability + Audit Surfaces [NR] — Owners: Platform + Engine
**Goals**
- Persist `explain_trace` for previews/applies; `/audit` API; correlation ids across layers.

**Success**
- Any rule/application can be reconstructed from audit + events; traces are human‑readable.
- ✅ Complete audit trail implemented with correlation IDs, event replay, and sample reports (PR #54).

---

### M1.4 — Copilot Read‑Only Queries [NR] — Owners: Copilot ✅ COMPLETE
**Goals**
- `/copilot/query` endpoint; schema-aware RAG; safe prompt → SQL/GraphQL; RBAC.

**Success**
- Queries like "List products with price > $100" and "Show changes scheduled next week" succeed; query + sources logged.
- ✅ Complete copilot with AI-powered NL→SQL, RBAC, anomaly detection, and 42+ tests (PR #57).
- ✅ Queries like "List products with price > $100" and "Show changes scheduled next week" succeed; query + sources logged.
- ✅ Implemented `/api/v1/copilot` endpoint with GPT-4 integration and pattern-based fallback
- ✅ RBAC enforcement with project membership and role validation
- ✅ SQL injection guards (read-only queries only)
- ✅ Query logging with `CopilotQueryLog` table for full audit trail
- ✅ Analytics digest cron job with anomaly detection (price spikes, margin compression, volatility)
- ✅ Console UI with `CopilotDrawer` and `CopilotButton` components
- ✅ 18+ comprehensive tests covering RBAC, query logging, and anomaly detection

**Completed:** January 2025 (M1.4)

---

### M1.5 — Stripe Connector [MW] — Owners: Connectors ✅ COMPLETE
**Goals**
- OAuth (Connect Standard); Sync Products/Prices/Transactions; Webhook verification.

**Success**
- ✅ Stripe integration complete with API Key flow, Sync, and Transactions (PR #124).
- ✅ E2E tests passing.

**Completed:** January 2025 (M1.5)

---

### M1.6 — Automation Runner Execution Layer [MW] — Owners: Engine ✅ COMPLETE
**Goals**
- Automation Safety (Guardrails, Conflict Detection, Kill Switch).
- Deploy Automation Runner service; Schedule Execution; Worker Observability.

**Success**
- ✅ **Safety Guardrails**: Price Floor, Max Delta, Velocity limits implemented and enforced.
- ✅ **RulesWorker**: Execution logic integrated with guardrail checks.
- ✅ **Validation**: Unit tests passing for guardrail logic.
- ✅ **Schema**: `GuardrailPolicy` model added.
- ✅ **Job Execution APIs**: `materialize`, `apply`, `reconcile`, `retry-failed` implemented.
- ✅ **Retry Logic**: Automatic and manual retry handling with exponential backoff.
- ✅ **E2E Tests**: Full lifecycle verification including partial failures and rate limits.
- ✅ **Metrics**: Prometheus metrics integrated with Grafana dashboard.

**Completed:** December 2025 (M1.6 Execution Layer)

---

### M1.8 — Copilot Propose + Automation Runner Preview/Apply [MW] — Owners: Copilot + Engine ✅ COMPLETE
**Goals**
- Copilot simulation → propose → approve/apply flow with preview runs and RBAC gating.
- Console actions wired to existing price-change workflows.
- Public enablement with demo tenant test data.

**Success**
- ✅ Preview runs materialized via Automation Runner and apply path uses admin-gated endpoints.
- ✅ Copilot propose endpoint persists disabled rule + preview run and logs metadata.
- ✅ Console supports “Approve & Apply Now” end-to-end.
- ✅ Demo tenant seeded with test data for public usage.
- ✅ CI green; Railway deploy verified with smoke checks.
- ✅ PR #134 merged to master.

**Completed:** February 3, 2026 (M1.8)

### M1.8.1 — Automation Runner Worker Enablement [MW] — Owners: Engine ✅ COMPLETE
**Goals**
- Start RulesWorker from the worker service and register Shopify connectors per project.
- Resolve Shopify variant IDs from channelRefs for apply/reconcile.
- Implement pre-flight health checks for safety.

**Success**
- ✅ Worker starts RulesWorker and registers per-project Shopify connectors.
- ✅ RulesWorker applies/reconciles using resolved Shopify variant IDs.
- ✅ Pre-flight health check gate implemented; aborts on unreachable connectors.
- ✅ Integration tests passing for variant ID resolution and health checks.
- ✅ Worker deployment hardening: health endpoint, ESM entrypoint alignment, Debian base for Prisma runtime stability. (PR #140)

**Completed:** February 2, 2026


### M1.9 — Copilot Feedback Loop [MW] — Owners: Copilot + Interface ✅ COMPLETE
**Goals**
- Collect user feedback on Copilot responses (rating + comment).
- Tune prompt strategies based on low-rated queries.

**Success**
- ✅ Feedback UI (thumbs up/down) in Copilot drawer.
- ✅ API endpoint to persist feedback to `CopilotQueryLog`.
- ✅ Analytics metric for "Average Copilot Rating".
- ✅ PR #137 merged.

**Completed:** February 2026 (M1.9)

### Ready‑For‑Automation Gate [NR] — ✅ 8/8 Requirements Met — COMPLETE
**Checklist**
- ✅ Engine supports schedule + revert
- ✅ Audit/explain complete
- ✅ Console shows lineage
- ✅ Connectors resilient (retry/backoff)
- ✅ Error surfacing
- ✅ Health checks
- ✅ **Amazon validation complete** — M0.4 validated with 100% test pass
- ✅ **Staging deployment validation** — Complete with comprehensive acceptance report

**Success**
- ✅ All 8 gate requirements validated through comprehensive testing
- ✅ 350+ automated tests passing across 14 packages
- ✅ 100% TypeScript type safety verified
- ✅ All connectors validated (Shopify, Amazon, Competitor Monitoring)
- ✅ Feature flags operational and tested
- ✅ Authentication flows validated
- ✅ Deployment configurations verified (Railway + Vercel)
- ✅ Comprehensive acceptance report created (`docs/STAGING_VALIDATION_ACCEPTANCE_REPORT.md`)
- ✅ Automated validation script created (`scripts/validate-staging.sh`)

**Completed:** November 26, 2025

- ✅ **GREEN LIGHT** for **Automation Runner** (M1.8) + **Copilot Simulation** (M1.9)
