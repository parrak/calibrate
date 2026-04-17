# ⚠️ STRATEGIC PIVOT — READ BEFORE ANY WORK

**Date**: February 13, 2026
**Status**: ACTIVE — All agents must read this before executing any tasks

---

## WHAT CHANGED

Calibrate has pivoted from **Shopify Plus agency pricing** to **Enterprise Discount Governance + Plan Price Change Governance for AI-native / growth-stage SaaS vendors**.

### OLD direction (DEPRECATED — do not build):
- Shopify bulk pricing for agencies
- E-commerce pricing change control
- Shopify connector as primary actuator
- Agency multi-tenant as first use case
- MCP-first developer distribution

### NEW direction (ACTIVE — build this):
- **Discount Override Governance** for SaaS sales teams
- **Plan Price Change Governance** for SaaS founders/finance
- **Expected vs. Realized Outcome Tracking** on every mutation
- Revenue Mutation Control System
- Target: Series B-C SaaS companies ($5-30M ARR)

---

## WHAT STAYS THE SAME

The existing architecture is an asset, not a liability. These survive the pivot:

- ✅ Event-sourced mutation log (rename "price_change" → "mutation")
- ✅ Governance flows (preview → approve → apply → rollback)
- ✅ Explain traces on every mutation
- ✅ Multi-tenant RLS with scoped tokens
- ✅ Idempotent execution with retry/backoff
- ✅ Audit event infrastructure (append-only)
- ✅ Monorepo structure, Railway + Vercel infra
- ✅ `@calibr/security`, `@calibr/monitor`, `@calibr/types`

---

## WHAT GETS REFACTORED

| Current | Becomes | Notes |
|---------|---------|-------|
| `price_change` table | `mutation` table | Domain-agnostic. Supports discount, plan_price, pricing, future domains |
| `@calibr/pricing-engine` | `@calibr/mutation-engine` | Extract pricing-specific logic into a domain handler |
| Shopify connector | External system interface (deferred) | MVP executes within Calibrate. Actual CRM/billing write-back is post-MVP |
| Pricing rules DSL | Policy engine | Configurable guardrails: thresholds, approval routing, hard blocks |
| Pricing-specific preview | Domain-agnostic simulation | Each domain handler implements its own simulate() |

---

## WHAT GETS KILLED

- ❌ Amazon SP-API stub
- ❌ Competitor scraping / monitoring
- ❌ Shopify-specific demo flow
- ❌ "Revenue Change Control" as external category name
- ❌ MCP server (defer until 10+ paying customers)
- ❌ Skill SDK / marketplace
- ❌ Promotional management domain
- ❌ Any pricing optimization / AI suggestions

---

## CONSTRAINTS

**Employment**: Founder is currently at Stripe. All work must:
- Use personal devices and accounts only
- Happen outside Stripe working hours (evenings/weekends)
- Use zero Stripe IP, code, internal tools, or customer data
- Be explainable from first principles and public knowledge

**Capacity**: ~15-20 hours/week. AI agents are force multipliers but not substitutes for design, QA, and customer conversations.

**External messaging**: Do NOT use these terms externally: "Revenue Change Control", "Action Contracts", "mutation lifecycle", "agent governance layer", "platform". External framing: "Discount governance and plan price change management for SaaS."

---

## NEXT STEPS

See `/agents/execution-packets/` for weekly task packets.
See `/agents/QUEUE.md` for the prioritized task queue.
See `/agents/ARCHITECTURE.md` for the system diagram and schema.

**Start here**: `/agents/execution-packets/week-01-mutation-core.md`
