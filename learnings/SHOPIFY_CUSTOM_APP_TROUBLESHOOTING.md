# Troubleshooting: Custom App "Unauthorized Access"

## Current Status
✅ Redirect URIs are configured correctly:
- `http://localhost:3000/api/platforms/shopify/oauth/callback`
- `https://api.calibr.lat/api/platforms/shopify/oauth/callback`

✅ Install URL is being generated correctly:
- `https://calibr-test.myshopify.com/admin/oauth/authorize?...`

❌ But getting "Unauthorized Access" error when authorizing

## Possible Causes

### 1. **User Permissions**
For Custom apps, the user attempting installation must:
- ✅ Be logged into Shopify as **store owner** or **Plus organization admin**
- ✅ Have permission to install apps on `calibr-test.myshopify.com`
- ❌ Regular staff members may not be able to install Custom apps

**Check:**
- Are you logged in as the store owner?
- Or logged in as an admin of the Plus organization?

### 2. **Custom App Limitations**
Custom apps are designed for:
- Single organization (Plus org)
- Same account that created the app

**The error shows:**
```
https://admin.shopify.com/store/calibr-test/oauth/authorize
```

This is Shopify's internal redirect, which suggests:
- The OAuth request is being processed
- But authorization is failing at the permission check

### 3. **App Not Available for Store**
Custom apps can only be installed on:
- The store specified during app creation (`calibr-test.myshopify.com`)
- Other stores in the **same Plus organization** (if multi-store install enabled)

**Verify:**
- Is `calibr-test.myshopify.com` the exact store domain you specified?
- Is it in the same Plus organization?

## Solutions to Try

### Solution 1: Use Shopify's Install Link
Custom apps provide a direct install link. Try using it:

1. **Copy the install link from Shopify Partners Dashboard:**
   ```
   https://admin.shopify.com/oauth/install_custom_app?client_id=55d12ed6f0420a21cd0682db635a7fa1&no_redirect=true&signature=...
   ```

2. **Access it while logged into `calibr-test.myshopify.com` admin**

3. **Or modify your code to use this link** (though this bypasses your OAuth flow)

### Solution 2: Verify Store Owner Access
1. **Log into `calibr-test.myshopify.com` admin**
2. **Go to Settings → Users and permissions**
3. **Verify you're listed as Store owner**
4. **Try OAuth flow again**

### Solution 3: Check Plus Organization
1. **Verify `calibr-test.myshopify.com` is part of a Plus organization**
2. **Verify you're an admin of that organization**
3. **Enable "Allow multi-store install" if testing with other stores**

### Solution 4: Switch to Public App (Recommended)
Custom apps have these limitations. For production, switch to **Public app**:

1. **Shopify Partners Dashboard** → Your app → **App setup**
2. **Change Distribution:** Custom → **Public app**
3. **Fill in required fields** (name, description, website)
4. **Save**
5. **Test OAuth flow again** - should work with any store

## Testing Steps

### Test 1: Direct Install Link
1. Open the install link from Shopify Partners Dashboard
2. Make sure you're logged into `calibr-test.myshopify.com` admin
3. Click "Install app"
4. Should redirect to your callback

### Test 2: Verify Redirect URI Match
Check the redirect URI in the error matches exactly:
- Error shows: `http://localhost:3000/api/platforms/shopify/oauth/callback`
- Dashboard has: `http://localhost:3000/api/platforms/shopify/oauth/callback`
- ✅ Should match exactly (verify no trailing slashes or spaces)

### Test 3: Check Environment Variable
Verify your API server is using the correct redirect URI:
```bash
# Check what redirect URI is being generated
curl "http://localhost:3000/api/platforms/shopify/oauth/install?project=demo&shop=calibr-test.myshopify.com"
```

Should return:
```json
{
  "installUrl": "https://calibr-test.myshopify.com/admin/oauth/authorize?redirect_uri=http://localhost:3000/api/platforms/shopify/oauth/callback&..."
}
```

## Most Likely Fix

**The issue is likely user permissions:**
- Custom apps require **store owner** or **Plus org admin** to install
- Regular users cannot install Custom apps
- Make sure you're logged in with the correct permissions

**Or switch to Public app** for production use, which doesn't have these restrictions.

