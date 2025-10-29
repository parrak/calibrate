Agents Broadcast — Phase 3 Update (2025-10-27)

Summary
- Hosting: UI on Vercel (site, console, docs); API on Railway.
- Agent C foundation shipped (interfaces, registry, routes). Agent A (Shopify) merged and green. Agent B (Amazon) pricing feed path implemented with status polling and console UX.
- Console login flow stabilized; env vars configured; end-to-end bearer auth to API verified.

Deployment & Env
- Console (Vercel project: rakesh-paridas-projects/console)
  - NEXT_PUBLIC_API_BASE=https://api.calibr.lat
  - AUTH_URL=https://console.calibr.lat
  - AUTH_SECRET=[set]
  - CONSOLE_INTERNAL_TOKEN=[set]
  - AUTH_TRUST_HOST=true
  - DATABASE_URL=[Railway Postgres URL]
- API (Railway)
  - CONSOLE_INTERNAL_TOKEN matches Console
  - DATABASE_URL, WEBHOOK_SECRET set

New/Updated Endpoints
- API-issued session tokens: POST /api/auth/session (header x-console-auth)
- Amazon pricing: POST /api/platforms/amazon/pricing; GET /api/platforms/amazon/pricing/status
- Platforms registry routes: /api/platforms, /api/platforms/[platform], /api/platforms/[platform]/sync

Console UX
- Login (/login) now returns to callbackUrl or /projects; avoids defaulting to demo.
- Amazon pricing page: /p/demo/integrations/amazon/pricing with “Check API Auth”.
- Error boundaries added (global-error, error, not-found).

For Agent A (Shopify)
- Shopify connector remains integrated and unaffected by auth changes.
- No action required; use registry and platform routes as before.

For Agent B (Amazon)
- Pricing feed doc encryption/upload/submission implemented; status polling + result parsing added.
- Endpoints and console page are live; next: catalog + competitive pricing ops, expand tests to 95%+.

For Agent C (Platform)
- Registry and interfaces are used in production. Handoff from earlier work is complete.
- Console auth now stable with bearer tokens to API; CORS allowed.

Verification
- console.calibr.lat: / and /login return 200; login succeeds.
- After sign-in, session.apiToken present; protected admin endpoint returns 200 with Authorization: Bearer <token>.

