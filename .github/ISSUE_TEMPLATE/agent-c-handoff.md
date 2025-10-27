---
name: Agent C Handoff – Console Login Stabilization
about: Pick up Console auth/login stabilization and complete end-to-end verification
title: "[Agent C] Console login stabilization and API auth verification"
labels: phase3, agent-c, auth, console
assignees: ''
---

Summary
- UI on Vercel; API on Railway. Platform abstraction complete. Shopify merged. Amazon pricing feed merged.
- Stabilize Console login (NextAuth v5) under local dev and verify Console→API bearer-token flow.

Scope
1) Console login stabilization (local dev)
   - Ensure only one dev server on 3001.
   - Clear caches: remove apps/console/.next and apps/console/.turbo.
   - Run dev: cd apps/console && pnpm dev.
   - Verify /login renders and completes sign-in.
   - Import sanity:
     - lib/auth.ts – import NextAuth from 'next-auth'.
     - middleware.ts – import { auth } from '@/lib/auth'.
     - app/api/auth/[...nextauth]/route.ts – re-export handlers from lib/auth.

2) Console ↔ API auth verification
   - API dev: cd apps/api && pnpm dev.
   - Env:
     - apps/api/.env.local: DATABASE_URL, WEBHOOK_SECRET, CONSOLE_INTERNAL_TOKEN
     - apps/console/.env.local: NEXT_PUBLIC_API_BASE, AUTH_SECRET, AUTH_URL, CONSOLE_INTERNAL_TOKEN (match API)
   - In Console → /p/demo/integrations/amazon/pricing, click "Check API Auth"; expect 200.

Acceptance Criteria
- /login works locally without missing chunk/import errors.
- session.apiToken present after sign-in.
- Protected API endpoint returns 200 with Authorization: Bearer <token>.

References
- AGENT_C_HANDOFF.md
- PHASE3_DAILY_LOG.md (2025‑10‑26 handoff notes)
- apps/api/app/api/auth/session/route.ts, apps/api/tests/auth-session.test.ts
- apps/console: app/error.tsx, app/global-error.tsx, app/not-found.tsx

Notes
- If you see missing dev chunk errors (e.g., './557.js'), kill port 3001 process, clear .next/.turbo, and retry.
