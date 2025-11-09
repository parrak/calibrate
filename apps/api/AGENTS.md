# AGENTS.md (apps/api)

Scope: `calibrate/apps/api` — Next.js App Router API with TypeScript, Vitest.

## When Editing
- Keep route handlers in `app/api/**/route.ts` with clear method exports (`GET`, `POST`, etc.).
- **⚠️ CRITICAL**: ALL routes MUST use `withSecurity` middleware AND export an `OPTIONS` handler. See [CORS_MIDDLEWARE_REQUIRED.md](./CORS_MIDDLEWARE_REQUIRED.md) for details.
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

## CORS Requirements (MANDATORY)

**Read this EVERY TIME you create or modify API routes:**

All route handlers MUST include:

```typescript
import { withSecurity } from '@/lib/security-headers'

export const GET = withSecurity(async (req: NextRequest) => {
  // handler code
})

// CRITICAL: Always export OPTIONS for CORS preflight
export const OPTIONS = withSecurity(async (req: NextRequest) => {
  return new NextResponse(null, { status: 204 })
})
```

**Why this matters:**
- Console frontend runs on different domain (console.calibr.lat)
- Browsers block requests without CORS headers
- Missing OPTIONS handler = failed preflight = CORS error

**Full details**: [CORS_MIDDLEWARE_REQUIRED.md](./CORS_MIDDLEWARE_REQUIRED.md)

## Validation Before Finishing
- `pnpm --filter @calibr/api lint`
- `pnpm --filter @calibr/api build` (ensures Next config/type safety)
- If DB changes are implied: `pnpm migrate` and `pnpm db:generate`
- **Test CORS**: `curl -X OPTIONS -H "Origin: https://console.calibr.lat" -i "https://api.calibr.lat/api/your-endpoint"`

## Pull Request Workflow to Master

### **Mandatory PR Requirements**

When creating a Pull Request to sync changes to `master`, **ALL PRs MUST include**:

1. **CHANGELOG.md Update**
   - Add a new entry under `[Unreleased]` section describing the API changes
   - Include endpoint changes, new features, bug fixes, or breaking changes
   - Reference PR number (e.g., `(PR #123)`)

2. **AGENT_WORKFLOW.md Update**
   - Update the relevant agent section in `agents/AGENT_WORKFLOW.md` to reflect progress
   - Mark completed deliverables with ✅ and date
   - Update status indicators and milestone table if applicable

3. **PR Description**
   - Clear title (e.g., `feat(api): add new endpoint` or `fix(api): resolve CORS issue`)
   - Summary of API changes
   - Testing performed (include test results)
   - Migration notes if database changes were made

### **PR Creation Steps**

```bash
# 1. Create feature branch
git checkout -b feature/api-your-feature

# 2. Make changes and commit
git add .
git commit -m "feat(api): your feature description"

# 3. Update CHANGELOG.md (add entry under [Unreleased])
# 4. Update agents/AGENT_WORKFLOW.md (update Agent B section)

# 5. Commit documentation
git add CHANGELOG.md agents/AGENT_WORKFLOW.md
git commit -m "docs: update changelog and agent workflow"

# 6. Push and create PR targeting master
git push origin feature/api-your-feature
```

