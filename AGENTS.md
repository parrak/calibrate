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

### Current Status (Oct 28, 2025)
- **Platform Integration**: ✅ Complete - Shopify and Amazon connectors registered and functional
- **CORS Issues**: ✅ Resolved - All critical API endpoints now have proper CORS middleware
- **Console Integration**: ✅ Working - Platform cards display correctly, no more "Failed to fetch" errors
- **API Stability**: ✅ Stable - All platform endpoints responding with proper CORS headers

### Recent Fixes (Oct 28, 2025)
- **Platform Registration**: Fixed missing Shopify connector import in `apps/api/lib/platforms/register.ts`
- **CORS Middleware**: Added `withSecurity` middleware to `/api/platforms/[platform]` endpoint
- **Build Issues**: Resolved JSX syntax errors in `PlatformCard.tsx`
- **Railway Deployment**: Fixed "Unexpected eof" build errors

### For Other Agents
- **Agent A (Shopify)**: ✅ No action needed - connector working correctly
- **Agent B (Amazon)**: ✅ No action needed - pricing feed functional
- **Agent C (Platform)**: ✅ Handoff complete - all platform infrastructure stable

### Documentation
- **CORS Requirements**: [apps/api/CORS_MIDDLEWARE_REQUIRED.md](apps/api/CORS_MIDDLEWARE_REQUIRED.md)
- **Platform Integration**: [AGENT_C_INTEGRATIONS_FIX.md](AGENT_C_INTEGRATIONS_FIX.md)
- **Latest Status**: [AGENT_C_OCT28_SUMMARY.md](AGENT_C_OCT28_SUMMARY.md)

## Subdirectory Guides
- See additional, more specific rules in:
  - `apps/api/AGENTS.md` — **Read CORS_MIDDLEWARE_REQUIRED.md before editing routes**
  - `apps/console/AGENTS.md`
  - `apps/site/AGENTS.md`
  - `packages/AGENTS.md`
  - `scripts/AGENTS.md`

## Status Broadcasting

Use this repo’s docs to broadcast your status and handoffs so other agents can follow and continue your work without friction. This file is the hub; link or update the files below as you work.

- Daily progress: `PHASE3_DAILY_LOG.md`
  - Add a dated entry with: what changed, what’s next, blockers.
- Rolling status: `CURRENT_STATUS.md` and `AGENT_STATUS.md`
  - Keep the top sections current for quick at-a-glance status.
- Milestone broadcasts: `AGENTS_BROADCAST_YYYY-MM-DD.md`
  - For cross-cutting updates. Example: `AGENTS_BROADCAST_2025-10-27.md`.
- Handoffs: `AGENT_*_HANDOFF.md`
  - Capture acceptance criteria, file references, and next steps.
- Low-level event log (optional): `agents/events/YYYYMMDD/<agent>.jsonl`
  - Append JSON objects for fine-grained progress; see `agents/README.md`.

Quick checklist when you finish a chunk of work
- Update `PHASE3_DAILY_LOG.md` with a concise entry.
- Refresh `CURRENT_STATUS.md` (and `AGENT_STATUS.md` if applicable).
- If the change is cross-cutting, add an `AGENTS_BROADCAST_<date>.md` and link it in the daily log.
- For a handoff, create/update an `AGENT_*_HANDOFF.md` and reference exact files like `apps/api/app/api/.../route.ts:1`.

Details and templates
- See `STATUS_BROADCASTING.md` for message structure and copy-paste templates.
- Collaboration protocol and JSONL event format live in `agents/PROTOCOLS.md` and `agents/README.md`.

