# Calibrate — Multi-Agent Execution Plan

This document defines how the Calibrate project is collaboratively developed across three autonomous agents:

- 🧠 **Agent A — Cursor:** Infrastructure, Developer Experience, CI/CD, and deployment orchestration.  
- ⚙️ **Agent B — Codex:** Core Product Implementation — pricing engine, connectors, API, and Price Changes MVP.  
- 📊 **Agent C — Claude Code:** AI, analytics, forecasting, and intelligent automation for Growth + Expansion phases.  

Each agent works independently but adheres to shared contracts, schemas, and milestones.

---

## 📖 Source of Truth

**Whenever direction is unclear, READ:**

- [/agents/docs/_EXECUTION_PACKET_V2/00_EXEC_SUMMARY.md](/agents/docs/_EXECUTION_PACKET_V2/00_EXEC_SUMMARY.md)
- [/agents/docs/_EXECUTION_PACKET_V2/01_MILESTONES.md](/agents/docs/_EXECUTION_PACKET_V2/01_MILESTONES.md)
- [/agents/docs/_EXECUTION_PACKET_V2/02_TEAM_ASSIGNMENTS.md](/agents/docs/_EXECUTION_PACKET_V2/02_TEAM_ASSIGNMENTS.md)

---

## 🧭  Project Overview

**Calibrate** is an AI-ready pricing automation platform for commerce systems.  
It synchronizes price data across marketplaces (Shopify, Amazon, etc.), applies guardrail policies, and progressively evolves toward AI-driven pricing intelligence.

### Monorepo Structure
```
calibrate/
├── packages/
│   ├── db/
│   ├── pricing-engine/
│   ├── connectors/
│   ├── security/
│   ├── ui/
│   └── analytics/           # (added by Claude Code)
└── apps/
    ├── api/
    ├── console/
    ├── site/
    └── docs/
```

---

## 🧩 Agent A — Cursor (Infrastructure & Developer Experience)

### **Mission**
Deliver and maintain the foundational developer environment, CI/CD, and deployment infrastructure enabling seamless collaboration for Agents B and C.

### **Primary Objectives**
1. **Workspace Integrity**
   - Maintain `pnpm` + Turborepo pipelines.
   - Synchronize `tsconfig`, TypeScript references, and shared types.
   - Enforce lint + format via ESLint & Prettier.
2. **Database & Environment**
   - Manage Prisma migrations + seeds.
   - Keep `.env` files consistent; add validation script.
   - Create a migration CI step (`pnpm migrate:check`).
3. **Deployment**
   - Deploy API on Fly.io or Railway.
   - Deploy Site & Console on Vercel (preview builds per PR).
   - Centralize secrets: `DATABASE_URL`, `WEBHOOK_SECRET`, `NEXT_PUBLIC_API_BASE`.
4. **DX & Observability**
   - Create `pnpm dev:all` to run API + Console + Site concurrently.
   - Add request logging (`@calibr/monitor`) and error tracing.
   - Generate OpenAPI or ts-rest types → `@calibr/types` for frontend.

### **Deliverables**
- 1-step bootstrap (`pnpm setup`)  
- Working preview deployments  
- Shared generated API types  
- CI pipeline validating migrations + tests  

### **Definition of Done**
- Dev environment reproducible < 5 min  
- All build targets compile cleanly  
- Preview deploys auto-build per PR  

---

## ⚙️ Agent B — Codex (Core Product)

### **Mission**
Implement the full **Price Changes MVP** and core pricing workflow APIs while maintaining production-grade reliability and testing.

### **MVP Phase (v0.2)**
1. **API Endpoints**
   - `GET /api/v1/price-changes` (list + filters + pagination)  
   - `POST /api/v1/price-changes/:id/(approve|apply|reject|rollback)`  
2. **Console Page**
   - `/p/[slug]/price-changes`  
   - Table view + filters + search + cursor pagination  
   - Detail drawer with price diff + policy checks + context  
   - Action buttons (Approve, Apply, Reject, Rollback) with optimistic updates  
3. **RBAC**
   - VIEWER → read-only  
   - EDITOR → approve/reject  
   - ADMIN → apply/rollback  
4. **Testing**
   - Supertest integration + React Testing Library UI tests.  

### **Post-MVP Growth (v0.3–v0.5)**
- Shopify connector write-back (REST Admin API).  
- Policy Templates (max Δ%, floor/ceiling, daily limit).  
- Notifications (Slack + email) on large deltas.  
- Connector retries + idempotent event queue.  

### **Deliverables**
- End-to-end Price Changes flow functional.  
- Comprehensive API docs (`/apps/docs`).  
- CI green on integration + UI tests.  

### **Definition of Done**
- All actions return correct HTTP codes.  
- Console reflects live state updates.  
- Data consistent across tenants + connectors.  

---

## 📊 Agent C — Claude Code (AI & Analytics)

### **Mission**
Build Calibrate's intelligence layer — AI pricing suggestions, analytics dashboards, forecasting, and merchant insights.

### **Status:** ✅ **Growth Phase (v0.3–v0.6) COMPLETE** — January 2, 2025

### **Growth Phase (v0.3–v0.6)** ✅ COMPLETE
1. ✅ **AI Pricing Assist** — COMPLETE
   - ✅ Created `packages/ai-engine` with `suggestPrice()` method
   - ✅ Inputs: SKU history, competitor data, sales velocity, cost data
   - ✅ Outputs: `{ delta, confidence, rationale, reasoning }`
   - ✅ Integrated into `pricing-engine` with 19 passing tests
   - ✅ Console UI: `AIPriceSuggest` component with confidence scoring
   - ✅ Ready for production with configurable weights and constraints

2. ✅ **Analytics Module** — COMPLETE
   - ✅ Created `packages/analytics` for daily snapshot aggregation
   - ✅ API: `GET /api/v1/analytics/:projectId/overview` with trends
   - ✅ API: `POST /api/v1/analytics/aggregate` for cron jobs
   - ✅ Console dashboard → `/p/[slug]/analytics` with full UI
   - ✅ Vercel cron configured (daily at midnight)
   - ✅ Script: `pnpm aggregate:analytics` for manual runs
   - ✅ Metrics: SKUs, price changes, margins, trends, top performers

3. ✅ **Policy Insight Copilot** — COMPLETE
   - ✅ `/api/v1/assistant/query` with GPT-4 integration
   - ✅ LLM-powered NL-to-SQL generation (OpenAI SDK)
   - ✅ Pattern-matching fallback when API key unavailable
   - ✅ Security: SQL injection protection, project-scoped queries
   - ✅ Queries: price explanations, what-if simulations, margin analysis
   - ✅ Response format: answer, data, SQL, suggestions

### **Expansion Phase (v0.7–v1.0)** — READY TO START
- Inventory-aware pricing (merge stock signals)
- Demand forecasting (Prophet / XGBoost)
- Merchant Intelligence Suite (margin heatmaps, elasticity)
- AI Copilot explaining price changes
- CPQ extension for B2B self-serve quoting

### **Deliverables** ✅ ALL COMPLETE
- ✅ AI engine + analytics packages deployed (26 passing tests)
- ✅ Analytics dashboard live with key metrics
- ✅ Copilot query endpoint returning accurate insights
- ✅ Console UI integration complete
- ✅ Cron jobs scheduled for daily aggregation

### **Definition of Done** ✅ ALL CRITERIA MET
- ✅ AI module suggests valid price deltas with explainability
- ✅ Analytics jobs run nightly (Vercel cron configured)
- ✅ Dashboard visualizations accurate within tolerance

### **Commits (January 2, 2025)**
- `48b45e2` - AI Pricing Engine (19 tests)
- `bf2f7fb` - Analytics Module (7 tests)
- `d77ff61` - Policy Insight Copilot
- `f9d1aa7` - Console UI Integration + Cron Jobs + GPT-4 Integration

### **Documentation**
See: [AGENT_C_AI_ANALYTICS_COMPLETE.md](docs/project-management/AGENT_C_AI_ANALYTICS_COMPLETE.md)  

---

## 🤝 Coordination & Interfaces

| Responsibility | Agent | Notes |
|----------------|--------|-------|
| Infra / CI / Deploy | Cursor | Maintains build pipelines + environments |
| Core Product & Connectors | Codex | Implements APIs + console |
| AI & Analytics | Claude Code | Consumes stable APIs |

### **Shared Contracts**
- `PriceChangeDTO` type (common schema)  
- `Event`, `Project`, and `Membership` tables  
- Common ENV structure (`DATABASE_URL`, `WEBHOOK_SECRET`, `NEXT_PUBLIC_API_BASE`)  

### **Handoff Rules**
1. Cursor → provides infra + API type generation.  
2. Codex → finalizes API and console flows (MVP).  
3. Claude Code → extends analytics & AI features built on Codex APIs.  
4. Cursor → adds jobs + cron infra for Claude's analytics.  

All agents commit to `develop`; Cursor manages preview deployments.

---

## 📅 Milestones & Accountability

| Phase | Lead Agent | Definition of Done | Status |
|--------|-------------|--------------------|--------------------|
| **MVP (v0.2)** | Codex | Price Changes workflow complete end-to-end | 🔄 In Progress |
| **Growth (v0.3–v0.6)** | Claude Code | AI Assist + Analytics Dashboard live | ✅ **COMPLETE** (Jan 2, 2025) |
| **Expansion (v0.7–v1.0)** | Shared | Inventory + Forecasting + Copilot complete | ⏳ Ready to Start |

---

## ✅ Summary

- **Agent A (CURSOR):** Infra / DX / CI / Deploy  
- **Agent B (CODEX):** Core Pricing MVP / Connectors / Policies  
- **Agent C (CLAUDE CODE):** AI / Analytics / Forecasting / Copilot  

All agents must re-read this file before each major merge cycle.  
Cursor ensures `develop` is always stable and deployable.

---

## 📌 Execution Packet Update Policy (All Agents)

When any milestone or major deliverable is completed, **all agents must**:
- Update `agents/docs/_EXECUTION_PACKET_V2/00_EXEC_SUMMARY.md` with the date + PR reference.
- Update `agents/docs/_EXECUTION_PACKET_V2/01_MILESTONES.md` to mark status and completion date.

---

## 🔄 Pull Request Workflow to Master

### **Mandatory PR Requirements**

When creating a Pull Request to sync changes to `master`, **ALL PRs MUST include**:

1. **CHANGELOG.md Update**
   - Add a new entry under `[Unreleased]` section describing the changes
   - Follow the format: `### Added`, `### Changed`, `### Fixed`, `### Deprecated`, `### Removed`, or `### Security`
   - Include specific details about what was changed, which components/features were affected, and any breaking changes
   - Reference PR number if applicable (e.g., `(PR #123)`)

2. **Execution Packet Update**
   - Update the relevant sections in `/agents/docs/_EXECUTION_PACKET_V2/` files to reflect progress
   - See `/agents/docs/_EXECUTION_PACKET_V2/00_EXEC_SUMMARY.md` for guidance
   - Mark completed deliverables with ✅ and date
   - Update status indicators (🔄 In Progress, ✅ Complete, ⏳ Ready to Start)
   - Add commit references with PR numbers
   - Update milestone status table if applicable

3. **PR Description**
   - Clear title describing the change
   - Link to related issues/tasks
   - Summary of changes
   - Testing performed
   - Any migration or deployment notes

### **PR Creation Steps**

```bash
# 1. Ensure you're on a feature branch (not master)
git checkout -b feature/your-feature-name

# 2. Make your changes and commit
git add .
git commit -m "feat: your feature description"

# 3. Update CHANGELOG.md
# Add entry under [Unreleased] section

# 4. Update execution packet files in agents/docs/_EXECUTION_PACKET_V2/
# Update relevant agent section with progress

# 5. Commit documentation updates
git add CHANGELOG.md agents/docs/_EXECUTION_PACKET_V2/
git commit -m "docs: update changelog and agent workflow"

# 6. Push and create PR
git push origin feature/your-feature-name
# Create PR via GitHub UI or CLI targeting master branch
```

### **PR Review Checklist**

Before requesting review, ensure:
- [ ] All tests pass (`pnpm test`)
- [ ] Linting passes (`pnpm lint`)
- [ ] Build succeeds (`pnpm build`)
- [ ] CHANGELOG.md updated with clear description
- [ ] Execution packet files updated with progress
- [ ] PR description includes all relevant context
- [ ] No breaking changes (or clearly documented if present)

---

## 🚀 Deployment Verification Checklist

When deploying to Railway/Vercel, do not consider the task complete until:
- [ ] Railway/Vercel deployment status is **SUCCESS** for all target services (not BUILDING/FAILED)
- [ ] If FAILED, fetch build + runtime logs and document the failure + fix plan
- [ ] Verify required env vars are set on new services (e.g., `DATABASE_URL`, connector secrets)
- [ ] Check runtime logs for startup errors and database connectivity
- [ ] Run smoke checks (at minimum `/api/health` on API and Console landing load; worker `/health` if public)
- [ ] If still BUILDING, explicitly call out pending status and follow-up check time

---

## 📚 Agent Learnings & Best Practices

This section captures critical lessons learned during development to prevent future issues.

### **Branding Guardrails — November 29, 2025**
- When creating or updating public-facing assets (site, console, docs, manifests, favicons, OG images), follow the live teal palette (`#80D9D9`, `#00A3A3`, `#008080`) and typography defined in `apps/*/app/globals.css`.
- Reference `branding/BRANDING_UPDATE_SUMMARY.md` and the sample metadata in `branding/usage/next/metadata.ts` for correct `themeColor`, icon paths, and gradient stops before adding new assets.
- Keep `themeColor` in metadata to `#008080` (aligns with `--brand-dark`) unless branding leadership provides a new packet.

### **Bug Fix Session - November 10, 2025**

**Context:** Comprehensive manual testing of console.calibr.lat revealed 4 critical production bugs that were fixed systematically.

#### **1. AI SQL Generation Security**
**Lesson:** Always replace AI-generated filter values, don't just check for presence.

**Problem:**
- AI (GPT-4) generated SQL like `SELECT COUNT(*) FROM "Product" WHERE "projectId" = 'demo'`
- Used project **slug** ('demo') instead of **CUID** ('proj-cuid-123')
- Security injection code only checked if 'projectId' was present, not if value was correct
- Result: Queries returned 0 results instead of actual product count

**Fix Applied:**
```typescript
// BEFORE (Bug):
if (!sql.includes('projectId')) {
  secureSQL = sql.replace(/WHERE/i, `WHERE "projectId" = '${projectId}' AND`)
}

// AFTER (Fixed):
// Pattern 1: Replace "projectId" = 'any-value' with actual CUID
secureSQL = secureSQL.replace(/"projectId"\s*=\s*['"][^'"]+['"]/gi, `"projectId" = '${projectId}'`)
// Pattern 2: Also handle unquoted column names
secureSQL = secureSQL.replace(/\bprojectId\b\s*=\s*['"][^'"]+['"]/gi, `"projectId" = '${projectId}'`)
```

**Best Practice:**
- Never trust AI-generated filter values
- Use regex replacement to fix incorrect values, not just injection when missing
- Apply belt-and-suspenders: replace + inject if missing
- Test with real project IDs vs slugs

**File:** `apps/api/app/api/v1/copilot/route.ts:394-416`

---

#### **2. Database Schema vs Migrations**
**Lesson:** Schema files don't create tables - migrations do.

**Problem:**
- `Audit` table defined in `schema.prisma` but no migration file existed
- When approving price changes, code tried to create audit records
- Failed with: `The table 'public.Audit' does not exist in the current database`
- Production 500 errors on critical price change approval flow

**Fix Applied:**
- Created missing migration: `20251210000000_add_audit_table/migration.sql`
- Used `IF NOT EXISTS` for idempotency
- Added proper indexes and foreign key constraints

**Best Practice:**
- **Always** run `prisma migrate dev` after schema changes
- Never commit schema.prisma changes without corresponding migration
- Verify migration files exist before deploying
- Consider pre-commit hook to check for missing migrations
- Use `IF NOT EXISTS` in migrations for safety

**File:** `packages/db/prisma/migrations/20251210000000_add_audit_table/migration.sql`

---

#### **3. Case Sensitivity in String Comparisons**
**Lesson:** Never assume database field casing - always normalize.

**Problem:**
- Shopify integration stores `syncStatus` as lowercase 'success'
- Sync status endpoint checked: `if (integration.syncStatus === 'SUCCESS')`
- Condition never matched, so sync logs never displayed
- Users saw "No sync history yet" despite successful syncs

**Fix Applied:**
```typescript
// BEFORE (Bug):
} else if (integration.syncStatus === 'SUCCESS') {

// AFTER (Fixed):
} else if (integration.syncStatus?.toUpperCase() === 'SUCCESS') {
```

**Best Practice:**
- Use case-insensitive comparisons for status/enum-like strings
- Normalize values when storing (use middleware or DB constraints)
- Consider using actual database ENUMs for status fields
- Test with lowercase, uppercase, and mixed case variations

**File:** `apps/api/app/api/platforms/shopify/sync/status/route.ts:113,121-126`

---

#### **4. Client-Side Data Fetching in Next.js**
**Lesson:** Client Components need explicit data fetching - they don't auto-load.

**Problem:**
- Price rules page (`'use client'` component) never fetched data from API
- Component initialized with empty array, no useEffect
- Users always saw "No pricing rules yet" despite existing rules
- Backend API was working correctly - frontend just never called it

**Fix Applied:**
```typescript
// Added useEffect to fetch on mount:
useEffect(() => {
  const fetchRules = async () => {
    const response = await fetch(`${API_BASE}/api/v1/rules?project=${params.slug}`)
    const data = await response.json()
    setRules(transformAPIResponse(data.items))
  }
  fetchRules()
}, [params.slug])
```

**Best Practice:**
- Client Components require explicit `useEffect` for data fetching
- Server Components auto-fetch (prefer when possible for better UX)
- Handle loading states properly
- Consider React Query or SWR for caching/revalidation
- Verify API endpoints are actually being called (check Network tab)

**File:** `apps/console/app/p/[slug]/rules/page.tsx:110-158`

---

#### **5. Integration Test Complexity**
**Lesson:** Perfect mocks are hard - focus on unit tests and real integration tests.

**Problem:**
- Regression tests created with complex mocks for entire API routes
- Authentication, session handling, and database mocking became fragile
- Tests failed due to mock complexity, not actual bugs
- Time spent on mocking > time spent on actual fixes

**Better Approach:**
- Unit test individual functions with minimal mocking
- Use real database for integration tests (test containers, separate test DB)
- Or skip complex mocks and rely on manual testing + E2E tests (Playwright/Cypress)
- Mock external services (OpenAI, Shopify) but keep internal mocking minimal

**Recommendation:**
- Add E2E test suite with real browser automation
- Use test database containers for integration tests
- Reserve mocks for external API calls only

---

### **Testing Recommendations for All Agents**

1. **Always Test Edge Cases:**
   - Empty states (0 products, no rules)
   - Case variations (lowercase, uppercase, mixed)
   - Missing data (null, undefined)
   - Wrong data types (slug instead of ID)

2. **Verify Database State:**
   - Don't assume tables exist - check migrations
   - Don't assume data format - normalize inputs
   - Don't assume field casing - use case-insensitive comparisons

3. **AI Integration:**
   - Never trust AI-generated values without validation
   - Always sanitize and replace with actual data
   - Test with real IDs vs human-readable slugs
   - Log generated SQL for debugging

4. **Next.js Client vs Server:**
   - Know when component needs explicit data fetching
   - Prefer Server Components when possible
   - Test that API endpoints are actually called
   - Handle loading and error states

5. **Manual Testing:**
   - Test full user flows end-to-end
   - Check console for errors
   - Verify network requests in DevTools
   - Test navigation between pages
   - Test with real data, not just fixtures

---

**Document Updated:** November 10, 2025
**Session:** Bug Fix & Regression Testing
**Files Changed:** 4 code files, 1 migration, 1 test file, 2 documentation files
**Impact:** Fixed 4 critical production bugs affecting AI queries, price approvals, sync history, and pricing rules

---

#### **6. E2E Testing with External Services**
**Lesson:** Mocking entire packages is fragile; spying on service prototypes is robust.

**Problem:**
- E2E tests for Stripe Integration failed because mocking the `stripe` NPM package was inconsistent across the monorepo.
- Mocking the `StripeService` class via `vi.mock` was bypassed by internal relative imports within the package.
- Tests were either hitting real Stripe API (auth errors) or failing to instantiate.

**Better Approach:**
- Use `vi.spyOn(Service.prototype, 'method')` to mock specific methods of the real class.
- This allows the consumer code (e.g., `StripeSync`) to use the *real* class structure but intercepts the heavy lifting (network calls).
- Ensure constructor arguments are handled safely (e.g., fallback env vars) so the class instantiates without throwing.

**Example:**
```typescript
// In test setup:
vi.spyOn(StripeService.prototype, 'listProducts').mockResolvedValue({ data: [...] })
process.env.STRIPE_CLIENT_SECRET = 'dummy_key' // Prevent constructor error
```

**Best Practice:**
- Prefer prototype spying for class-based service mocks in E2E tests.
- Always provide fallback environment variables for required constructor args in tests.
- Verify that the *logic* (mapping, database writes) works, not just that the mock was called.

**File:** `apps/api/tests/integrations/stripe.e2e.test.ts`

---

#### **7. Secret Management & Push Protection**
**Lesson:** Never commit secrets, even in example files.

**Problem:**
- A real-looking test key was accidentally added to `.env.example`.
- GitHub Push Protection blocked the push (correctly).
- Required amending the commit to remove the secret.

**Best Practice:**
- Use obvious placeholders in `.env.example` (e.g., `sk_test_placeholder`).
- Never paste real keys into files that are tracked by git, even temporarily.
- If a push is blocked, **do not** bypass it unless it's a false positive. Remove the secret and amend the commit.
