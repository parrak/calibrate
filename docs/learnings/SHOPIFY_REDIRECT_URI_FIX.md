# Fix: Shopify OAuth "Unauthorized Access" Error

## Error You're Seeing

```
Unauthorized Access
The redirect url was: 
https://admin.shopify.com/store/calibr-test/oauth/authorize?client_id=...&redirect_uri=http://localhost:3000/api/platforms/shopify/oauth/callback...
```

## Root Cause

**The redirect URI `http://localhost:3000/api/platforms/shopify/oauth/callback` is NOT configured in your Shopify app settings.**

For Custom apps, Shopify requires you to explicitly allow redirect URIs.

## Fix Steps

### Step 1: Add Redirect URI to Shopify App

1. Go to [Shopify Partners Dashboard](https://partners.shopify.com/)
2. Navigate to **Apps** → Your app → **App setup**
3. Scroll to **Allowed redirection URL(s)** section
4. Click **"Add URL"** or edit the existing field
5. Add this URL:
   ```
   http://localhost:3000/api/platforms/shopify/oauth/callback
   ```
6. **Save** the changes

### Step 2: Also Add Production URL (For Later)

While you're there, also add the production URL:
```
https://api.calibr.lat/api/platforms/shopify/oauth/callback
```

### Step 3: Wait and Test

1. **Wait 1-2 minutes** for Shopify to propagate the changes
2. **Test again:**
   - Go to: `http://localhost:3001/p/demo/integrations/shopify`
   - Enter store: `calibr-test.myshopify.com`
   - Click "Connect Shopify Store"
   - Should now work! ✅

## Why This Happens

Shopify Custom apps require:
- ✅ Redirect URIs to be explicitly whitelisted
- ✅ Exact match (no trailing slashes, exact protocol)
- ✅ Each environment needs its own entry

## Current Redirect URI

Your OAuth install route generates:
```
redirect_uri=http://localhost:3000/api/platforms/shopify/oauth/callback
```

This **must** be in the "Allowed redirection URL(s)" list in Shopify Partners Dashboard.

## Verification Checklist

- [ ] Redirect URI added in Shopify Partners Dashboard
- [ ] Exact match: `http://localhost:3000/api/platforms/shopify/oauth/callback`
- [ ] No trailing slash
- [ ] Saved changes
- [ ] Waited 1-2 minutes
- [ ] Tested OAuth flow again

## Alternative: If Localhost Not Allowed

Some Shopify app types don't allow `localhost` redirects. If that's the case:

1. **Use ngrok or similar** for local testing:
   ```bash
   # Install ngrok
   ngrok http 3000
   
   # Use the ngrok URL:
   https://xxxx-xxx-xxx.ngrok.io/api/platforms/shopify/oauth/callback
   ```

2. **Or test directly on production** after deploying

## After Adding Redirect URI

Once the redirect URI is configured:
1. OAuth will redirect to Shopify ✅
2. User authorizes ✅
3. Shopify redirects back to your callback ✅
4. Integration saves to database ✅
5. User sees success message ✅

The code is correct - just needs the redirect URI configured in Shopify!

