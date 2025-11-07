# Milestones

### M1.4 — Copilot Read-Only Queries [NR] — Owners: Copilot

### Ready-For-Automation Gate [NR]

**Outcome**

- Green-light **Automation Runner** + **Copilot Simulation** in the next packet.

---

### M1.5 — Stripe Connector (Conditional, behind SaaS Validation Gate) [NR→MW]

**Owners**: Platform + Connectors + Copilot & Analytics

**Precondition**: `/agents/docs/_EXECUTION_PACKET_V2/03_VALIDATION_PLAN.md` "Go" threshold met.

**Goals**

- OAuth (Connect Standard) + webhook verification and idempotency

- Catalog and transactions ingest (Products/Prices, PaymentIntents/Charges, BalanceTransactions)

- Mapping tables to internal `Product`/`Price`; Transaction rows linked when possible

- Basic UI surfaces: Connectors settings, Transactions page, Analytics overview filters

**Success**

- Merchant connects Stripe; catalog + recent transactions visible; webhooks verified; backfill stable (≥10k)

- Analytics shows Stripe totals with source filters; Console hints on SKU mismatches

**Notes**

- Full plan in `/agents/docs/_EXECUTION_PACKET_V2/05_STRIPE_INTEGRATION_PLAN.md`

---

## Global Definition of Ready (DoR)

- Contract snippet in `contracts/<issue>.md` (DTOs, request/response, errors)

- Env & secrets listed and validated

- Acceptance criteria measurable, owner and milestone tag present

## Operational SLAs

- API p95: ≤ 1.0s (read), ≤ 1.5s (mutations)

- API 5xx: < 2% per day

- Connector job success: ≥ 98% daily

- Cron reliability: ≥ 99% runs; alerts on miss

