# Shopify App Setup Guide - Distribution Model

## Current Status
✅ OAuth redirect is working - app is redirecting to Shopify correctly

## Required: Complete App Setup in Shopify Partners Dashboard

### Step 1: Access Your App Settings

1. Go to [Shopify Partners Dashboard](https://partners.shopify.com/)
2. Navigate to **Apps** → Select your app (Client ID: `55d12ed6f0420a21cd0682db635a7fa1`)
3. Click on **App setup** tab

### Step 2: Distribution Model Selection

You need to select how your app will be distributed:

#### Option A: Public App (Recommended for Development/Testing)
- **Choose this if:** You want anyone to be able to install the app
- **Best for:** Development, testing, or if you plan to publish to Shopify App Store
- **Steps:**
  1. Under **Distribution**, select **Public app**
  2. Fill in required fields:
     - App description
     - Category
     - App website URL
     - Support email
  3. **Save** the settings

#### Option B: Custom App (For Private/Internal Use)
- **Choose this if:** The app is for internal use or specific clients only
- **Best for:** Private integrations, custom solutions
- **Steps:**
  1. Under **Distribution**, select **Custom app**
  2. Configure app settings
  3. **Save** the settings

#### Option C: Unlisted App
- **Choose this if:** You want control over who can install, but don't want to go through App Store review
- **Best for:** Controlled distribution without public listing

### Step 3: Required Configuration

After selecting distribution model, ensure these are set:

#### App URLs
- **App URL:** `https://console.calibr.lat`
- **Allowed redirection URL(s):**
  - **Production:** `https://api.calibr.lat/api/platforms/shopify/oauth/callback`
  - **Development:** `http://localhost:3000/api/platforms/shopify/oauth/callback` (for local testing)

#### OAuth Scopes
Ensure these scopes are configured:
- `read_products`
- `write_products`
- `read_orders`
- `read_inventory`
- `write_inventory`

#### API Credentials
- **Client ID (API Key):** `55d12ed6f0420a21cd0682db635a7fa1`
- **Client Secret (API Secret):** `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`

### Step 4: Save and Test

1. **Save** all changes in Shopify Partners Dashboard
2. **Wait 1-2 minutes** for changes to propagate
3. **Test the OAuth flow again:**
   ```
   http://localhost:3001/p/demo/integrations/shopify
   ```
4. Click "Connect Shopify Store" and verify you can complete installation

## Quick Checklist

- [ ] Selected distribution model (Public/Custom/Unlisted)
- [ ] Filled in required app information
- [ ] App URL set to `https://console.calibr.lat`
- [ ] Redirect URL added: `https://api.calibr.lat/api/platforms/shopify/oauth/callback`
- [ ] OAuth scopes configured correctly
- [ ] Saved all changes
- [ ] Tested OAuth installation flow

## Common Issues

### "App not available for installation"
**Solution:** Make sure distribution model is selected and app is saved

### "Redirect URI mismatch"
**Solution:** Verify redirect URL in Shopify matches exactly:
- Production: `https://api.calibr.lat/api/platforms/shopify/oauth/callback`
- No trailing slashes, exact match required

### "Invalid scopes"
**Solution:** Ensure all required scopes are listed in app settings

## After Setup Complete

Once distribution model is selected and app is saved:

1. Test OAuth flow locally:
   ```
   http://localhost:3001/p/demo/integrations/shopify
   ```

2. Complete OAuth authorization on Shopify

3. Verify redirect back to console with success message

4. Check database to confirm integration is saved

The code is ready - just needs the Shopify Partners configuration completed!

