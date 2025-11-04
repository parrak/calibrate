# Shopify API Secret Rotation Guide

## 🚨 Important: Secret Exposure

The Shopify API secret was exposed in git history (commit 704a103). This guide helps you rotate the secret to a new value.

## Step 1: Generate New Secret in Shopify Partners Dashboard

1. **Log in to Shopify Partners Dashboard:**
   - Go to https://partners.shopify.com/
   - Navigate to **Apps** → Select your app (or create a new one)

2. **Regenerate Client Secret:**
   - Go to **App setup** → **Client credentials**
   - Click **"Regenerate"** next to **Client secret**
   - **⚠️ WARNING:** This will invalidate the old secret immediately
   - Copy the new **Client secret** (starts with `shpss_`)

3. **Verify the New Secret:**
   - Note down the new secret in a secure location
   - Make sure you don't commit it to git

## Step 2: Update Production (Railway)

### Option A: Railway Dashboard

1. Go to https://railway.app
2. Navigate to: **Projects** → **nurturing-caring** → **@calibr/api** → **Variables**
3. Find `SHOPIFY_API_SECRET`
4. Click **Edit** → Update the value to your new secret
5. Click **Save** - Railway will automatically redeploy

### Option B: Railway CLI

```bash
# Set the new secret
railway variables set SHOPIFY_API_SECRET=YOUR_NEW_SECRET_HERE

# Verify it's set correctly (will show [REDACTED])
railway variables | grep SHOPIFY_API_SECRET

# Check deployment logs to ensure it restarted
railway logs --service @calibr/api --tail
```

## Step 3: Update Local Development

1. **Update `apps/api/.env.local`:**
   ```bash
   # Edit apps/api/.env.local
   SHOPIFY_API_SECRET=YOUR_NEW_SECRET_HERE
   ```

2. **Restart Local Development Server:**
   ```bash
   # Stop the current server (Ctrl+C)
   # Then restart
   pnpm dev
   ```

## Step 4: Verify Rotation

### Production Verification

1. **Check Railway Logs:**
   ```bash
   railway logs --service @calibr/api | grep -i "shopify"
   ```
   Should show no errors about invalid secrets

2. **Test OAuth Install Endpoint:**
   ```bash
   curl "https://api.calibr.lat/api/platforms/shopify/oauth/install?project=demo&shop=test-store.myshopify.com"
   ```
   Should return JSON with `installUrl` (not an error)

3. **Test OAuth Callback (if you have an active integration):**
   - The old integrations will need to be reconnected
   - New OAuth flows will use the new secret for HMAC verification

### Local Verification

1. **Test Install Endpoint Locally:**
   ```bash
   curl "http://localhost:3000/api/platforms/shopify/oauth/install?project=demo&shop=test-store.myshopify.com"
   ```
   Should return JSON with `installUrl`

2. **Check Console Logs:**
   ```bash
   # In the API server console, should see:
   # No errors about "Invalid HMAC" or "SHOPIFY_API_SECRET not configured"
   ```

## Step 5: Reconnect Existing Integrations

⚠️ **Important:** After rotating the secret, existing integrations may need to be reconnected because:
- HMAC verification during OAuth callbacks uses the secret
- Old integrations were authorized with the old secret

### For Each Active Integration:

1. **Disconnect the old integration:**
   - Go to: `https://console.calibr.lat/p/{project-slug}/integrations/shopify`
   - Click **"Disconnect Shopify"**

2. **Reconnect with new secret:**
   - Click **"Connect Shopify Store"**
   - Complete the OAuth flow
   - This will use the new secret for HMAC verification

## Step 6: Monitor for Issues

After rotation, monitor for:

1. **OAuth Callback Failures:**
   - Check Railway logs for "Invalid HMAC" errors
   - These indicate the secret mismatch

2. **Integration Status:**
   - Verify existing integrations still work
   - If they fail, they need to be reconnected

3. **New OAuth Flows:**
   - Test a fresh OAuth connection
   - Should work with the new secret

## Troubleshooting

### "Invalid HMAC" Errors

**Cause:** Secret mismatch between Shopify and your application.

**Fix:**
1. Verify the secret in Railway matches Shopify Partners Dashboard exactly
2. Check for extra spaces or line breaks in the secret
3. Ensure Railway has redeployed after the secret change

### "SHOPIFY_API_SECRET not configured"

**Cause:** Environment variable not set or not accessible.

**Fix:**
1. Verify the variable is set in Railway: `railway variables`
2. Check it's set in the correct service (`@calibr/api`)
3. Restart the service if needed

### Existing Integrations Stop Working

**Cause:** Old integrations may be tied to the old secret.

**Fix:**
1. Reconnect the integration (disconnect → reconnect)
2. This creates a new OAuth flow with the new secret

## Security Best Practices

1. **Never commit secrets to git**
   - Use `.env.local` files (already in `.gitignore`)
   - Use environment variables in production

2. **Rotate secrets periodically**
   - Schedule regular rotations (e.g., quarterly)
   - Rotate immediately if exposed

3. **Use secure storage**
   - Railway handles production secrets securely
   - Never share secrets in documentation (use placeholders)

4. **Monitor for exposure**
   - GitHub secret scanning helps detect leaks
   - Review git history if secrets are exposed

## Verification Checklist

- [ ] New secret generated in Shopify Partners Dashboard
- [ ] Secret updated in Railway production environment
- [ ] Secret updated in local `.env.local` file
- [ ] Railway service redeployed successfully
- [ ] Local server restarted with new secret
- [ ] OAuth install endpoint works (production)
- [ ] OAuth install endpoint works (local)
- [ ] Existing integrations tested/reconnected
- [ ] No errors in Railway logs
- [ ] No errors in local console

## Related Files

- OAuth Callback: `apps/api/app/api/platforms/shopify/oauth/callback/route.ts`
- OAuth Install: `apps/api/app/api/platforms/shopify/oauth/install/route.ts`
- Connector Config: `packages/shopify-connector/src/ShopifyConnector.ts`
- Environment Setup: `docs/learnings/SETUP_SHOPIFY_CREDENTIALS.md`

