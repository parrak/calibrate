# Shopify Custom App Setup - Current Limitations & Testing

## ✅ Current Setup

You've successfully created a **Custom app** with:
- **Store domain:** `calibr-test.myshopify.com`
- **Distribution:** Custom (limited to Plus organization)
- **Client ID:** `55d12ed6f0420a21cd0682db635a7fa1`

## ⚠️ Important Limitation

**Your Custom app can ONLY be installed on:**
- Stores that belong to the **same Plus organization** as `calibr-test.myshopify.com`
- This means:
  - ✅ Works for stores in the same Plus account
  - ❌ **Will NOT work** for regular Shopify stores
  - ❌ **Will NOT work** for stores in different Plus accounts

## Your OAuth Flow

Your current OAuth implementation:
1. User enters **any** shop domain
2. Redirects to Shopify OAuth
3. **Expected:** Should work with any store

**Reality with Custom app:**
- Will only succeed for stores in the same Plus org
- Other stores will show an error like "App not available"

## Options

### Option 1: Test with Current Setup (Limited)

**You can test if:**
1. You have access to multiple stores in the same Plus organization as `calibr-test.myshopify.com`
2. Test the OAuth flow with those stores

**Test Steps:**
```
1. Go to: http://localhost:3001/p/demo/integrations/shopify
2. Enter a store domain from the same Plus org
3. Complete OAuth flow
```

**Limitation:** Won't work with stores outside the Plus org

### Option 2: Switch to Public App (Recommended for Production)

**Better for production:**
1. In Shopify Partners Dashboard, go to **App setup**
2. Change distribution from **Custom** → **Public app**
3. Fill in required fields (name, description, etc.)
4. Save

**Benefits:**
- ✅ Works with **any** Shopify store
- ✅ Matches your OAuth flow design
- ✅ Can remain unlisted (not in App Store)
- ✅ No Plus organization limitation

## Current OAuth Flow Status

Your code will work correctly, but:
- **With Custom app:** Only stores in same Plus org can install
- **With Public app:** Any store can install (what you want)

## Testing Right Now

If you want to test immediately with the Custom app:

1. **Make sure you have Plus:**
   - The "Allow multi-store install" option suggests you have Plus
   
2. **Test with stores in same Plus org:**
   ```
   http://localhost:3001/p/demo/integrations/shopify
   ```
   - Enter store domain from same Plus organization
   - OAuth should work

3. **What happens with other stores:**
   - OAuth will redirect to Shopify
   - Shopify will show error: "App not available for this store"
   - This is expected with Custom app limitation

## Recommendation

**For Now (Testing):**
- Test with stores in the same Plus org
- Verify OAuth callback flow works
- Test database integration

**Before Production:**
- Switch to **Public app** distribution
- Remove Plus organization limitation
- App will work with any Shopify store

## Next Steps

1. **Test with Plus org stores:**
   - Use a store domain from same Plus org
   - Complete OAuth flow
   - Verify callback works

2. **Switch to Public app when ready:**
   - Change distribution model
   - Test with any store
   - Deploy to production

Your OAuth code is correct - it's just the Shopify app configuration that limits which stores can install.

