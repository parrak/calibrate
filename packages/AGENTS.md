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

## Pull Request Workflow to Master

### **Mandatory PR Requirements**

When creating a Pull Request to sync changes to `master`, **ALL PRs MUST include**:

1. **CHANGELOG.md Update**
   - Add a new entry under `[Unreleased]` section describing the package changes
   - Include new features, API changes, bug fixes, or breaking changes
   - Specify which package(s) were affected (e.g., `@calibr/db`, `@calibr/ui`)
   - Reference PR number (e.g., `(PR #123)`)

2. **AGENT_WORKFLOW.md Update**
   - Update the relevant agent section in `agents/AGENT_WORKFLOW.md` to reflect progress
   - Mark completed deliverables with ✅ and date
   - Update status indicators and milestone table if applicable
   - Note which agent (A, B, or C) completed the work

3. **PR Description**
   - Clear title (e.g., `feat(packages): add new utility` or `fix(db): resolve migration issue`)
   - Summary of package changes
   - Breaking changes clearly documented
   - Testing performed (include test results)
   - Migration notes if database schema changes

### **PR Creation Steps**

```bash
# 1. Create feature branch
git checkout -b feature/packages-your-feature

# 2. Make changes and commit
git add .
git commit -m "feat(packages): your feature description"

# 3. Update CHANGELOG.md (add entry under [Unreleased])
# 4. Update agents/AGENT_WORKFLOW.md (update relevant agent section)

# 5. Commit documentation
git add CHANGELOG.md agents/AGENT_WORKFLOW.md
git commit -m "docs: update changelog and agent workflow"

# 6. Push and create PR targeting master
git push origin feature/packages-your-feature
```

