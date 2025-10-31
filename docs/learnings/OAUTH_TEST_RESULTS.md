# Shopify OAuth End-to-End Flow Test Results

## Test Date
October 29, 2025

## Status
⚠️ **Production API Testing Required**

## What I Can Test Automatically

### ✅ Code Review Complete
1. **Install Route** (`apps/api/app/api/platforms/shopify/oauth/install/route.ts`)
   - ✅ Validates required parameters (project, shop)
   - ✅ Normalizes shop domain format
   - ✅ Generates OAuth URL with correct scopes
   - ✅ Uses environment variable `SHOPIFY_API_KEY`
   - ✅ Includes `withSecurity` middleware
   - ✅ Has OPTIONS handler for CORS

2. **Callback Route** (`apps/api/app/api/platforms/shopify/oauth/callback/route.ts`)
   - ✅ Validates OAuth callback parameters
   - ✅ Verifies HMAC signature (timing-safe)
   - ✅ Exchanges code for access token
   - ✅ Calls POST endpoint with `platformName`
   - ✅ Redirects to console on success/error
   - ✅ Uses environment variable `SHOPIFY_API_SECRET`
   - ✅ Includes `withSecurity` middleware
   - ✅ Has OPTIONS handler for CORS

3. **Integration with POST Endpoint**
   - ✅ Callback route properly calls `/api/platforms/shopify` POST
   - ✅ Includes required `platformName` field
   - ✅ Sends credentials in correct format
   - ✅ Handles errors appropriately

4. **Console UI Components**
   - ✅ `ShopifyAuthButton` uses absolute API URL
   - ✅ `DisconnectButton` created as client component
   - ✅ Integration page handles success/error states

## What Needs Manual Testing

### 🔴 Critical: Production API Endpoint Test

The production API returned **405 Method Not Allowed** when testing the install endpoint. This could indicate:

1. **CORS Issue**: May need OPTIONS preflight request first
2. **Route Configuration**: Verify route is properly registered
3. **Railway Deployment**: Check if latest code is deployed

### Manual Testing Steps Required

#### Step 1: Verify Environment Variables in Railway
```bash
# Check Railway dashboard or logs
railway logs --service @calibr/api | grep SHOPIFY_API
```

Expected output should show:
- `SHOPIFY_API_KEY: [SET]`
- `SHOPIFY_API_SECRET: [SET]`

#### Step 2: Test Install Endpoint Directly
Navigate in browser or use curl:
```bash
# From browser or Postman
https://api.calibr.lat/api/platforms/shopify/oauth/install?project=demo&shop=test-store.myshopify.com
```

Expected response:
```json
{
  "installUrl": "https://test-store.myshopify.com/admin/oauth/authorize?client_id=55d12ed6f0420a21cd0682db635a7fa1&scope=...",
  "shop": "test-store.myshopify.com",
  "scopes": ["read_products", "write_products", ...]
}
```

#### Step 3: Test Full OAuth Flow
1. Navigate to: `https://console.calibr.lat/p/[project-slug]/integrations/shopify`
2. Click "Connect Shopify Store"
3. Enter shop domain (e.g., `test-store.myshopify.com`)
4. Click "Continue to Shopify"
5. **Expected**: Redirect to Shopify OAuth consent screen
6. Click "Install app" on Shopify
7. **Expected**: Redirect back to console with `?success=true`
8. **Expected**: Integration status shows "Connected"

#### Step 4: Verify Database Integration
After successful OAuth:
```sql
SELECT * FROM "ShopifyIntegration" 
WHERE "shopDomain" = 'test-store.myshopify.com';
```

Expected:
- `isActive` = `true`
- `accessToken` present (encrypted)
- `scope` contains granted scopes

#### Step 5: Test Disconnect
1. Click "Disconnect Shopify" button
2. **Expected**: Integration shows "Not Connected"
3. **Expected**: Database `isActive` = `false`

## Potential Issues to Check

### Issue 1: 405 Method Not Allowed
**Possible Causes:**
- Route not properly exported
- CORS preflight failing
- Railway deployment missing latest code

**Solution:**
- Check Railway deployment logs
- Verify route file is included in build
- Test with OPTIONS request first

### Issue 2: HMAC Verification Failing
**Symptoms:**
- OAuth callback redirects with `error=invalid_signature`
- Console shows "Invalid HMAC signature" in logs

**Solution:**
- Verify `SHOPIFY_API_SECRET` matches exactly (no extra spaces)
- Check HMAC verification logic is correct

### Issue 3: Token Exchange Failing
**Symptoms:**
- OAuth callback redirects with `error=token_exchange_failed`
- Shopify returns error when exchanging code

**Solution:**
- Verify `SHOPIFY_API_KEY` matches Client ID in Partners Dashboard
- Check redirect URI matches exactly in Shopify app settings
- Verify scopes are granted in Shopify app configuration

### Issue 4: Save Integration Failing
**Symptoms:**
- OAuth completes but redirects with `error=save_failed`
- Integration not saved to database

**Solution:**
- Check POST endpoint is working: `POST /api/platforms/shopify`
- Verify database connection
- Check Prisma client is properly initialized

## Test Checklist

- [ ] Environment variables set in Railway (`SHOPIFY_API_KEY`, `SHOPIFY_API_SECRET`)
- [ ] Shopify app configured with correct redirect URL
- [ ] Install endpoint accessible and returns OAuth URL
- [ ] OAuth flow redirects to Shopify correctly
- [ ] Shopify OAuth consent screen appears
- [ ] OAuth callback receives parameters correctly
- [ ] HMAC verification succeeds
- [ ] Token exchange succeeds
- [ ] Integration saved to database
- [ ] Redirect to console with success message
- [ ] Integration status shows "Connected"
- [ ] Disconnect functionality works

## Next Steps

1. **Immediate**: Test the install endpoint from browser to verify 405 issue
2. **If 405 persists**: Check Railway deployment and route configuration
3. **Once install works**: Test full OAuth flow with a development store
4. **After OAuth succeeds**: Verify database integration and UI updates

## Files Modified

All critical files have been reviewed and fixed:
- ✅ `apps/api/app/api/platforms/shopify/oauth/install/route.ts`
- ✅ `apps/api/app/api/platforms/shopify/oauth/callback/route.ts`
- ✅ `apps/console/app/p/[slug]/integrations/shopify/components/ShopifyAuthButton.tsx`
- ✅ `apps/console/app/p/[slug]/integrations/shopify/components/DisconnectButton.tsx` (new)
- ✅ `apps/console/app/p/[slug]/integrations/shopify/page.tsx`

## Conclusion

**Code Status**: ✅ All critical fixes applied, routes look correct

**Testing Status**: ⚠️ Requires manual testing with production API

**Recommendation**: 
1. Verify Railway environment variables are set
2. Test install endpoint from browser (bypasses CORS issues)
3. Complete full OAuth flow with a Shopify development store
4. Verify all success criteria are met

