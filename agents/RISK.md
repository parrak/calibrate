# CALIBRATE — Risk & Constraints

---

## EMPLOYMENT CONSTRAINTS (CRITICAL)

Founder is currently employed at Stripe. This creates hard constraints on all work:

### Three Rules (Non-Negotiable)
1. **Total separation of assets**: Personal devices, personal GitHub, personal cloud, personal email. No Stripe anything.
2. **Total separation of time**: Evenings, weekends, PTO only. Commit timestamps must prove this.
3. **Total separation of knowledge**: All Calibrate design decisions must be explainable from first principles and public research. Zero Stripe internals.

### What agents must NOT do:
- Reference Stripe internal architecture, pricing, tooling, or customer data
- Use patterns that are clearly derived from Stripe-proprietary systems
- Create code during Pacific business hours (commit timestamps are evidence)
- Use any Stripe-provided infrastructure, accounts, or credentials
- Target Stripe customers specifically in outreach lists

### Recommended legal actions (founder):
- 🔴 Review Stripe employment agreement (IP assignment, moonlighting clauses)
- 🔴 30-min employment attorney consult
- ⚠️ LLC/Corp formation for corporate separation
- ⚠️ Document separation practices (log personal equipment, outside-hours work)

---

## OPERATIONAL CONSTRAINTS

### Capacity
- 15-20 hours/week maximum on Calibrate
- AI agents are 2-3x multiplier on code tasks, not on design/sales/QA
- Hard limit: one full weekend off per month (burnout prevention)

### Recommended schedule
| Day | Activity |
|-----|----------|
| Mon-Fri (daytime) | Stripe. No Calibrate work. |
| Tue/Thu (evening) | Code — deep implementation work |
| Sat | Customer conversations, outreach, feedback review |
| Sun | Planning, architecture decisions, agent tasking |

### Context switching
- Dedicated blocks, not interleaving
- Each session starts with: read QUEUE.md → pick task → update status → execute
- End each session with: update status → note blockers → commit

---

## STRATEGIC RISK REGISTER

| Risk | Likelihood | Impact | Mitigation |
|------|-----------|--------|------------|
| Burnout | HIGH | HIGH | Hard 15-20 hr cap. One weekend off/month. |
| Day job performance drops | MEDIUM | HIGH | Calibrate never compromises Stripe work. |
| Stripe employment conflict | LOW | VERY HIGH | Attorney consult. Total separation. |
| Shipping too slowly | HIGH | MEDIUM | 2-week buffers in plan. AI agents for speed. |
| Building without customers | MEDIUM | HIGH | Week 9-10 is dedicated outreach. No skipping. |
| Over-engineering before PMF | MEDIUM | MEDIUM | Simulation is structural only. No predictive ML. No Skill SDK. |

---

## WHEN TO LEAVE STRIPE

Do not leave until ALL of these are true:
- 5+ paying customers
- $5K+ MRR
- 90 days personal runway
- Clear signal that full-time would accelerate growth

**Sequence**: Build + validate (now) → If 3+ convert by month 4, plan departure → If $5K+ MRR by month 6, give notice → Full-time with 6+ months runway.

**If zero paying customers by month 4**: Reassess the wedge. Not the departure timeline.
