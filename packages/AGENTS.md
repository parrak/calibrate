# AGENTS.md (packages/*)

Scope: `calibrate/packages` — shared libraries, connectors, db, config, and UI.

## General
- TypeScript-first. Export from `index.ts` (or `src/index.ts`) with clear public APIs.
- Keep modules small and composable. Avoid cross-package imports that create cycles.
- Prefer `zod` for schema/validation where applicable.

## Testing
- Vitest is standard. Run per package: `pnpm --filter <pkg> test:run` (or `test`).
- Write unit tests close to source (e.g., `src/__tests__`).

## DB (`@calibr/db`)
- Edit Prisma schema only in `packages/db/prisma/schema.prisma`.
- Generate client: `pnpm db:generate`. Do not commit generated code edits.
- Migrations: `pnpm migrate` (from repo root).

## UI (`@calibr/ui`)
- Keep components framework-agnostic React 18. No Next.js-specific imports.
- Maintain prop typing and minimal styling assumptions; rely on Tailwind utilities.

## Connectors (`@calibr/*-connector`)
- Provide type-safe client wrappers and input validation. Avoid leaking raw SDK shapes.
- Hide secrets behind env vars. No hard-coded tokens.

## Validation Before Finishing
- Lint and build/check types for the changed package only.
- If API surface changes, update `index.ts` exports and add/revise tests.

