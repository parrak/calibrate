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

### M0.4 — Amazon Connector (Read‑Only Stub) [NR→MW later] — Owners: Connectors
**Goals**
- SP‑API auth scaffolding; catalog ingest for schema stress test (no write).

**Success**
- Sample Amazon catalog rows visible in console; no write paths; flags disabled in prod.

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

---

### M1.3 — Explainability + Audit Surfaces [NR] — Owners: Platform + Engine
**Goals**
- Persist `explain_trace` for previews/applies; `/audit` API; correlation ids across layers.

**Success**
- Any rule/application can be reconstructed from audit + events; traces are human‑readable.
- ✅ Complete audit trail implemented with correlation IDs, event replay, and sample reports (PR #54).

---

### M1.4 — Copilot Read‑Only Queries [NR] — Owners: Copilot
**Goals**
- `/copilot/query` endpoint; schema-aware RAG; safe prompt → SQL/GraphQL; RBAC.

**Success**
- Queries like "List products with price > $100" and "Show changes scheduled next week" succeed; query + sources logged.

---

### Ready‑For‑Automation Gate [NR]
**Checklist**
- Engine supports schedule + revert; audit/explain complete; console shows lineage.
- Connectors resilient (retry/backoff); error surfacing; health checks.

**Outcome**
- Green‑light **Automation Runner** + **Copilot Simulation** in the next packet.

