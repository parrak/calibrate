# Shopify OAuth & CORS Fixes - October 31, 2025

## Summary
Fixed all critical issues blocking the Shopify OAuth flow and cross-origin requests between console and API services.

## Critical Issues Resolved

### 1. OAuth Install Route - 405 Method Not Allowed
**Problem:** Route returned 405 even with correct OPTIONS handler.

**Root Cause:** Const variable reassignment bug in `apps/api/app/api/platforms/shopify/oauth/install/route.ts`. The `shop` variable was declared as `const` but then reassigned, which prevented the route handler from loading correctly.

**Fix:** Introduced `finalShop` variable to hold the normalized shop domain value without reassigning the const.

**Files:**
- `apps/api/app/api/platforms/shopify/oauth/install/route.ts:1`

### 2. OAuth Callback - Missing platformName Parameter
**Problem:** Integration save failed with "platformName required" error.

**Root Cause:** POST request to `/api/platforms/shopify` was missing required `platformName` parameter.

**Fix:** Added `platformName: shop` to the POST request body in callback handler.

**Files:**
- `apps/api/app/api/platforms/shopify/oauth/callback/route.ts:1`

### 3. Connection Test Failures - CORS Errors
**Problem:** "Failed to fetch" error when console (localhost:3001) called API sync endpoint (localhost:3000).

**Root Cause:** Missing `withSecurity` middleware and OPTIONS handler on `/api/integrations/shopify/sync` endpoint.

**Fix:**
- Wrapped POST handler with `withSecurity` middleware
- Added OPTIONS handler with `withSecurity` middleware
- Added `credentials: 'include'` to fetch call in UI component

**Files:**
- `apps/api/app/api/integrations/shopify/sync/route.ts:13`
- `apps/console/app/p/[slug]/integrations/shopify/components/ShopifyStatus.tsx:50`

### 4. Shopify Client Initialization - Wrong Shop Domain/Token
**Problem:** "Failed to connect to platform" error even with valid credentials.

**Root Cause:** `ShopifyClient` was using `config.apiKey` for both shop domain and access token instead of credentials.

**Fix:**
- Updated `ShopifyConnector.initialize()` to pass `shopDomain` and `accessToken` from credentials
- Updated `ShopifyClient` constructor to accept and use `shopDomain` and `accessToken` parameters
- Added fallbacks for backward compatibility

**Files:**
- `packages/shopify-connector/src/ShopifyConnector.ts:1`
- `packages/shopify-connector/src/client.ts:1`

### 5. UI Component State Management
**Problem:** "onUpdate is not a function" error in ShopifyStatus component.

**Root Cause:** Component expected `onUpdate` prop but parent server component couldn't provide it.

**Fix:**
- Made `onUpdate` prop optional
- Added local state (`currentIntegration`) to manage UI updates
- Added `useEffect` to sync prop changes to local state

**Files:**
- `apps/console/app/p/[slug]/integrations/shopify/components/ShopifyStatus.tsx:27`

### 6. Connection Test - Project Slug Resolution
**Problem:** Connection test failed with "No active Shopify integration found".

**Root Cause:** Sync endpoint only accepted `projectId` but UI was sending `projectSlug`.

**Fix:**
- Modified sync endpoint to accept `projectSlug` in request body
- Added logic to resolve `projectSlug` to `projectId` before querying integration

**Files:**
- `apps/api/app/api/integrations/shopify/sync/route.ts:28`

### 7. NextAuth v4 Compatibility
**Problem:** "getServerSession is not a function" error in console components.

**Root Cause:** Incorrect import path for NextAuth v4.

**Fix:** Updated import to use `next-auth` directly instead of `next-auth/next`.

**Files:**
- `apps/console/lib/auth.ts:1`

## New Components Added

### DisconnectButton
Created new client component for disconnecting Shopify integration:
- `apps/console/app/p/[slug]/integrations/shopify/components/DisconnectButton.tsx`

## Testing Results

✅ **OAuth Install Endpoint**
- Returns 200 with correct authorization URL
- Shop domain validation works for both formats (mystore.myshopify.com and mystore)
- Client ID matches expected value

✅ **OAuth Callback**
- Successfully saves integration to database
- HMAC verification working correctly
- Integration status set to active

✅ **CORS Preflight (OPTIONS)**
- Returns 200 with correct CORS headers
- Access-Control-Allow-Origin: http://localhost:3001
- Access-Control-Allow-Credentials: true

✅ **CORS POST Request**
- Returns 200 with CORS headers
- Connection test works end-to-end

✅ **Database**
- ShopifyIntegration table exists
- Migrations applied successfully

## Environment Variables Required

### API Service (`apps/api/.env.local`)
```env
SHOPIFY_API_KEY=your_api_key
SHOPIFY_API_SECRET=your_api_secret
SHOPIFY_SCOPES=read_products,write_products,read_orders,read_inventory,write_inventory
SHOPIFY_API_VERSION=2024-10
DATABASE_URL=postgresql://user:password@localhost:5432/calibr
NEXT_PUBLIC_API_URL=http://localhost:3000
NEXT_PUBLIC_CONSOLE_URL=http://localhost:3001
```

### Console Service (`apps/console/.env.local`)
```env
DATABASE_URL=postgresql://user:password@localhost:5432/calibr
NEXT_PUBLIC_API_URL=http://localhost:3000
```

## Files Modified Summary

### API Routes
- `apps/api/app/api/platforms/shopify/oauth/install/route.ts` - Fixed const reassignment bug
- `apps/api/app/api/platforms/shopify/oauth/callback/route.ts` - Added platformName
- `apps/api/app/api/integrations/shopify/sync/route.ts` - Added CORS, projectSlug support
- `apps/api/app/api/platforms/[platform]/route.ts` - Fixed connector initialization

### Console Components
- `apps/console/app/p/[slug]/integrations/shopify/components/ShopifyStatus.tsx` - Fixed state management
- `apps/console/app/p/[slug]/integrations/shopify/components/ShopifyAuthButton.tsx` - Fixed imports
- `apps/console/app/p/[slug]/integrations/shopify/page.tsx` - Added DisconnectButton
- `apps/console/lib/auth.ts` - Fixed NextAuth v4 import

### Connector Packages
- `packages/shopify-connector/src/ShopifyConnector.ts` - Fixed initialization
- `packages/shopify-connector/src/client.ts` - Use credentials for shop/token

## Key Learnings

1. **CORS Requirements**: All API routes called from console must have `withSecurity` middleware and OPTIONS handler
2. **Const Reassignment**: Never reassign const variables - use separate variables for transformed values
3. **Credential Flow**: Always pass shop domain and access token from credentials, not config
4. **State Management**: Client components should manage their own state when props are optional
5. **Project Slug Resolution**: Always support both projectId and projectSlug in API endpoints for flexibility

## Next Steps

1. Test end-to-end OAuth flow in production (Railway)
2. Verify production environment variables are set correctly
3. Monitor sync operations in production
4. Consider adding webhook setup automation
5. Add additional error handling for edge cases

## Related Documentation

- CORS Configuration: `apps/api/lib/security-headers.ts`
- Shopify OAuth Flow: `apps/api/app/api/platforms/shopify/oauth/`
- Integration Management: `apps/console/app/p/[slug]/integrations/shopify/`

