# AGENTS.md (apps/api)

Scope: `calibrate/apps/api` — Next.js App Router API with TypeScript, Vitest.

## When Editing
- Keep route handlers in `app/api/**/route.ts` with clear method exports (`GET`, `POST`, etc.).
- Validate all external inputs with `zod`. Return typed JSON only.
- Prefer small, composable utilities under `lib/` for shared logic.
- Follow existing response shapes; avoid breaking clients.

## Testing
- Run tests: `pnpm --filter @calibr/api test`
- CI-like run: `pnpm --filter @calibr/api test:run`
- Use Vitest + Supertest for route-level tests (see `tests/`).
- For JSON edge cases, see `lib/json-serialization-test.ts` and run `pnpm --filter @calibr/api test:json-serialization` when relevant.

## Data & Env
- Database access lives in `packages/db` (Prisma). Do not edit generated code.
- Generate Prisma client if needed: `pnpm db:generate`
- Local env: `.env.local` and `.env.local.example`. Do not commit secrets.

## Performance & Safety
- Avoid heavy work in route handlers; extract to `lib/` and cache if applicable.
- Sanitize user-controlled HTML with `isomorphic-dompurify` where relevant.

## Validation Before Finishing
- `pnpm --filter @calibr/api lint`
- `pnpm --filter @calibr/api build` (ensures Next config/type safety)
- If DB changes are implied: `pnpm migrate` and `pnpm db:generate`

