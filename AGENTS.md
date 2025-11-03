# Calibrate — Multi-Agent Execution Plan

This document defines how the Calibrate project is collaboratively developed across three autonomous agents:

- 🧠 **Agent A — Cursor:** Infrastructure, Developer Experience, CI/CD, and deployment orchestration.  
- ⚙️ **Agent B — Codex:** Core Product Implementation — pricing engine, connectors, API, and Price Changes MVP.  
- 📊 **Agent C — Claude Code:** AI, analytics, forecasting, and intelligent automation for Growth + Expansion phases.  

Each agent works independently but adheres to shared contracts, schemas, and milestones.

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

### **Growth Phase (v0.3–v0.6)**
1. **AI Pricing Assist**
   - Add `packages/ai-engine` with `suggestPrice()` method.  
   - Inputs: SKU history, competitor data, sales velocity.  
   - Outputs: `{ delta, confidence, rationale }`.  
   - Integrate into `pricing-engine` as optional AI policy.  
2. **Analytics Module**
   - Create `packages/analytics` for daily snapshot aggregation.  
   - Expose `/api/v1/analytics/:projectId/overview`.  
   - Console dashboard → `/p/[slug]/analytics`.  
3. **Policy Insight Copilot**
   - `/api/v1/assistant/query` → LLM-powered SQL templates.  
   - Console chat panel for "why / what-if" queries.  

### **Expansion Phase (v0.7–v1.0)**
- Inventory-aware pricing (merge stock signals).  
- Demand forecasting (Prophet / XGBoost).  
- Merchant Intelligence Suite (margin heatmaps, elasticity).  
- AI Copilot explaining price changes.  
- CPQ extension for B2B self-serve quoting.  

### **Deliverables**
- AI engine + analytics packages deployed.  
- Analytics dashboard live with key metrics.  
- Copilot query endpoint returning accurate insights.  

### **Definition of Done**
- AI module suggests valid price deltas with explainability.  
- Analytics jobs run nightly.  
- Dashboard visualizations accurate within tolerance.  

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

| Phase | Lead Agent | Definition of Done |
|--------|-------------|--------------------|
| **MVP (v0.2)** | Codex | Price Changes workflow complete end-to-end |
| **Growth (v0.3–v0.6)** | Claude Code | AI Assist + Analytics Dashboard live |
| **Expansion (v0.7–v1.0)** | Shared | Inventory + Forecasting + Copilot complete |

---

## ✅ Summary

- **Agent A (CURSOR):** Infra / DX / CI / Deploy  
- **Agent B (CODEX):** Core Pricing MVP / Connectors / Policies  
- **Agent C (CLAUDE CODE):** AI / Analytics / Forecasting / Copilot  

All agents must re-read this file before each major merge cycle.  
Cursor ensures `develop` is always stable and deployable.