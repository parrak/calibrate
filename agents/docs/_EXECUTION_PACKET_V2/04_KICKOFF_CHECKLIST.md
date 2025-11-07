# Kickoff Checklist

## Copilot (Read-Only)

- [ ] `/copilot/query` returns results with logged SQL/GraphQL + scopes.

- [ ] RAG over schemas enabled; denylist patterns enforced.

## Acceptance Gate (Ready for Automation Runner)

- [ ] Apply/rollback reliable; audit/explain intact.

- [ ] Connectors stable under backoff; surfaced in health page.

---

## Definition of Ready (DoR) — Enforced at PR Triage

- [ ] Contract snippet attached (`contracts/<issue>.md`)

- [ ] Env & secrets enumerated; vault paths present

- [ ] Acceptance criteria listed; owner + milestone tag assigned

## Operational SLAs — Alerting Owned by Platform

- [ ] API p95 latency SLO dashboards configured

- [ ] 5xx rate alerts (< 2%/day) wired

- [ ] Connector job success SLO (≥ 98%) and cron success (≥ 99%) monitored

