Auth Integration Checkpoint (2025-10-26)

Summary
- Implemented API-issued bearer tokens for Console→API requests.
- Console requests token on sign-in and stores on session (session.apiToken).
- Added UI check to verify token against a protected admin endpoint.

Endpoints
- POST /api/auth/session (header: `x-console-auth: CONSOLE_INTERNAL_TOKEN` — **required**)
  - Body: { userId: string, roles?: string[], projectId?, tenantId? }
  - Returns: { token, context }
  - Defaults missing roles to `viewer` and removes duplicate, whitespace-padded, or uppercase role entries before generating the session token.
  - ❗️ API now rejects requests without the header or when the environment variable is unset; misconfigured environments will surface a 500 "Server misconfiguration" response instead of silently succeeding.

Env Vars
- API (Railway): CONSOLE_INTERNAL_TOKEN
- Console (Vercel/local): CONSOLE_INTERNAL_TOKEN, AUTH_URL, AUTH_SECRET, NEXT_PUBLIC_API_BASE

Known Issues (to resolve next session)
- ✅ NextAuth v5 import path errors resolved by staying on `next-auth@4.24.11` and confirming route handler compiles in Next 14.

Validation Plan
- Restart API (3000) and Console (3001) locally.
- Login at /login, navigate to /p/demo/integrations/amazon/pricing, run "Check API Auth".
- Ensure 200 response; otherwise confirm CONSOLE_INTERNAL_TOKEN matches in both envs.

