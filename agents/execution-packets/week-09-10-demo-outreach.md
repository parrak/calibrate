# Weeks 9-10 Execution Packet: Demo + Outreach

**Tasks**: CAL-055 through CAL-065  
**Hours**: 32-36 (split across 2 weeks)  
**Agent**: Claude Code (demo setup), Founder (outreach, calls)  
**Dependencies**: Weeks 7-8 complete (CAL-044 to CAL-054)

---

## OBJECTIVE

Create a polished demo, record a professional Loom walkthrough, rewrite the landing page, and execute targeted outreach to 50 Series B-C SaaS companies. Goal: 5-8 discovery calls with qualified prospects.

---

## WEEK 9: DEMO + ASSETS

### CAL-055: Demo tenant setup ("NovaCRM")

**File**: `packages/db/prisma/seeds/demo-tenant.ts`

Create realistic demo tenant with full data.

**Data**:
- **Company**: NovaCRM (fictional B2B SaaS, $12M ARR, Series B)
- **Plans**: Starter ($49), Pro ($99), Enterprise ($299)
- **Customers**: 500 total
  - 200 on Starter
  - 240 on Pro
  - 60 on Enterprise
- **Users**:
  - Sales rep: John Doe
  - Manager: Sarah Chen
  - Finance VP: Michael Torres
  - CEO: Lisa Park
- **Historical mutations**: 6 months of discount requests + 2 plan price changes (with outcomes)
- **Policies**: Configured per ARCHITECTURE.md templates

**Done when**: Demo tenant fully seeded, realistic, ready for walkthrough.

---

### CAL-056: Demo script — Discount Override (3 min)

**File**: `agents/demos/discount-override-script.md`

Exact click-by-click script for discount demo.

**Flow**:
1. **Setup** (15 sec): "I'm John, a sales rep at NovaCRM. I just closed a $50K ARR deal with Acme Corp, but they need 22% discount to sign."
2. **Create request** (45 sec): Show Console → New Discount Override → fill form → Preview Impact
3. **Simulation** (30 sec): "System shows margin drops from 65% to 58%, ARR exposure $11K. Policy requires finance approval."
4. **Slack notification** (30 sec): Switch to Slack → show notification to Michael (Finance VP)
5. **Approval** (30 sec): Michael clicks Approve in Slack → mutation applied
6. **Outcome tracking** (30 sec): "System now tracks: did deal close? What's actual margin? We'll compare in 30 days."

**Done when**: Script is tight, 3 minutes, tells a story.

---

### CAL-057: Demo script — Plan Price Change (3 min)

**File**: `agents/demos/plan-price-change-script.md`

Exact script for plan price demo.

**Flow**:
1. **Setup** (15 sec): "I'm Lisa, CEO. We're raising Pro plan from $99 to $129 (30% increase)."
2. **Create request** (45 sec): Show Console → New Plan Price Change → select Pro → enter $129 → Preview Impact
3. **Cohort preview** (45 sec): "240 customers affected. 60 grandfathered for 3 months. Expected: 180 accept, 50 churn, 10 downgrade. Net ARR: +$86K."
4. **Approval** (30 sec): "30% increase requires CEO approval. I approve my own request (in real use, board would approve)."
5. **Outcome tracking** (45 sec): "System tracks actual churn vs. expected 20.8%. After 6 months, we see actual was 12% — we beat expectations."

**Done when**: Script is polished, shows cohort analysis power.

---

### CAL-058: Demo script — "The Story" (2 min opener)

**File**: `agents/demos/opening-narrative.md`

Hook for the demo. Sets up the pain.

**Narrative**:
"Last quarter, NovaCRM's finance team discovered $340K in unapproved discounts. Sales reps were giving 25-40% discounts to close deals, but finance had no visibility until month-end. Margins tanked. The CFO was furious.

They tried Slack approvals, but messages got lost. They tried spreadsheets, but reps ignored them. They needed a system that:
1. Made it easy for reps to request discounts
2. Automatically routed to the right approver
3. Showed the margin impact before approval
4. Tracked what actually happened vs. what was promised

That's Calibrate. Let me show you."

**Done when**: 2-minute opener that resonates with finance leaders.

---

### CAL-059: Record Loom demo (8-10 min)

**File**: Loom video (link in README)

Professional quality recording.

**Structure**:
1. **Opener** (2 min): The Story (CAL-058)
2. **Discount flow** (3 min): CAL-056 script
3. **Plan price flow** (3 min): CAL-057 script
4. **Outcome dashboard** (2 min): Show rep performance view, variance analysis

**Production notes**:
- Clean browser (no bookmarks, extensions)
- Rehearse 3x before recording
- Use Loom's editing to trim pauses
- Add captions
- Background music (subtle, professional)

**Done when**: Loom uploaded, link added to README and landing page.

---

### CAL-060: Landing page rewrite

**File**: `apps/site/app/page.tsx`

Strip all e-commerce positioning. New: discount governance + plan pricing.

**Hero**:
- Headline: "Stop Revenue Leakage. Start Governance."
- Subhead: "Calibrate helps SaaS companies control discounts, plan price changes, and revenue decisions with approval workflows and outcome tracking."
- CTA: "Watch Demo" (Loom link) + "Request Access"

**Sections**:
1. **The Problem**: $340K in unapproved discounts (NovaCRM story)
2. **How It Works**: 3 steps (Request → Approve → Track)
3. **Features**: Discount governance, plan price changes, outcome tracking, Slack integration
4. **Who It's For**: Series B-C SaaS ($5-30M ARR), finance leaders, RevOps
5. **Demo**: Embedded Loom video
6. **CTA**: Request early access form

**Done when**: Landing page is crisp, focused, conversion-optimized.

---

### CAL-061: Outreach templates (3 variants)

**File**: `agents/outreach/templates.md`

Personalized email templates for 3 personas.

**Variant 1: VP Finance**
- Subject: "How [Company] controls discount approvals"
- Pain: Unapproved discounts, margin erosion
- Hook: "We built this after discovering $340K in unapproved discounts at a Series B SaaS company"
- CTA: "10-min demo?"

**Variant 2: Head of RevOps**
- Subject: "Approval workflows for discounts + plan price changes"
- Pain: Slack approvals getting lost, no audit trail
- Hook: "Calibrate routes approvals, tracks outcomes, integrates with Slack"
- CTA: "Quick call to show you?"

**Variant 3: CRO (Chief Revenue Officer)**
- Subject: "Expected vs. realized on every revenue decision"
- Pain: Sales reps over-promise, finance cleans up mess
- Hook: "Track what reps promise vs. what actually happens"
- CTA: "15-min walkthrough?"

**Done when**: 3 templates ready, personalization placeholders marked.

---

## WEEK 10: OUTREACH + DISCOVERY CALLS

### CAL-062: Build target list — 50 companies

**File**: `agents/outreach/target-list.csv`

Research and compile list.

**Criteria**:
- Series B or C funding
- $5-30M ARR
- B2B SaaS
- 50-200 employees
- Has VP Finance or Head of RevOps on LinkedIn

**Sources**:
- Crunchbase (filter by funding, industry)
- LinkedIn Sales Navigator
- SaaS company directories

**Done when**: 50 companies identified with contact info (name, title, email, LinkedIn).

---

### CAL-063: Send 30 personalized outreach

**Task**: Founder sends emails + LinkedIn messages

**Process**:
1. Pick 30 companies from target list
2. Research each (recent funding, pain signals on LinkedIn)
3. Personalize template (mention their company, recent news)
4. Send email + LinkedIn connection request
5. Track in CRM or spreadsheet (sent date, response status)

**Goal**: 10-15% response rate → 3-5 interested replies

**Done when**: 30 outreach messages sent, tracked.

---

### CAL-064: Run 5-8 discovery calls

**Task**: Founder conducts 30-min discovery calls

**Call structure**:
1. **Pain discovery** (10 min): "How do you handle discount approvals today?"
2. **Demo** (10 min): Show Loom or live walkthrough
3. **Feedback** (5 min): "Would this solve your problem? What's missing?"
4. **Next steps** (5 min): "Want to try it with your data?"

**Goal**: Validate pain, gauge willingness to pay, identify design partner candidates.

**Done when**: 5-8 calls completed, notes documented.

---

### CAL-065: Document feedback

**File**: `agents/outreach/discovery-feedback.md`

Structured notes from all calls.

**Template per call**:
- **Company**: Name, ARR, stage
- **Contact**: Name, title
- **Pain confirmed?**: Yes/No + details
- **Objections**: What concerns did they raise?
- **Willingness to pay**: High / Medium / Low
- **Design partner candidate?**: Yes / No / Maybe
- **Next steps**: Follow-up date, action items

**Done when**: All 5-8 calls documented, patterns identified.

---

## ACCEPTANCE CRITERIA (WEEKS 9-10 COMPLETE)

- [ ] Demo tenant fully seeded (NovaCRM)
- [ ] Demo scripts written (discount, plan price, opener)
- [ ] Loom demo recorded (8-10 min, professional quality)
- [ ] Landing page rewritten (SaaS discount governance focus)
- [ ] Outreach templates created (3 variants)
- [ ] Target list built (50 companies)
- [ ] 30 personalized outreach messages sent
- [ ] 5-8 discovery calls completed
- [ ] Feedback documented

---

## DO NOT

- Do not build new features based on feedback yet (wait for design partners)
- Do not over-engineer demo (keep it realistic)
- Do not spam outreach (quality over quantity)

---

## NEXT

When all CAL-055 through CAL-065 are DONE, proceed to:  
`/agents/execution-packets/week-11-12-design-partners.md`
