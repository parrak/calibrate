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

## 🔄 Pull Request Workflow to Master

### **Mandatory PR Requirements**

When creating a Pull Request to sync changes to `master`, **ALL PRs MUST include**:

1. **CHANGELOG.md Update**
   - Add a new entry under `[Unreleased]` section describing the changes
   - Follow the format: `### Added`, `### Changed`, `### Fixed`, `### Deprecated`, `### Removed`, or `### Security`
   - Include specific details about what was changed, which components/features were affected, and any breaking changes
   - Reference PR number if applicable (e.g., `(PR #123)`)

2. **AGENT_WORKFLOW.md Update**
   - Update the relevant agent section in `agents/AGENT_WORKFLOW.md` to reflect progress
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

# 4. Update agents/AGENT_WORKFLOW.md
# Update relevant agent section with progress

# 5. Commit documentation updates
git add CHANGELOG.md agents/AGENT_WORKFLOW.md
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
- [ ] AGENT_WORKFLOW.md updated with progress
- [ ] PR description includes all relevant context
- [ ] No breaking changes (or clearly documented if present)