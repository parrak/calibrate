# Kickoff Checklist — First 30 Days (Milestone-Oriented)

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

