Auth Integration Checkpoint (2025-10-26)

Summary
- Implemented API-issued bearer tokens for Console→API requests.
- Console requests token on sign-in and stores on session (session.apiToken).
- Added UI check to verify token against a protected admin endpoint.

Endpoints
- POST /api/auth/session (header: x-console-auth = CONSOLE_INTERNAL_TOKEN)
  - Body: { userId: string, roles?: string[], projectId?, tenantId? }
  - Returns: { token, context }

Env Vars
- API (Railway): CONSOLE_INTERNAL_TOKEN
- Console (Vercel/local): CONSOLE_INTERNAL_TOKEN, AUTH_URL, AUTH_SECRET, NEXT_PUBLIC_API_BASE

Known Issues (to resolve next session)
- NextAuth v5 import path errors under dev/webpack for console login.
  - Investigate correct imports for server (next-auth) vs middleware (next-auth/middleware) and providers.
  - Validate Credentials provider import path for v5 and add typings if needed.
  - Clear .next cache and re-run dev after changes.

Validation Plan
- Restart API (3000) and Console (3001) locally.
- Login at /login, navigate to /p/demo/integrations/amazon/pricing, run "Check API Auth".
- Ensure 200 response; otherwise confirm CONSOLE_INTERNAL_TOKEN matches in both envs.

