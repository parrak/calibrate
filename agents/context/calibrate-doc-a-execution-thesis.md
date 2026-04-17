# CALIBRATE — Execution Thesis
## "Safe bulk pricing for Shopify Plus agencies."

---

## WHO

**Primary buyer**: E-commerce agencies managing 5+ Shopify Plus stores for clients.

**Titles**: Operations Director, Account Manager, Agency Principal.

**Why agencies**: They manage revenue operations across multiple client stores. Mistakes are career-ending — a bad price change on a client's store means a lost account. They need audit trails to prove to clients that changes were approved and executed correctly. Multi-tenant isolation is non-negotiable. They can't scale headcount to match client growth.

**Secondary buyer** (Month 3+): Multi-brand Shopify Plus operators with 3+ stores and a dedicated pricing/RevOps person.

---

## PAIN

Agencies manage pricing changes for 10-50 client stores using:
- Internal SOPs documented in Google Docs
- Spreadsheets tracking what changed, when, and who approved it
- Shopify's bulk editor with no preview, no approval, and no rollback
- Screenshots for "proof of approval" when clients ask
- Project management tools (Asana, Monday) as makeshift governance

**The acute pain**: Every new client adds ops burden. They can't take on more clients without hiring more ops people. And when something goes wrong (a promo that doesn't end, prices set below cost, wrong store updated), there's no audit trail and no undo button.

**The buying trigger**: The last time a pricing mistake happened on a client store. Or: the moment they realize they're spending 20+ hours/week on manual pricing coordination that could be automated with governance.

---

## PRODUCT (What Ships in 6 Weeks)

**Calibrate v1: Governed bulk pricing for agencies.**

Core workflow: **Propose → Preview → Approve → Apply → Observe → Rollback**

What it does:
- **Preview every price change** before it goes live (diff view: before/after for every SKU)
- **Require approvals when needed** (configurable: always, above threshold, or auto-approve within guardrails)
- **Full audit trail** (every change has a who, what, when, why — exportable for client reporting)
- **One-click rollback** (revert any change to the previous state, with attribution)
- **Slack-integrated approvals** (approve or reject from Slack, logged in audit trail)
- **Multi-tenant by design** (each client store is isolated — separate permissions, separate audit, separate guardrails)
- **Guardrails** (margin floors, max % delta, ceiling/floor enforcement — mistakes prevented before they happen)

What it does NOT do (yet):
- AI pricing suggestions
- Competitive monitoring
- Promotional management
- Revenue forecasting
- Agent integration / MCP
- Multi-marketplace (Amazon, etc.)

**Simulation in v1 means**: Structural validation. "These 847 items would change. 12 items hit guardrail overrides. Total revenue exposure is $X. Minimum margin stays above 22%." NOT predictive revenue forecasting.

---

## WHY NOW

1. **Agencies are scaling faster than their ops teams**. Shopify Plus ecosystem is growing. Agencies managing 10+ stores don't have a pricing governance tool. They have spreadsheets.

2. **AI agents are coming for revenue operations** (40% of enterprise apps will have task-specific agents by end of 2026). When agents start proposing price changes, someone needs to govern those proposals. Calibrate is positioned to be that governance layer — but that's the 12-month story, not the 6-week story.

3. **The architecture already exists**. 1,162 commits of event-sourced, governance-enabled, multi-tenant infrastructure. The hard engineering is done. The pivot is primarily renaming, interface extraction, and UX redesign — not a rewrite.

---

## FIRST 3 MILESTONES

### Milestone 1: Governed Pricing Live (Week 3)
- Action Contract object model shipped (generalized from current pricing engine)
- Change Request API: create, simulate, approve, apply, rollback
- Console redesigned around Change Requests (not pricing rules)
- Slack integration for approvals
- **Validation**: End-to-end demo — create change request, preview, approve via Slack, apply to Shopify, rollback

### Milestone 2: First Design Partners (Week 6)
- 3 agency design partners onboarded
- Real change requests flowing for real client stores
- Audit trail exports working (agencies need these for client reporting)
- Guardrails configured and tested in production
- **Validation**: 3 agencies running governed pricing changes weekly, providing feedback

### Milestone 3: First Revenue (Week 8-10)
- Convert design partners to paid ($499/month per workspace + $99/store after 3)
- 5 paying customers (at least 3 agencies)
- 100+ governed change requests executed
- **Validation**: $2K+ MRR, >80% weekly active usage among paying customers

---

## HOW TO FIND FIRST 5 CUSTOMERS

| # | Channel | Approach |
|---|---------|----------|
| 1-2 | Shopify Plus Partner Directory | Direct outreach to agencies managing 10+ stores. Message: "We built governed pricing for agency ops teams. Free pilot, 2 weeks." |
| 3 | Fractional RevOps network (Pavilion, RevOps Co-Op) | Post in community: "Who manages pricing across multiple Shopify stores and wants audit trails?" |
| 4-5 | Personal network + warm intros | Ask: "Know any e-commerce agency owners who've had a pricing disaster?" |

**The outreach message**:

"Hey [name] — I'm building a tool that gives agencies approval workflows, audit trails, and one-click rollback for bulk pricing changes across client Shopify stores. Basically, stop managing pricing changes via spreadsheets and screenshots.

We're looking for 3 agencies to pilot for free over 2 weeks. Interested?"

---

## PRICING (Simple)

| Tier | Price | Includes |
|------|-------|----------|
| Free (sandbox) | $0 | 1 store, 50 changes/month, basic guardrails, 7-day history |
| Team | $499/month | 3 stores, 500 changes/month, approvals, Slack, audit exports, 2 users |
| Business | $999/month | 10 stores, 2,000 changes/month, advanced guardrails, 10 users |
| Additional stores | +$99/store/month | Beyond tier allowance |

---

## WHAT SUCCESS LOOKS LIKE IN 90 DAYS

- 5+ paying customers (primarily agencies)
- 50+ stores under management
- 500+ governed change requests executed
- $3-5K MRR
- At least 2 customers ask for something beyond pricing (promos, integrity) — this earns the right to expand
- Founder can articulate: "Here's the pricing disaster story from Customer X that proves governance matters"

---

## WHAT WE DO NOT TALK ABOUT EXTERNALLY (YET)

- Revenue Change Control (category)
- Action Contracts (abstraction)
- Multi-domain expansion (platform)
- MCP / agent integration
- Skill SDK / marketplace
- Investor narrative

These are internal strategy. They guide architecture decisions. They do not appear on the website, in sales calls, or in outreach until 10+ agencies are onboard and asking for more.

---

*"Win 'safe bulk pricing for agencies.' If that works, the platform is inevitable. If it doesn't, the platform narrative won't save it."*
