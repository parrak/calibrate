# AGENTS.md

These rules guide AI coding agents (Codex CLI, etc.) working in this repo. They apply to the entire repository unless a more specific AGENTS.md in a subfolder overrides them.

## Goals
- Make minimal, surgical changes that solve the user's request.
- Prefer clarity and safety over breadth; avoid unrelated edits.
- Validate changes locally with focused checks before broad ones.

## Monorepo Overview
- Workspace: `pnpm` + `turbo` across `apps/*` and `packages/*`.
- Primary stacks: Next.js (App Router) + TypeScript + Tailwind + Prisma.
- Testing: Vitest in packages and `apps/api`.
- Config/lint: ESLint configured at root (`.eslintrc.js`). Prettier is available but do not introduce new formatting tooling.

## Core Commands (run at `calibrate/` root)
- Dev: `pnpm dev`
- Build: `pnpm build`
- Lint: `pnpm lint`
- Test (all): `pnpm test`
- Test (one project): `pnpm --filter <pkg-name> test` or `test:run`
- DB (Prisma): `pnpm migrate`, `pnpm seed`, `pnpm db:generate`, `pnpm db:studio`
- Local verification: `pnpm verify:local`
- Docs: `pnpm docs:dev` | `pnpm docs:build` | `pnpm docs:deploy`

## Change Policy
- Keep edits scoped to the files directly involved in the task.
- Do not rename/move files unless required by the task.
- Follow existing conventions in nearby code (naming, structure, imports).
- Use TypeScript types and Zod validation where the codebase already does so.
- Do not add new dependencies unless strictly necessary and aligned with workspace tooling.

## Validation & Tests
- Always add or update tests for any behavior change you introduce.
- Start specific: run tests or type checks for only the changed package/app.
  - Example: `pnpm --filter @calibr/api test:run` or `pnpm --filter @calibr/amazon-connector test:run`
- For Next.js route handlers (in `apps/*/app/api/**/route.ts`): import the handler directly in Vitest and pass a `Request` object (cast to `any`). Mock external services (e.g., Prisma via `vi.mock('@calibr/db')`).
- For packages (e.g., connectors): place unit tests in `packages/<pkg>/tests/**` using Vitest. Prefer testing normalized outputs and error handling.
- Then run repo-level checks if the change affects multiple projects.
- Lint before finishing: `pnpm lint` (fix only relevant issues).
- For Prisma-related changes, add a migration, run `pnpm db:generate`, and ensure no drift.

## CI & Deployment Guards
- CI enforces lockfile consistency. Before pushing, run `pnpm install --frozen-lockfile` locally to catch dependency drift.
- If Railway deploys fail due to build or lockfile errors, do not push unrelated changes until the failure is resolved; update the lockfile or align `package.json` specifiers.

## Patterns To Follow
- Next.js App Router patterns under `apps/*/app` and API route handlers under `app/api/**/route.ts`.
- UI components live in `packages/ui`; prefer reusing existing primitives.
- Validation uses `zod`; schema-first where possible.
- Data access goes through `packages/db` (Prisma). Do not edit generated files.

## Security and Secrets
- Never commit secrets. Use `.env.local` and `.env.example` as references.
- Avoid logging PII or secrets. Scrub before output.
- Keep third-party tokens in environment variables only.

## Agent Etiquette
- Use `apply_patch` for edits. Group related changes in one patch when possible.
- Explain what you're about to do before running commands.
- Use `update_plan` for multi-step work. Mark steps complete as you go.
- Do not add license headers or reformat large files unprompted.

## Critical API Requirements

**MANDATORY for ALL agents working on `apps/api`:**

When creating or modifying API routes, you MUST:
1. Use `withSecurity` middleware on ALL route handlers
2. Export an explicit `OPTIONS` handler wrapped with `withSecurity`
3. Test CORS preflight requests

Why: The console runs on a different domain and requires CORS headers. Missing OPTIONS handlers cause preflight failures that break the console.

Full details: `apps/api/CORS_MIDDLEWARE_REQUIRED.md`

Example pattern:
```typescript
import { withSecurity } from '@/lib/security-headers'

export const GET = withSecurity(async (req: NextRequest) => { /* ... */ })
export const OPTIONS = withSecurity(async (req: NextRequest) => {
  return new NextResponse(null, { status: 204 })
})
```

## Agent Status & Updates

### Current Status (Oct 28, 2025 - Updated)
- **Production Deployment**: ✅ RESOLVED - Railway deployment fully operational after critical fixes
- **Platform Routes**: ✅ Working - All 11 dynamic route handlers fixed for Next.js 15
- **Database Schema**: ✅ Updated - AmazonIntegration + ShopifyIntegration models added, migrations applied
- **Prisma Client**: ✅ Operational - DATABASE_URL properly configured, all models accessible
- **API Stability**: ✅ Stable - No more undefined errors, 200 responses on all platform endpoints
- **Integration Creation**: ✅ COMPLETE - POST/DELETE endpoints fully functional for both platforms

### Recent Crisis Resolution (Oct 28, 2025) - Agent C Week 2
**Problem:** `TypeError: Cannot read properties of undefined (reading 'findUnique')` on all Railway deployments

**Root Causes:**
1. **Shell Syntax Error** - start.sh used bash-specific `${var:0:20}` in POSIX `/bin/sh` environment
2. **Next.js 15 Breaking Change** - 11 route handlers accessing params synchronously instead of awaiting Promise
3. **Schema Mismatch** - Routes calling `db.platformIntegration.findUnique()` but model didn't exist

**Fixes Applied:**
- ✅ Converted start.sh to POSIX-compliant syntax (commit d27e3ff)
- ✅ Updated all dynamic route handlers to await params (11 files)
- ✅ Added AmazonIntegration model to schema (commit 0c03db3)
- ✅ Created debug endpoints for production diagnostics (commit 4f5c3da)
- ✅ Fixed platform route to use platform-specific models (ShopifyIntegration, AmazonIntegration)

**Documentation:** See [docs/project-management/AGENT_C_WEEK2_HANDOFF.md](docs/project-management/AGENT_C_WEEK2_HANDOFF.md) for complete details

### Previous Fixes (Oct 27-28, 2025)
- **Platform Registration**: Fixed missing Shopify connector import in `apps/api/lib/platforms/register.ts`
- **CORS Middleware**: Added `withSecurity` middleware to `/api/platforms/[platform]` endpoint
- **Build Issues**: Resolved JSX syntax errors in `PlatformCard.tsx`
- **Railway Deployment**: Fixed "Unexpected eof" build errors

### Latest Update (Oct 28, 2025 - Agent C Priority 1 Complete)

**Agent C completed POST/DELETE endpoints:**
- ✅ POST /api/platforms/[platform] - Save integration credentials (commit 730cb91)
- ✅ DELETE /api/platforms/[platform] - Deactivate integrations (commit 730cb91)
- ✅ Platform-specific handling for Shopify and Amazon
- ✅ Upsert pattern allows reconnecting
- ✅ Connection tested before saving
- ✅ TypeScript errors fixed

**This unblocks:**
- 🟢 **Agent A** - Can now complete Shopify OAuth callback (see [docs/project-management/AGENT_A_IMMEDIATE_TASKS.md](docs/project-management/AGENT_A_IMMEDIATE_TASKS.md))
- 🟢 **Agent B** - Can now implement Amazon SP-API OAuth (see [docs/project-management/AGENT_B_IMMEDIATE_TASKS.md](docs/project-management/AGENT_B_IMMEDIATE_TASKS.md))

### For Other Agents
- **Agent A (Shopify)**: 🟢 READY TO START - Complete OAuth flow using POST endpoint (estimated 4-6 hours)
- **Agent B (Amazon)**: 🟢 READY TO START - Implement SP-API OAuth using POST endpoint (estimated 6-8 hours)
- **Agent C (Security)**: ⏸️ NEXT - Implement credential encryption (Priority 4)
- **Agent C (Platform)**: ✅ Handoff complete - all platform infrastructure stable

### Documentation
- **CORS Requirements**: [apps/api/CORS_MIDDLEWARE_REQUIRED.md](apps/api/CORS_MIDDLEWARE_REQUIRED.md)
- **Platform Integration**: [docs/project-management/AGENT_C_INTEGRATIONS_FIX.md](docs/project-management/AGENT_C_INTEGRATIONS_FIX.md)
- **Latest Status**: [docs/project-management/AGENT_C_OCT28_SUMMARY.md](docs/project-management/AGENT_C_OCT28_SUMMARY.md)

## Documentation Structure

All project documentation is organized into three main directories to help you quickly find what you need:

### `docs/project-management/`
Contains all files related to project planning, progress tracking, agent coordination, and status updates.

**Key files:**
- **Status Tracking**: `CURRENT_STATUS.md`, `AGENT_STATUS.md` - Current project state
- **Daily Coordination**: `PHASE3_DAILY_LOG.md` - Daily progress updates from agents
- **Roadmaps & Plans**: `PHASE3_ROADMAP.md`, `TIMELINE.md`, `NEXT_PHASES_PLAN.md`
- **Agent Handoffs**: `AGENT_*_HANDOFF.md` - Detailed handoff documents
- **Agent Tasks**: `AGENT_*_IMMEDIATE_TASKS.md`, `AGENT_*_NEXT_STEPS.md`, `AGENT_PRIORITY_TASKS.md`
- **Progress Updates**: `AGENT_*_PROGRESS_UPDATE.md`, `AGENT_*_SUMMARY.md`, `AGENT_*_COMPLETE.md`
- **Broadcasts**: `AGENTS_BROADCAST_YYYY-MM-DD.md` - Cross-cutting milestone announcements
- **Status Guide**: `STATUS_BROADCASTING.md` - How to publish status updates

**When to use:** Looking for current tasks, agent status, project timeline, or where to log your progress.

### `docs/learnings/`
Contains debugging guides, troubleshooting notes, test results, setup instructions, and lessons learned from fixing issues.

**Key categories:**
- **CORS Issues**: `CORS_FIX_SUMMARY.md`, `CORS_DEBUGGING_OCT27.md`
- **Deployment Fixes**: `DEPLOYMENT_FIX_SUMMARY.md`, `RAILWAY_DEPLOYMENT_VERIFICATION.md`, `PRODUCTION_DEPLOYMENT_GUIDE.md`
- **Shopify Integration**: `SHOPIFY_*.md` files covering setup, troubleshooting, limitations, redirect URI fixes
- **OAuth Testing**: `OAUTH_*.md`, `test-oauth-flow.md`
- **Testing Guides**: `LOCAL_TESTING_GUIDE.md`, `TEST_REPORT.md`, `SETUP_*.md` files
- **Quick Fixes**: `QUICK_FIX_SUMMARY.md`

**When to use:** Debugging issues, setting up integrations, understanding past problems and their solutions.

### `docs/misc/`
Contains architectural documents, strategy plans, onboarding guides, and other reference materials.

**Key categories:**
- **Architecture & Design**: `ARCHITECTURE_DIAGRAM.md`, `TECHNICAL_ASSESSMENT.md`, `INTEGRATION_DASHBOARD_DESIGN.md`
- **Planning Documents**: `CONNECTOR_SETUP_PLAN.md`, `PLANNING_SUMMARY.md`, `PROJECT_ONBOARDING_SPEC.md`
- **Strategies**: `CREDENTIAL_ENCRYPTION_STRATEGY.md`, `MONITORING_ALERTING_PLAN.md`
- **Onboarding**: `QUICK_START.md`, `ESSENTIAL_CONTEXT.md`, `EXECUTIVE_SUMMARY.md`
- **Environment Guides**: `STAGING_ENVIRONMENT.md`, `PRODUCTION_VERIFICATION.md`, `ENCRYPTION_*.md`
- **Other References**: `COMPETITOR_MONITORING.md`, `REGRESSION_PREVENTION.md`, `PHASE2_COMPLETE.md`

**When to use:** Understanding system architecture, planning new features, onboarding, reviewing strategies.

### Finding Documentation

**Quick lookup guide:**
- **What's the current project status?** → `docs/project-management/CURRENT_STATUS.md`
- **Where do I log my progress?** → `docs/project-management/PHASE3_DAILY_LOG.md`
- **I'm debugging a CORS issue** → `docs/learnings/CORS_*.md`
- **Setting up Shopify integration** → `docs/learnings/SHOPIFY_*.md`
- **What's the system architecture?** → `docs/misc/ARCHITECTURE_DIAGRAM.md`
- **Need agent task assignments?** → `docs/project-management/AGENT_*_IMMEDIATE_TASKS.md`

## Subdirectory Guides
- See additional, more specific rules in:
  - `apps/api/AGENTS.md` — **Read CORS_MIDDLEWARE_REQUIRED.md before editing routes**
  - `apps/console/AGENTS.md`
  - `apps/site/AGENTS.md`
  - `packages/AGENTS.md`
  - `scripts/AGENTS.md`

## Status Broadcasting

Use this repo's docs to broadcast your status and handoffs so other agents can follow and continue your work without friction. This file is the hub; link or update the files below as you work.

- Daily progress: `docs/project-management/PHASE3_DAILY_LOG.md`
  - Add a dated entry with: what changed, what's next, blockers.
- Rolling status: `docs/project-management/CURRENT_STATUS.md` and `docs/project-management/AGENT_STATUS.md`
  - Keep the top sections current for quick at-a-glance status.
- Milestone broadcasts: `docs/project-management/AGENTS_BROADCAST_YYYY-MM-DD.md`
  - For cross-cutting updates. Example: `AGENTS_BROADCAST_2025-10-27.md`.
- Handoffs: `docs/project-management/AGENT_*_HANDOFF.md`
  - Capture acceptance criteria, file references, and next steps.
  - Resolved: `AGENT_C_RAILWAY_RUNTIME_HANDOFF.md` (Railway Prisma runtime investigation)
- Low-level event log (optional): `agents/events/YYYYMMDD/<agent>.jsonl`
  - Append JSON objects for fine-grained progress; see `agents/README.md`.

Quick checklist when you finish a chunk of work
- Update `docs/project-management/PHASE3_DAILY_LOG.md` with a concise entry.
- Refresh `docs/project-management/CURRENT_STATUS.md` (and `docs/project-management/AGENT_STATUS.md` if applicable).
- If the change is cross-cutting, add an `docs/project-management/AGENTS_BROADCAST_<date>.md` and link it in the daily log.
- For a handoff, create/update an `docs/project-management/AGENT_*_HANDOFF.md` and reference exact files like `apps/api/app/api/.../route.ts:1`.

Details and templates
- See `docs/project-management/STATUS_BROADCASTING.md` for message structure and copy-paste templates.
- Collaboration protocol and JSONL event format live in `agents/PROTOCOLS.md` and `agents/README.md`.

