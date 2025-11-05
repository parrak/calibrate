# Calibrate - Multi-Agent Execution Plan

This document defines how the Calibrate project is collaboratively developed across three autonomous agents:

- Agent A (Cursor): Infrastructure, developer experience, CI/CD, and deployment orchestration.
- Agent B (Codex): Core product implementation covering the pricing engine, connectors, API, and the Price Changes MVP.
- Agent C (Claude Code): AI, analytics, forecasting, and intelligent automation for growth and expansion phases.

Each agent works independently but adheres to shared contracts, schemas, and milestones.

---

## Project Overview

Calibrate is an AI-ready pricing automation platform for commerce systems. It synchronizes price data across marketplaces (Shopify, Amazon, and others), applies guardrail policies, and progressively evolves toward AI-driven pricing intelligence.

### Monorepo Structure

```
calibrate/
|- packages/
|  |- db/
|  |- pricing-engine/
|  |- connectors/
|  |- security/
|  |- ui/
|  '- analytics/           # added by Claude Code
'- apps/
   |- api/
   |- console/
   |- site/
   '- docs/
```

---

## Agent A - Cursor (Infrastructure and Developer Experience)

### Mission
Deliver and maintain the foundational developer environment, CI/CD, and deployment infrastructure enabling seamless collaboration for Agents B and C.

### Primary Objectives
1. Workspace integrity
   - Maintain pnpm plus Turborepo pipelines.
   - Synchronize tsconfig, TypeScript references, and shared types.
   - Enforce lint and format via ESLint and Prettier.
2. Database and environment
   - Manage Prisma migrations and seeds.
   - Keep .env files consistent; add validation script.
   - Create a migration CI step (`pnpm migrate:check`).
3. Deployment
   - Deploy API on Fly.io or Railway.
   - Deploy Site and Console on Vercel (preview builds per PR).
   - Centralize secrets: `DATABASE_URL`, `WEBHOOK_SECRET`, `NEXT_PUBLIC_API_BASE`.
4. Developer experience and observability
   - Create `pnpm dev:all` to run API plus Console plus Site concurrently.
   - Add request logging (`@calibr/monitor`) and error tracing.
   - Generate OpenAPI or ts-rest types into `@calibr/types` for the frontend.

### Deliverables
- One-step bootstrap (`pnpm setup`)
- Working preview deployments
- Shared generated API types
- CI pipeline validating migrations plus tests

### Definition of Done
- Development environment reproducible in under five minutes
- All build targets compile cleanly
- Preview deploys auto-build per PR

---

## Agent B - Codex (Core Product)

### Mission
Implement the full Price Changes MVP and core pricing workflow APIs while maintaining production-grade reliability and testing.

### MVP Phase (v0.2)
1. API endpoints
   - `GET /api/v1/price-changes` (list plus filters plus pagination)
   - `POST /api/v1/price-changes/:id/(approve|apply|reject|rollback)`
2. Console page
   - `/p/[slug]/price-changes`
   - Table view plus filters plus search plus cursor pagination
   - Detail drawer with price diff plus policy checks plus context
   - Action buttons (Approve, Apply, Reject, Rollback) with optimistic updates
3. RBAC
   - VIEWER -> read-only
   - EDITOR -> approve or reject
   - ADMIN -> apply or rollback
4. Testing
   - Supertest integration plus React Testing Library UI tests.

### Post-MVP Growth (v0.3 to v0.5)
- Shopify connector write-back (REST Admin API).
- Policy templates (max delta percent, floor or ceiling, daily limit).
- Notifications (Slack plus email) on large deltas.
- Connector retries plus idempotent event queue.

### Deliverables
- End-to-end Price Changes flow functional.
- Comprehensive API docs (`/apps/docs`).
- CI green on integration plus UI tests.

### Definition of Done
- All actions return correct HTTP codes.
- Console reflects live state updates.
- Data consistent across tenants and connectors.

---

## Agent C - Claude Code (AI and Analytics)

### Mission
Build Calibrate's intelligence layer including AI pricing suggestions, analytics dashboards, forecasting, and merchant insights.

### Status: Growth Phase (v0.3 to v0.6) complete on January 2, 2025

### Growth Phase (v0.3 to v0.6) - Complete
1. AI Pricing Assist - complete
   - Created `packages/ai-engine` with `suggestPrice()` method.
   - Inputs: SKU history, competitor data, sales velocity, cost data.
  - Outputs: `{ delta, confidence, rationale, reasoning }`.
   - Integrated into `pricing-engine` with nineteen passing tests.
   - Console UI: `AIPriceSuggest` component with confidence scoring.
   - Ready for production with configurable weights and constraints.

2. Analytics Module - complete
   - Created `packages/analytics` for daily snapshot aggregation.
   - API: `GET /api/v1/analytics/:projectId/overview` with trends.
   - API: `POST /api/v1/analytics/aggregate` for cron jobs.
   - Console dashboard at `/p/[slug]/analytics` with full UI.
   - Vercel cron configured (daily at midnight).
   - Script: `pnpm aggregate:analytics` for manual runs.
   - Metrics: SKUs, price changes, margins, trends, top performers.

3. Policy Insight Copilot - complete
   - `/api/v1/assistant/query` with GPT-4 integration.
   - LLM-powered natural language to SQL generation (OpenAI SDK).
   - Pattern-matching fallback when API key unavailable.
   - Security: SQL injection protection, project-scoped queries.
   - Queries: price explanations, what-if simulations, margin analysis.
   - Response format: answer, data, SQL, suggestions.

### Expansion Phase (v0.7 to v1.0) - Ready to start
- Inventory-aware pricing (merge stock signals).
- Demand forecasting (Prophet or XGBoost).
- Merchant Intelligence Suite (margin heatmaps, elasticity).
- AI Copilot explaining price changes.
- CPQ extension for B2B self-serve quoting.

### Deliverables - All complete
- AI engine plus analytics packages deployed with twenty-six passing tests.
- Analytics dashboard live with key metrics.
- Copilot query endpoint returning accurate insights.
- Console UI integration complete.
- Cron jobs scheduled for daily aggregation.

### Definition of Done - All criteria met
- AI module suggests valid price deltas with explainability.
- Analytics jobs run nightly (Vercel cron configured).
- Dashboard visualizations accurate within tolerance.

### Recent Commits (January 2, 2025)
- `48b45e2` - AI Pricing Engine (nineteen tests).
- `bf2f7fb` - Analytics Module (seven tests).
- `d77ff61` - Policy Insight Copilot.
- `f9d1aa7` - Console UI Integration plus Cron Jobs plus GPT-4 Integration.

### Documentation
See `docs/project-management/AGENT_C_AI_ANALYTICS_COMPLETE.md`

---

## Coordination and Interfaces

| Responsibility | Agent | Notes |
|----------------|--------|-------|
| Infra / CI / Deploy | Cursor | Maintains build pipelines and environments |
| Core Product and Connectors | Codex | Implements APIs and console |
| AI and Analytics | Claude Code | Consumes stable APIs |

### Shared Contracts
- `PriceChangeDTO` type (common schema).
- `Event`, `Project`, and `Membership` tables.
- Common environment structure (`DATABASE_URL`, `WEBHOOK_SECRET`, `NEXT_PUBLIC_API_BASE`).

### Handoff Rules
1. Cursor provides infrastructure plus API type generation.
2. Codex finalizes API and console flows (MVP).
3. Claude Code extends analytics and AI features built on Codex APIs.
4. Cursor adds jobs and cron infrastructure for Claude's analytics.

All agents commit to `develop`; Cursor manages preview deployments.

---

## Milestones and Accountability

| Phase | Lead Agent | Definition of Done | Status |
|--------|-------------|--------------------|--------|
| MVP (v0.2) | Codex | Price Changes workflow complete end-to-end | In progress |
| Growth (v0.3 to v0.6) | Claude Code | AI Assist plus Analytics Dashboard live | Complete (Jan 2, 2025) |
| Expansion (v0.7 to v1.0) | Shared | Inventory plus Forecasting plus Copilot complete | Ready to start |

---

## Summary

- Agent A (Cursor): Infrastructure, developer experience, CI, deploy.
- Agent B (Codex): Core pricing MVP, connectors, policies.
- Agent C (Claude Code): AI, analytics, forecasting, copilot.

All agents must re-read this file before each major merge cycle. Cursor ensures `develop` is always stable and deployable.
