Agent C Handoff: Auth/Login Stabilization (Phase 3)

Summary
- UI apps (site, console, docs) deploy on Vercel; API deploys on Railway.
- Platform abstraction is complete; Shopify connector merged; Amazon pricing feed path merged.
- In-progress: Console login (NextAuth v5) alignment with dev bundler to avoid stale runtime chunks and import-path issues.

Current State
- API: Added POST /api/auth/session to issue bearer tokens for Console → API (guarded by CONSOLE_INTERNAL_TOKEN). Tests passing.
- Console: On sign-in, requests API token in NextAuth jwt callback; exposes session.apiToken; page to test token under /p/demo/integrations/amazon/pricing.
- Error boundaries added (app/error.tsx, app/global-error.tsx, app/not-found.tsx) to surface issues clearly.
- Known dev issue: After deep import changes, Next dev sometimes reports missing chunk (e.g., ./557.js). A full cache clear and single dev instance resolves it.

What to Do Next
1) Console login stabilization (local dev)
   - Ensure only one dev server on 3001.
   - Clear caches: remove apps/console/.next and apps/console/.turbo.
   - Run dev: cd apps/console && pnpm dev.
   - Verify /login renders and completes sign-in.
   - If import errors appear, confirm:
     - lib/auth.ts imports: `import NextAuth from 'next-auth'` (v5 server entry)
     - middleware imports: `import { auth } from '@/lib/auth'`
     - API route: app/api/auth/[...nextauth]/route.ts re-exports handlers from lib/auth.

2) Verify Console ↔ API auth
   - API dev: cd apps/api && pnpm dev.
   - Env:
     - apps/api/.env.local: DATABASE_URL, WEBHOOK_SECRET, CONSOLE_INTERNAL_TOKEN
     - apps/console/.env.local: NEXT_PUBLIC_API_BASE, AUTH_SECRET, AUTH_URL, CONSOLE_INTERNAL_TOKEN (match API value)
   - In Console -> /p/demo/integrations/amazon/pricing, click "Check API Auth"; expect 200.

3) CORS & headers sanity (if browser calls API directly)
   - Staging config already includes console origin; for local dev, staging.ts allows http://localhost:3001.
   - For any new routes called client-side, ensure withCORS is applied if needed.

Acceptance Criteria
- /login renders and completes auth in dev without missing-chunk or import errors.
- session.apiToken is present after sign-in.
- Protected API endpoint (e.g., /api/admin/dashboard) returns 200 with Authorization: Bearer <token>.

Reference Files
- Console
  - app/api/auth/[...nextauth]/route.ts
  - lib/auth.ts
  - middleware.ts
  - app/error.tsx, app/global-error.tsx, app/not-found.tsx
- API
  - app/api/auth/session/route.ts
  - tests/auth-session.test.ts (vitest)

Notes
- The stale chunk error (e.g., './557.js') is a dev runtime cache artifact; kill port 3001 process, clear .next/.turbo, and re-run.
- ESLint config warning during build is unrelated to runtime; can be handled later.

