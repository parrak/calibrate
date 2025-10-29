Title: [Agent B] Amazon SP-API OAuth (LWA) — Install + Callback + UI

Summary
- Implement Login with Amazon OAuth for SP-API.
- Persist integration via POST /api/platforms/amazon and expose UI connect flow.

Tasks
- [x] API: GET /api/platforms/amazon/oauth/install (returns consent URL)
- [x] API: GET /api/platforms/amazon/oauth/callback (exchange code, upsert AmazonIntegration)
- [x] Console: Connect Amazon button → calls install, redirects to consent
- [x] Console: Success banner on ?connected=1 and refresh status
- [ ] Console: Add Disconnect confirmation modal
- [ ] Docs: Update env vars and flow in README/QUICK_START

Refs
- apps/api/app/api/platforms/amazon/oauth/install/route.ts:1
- apps/api/app/api/platforms/amazon/oauth/callback/route.ts:1
- apps/console/app/p/[slug]/integrations/amazon/page.tsx:1

Acceptance Criteria
- Install returns valid consent URL with application_id and state.
- Callback stores refresh token and optional access token + expiry.
- Integration status shows “Connected” and can “Disconnect”.

