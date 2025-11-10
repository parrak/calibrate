Title: [Agent A] Shopify OAuth — Install + Callback + UI polish

Summary
- Complete Shopify OAuth install/callback and ensure console UX reflects connection state.

Tasks
- [x] Console: ShopifyAuthButton calls install with project_id and shop domain
- [x] Console: Show success banner on ?success=true and refresh status
- [x] API: Verify install/callback routes handle HMAC validation and token exchange
- [x] API: POST to /api/platforms/shopify after callback (if not already)
- [x] UI: Add Disconnect confirmation and refresh
- [x] Docs: Update envs and flow

Refs
- apps/api/app/api/integrations/shopify/oauth/install/route.ts:1
- apps/api/app/api/integrations/shopify/oauth/callback/route.ts:1
- apps/console/app/p/[slug]/integrations/shopify/page.tsx:1
- apps/console/app/p/[slug]/integrations/shopify/components/ShopifyAuthButton.tsx:1

Acceptance Criteria
- Install returns valid Shopify auth URL; user completes OAuth.
- Callback persists access token to DB and redirects to console.
- Integration status reflects Connected; can Disconnect.

