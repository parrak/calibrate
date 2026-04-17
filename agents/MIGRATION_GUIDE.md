# Migration Guide: E-Commerce → Mutation Lifecycle

**Date**: February 13, 2026  
**Purpose**: Guide for agents transitioning from e-commerce execution packet to mutation lifecycle strategy

---

## What Changed

Calibrate has pivoted from **Shopify Plus agency pricing** to **Enterprise Discount Governance + Plan Price Change Governance for AI-native SaaS vendors**.

### Old Strategy (Deprecated)
- **Target**: Shopify Plus agencies managing pricing for multiple merchants
- **Wedge**: Bulk pricing automation for e-commerce
- **Connectors**: Shopify (read/write), Amazon (read-only stub)
- **Distribution**: MCP server for developer adoption

### New Strategy (Active)
- **Target**: Series B-C SaaS companies ($5-30M ARR)
- **Wedge**: Discount governance + plan price change governance
- **Domains**: Discount overrides, plan price changes, (future: pricing experiments)
- **Distribution**: Direct sales to finance leaders and RevOps

---

## Concept Mapping

| Old Concept | New Concept | Notes |
|-------------|-------------|-------|
| `PriceChange` | `Mutation` | Domain-agnostic. Supports discount, plan_price, pricing domains |
| `@calibr/pricing-engine` | `@calibr/mutation-engine` | Pricing becomes one domain handler among many |
| Shopify connector | External system interface | Deferred. MVP executes within Calibrate |
| Pricing rules DSL | Policy engine | Configurable guardrails with approval routing |
| Pricing preview | Domain-agnostic simulation | Each domain implements its own simulate() |
| Competitor monitoring | (Removed) | Not part of MVP |
| Amazon SP-API | (Removed) | Not part of MVP |
| MCP server | (Deferred) | Wait until 10+ paying customers |

---

## What Stays the Same

The existing architecture is an **asset**, not a liability. These survive the pivot:

✅ **Event-sourced mutation log** - Rename "price_change" → "mutation"  
✅ **Governance flows** - Preview → approve → apply → rollback  
✅ **Explain traces** - Human-readable narrative on every mutation  
✅ **Multi-tenant RLS** - Scoped tokens, per-tenant data isolation  
✅ **Idempotent execution** - Retry/backoff, safe to replay  
✅ **Audit event infrastructure** - Append-only log  
✅ **Monorepo structure** - Turborepo + pnpm  
✅ **Infrastructure** - Railway (API/DB), Vercel (Console)  
✅ **Packages** - `@calibr/security`, `@calibr/monitor`, `@calibr/types`

---

## File Structure Changes

### New Agent Directive Files

```
/agents/
├── AGENTS.md                    ← START HERE. Agent contributor guide.
├── PIVOT.md                     ← Explains the strategic pivot.
├── QUEUE.md                     ← 75 prioritized tasks (CAL-001 to CAL-075).
├── ARCHITECTURE.md              ← Complete system architecture, schema, API routes.
├── RISK.md                      ← Employment constraints, operational limits.
├── execution-packets/
│   ├── week-01-mutation-core.md       ← Schema + types
│   ├── week-02-mutation-api.md        ← API + policy engine
│   ├── week-03-explain-audit.md       ← Explain traces + audit
│   ├── week-04-05-discount-flow.md    ← Discount domain + Slack
│   ├── week-06-plan-price.md          ← Plan price domain
│   ├── week-07-08-outcomes.md         ← Outcome tracking
│   ├── week-09-10-demo-outreach.md    ← Demo + outreach
│   └── week-11-12-design-partners.md  ← Design partners + PMF
├── completed/                   ← Moved here when done
└── context/
    ├── calibrate-doc-a-execution-thesis.md
    └── calibrate-doc-b-platform-vision.md
```

### Deprecated Files

```
/agents/docs/_DEPRECATED/
├── README.md                           ← Explains why archived
├── 00_EXEC_SUMMARY_ECOMMERCE.md       ← Original exec summary
├── 01_MILESTONES_ECOMMERCE.md         ← Original milestones
└── NEXT_TASK_PLAN_ECOMMERCE.md        ← Original Q1 2026 plan
```

### Updated Files (with pivot notices)

- `/agents/docs/_EXECUTION_PACKET_V2/00_EXEC_SUMMARY.md` - Added pivot warning
- `/agents/docs/_EXECUTION_PACKET_V2/01_MILESTONES.md` - Recontextualized as platform foundation
- `/agents/docs/_EXECUTION_PACKET_V2/NEXT_TASK_PLAN.md` - Marked as deprecated
- `/README.md` - Updated product positioning

---

## How to Start

### For New Agents

1. **Read `/agents/AGENTS.md`** - Understand rules, tool mapping, safety constraints
2. **Read `/agents/PIVOT.md`** - Understand what changed and why
3. **Read `/agents/QUEUE.md`** - See the 75-task breakdown
4. **Read `/agents/ARCHITECTURE.md`** - Understand the system design
5. **Start `/agents/execution-packets/week-01-mutation-core.md`** - Begin with schema

### For Existing Context

If you have context from the e-commerce execution packet:

1. **Understand the foundation** - M0.1-M1.9 established the platform that now powers mutation lifecycle
2. **Map concepts** - Use the table above to translate old concepts to new
3. **Focus on new tasks** - Don't continue e-commerce work. Start with CAL-001.
4. **Preserve learnings** - Architectural patterns (event-sourcing, RLS, explainability) still apply

---

## Task Prioritization

**Current priority**: Week 1 (CAL-001 to CAL-009)

Tasks are organized into 5 phases across 12 weeks:

1. **Phase 1: Mutation Core** (Weeks 1-3) - Schema, API, policy engine
2. **Phase 2: Domain Flows** (Weeks 4-6) - Discount + plan price domains
3. **Phase 3: Outcome Tracking** (Weeks 7-8) - Expected vs. realized metrics
4. **Phase 4: Demo + Outreach** (Weeks 9-10) - Polished demo, target outreach
5. **Phase 5: Design Partners** (Weeks 11-12) - Real usage, PMF assessment

**Do not skip ahead.** Each phase builds on the previous.

---

## Employment Constraints (CRITICAL)

Founder is currently at Stripe. All work must:

- Use **personal devices and accounts only**
- Happen **outside Stripe working hours** (evenings/weekends)
- Use **zero Stripe IP, code, or internal knowledge**
- Be explainable from **first principles and public research**

See `/agents/RISK.md` for full details.

---

## Questions?

- **What's the current task?** → Check `/agents/QUEUE.md`, find first `TODO` where all dependencies are `DONE`
- **How does X work?** → Check `/agents/ARCHITECTURE.md`
- **Why did we pivot?** → Read `/agents/PIVOT.md`
- **What's the timeline?** → 12 weeks, 15-20 hrs/week capacity
- **When do we ship?** → Week 10 (demo + outreach), Week 12 (design partners)

---

## Success Metrics

**Week 12 PMF signals** (positive):
- 2+ design partners using weekly
- At least 1 partner says "I'd pay for this"
- At least 1 partner refers another company
- Feedback is aligned (same features requested)

**If no PMF**: Reassess wedge, pivot, or shut down gracefully.

---

**Last updated**: February 13, 2026  
**Next review**: End of Week 1 (CAL-009 complete)
