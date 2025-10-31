# Shopify Credentials Setup Guide

## 🚨 Important Security Note
**DO NOT commit these credentials to git!** They are sensitive and should only be set as environment variables.

## Production Setup (Railway)

### Option 1: Railway Dashboard
1. Go to https://railway.app
2. Navigate to: **Projects** → **nurturing-caring** → **@calibr/api** → **Variables**
3. Add the following variables:

```
SHOPIFY_API_KEY=55d12ed6f0420a21cd0682db635a7fa1
SHOPIFY_API_SECRET=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
```

4. Click **Save** - Railway will automatically redeploy

### Option 2: Railway CLI
```bash
# Set environment variables
railway variables set SHOPIFY_API_KEY=55d12ed6f0420a21cd0682db635a7fa1
railway variables set SHOPIFY_API_SECRET=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

# Verify they're set
railway variables
```

## Local Development Setup

### Create `.env.local` in `apps/api/` directory:

```bash
# In apps/api/.env.local
SHOPIFY_API_KEY=55d12ed6f0420a21cd0682db635a7fa1
SHOPIFY_API_SECRET=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

# Also ensure these are set:
NEXT_PUBLIC_API_URL=http://localhost:3001
NEXT_PUBLIC_CONSOLE_URL=http://localhost:3000
```

## Verification

After setting up, verify the OAuth flow works:

1. **Check Railway logs:**
   ```bash
   railway logs --service @calibr/api
   ```
   Look for: `SHOPIFY_API_KEY: [SET]` and `SHOPIFY_API_SECRET: [SET]`

2. **Test OAuth install endpoint:**
   ```bash
   curl "https://api.calibr.lat/api/platforms/shopify/oauth/install?project=demo&shop=test-store.myshopify.com"
   ```
   
   Should return JSON with `installUrl` (not an error about missing API key)

3. **Test full OAuth flow:**
   - Navigate to: `https://console.calibr.lat/p/demo/integrations/shopify`
   - Click "Connect Shopify Store"
   - Enter a test shop domain
   - Complete the OAuth flow

## Shopify App Configuration

Make sure your Shopify app in Partners Dashboard is configured:

- **App URL:** `https://console.calibr.lat`
- **Allowed redirection URL(s):** `https://api.calibr.lat/api/platforms/shopify/oauth/callback`
- **Scopes:** `read_products,write_products,read_orders,read_inventory,write_inventory`

## Troubleshooting

If OAuth fails with "configuration_error":
- Verify environment variables are set correctly
- Check Railway logs for `SHOPIFY_API_SECRET not configured` errors
- Ensure variables are set in the correct service (@calibr/api, not other services)

If OAuth fails with "invalid_signature":
- Verify `SHOPIFY_API_SECRET` matches exactly what's in Shopify Partners Dashboard
- Check for extra spaces or line breaks in the secret

