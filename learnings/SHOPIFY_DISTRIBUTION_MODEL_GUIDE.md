# Shopify App Distribution Model - Configuration Guide

## Your Situation

You're setting up a **Custom app** and Shopify is asking for a **Store domain**.

## ⚠️ Important Decision

### Option 1: Use a Test Store Domain (Recommended for Testing)

**Enter:** Your development/test store domain
- Example: `your-test-store.myshopify.com`
- Or create a development store in Shopify Partners → Stores → Create store

**Check this box:**
- ✅ **Allow multi-store install for one Plus organization** (if you have Shopify Plus)
  - This allows the app to be installed on multiple stores within the same Plus account

**Limitation:** Custom apps with a specific store domain are typically limited to:
- That specific store, OR
- Stores in the same Plus organization (if the checkbox is enabled)

### Option 2: Use Public App Instead (Recommended for Production)

**Better approach for a multi-store app:**

1. **Go back** and select **"Public app"** instead of "Custom app"
2. **Public apps** don't require a specific store domain
3. **Can be installed on any Shopify store** (exactly what you need for OAuth)
4. Can still be unlisted (not published to App Store)

**Steps:**
1. Select **"Public app"** as distribution model
2. Fill in required fields:
   - App name: "Calibr Pricing"
   - Description: "Automated pricing management for your Shopify store"
   - Support email: your support email
   - App website: `https://calibr.lat`
3. **Save** settings

**Benefits:**
- ✅ Works with any Shopify store
- ✅ No store domain limitation
- ✅ OAuth works for all users
- ✅ Can be unlisted (not shown in App Store)

## Recommendation

**For Development/Testing:**
- Use **Custom app** with a test store domain
- Example: `calibr-test.myshopify.com` (create a dev store if needed)
- Enable "Allow multi-store install" if you have Plus

**For Production:**
- Switch to **Public app**
- No store domain needed
- Works with all Shopify stores
- Can remain unlisted if you don't want it in the App Store

## Current Setup Impact

**Your OAuth flow expects:**
- Users to enter **their own** shop domain
- Installation on **any store** that authorizes

**Custom app with specific domain:**
- ❌ May only work for that specific store
- ❌ Won't work for other users' stores (unless Plus org)

**Public app:**
- ✅ Works for any store
- ✅ Matches your OAuth flow design

## Quick Action

1. **If testing now:** Enter a test store domain (create dev store in Partners if needed)
2. **For production:** Switch to "Public app" distribution model
3. Both will work with your current OAuth code

## Creating a Development Store (If Needed)

1. In Shopify Partners Dashboard → **Stores**
2. Click **"Add store"** → **"Development store"**
3. Enter store name (e.g., "Calibr Test Store")
4. Get the domain: `your-store-name.myshopify.com`
5. Use this domain in the Custom app setup

---

**After selecting distribution model, remember to:**
- Save all changes
- Wait 1-2 minutes for propagation
- Test OAuth flow again

