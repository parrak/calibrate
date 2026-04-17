# CALIBRATE — Platform Vision
## Revenue Change Control: The Governed Execution Layer for Revenue Operations

**Classification**: Internal strategy + investor narrative. Not for external marketing until wedge is validated.  
**Prerequisite**: Document A milestones achieved (5+ paying agency customers, 500+ governed changes, clear pain validated)  
**Date**: February 2026

---

## 1. THE PLATFORM THESIS

Calibrate is a **governed execution layer for revenue change**. Pricing is the first actuator that proves it works. The platform expands to every domain where revenue-impacting actions need to be proposed, simulated, approved, executed, tracked, and reversed.

**The analogy**: DevOps evolved from "deploy code manually" to CI/CD pipelines with tests, approvals, staging, canary deploys, and rollback. Revenue operations needs the same evolution — from spreadsheet edits to governed change pipelines.

**The category**: Revenue Change Control.

**The core abstraction**: Action Contracts — a standardized envelope for any revenue change, regardless of who proposed it (human, rule, or agent) or what domain it affects (pricing, promos, credits, entitlements).

---

## 2. WHY THIS PLATFORM, WHY NOW

### 2.1 AI Agents Need a Governance Layer

40% of enterprise applications will integrate task-specific AI agents by end of 2026 (Gartner). The AI agent market crossed $7.6B in 2025, projected to exceed $50B by 2030.

But the missing layer is not more agents — it is safe execution of agent-proposed changes. Every company deploying an AI agent to touch revenue data needs:
- Simulation before execution
- Policy checks and guardrails
- Approval workflows (human-in-the-loop when stakes are high)
- Audit trails for compliance
- Rollback when things go wrong

Calibrate provides this governance layer. It doesn't compete with agent platforms (StackAI, Gumloop). It sits beneath them — governing the execution of whatever agents propose.

### 2.2 Revenue Operations Is the Last Ungoverned Function

Engineering has CI/CD, code review, staging environments, feature flags, and rollback. Finance has approval chains, audit requirements, and segregation of duties. Revenue operations — pricing, promotions, discounting, entitlements — still runs on spreadsheets, bulk editors, and hope.

This gap exists because:
- Revenue changes were historically low-frequency (quarterly price reviews)
- The tools were simple (upload a CSV to Shopify)
- The risk was manageable (one store, one market)

All three conditions are changing:
- Changes are now continuous (dynamic pricing, competitive responses, AI-driven proposals)
- The systems are complex (multi-store, multi-channel, multi-currency)
- The risk is compounding (public-facing prices, regulatory requirements, agent-driven automation)

### 2.3 The Architecture Advantage

Calibrate's existing codebase contains enterprise trust primitives that were over-engineered for a pricing tool but are precisely right for a governed execution platform:

- Event-sourced append-only audit logs (tamper-evident change history)
- Governance flows with preview, approval, and rollback (human-in-the-loop execution)
- Explain traces on every mutation (every change has a "why")
- Multi-tenant isolation with RLS and scoped tokens (agency-grade data separation)
- Idempotent execution with retry/backoff (safe automation at scale)
- Schema registry with typed contracts (extensible to new domains)

These primitives are not features. They are trust infrastructure. They take 6-12 months to build correctly. Calibrate has already built them.

---

## 3. ACTION CONTRACTS: THE CORE ABSTRACTION

### 3.1 Definition

An Action Contract is the atomic unit of work in Calibrate. Every revenue change — whether proposed by a human, a rule, or an AI agent — is expressed as an Action Contract that flows through a standard lifecycle:

```
Trigger → Propose → Simulate → Govern → Approve → Execute → Observe → Complete/Rollback
```

An Action Contract includes:
- **What**: The proposed changes (structured diff of before/after states)
- **Why**: Explain trace (natural language rationale for the change)
- **Impact**: Simulation results (structural validation: affected items, margin impact, guardrail checks)
- **Governance**: Policy evaluations (which guardrails passed, flagged, or overrode)
- **Execution**: Application log (what was written, to which system, with what result)
- **Evidence**: Full audit trail (every state transition, who triggered it, when)
- **Reversal**: Rollback plan (how to undo each change, with what side effects)
- **Outcome**: Measured impact (actual results vs. simulation prediction, over configured observation window)

### 3.2 Why This Abstraction Wins

**For humans**: A Change Request they can review, approve, and track — like a pull request for revenue data.

**For systems**: A transactional unit with clear lifecycle, idempotency, and rollback semantics.

**For agents**: A tool with defined inputs, outputs, side effects, and safety guarantees. An agent can propose a change and know exactly what governance applies and how to undo it.

**For compliance**: An audit record where every change has a who, what, when, why, and what-happened-next.

### 3.3 Interfaces

Every Action Contract is accessible through three interfaces:

| Interface | User | Access Method | Primary Use |
|-----------|------|---------------|-------------|
| Console | RevOps operators, agency managers | Web UI | Review, approve, monitor, report |
| API | Internal systems, automation pipelines | REST + webhooks | Programmatic creation and lifecycle management |
| MCP | AI agents, LLM-powered workflows | Model Context Protocol | Agent-driven proposals with governance |

All three interfaces operate on the same object model. The governance flow is identical regardless of interface.

---

## 4. PLATFORM EXPANSION PATH

### 4.1 Domain Sequence

Each "domain" is a category of revenue change that uses the same Action Contract infrastructure. Domains are added based on customer demand, not vision.

**Domain 1: Pricing (NOW — validated through wedge)**
- Bulk price updates with guardrails
- Rule-based repricing (schedule, condition, transform)
- Competitive response pricing
- Multi-store price coordination

**Domain 2: Promotions (NEXT — when 3+ customers ask)**
- Time-boxed promotional pricing with budget guardrails
- Discount code governance (creation, limits, auto-expiry)
- Flash sale management (auto-start, auto-end, auto-rollback)
- Promo conflict detection (overlapping promos on same items)

**Domain 3: Price Integrity (NEXT — when anomaly detection demand is validated)**
- MAP violation detection and alerting
- Channel price conflict monitoring (same product, different prices across stores)
- Statistical anomaly detection (sudden drops, outlier prices)
- Corrective action proposals (integrity alerts → governed change requests)

**Domain 4: Discounting Governance (LATER — when SaaS/enterprise demand exists)**
- Sales rep discount authority limits
- Volume and tiered discount management
- Quote-to-cash pricing governance
- Customer-specific pricing approval chains

**Domain 5: Billing Rule Changes (LATER — requires Stripe/billing connectors)**
- Plan pricing changes with simulation
- Usage rate adjustments
- Entitlement modifications
- Contract renewal pricing governance

### 4.2 Domain Expansion Criteria

A new domain is added ONLY when:
1. At least 3 existing customers explicitly ask for it
2. The Action Contract lifecycle fits naturally (propose → approve → execute → rollback)
3. A connector exists for execution (can actually write the change to a target system)
4. Rollback is technically feasible (the change can be safely undone)
5. The governance requirements are real (the buyer already needs approvals/audit for this change type)

---

## 5. SKILLS ARCHITECTURE

### 5.1 Definition

A Skill is a versioned, governed package that generates Action Contracts for a specific domain. Skills are the "proposal engine" — they decide WHAT to change. The platform handles HOW to govern, execute, and audit those changes.

A Skill includes:
- Data access permissions (what the skill can read)
- Policies and guardrails (default safety boundaries)
- Proposal logic (rules, heuristics, ML, or LLM-driven)
- Simulation logic (how to validate impact before execution)
- Apply and rollback handlers (how to execute and undo changes in target systems)
- Explainability template (how to generate human-readable rationale)
- Outcome metrics (what to measure after execution)

### 5.2 Built-In Skills

**Pricing — Bulk Update**: Rules DSL for batch price changes with guardrails. Status: BUILT (existing pricing engine).

**Pricing — Competitive Response**: Rule-based competitive counter-pricing with margin protection. Status: PARTIALLY BUILT.

**Promo Guard**: Time-boxed promotional pricing with budget caps and auto-rollback. Status: NOT BUILT (planned Domain 2).

**Price Integrity**: Anomaly detection, MAP monitoring, and channel conflict alerting. Status: PARTIALLY BUILT (E2E tests exist).

### 5.3 Skill SDK (Future)

When the platform has 15+ customers and validated demand for custom skills, ship a Skill SDK that enables:
- Third-party developers to build and publish governed actions
- Agency-specific skills (e.g., client-specific pricing playbooks)
- Integration partners to contribute domain-specific skills
- Potential marketplace with revenue share

This is a Year 2 initiative. Do not discuss externally or allocate engineering time until then.

---

## 6. DISTRIBUTION AND AGENT INTEGRATION

### 6.1 MCP Strategy (Post-Wedge Validation)

After the pricing wedge is validated with 10+ paying customers, expose Action Contracts as MCP tools:

```
calibrate.propose_change     — Create a governed change request from agent reasoning
calibrate.simulate_change    — Run structural validation on a proposed change
calibrate.check_policies     — Evaluate guardrails without proposing
calibrate.list_pending       — See what's awaiting approval
calibrate.apply_change       — Execute an approved change
calibrate.rollback_change    — Revert an applied change
calibrate.get_outcome        — Check measured impact of a past change
```

**Why MCP matters (later)**: Every AI agent that touches revenue data is a potential Calibrate integration point. MCP is the standard for agent-to-tool connection. Being discoverable in MCP registries provides developer distribution at near-zero marginal cost.

**Why not MCP now**: MCP discovery is unproven for commerce use cases. The primary buyer (agency ops managers) does not browse MCP registries. Revenue must come from direct channels first. MCP is a 2-day engineering exercise once the API exists — defer it, don't architect against it.

### 6.2 Long-Term Distribution Architecture

```
Phase 1 (Now):     Agency partner channel → direct revenue
Phase 2 (Month 4): Developer channel (API + MCP) → bottom-up adoption
Phase 3 (Month 8): Marketplace (Shopify App Store, partner ecosystem) → scale
Phase 4 (Year 2):  Skill marketplace → ecosystem value
```

---

## 7. MOAT AND DEFENSIBILITY

### 7.1 What IS the Moat

**1. Standardized Action Contracts for Revenue Changes**
Once a company structures revenue operations around Action Contracts, switching cost is high. They'd need to rebuild governance, audit trails, and rollback infrastructure.

**2. Durable Audit and Outcome System**
Every change has a who, what, when, why, and what-happened-next. This becomes institutional memory that grows more valuable over time and is impossible to replicate by a new entrant.

**3. Deep Rollback Capability Across Systems**
Most tools can write to Shopify. Few can safely revert across systems with proper attribution, side-effect management, and audit. Rollback is technically hard and is a durable engineering advantage.

**4. Compounded Workflow Data** (over time)
As more changes flow through Calibrate, the platform accumulates data about which guardrails catch real problems, which simulations are accurate, and which policies matter. This makes the system safer and more accurate over time.

### 7.2 What IS NOT the Moat

- MCP servers (will be commoditized)
- Individual skills (can be replicated)
- AI/ML pricing intelligence (Competera has better models; don't compete here)
- Shopify integration (every pricing tool has one)

---

## 8. INVESTOR NARRATIVE

### 8.1 The Pitch (When Ready — Post $30K+ MRR)

**Problem**: Revenue operations is the last major business function without governed change management. Pricing, promotions, discounting, and entitlements are managed through spreadsheets and manual edits with no preview, no approval flow, no audit trail, and no undo button. As AI agents begin driving revenue-impacting changes, this gap becomes critical.

**Solution**: Calibrate is the governed execution layer for revenue changes. Every change — whether proposed by a human, a rule, or an agent — flows through a standard lifecycle: propose, simulate, approve, execute, observe, rollback. We call this Revenue Change Control.

**Traction**: [X] agencies managing [Y] stores with [Z] governed change requests per month. [Retention rate]. [Expansion metrics]. [Customer quote about the pricing disaster that made them buy].

**Market**: The pricing optimization market alone is $4.5B growing at 17% CAGR. But Calibrate is not a pricing tool — it's the governance layer for all revenue changes. The adjacent markets (RevOps tooling, enterprise agent governance) expand the addressable opportunity to $10B+.

**Wedge → Platform**: We started with pricing because it has the highest frequency, clearest ROI, and safest rollback path. We're expanding to promotions, discounting, and billing rule governance based on customer demand. The Action Contract abstraction generalizes cleanly across domains.

**Why now**: AI agents are moving from experiment to production in revenue operations. Every agent that proposes a price change, generates a discount, or modifies a billing rule needs a governance layer. Calibrate is positioned to be that layer.

**Moat**: Standardized action contracts + durable audit/outcome data + deep rollback capability + compounded workflow intelligence.

**Ask**: [Seed round: $X for Y months of runway. Use of proceeds: engineering hire, customer success, GTM.]

### 8.2 Investor Narrative Readiness Criteria

Do NOT pursue fundraising until:
- 10+ paying customers
- $30K+ MRR (or clear path within 60 days)
- At least 1 domain expansion validated by customer demand
- Retention >85% monthly
- At least 3 referenceable customers willing to speak with investors
- A clear "pricing disaster" customer story that proves the pain

---

## 9. COMPETITIVE POSITIONING (INTERNAL REFERENCE)

### 9.1 Why We Win Against Pricing Tools

| Competitor | Their strength | Our angle |
|-----------|---------------|-----------|
| Prisync ($59-135/mo) | Easy competitive monitoring | We don't monitor — we govern execution. Different problem. |
| Competera ($500-2K/mo) | ML-driven price optimization | We don't optimize — we make any change safe. Use Competera for intelligence, Calibrate for execution. |
| Pricefx ($50K+/yr) | Deep ERP/CPQ integration | We're lighter, faster, focused on commerce. They sell to procurement. We sell to RevOps. |

**Positioning**: "Other tools tell you WHAT to change. Calibrate ensures changes happen SAFELY."

### 9.2 Why We Win Against "Do Nothing" (Spreadsheets)

This is the real competitor.

- **Incident story**: "When was the last time a price change went wrong? How long to fix?"
- **Cost math**: "20 hours/week on manual pricing at $75/hour = $6,500/month in ops cost. Calibrate is $499."
- **Scale argument**: "You can manage 10 stores. Can you manage 30 with the same process?"
- **Accountability**: "When a client asks who approved that price change, what do you show them? A screenshot of a Slack message?"

---

## 10. LONG-TERM VISION (3-5 YEAR HORIZON)

### 10.1 The Endgame

Calibrate becomes the standard execution layer for governed revenue changes across industries.

- **Year 1**: Pricing change control for Shopify Plus agencies and multi-brand operators
- **Year 2**: Multi-domain revenue change control (pricing + promos + discounting) with skill ecosystem
- **Year 3**: Agent governance layer — every AI agent that touches revenue routes through Calibrate
- **Year 4-5**: Cross-industry expansion (SaaS billing governance, manufacturing pricing, healthcare billing)

### 10.2 The Intelligence Network (Year 3+)

With thousands of governed changes flowing through the platform:
- Anonymized benchmarks: "Agencies like yours apply 340 price changes per month with a 2.1% rollback rate"
- Predictive guardrails: "Changes similar to this one have had a 15% rollback rate — additional review recommended"
- Outcome intelligence: "Across all customers, 20% discounts on apparel generate 2.3x more revenue than 15% discounts"

This is the network effect. It compounds with every customer and every change request. It cannot be replicated by a new entrant.

### 10.3 Autonomous Revenue Operations (Year 4+)

When trust is established through years of governed execution:
- Agent-driven changes with configurable autonomy levels (observe → suggest → auto-apply within guardrails → full autonomy)
- Cross-system coordination (change price in Shopify AND update ad spend AND adjust inventory reorder point — as one governed transaction)
- Predictive governance (system recommends policy changes based on observed patterns)

---

*This document is the internal compass. It guides architecture and hiring decisions. It informs investor conversations after the wedge is validated. It does not appear on the website, in outreach, or in sales materials until Document A milestones are achieved.*

*"Win governed bulk pricing for agencies. If that works, the platform is inevitable."*
