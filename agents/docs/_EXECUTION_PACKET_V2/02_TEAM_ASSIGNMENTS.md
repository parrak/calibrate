# Atomic Team Assignments — V2 (E‑Comm Focus)

## Teams
- **Platform**: schema, migrations, RLS, outbox/eventing, CI, observability, deployment.
- **Connectors**: Shopify read/write; Amazon read-only stub.
- **Engine**: rules DSL, apply/rollback, idempotency, explain traces (with Platform).
- **Interface**: Console (catalog, rule builder, diff preview, audit drawer).
- **Copilot**: NL query endpoint (read-only), schema RAG, RBAC.

## Responsibility Matrix (RACI)
| Deliverable | Platform | Connectors | Engine | Interface | Copilot |
|---|---|---|---|---|---|
| Schema Registry & DTOs | **R** | C | C | C | C |
| Event Log & Outbox | **R** | C | C | C | C |
| Shopify Ingest/Write | C | **R** | C | C | C |
| Amazon Read-only Stub | C | **R** | C | C | C |
| Rules Engine (MVP) | C | C | **R** | C | C |
| Console (Catalog + Rules) | C | C | C | **R** | C |
| Explainability & Audit | **R** | C | **R** | C | C |
| Copilot Read-only | C | C | C | C | **R** |

**R = Responsible; C = Consulted**

## Interfaces & Contracts
- **Types**: `@calibr/types` (CI publishes on merge to `develop`).  
- **APIs**: OpenAPI under `/apps/api`; GraphQL schema under `/apps/api/graphql`.  
- **Auth**: service tokens per connector; RLS enforced on all read/write queries.  
- **Observability**: `@calibr/monitor` request ids + connector health metrics.

## Human–AI Handoff Rules
- PR descriptions MUST include affected schemas and migration notes.
- Any rule transformation requires an example + expected diff fixture.
- Copilot must log generated SQL/GraphQL and resolved scopes (tenant, role).

