Title: [Agent C] Runtime Verification — Prisma in Next standalone on Railway

Summary
- Verify Prisma Client availability and module resolution at runtime in Railway.
- Ensure platform routes function (GET/POST/DELETE) without model access errors.

Tasks
- [x] Copy Prisma Client/engines into both /app/node_modules and /app/apps/api/node_modules in Dockerfile
- [x] Forward Next route context in withSecurity/withCORS for dynamic routes
- [x] Switch API route Prisma usage to prisma() and reuse db instance
- [ ] Verify runtime filesystem via Railway exec (list @prisma and .prisma paths)
- [ ] Add a temporary diag route if needed, then remove
- [ ] Close out handoff as resolved in docs

Refs
- Dockerfile:1
- apps/api/lib/security-headers.ts:162
- apps/api/app/api/platforms/[platform]/route.ts:1
- AGENT_C_RAILWAY_RUNTIME_HANDOFF.md:1

Acceptance Criteria
- /api/health returns 200.
- /api/platforms/{platform}?project=<slug> returns 200 JSON (or 404 if missing), no Prisma undefined errors.
- POST/DELETE platform routes operate correctly in prod.

