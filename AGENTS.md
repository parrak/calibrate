# AGENTS.md

These rules guide AI coding agents (Codex CLI, etc.) working in this repo. They apply to the entire repository unless a more specific AGENTS.md in a subfolder overrides them.

## Goals
- Make minimal, surgical changes that solve the user’s request.
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
- For Next.js route handlers (in `apps/*/app/api/**/route.ts`): import the handler directly in Vitest and pass a `Request` object (cast to `any`). Mock external services (e.g. Prisma via `vi.mock('@calibr/db')`).
- For packages (e.g. connectors): place unit tests in `packages/<pkg>/tests/**` using Vitest. Prefer testing normalized outputs and error handling.
- Then run repo-level checks if the change affects multiple projects.
- Lint before finishing: `pnpm lint` (fix only relevant issues).
- For Prisma-related changes, add a migration, run `pnpm db:generate`, and ensure no drift.

## CI & Deployment Guards
- CI enforces lockfile consistency. Before pushing, run `pnpm install --frozen-lockfile` locally to catch dependency drift.
- If Railway deploys fail due to build or lockfile errors, do not push unrelated changes until the failure is resolved; update the lockfile or align package.json specifiers.

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
- Explain what you’re about to do before running commands.
- Use `update_plan` for multi-step work. Mark steps complete as you go.
- Do not add license headers or reformat large files unprompted.

## Critical API Requirements

**⚠️ MANDATORY for ALL agents working on `apps/api`:**

When creating or modifying API routes, you MUST:
1. Use `withSecurity` middleware on ALL route handlers
2. Export an explicit `OPTIONS` handler wrapped with `withSecurity`
3. Test CORS preflight requests

**Why**: The console runs on a different domain and requires CORS headers. Missing OPTIONS handlers cause preflight failures that break the console.

**Full details**: [apps/api/CORS_MIDDLEWARE_REQUIRED.md](apps/api/CORS_MIDDLEWARE_REQUIRED.md)

**Example pattern**:
```typescript
import { withSecurity } from '@/lib/security-headers'

export const GET = withSecurity(async (req: NextRequest) => { /* ... */ })
export const OPTIONS = withSecurity(async (req: NextRequest) => {
  return new NextResponse(null, { status: 204 })
})
```

## Subdirectory Guides
- See additional, more specific rules in:
  - `apps/api/AGENTS.md` — **Read CORS_MIDDLEWARE_REQUIRED.md before editing routes**
  - `apps/console/AGENTS.md`
  - `apps/site/AGENTS.md`
  - `packages/AGENTS.md`
  - `scripts/AGENTS.md`

