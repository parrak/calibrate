# Team Assignments

## Teams

- **Platform**: schema, migrations, RLS, outbox/eventing, CI, observability, deployment.

- **Connectors**: Shopify read/write; Amazon read-only stub.

- **Engine**: rules DSL, apply/rollback, idempotency, explain traces (with Platform).

- **Interface**: Console (catalog, rule builder, diff preview, audit drawer).

- **Copilot & Analytics**: NL query endpoint (read-only), schema RAG, RBAC, anomaly flags, weekly digest, explainability UI hooks.

| Deliverable | Platform | Connectors | Engine | Interface | Copilot |
|---|---|---|---|---|---|
| Schema Registry & DTOs | **R** | C | C | C | C |
| Event Log & Outbox | **R** | C | C | C | C |
| Shopify Ingest/Write | C | **R** | C | C | C |
| Amazon Read-only Stub | C | **R** | C | C | C |
| Rules Engine (MVP) | C | C | **R** | C | C |
| Console (Catalog + Rules) | C | C | C | **R** | C |
| Explainability & Audit | **R** | C | **R** | C | C |
| Copilot Read-only & Analytics Surfaces | C | C | C | C | **R** |

## Human–AI Handoff Rules

- PR descriptions MUST include affected schemas and migration notes.

- Any rule transformation requires an example + expected diff fixture.

- Copilot must log generated SQL/GraphQL and resolved scopes (tenant, role).

- Analytics additions MUST register metrics in `@calibr/monitor` with correlation ids.

## UI Theming Rollout (Light Theme)

**Goal**: Notion-style light theme with shared tokens across Site, Console, Docs.

- **Owner**: Interface (build) + Platform (tokens, release)

- **Scope**: `apps/{site,console,docs}/app/globals.css`, `packages/ui`

- **Acceptance**: WCAG AA contrast; screenshots for hero/dashboard/docs; Lighthouse ≥ 90 (desktop)

