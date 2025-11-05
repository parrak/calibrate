# Shopify OAuth & CORS Fixes - October 31, 2025

## Summary

Fixed all critical issues blocking the Shopify OAuth flow and cross-origin requests between console and API services.

## Critical Issues Resolved

### 1. OAuth Install Route - 405 Method Not Allowed
**Problem:** Route returned 405 even with correct OPTIONS handler.

**Root Cause:** Const variable reassignment bug in `apps/api/app/api/platforms/shopify/oauth/install/route.ts`. The `shop` variable was declared as `const` but then reassigned.

**Fix:** Introduced `finalShop` variable to hold the normalized shop domain value without reassigning the const.

**File:** `apps/api/app/api/platforms/shopify/oauth/install/route.ts:1`

### 2. OAuth Callback - Missing platformName Parameter
**Problem:** Integration save failed with "platformName required" error.

**Root Cause:** POST request to `/api/platforms/shopify` was missing required `platformName` parameter.

**Fix:** Added `platformName: shop` to the POST request body in callback handler.

**File:** `apps/api/app/api/platforms/shopify/oauth/callback/route.ts:1`

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

**Files:**
- `packages/shopify-connector/src/ShopifyConnector.ts:1`
- `packages/shopify-connector/src/client.ts:1`

### 5. Connection Test - Project Slug Resolution
**Problem:** Connection test failed with "No active Shopify integration found".

**Root Cause:** Sync endpoint only accepted `projectId` but UI was sending `projectSlug`.

**Fix:**
- Modified sync endpoint to accept `projectSlug` in request body
- Added logic to resolve `projectSlug` to `projectId` before querying integration

**File:** `apps/api/app/api/integrations/shopify/sync/route.ts:28`

## Key Learnings

1. **CORS Requirements**: All API routes called from console must have `withSecurity` middleware and OPTIONS handler
2. **Const Reassignment**: Never reassign const variables - use separate variables for transformed values
3. **Credential Flow**: Always pass shop domain and access token from credentials, not config
4. **State Management**: Client components should manage their own state when props are optional
5. **Project Slug Resolution**: Always support both projectId and projectSlug in API endpoints for flexibility

