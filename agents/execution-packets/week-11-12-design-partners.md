# Weeks 11-12 Execution Packet: Design Partners

**Tasks**: CAL-066 through CAL-075  
**Hours**: 32-36 (split across 2 weeks)  
**Agent**: Claude Code (onboarding features), Founder (partner management)  
**Dependencies**: Weeks 9-10 complete (CAL-055 to CAL-065)

---

## OBJECTIVE

Onboard 3 design partners (real companies using Calibrate with real data), fix critical issues, and measure actual usage. End with an honest PMF assessment: are we on the path to revenue?

---

## WEEK 11: ONBOARDING INFRASTRUCTURE + PARTNER 1-2

### CAL-066: Onboarding flow — Guided setup

**File**: `apps/console/app/onboarding/page.tsx`

Multi-step wizard for new workspace setup.

**Steps**:
1. **Create workspace**: Company name, subdomain
2. **Configure policies**: Choose templates or custom thresholds
3. **Invite team**: Add users with roles (rep, manager, finance, admin)
4. **Connect Slack** (optional): OAuth flow
5. **Import data** (optional): CSV upload for customers/plans
6. **Create first mutation**: Guided walkthrough

**Done when**: New user can go from signup to first mutation in < 10 minutes.

---

### CAL-067: Data import — Customer/Plan CSV

**File**: `apps/api/app/api/v1/import/route.ts`

Bulk import customers and plans from CSV.

**CSV format (customers)**:
```csv
customer_id,customer_name,plan_id,current_price,arr,margin_percent
cust_001,Acme Corp,pro,99,50000,65
```

**CSV format (plans)**:
```csv
plan_id,plan_name,price,active
starter,Starter,49,true
pro,Pro,99,true
```

**Logic**:
1. Validate CSV (required columns, data types)
2. Upsert customers/plans (idempotent)
3. Return summary (created, updated, errors)

**Done when**: Partner can upload CSV, seed their workspace with real data.

---

### CAL-068: Policy configuration UI

**File**: `apps/console/app/p/[slug]/settings/policies/page.tsx`

Configure approval thresholds and routing rules.

**Features**:
- List active policies
- Edit policy config (threshold, action, approver role)
- Create custom policy
- Activate/deactivate policy
- Preview: "If discount = 22%, which policies trigger?"

**Done when**: Partner can customize policies to match their approval process.

---

### CAL-069: Onboard partner 1

**Task**: Founder onboards first design partner

**Process**:
1. **Kickoff call** (30 min): Explain vision, set expectations, walk through onboarding
2. **Data import**: Help partner upload customers/plans CSV
3. **Policy config**: Configure thresholds to match their current process
4. **Team invite**: Add their finance VP, sales manager
5. **First mutation**: Guide them through creating a real discount request
6. **Slack setup**: Connect their Slack workspace
7. **Follow-up** (1 week): Check usage, answer questions

**Success metrics**:
- Partner creates 3+ mutations in first week
- At least 1 approval via Slack
- No critical bugs blocking usage

**Done when**: Partner 1 is actively using Calibrate with real data.

---

### CAL-070: Onboard partner 2

**Task**: Founder onboards second design partner

**Process**: Same as CAL-069

**Goal**: Capture differences in workflow, identify edge cases.

**Questions to ask**:
- How does their approval process differ from Partner 1?
- What features are missing?
- What's confusing?

**Done when**: Partner 2 is actively using Calibrate.

---

## WEEK 12: PARTNER 3 + FIXES + PMF ASSESSMENT

### CAL-071: Fix top 3 issues from partners

**Task**: Agent fixes critical bugs/gaps identified by partners

**Likely issues** (examples):
1. **Approval routing too rigid**: Need custom routing per mutation type
2. **Slack notifications too noisy**: Need granular notification preferences
3. **CSV import fails on edge cases**: Handle missing columns, special characters

**Process**:
1. Triage partner feedback
2. Prioritize top 3 blockers
3. Fix + test
4. Deploy
5. Notify partners

**Done when**: Top 3 issues resolved, partners unblocked.

---

### CAL-072: Onboard partner 3

**Task**: Founder onboards third design partner

**Process**: Same as CAL-069

**Goal**: Third data point for PMF signal.

**Done when**: Partner 3 is actively using Calibrate.

---

### CAL-073: Measure — Mutations created, approvals, rollbacks

**File**: `apps/api/app/api/v1/analytics/usage/route.ts`

Track usage metrics per partner.

**Metrics**:
- Mutations created (per week)
- Mutations approved (per week)
- Mutations applied (per week)
- Mutations rolled back (per week)
- Active users (per week)
- Slack approvals vs. Console approvals

**Dashboard**: Internal admin view (not customer-facing yet)

**Done when**: Can see weekly active mutations per partner.

---

### CAL-074: Begin real outcome tracking

**Task**: Connect to partner revenue data

**Options**:
1. **Stripe webhook**: If partner uses Stripe, connect webhook to record deal_closed, churn events
2. **Manual CSV upload**: Partner exports data monthly, uploads to Calibrate
3. **API integration**: Partner's CRM/billing system sends outcome data via API

**Goal**: Start tracking real expected vs. actual for at least 1 partner.

**Done when**: At least 1 partner has outcome data flowing in.

---

### CAL-075: Week 12 State of Play memo

**File**: `agents/pmf-assessment.md`

Honest assessment of product-market fit.

**Questions to answer**:
1. **Usage**: Are partners creating mutations weekly? Or did they try once and stop?
2. **Value**: Do partners say this solves a real pain? Or is it a "nice to have"?
3. **Willingness to pay**: Did any partner ask about pricing? Or assume it's free?
4. **Retention signal**: Are partners still using it in week 4? Or did they churn?
5. **Referrals**: Did any partner refer us to another company?
6. **Feedback themes**: What features are they asking for? Are requests aligned or scattered?

**PMF signals** (positive):
- 2+ partners using weekly
- At least 1 partner says "I'd pay for this"
- At least 1 partner refers another company
- Feedback is aligned (same features requested)

**No PMF signals** (negative):
- Partners tried once, stopped
- No one mentions pricing
- Feedback is scattered (everyone wants different things)
- No referrals

**Recommendation**:
- **If PMF signals**: Plan pricing, convert partners to paying customers, expand outreach
- **If no PMF**: Reassess wedge (maybe discount governance isn't the pain), pivot or shut down

**Done when**: Memo written, shared with advisors/investors (if any), decision made.

---

## ACCEPTANCE CRITERIA (WEEKS 11-12 COMPLETE)

- [ ] Onboarding flow built (guided setup)
- [ ] CSV import works (customers + plans)
- [ ] Policy configuration UI functional
- [ ] Partner 1 onboarded and actively using
- [ ] Partner 2 onboarded and actively using
- [ ] Top 3 issues fixed
- [ ] Partner 3 onboarded and actively using
- [ ] Usage metrics tracked (mutations/week, active users)
- [ ] Real outcome tracking started (at least 1 partner)
- [ ] Week 12 State of Play memo written
- [ ] Honest PMF assessment completed

---

## DO NOT

- Do not build new features speculatively (only fix blockers)
- Do not over-promise to partners (set realistic expectations)
- Do not ignore negative signals (be honest about PMF)

---

## NEXT STEPS (POST WEEK 12)

**If PMF signals positive**:
1. Define pricing ($500-2000/mo per workspace)
2. Convert design partners to paying customers
3. Expand outreach (target 20 more companies)
4. Hire first engineer (if revenue justifies)

**If PMF signals negative**:
1. Reassess wedge (interview partners: what would they pay for?)
2. Pivot to different use case (e.g., commission governance, pricing experiments)
3. Or shut down gracefully, return to Stripe full-time

**Decision point**: End of Week 12.
