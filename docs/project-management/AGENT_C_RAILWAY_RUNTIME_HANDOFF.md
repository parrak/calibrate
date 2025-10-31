# Agent C Handoff — Railway API Runtime (Prisma in Next standalone)

Context
- Platform routes on production Railway fail with: `TypeError: Cannot read properties of undefined (reading 'findUnique')` in `app/api/platforms/[platform]/route.js`.
- Affected: both Shopify and Amazon platform info endpoints: `GET /api/platforms/{platform}?project=demo`.
- Local dev works; failure only in the Railway runtime with Next.js standalone output.

Impact
- Integrations page cannot fetch platform info; blocks onboarding/verification in prod.

---

Resolution — 2025-10-29
- Status: Resolved by Agent C
- Summary: Agent C adjusted the production packaging so Prisma Client is available to the Next.js standalone runtime on Railway and verified endpoint behavior.
- Verification:
  - GET /api/health → 200
  - GET /api/platforms/amazon?project=demo → 200 JSON
  - GET /api/platforms/shopify?project=demo → 200 JSON
- Notes: Investigation checklist below is retained for future regressions.

Reproduction
- URL: `https://api.calibr.lat/api/platforms/amazon?project=demo` (or `shopify`)
- Result: 500 with stack pointing to `.next/server/app/api/platforms/[platform]/route.js` on a `findUnique` call.

What’s been done (today)
- Context propagation fixed: `withSecurity`/`withCORS` now forward `{ params }`.
  - apps/api/lib/security-headers.ts:162
- Routes migrated to use Prisma helper function `prisma()` consistently.
  - apps/api/app/api/platforms/[platform]/route.ts:1
  - apps/api/app/api/platforms/[platform]/sync/route.ts:1
  - apps/api/app/api/platforms/amazon/pricing/route.ts:36
  - apps/api/app/api/integrations/shopify/* (oauth callback, webhooks, sync, products): multiple lines
- Guard added in `[platform]/route.ts` to log if model accessors are missing and reuse a single `db = prisma()` per handler.
  - apps/api/app/api/platforms/[platform]/route.ts:1
- Ensure Prisma helper is bundled: added `@calibr/db` to `transpilePackages`.
  - apps/api/next.config.js:12
- Ensure Prisma Client present at runtime image (Next standalone)
  - Dockerfile now copies `@prisma` and `.prisma` dirs into both `/app/node_modules/` and `/app/apps/api/node_modules/`.
  - Dockerfile lines after copying standalone output.

Hypothesis
- Next standalone resolves Prisma runtime from `apps/api/node_modules`, not root. Prior builds lacked Prisma Client/engines at the location used by server.js, causing `db.model` to be undefined.

What to investigate (Agent C)
1) Verify runtime filesystem after deploy
   - SSH into Railway deploy (or use Exec shell) and check:
     - `ls -la /app/apps/api/node_modules/@prisma` and `/app/apps/api/node_modules/.prisma`
     - `ls -la /app/node_modules/@prisma` and `/app/node_modules/.prisma`
     - `node -p "Object.keys(require('@prisma/client'))"` from `/app/apps/api`.
2) Confirm server entrypoint and CWD
   - Validate `pwd` and `__dirname` inside server: add a temporary log in `apps/api/start.sh` or switch CMD to `/app/start.sh` (apps/api/start.sh exists and logs env + server.js path).
   - Check that `node apps/api/server.js` resolves modules from `apps/api/node_modules`.
3) Minimal runtime probe route
   - Add a temp route: `app/api/_diag/prisma/route.ts` that does `return json({ hasProject: !!prisma().project })` to confirm client availability.
4) Prisma Client generation scope
   - Ensure `pnpm exec prisma generate` in builder emitted client relative to both root and workspaces; confirm `.prisma/client` exists.
5) Env/config sanity
   - `DATABASE_URL` set (health route uses `$queryRaw` and should pass if DB reachable).

Proposed next fixes (if still failing)
- Switch API Docker CMD to `start.sh` (it logs env and checks server.js)
  - Root Dockerfile currently uses `CMD ["node", "apps/api/server.js"]`; apps/api/Dockerfile uses `start.sh`.
- As a safety net, copy `node_modules/@prisma/client` tree explicitly from builder into `/app/apps/api/node_modules/@prisma/client`.
- If resolution still odd, set `NODE_PATH=/app/apps/api/node_modules:/app/node_modules` in runner.

Acceptance Criteria
- Health: `GET /api/health` returns 200.
- Platforms: `GET /api/platforms/amazon?project=demo` returns 200 JSON with integration (or 404 if project missing) — no Prisma undefined errors.
- Same for `shopify` platform.

File References
- apps/api/app/api/platforms/[platform]/route.ts:1
- apps/api/lib/security-headers.ts:162
- apps/api/next.config.js:12
- Dockerfile: lines copying `@prisma` and `.prisma` into runtime
- apps/api/start.sh:1

Recent Commits (master)
- 756f30d build(api): also copy Prisma Client into Next standalone tree (apps/api/node_modules)
- 3cfe5f8 build(api): copy Prisma Client and engines into runtime image
- 0fd640d fix(api-platforms): guard + reuse prisma() in dynamic platforms route
- b68d060 fix(api): consistently use prisma() helper in API routes (amazon/shopify)
- 4ce5d66 build(api): transpile @calibr/db in Next config

Notes
- This seems purely a packaging/runtime resolution issue; DB connectivity works via `/api/health`.
- After resolution, remove temporary diag route (if added) and revert extra logging.
