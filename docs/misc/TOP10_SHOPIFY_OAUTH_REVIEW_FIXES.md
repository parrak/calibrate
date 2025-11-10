# Top 10 Outstanding Shopify OAuth Review Fixes (November 2025)

| # | Issue | Impact | Resolution |
|---|-------|--------|------------|
| 1 | Legacy install route expected `project_id` instead of slug and bypassed updated validation. | OAuth installs from the console failed when review links hit the old path. | Re-exported `/api/app/api/integrations/shopify/oauth/install` to the hardened platforms install handler so both paths behave identically. |
| 2 | Legacy callback route duplicated outdated logic without security middleware. | Risk of unprotected callbacks and inconsistent integration saves. | Re-exported `/api/app/api/integrations/shopify/oauth/callback` to the secured platforms callback handler. |
| 3 | OAuth state tokens were plain Base64 payloads. | Attackers could tamper with project slugs or reuse stale state. | Added HMAC signing with `SHOPIFY_API_SECRET`, random nonce, and version metadata to the state encoder. |
| 4 | OAuth state lacked expiry enforcement. | Replay attacks could complete OAuth hours later. | Introduced a 10-minute TTL check during state decode. |
| 5 | Decoding succeeded even when the secret was missing. | Misconfigured environments silently produced insecure tokens. | Decoder now returns null without a secret and encoder throws, forcing proper configuration. |
| 6 | Console used a bespoke confirm dialog for disconnect. | Inconsistent UX and no toast feedback compared to Amazon flow. | Replaced with shared `DisconnectConfirm` modal inside the new `ShopifyIntegrationClient`. |
| 7 | Shopify integration page didn’t refresh after disconnect/connect actions. | Users saw stale status until manual reload. | Added client-side status management with automatic refresh and loading hint. |
| 8 | Success/error banners were static and non-dismissible. | UX cluttered after reconnecting or encountering transient errors. | Implemented dismissible alerts with toast notifications and query cleanup. |
| 9 | Console rendered nothing if the status fetch failed. | Broken API responses produced blank screens. | Added graceful fallback that surfaces the error message while keeping interactive controls. |
|10 | README + execution packet referenced outdated paths and lacked security notes. | Onboarding guides continued to direct teams to deprecated endpoints. | Updated README OAuth flow paths, documented signed state, and noted the completion in `01_MILESTONES.md`. |

These fixes resolve all outstanding Shopify OAuth review comments and bring the console UX in line with the shared integration patterns.

## November 2025 Follow-up: Additional Review Items Closed

| # | Issue | Impact | Resolution |
|---|-------|--------|------------|
| 1 | Callback route depended on `NEXT_PUBLIC_API_BASE`, failing when only internal bases were configured. | Shopify OAuth would save integrations to the wrong host or fail entirely in staging. | Added `resolveInternalApiBase` helper that prefers `INTERNAL_API_BASE`/`API_BASE_URL` and falls back to request origin before posting to `/api/platforms/shopify`. |
| 2 | Install route hard-coded the public base URL, breaking redirects behind proxies. | Shopify redirected back to invalid callback URLs in environments with edge gateways. | Introduced `resolvePublicApiBase` to honour `SHOPIFY_OAUTH_CALLBACK_BASE`, forwarded headers, or the request origin when building the redirect URI. |
| 3 | OAuth callback tests only covered missing parameters. | HMAC regressions or callback routing issues could ship unchecked. | Added Vitest coverage for invalid signatures, tampered state tokens, and the successful token-exchange path, including assertions for internal fetch targets. |
| 4 | `ShopifyIntegrationClient` never refreshed after mount and spammed toasts on 404s. | Console pages showed stale statuses or noisy errors right after OAuth. | Implemented guarded refresh logic with silent initial loads, interval polling during sync, and graceful 404 handling. |
| 5 | `ShopifyStatus` triggered sync/test operations via legacy fetch logic. | Requests bypassed shared platform middleware and omitted toast feedback. | Switched to `platformsApi.triggerSync`, added success/error toasts, and normalised status updates. |
| 6 | Sync status polling reused stale intervals and hid repeated failures. | Users received no feedback when background polling broke. | Reset pollers on state changes, de-duplicated error toasts, and shortened the cadence to actionable updates. |
| 7 | Status badges ignored `SYNCING`/`pending` values. | Active syncs appeared “Unknown”, confusing reviewers. | Expanded badge mapping and added an explicit “Idle” state when no sync has run yet. |
| 8 | Connection tests surfaced generic alerts and leaked network details. | Console UX felt brittle and exposed raw error strings. | Replaced `alert()` usage with toasts and friendly network diagnostics while preserving detailed console logs. |
| 9 | Shopify OAuth issue tracker still showed critical tasks unchecked. | Reviewers believed HMAC validation and docs remained unresolved. | Marked the `.github/ISSUES/agent-a-shopify-oauth.md` checklist items complete now that routes, UI, and docs are updated. |
|10 | Follow-up fixes were undocumented. | Future reviewers lacked a single source summarising the latest review closures. | Documented this follow-up table alongside the original top ten for full historical context. |
