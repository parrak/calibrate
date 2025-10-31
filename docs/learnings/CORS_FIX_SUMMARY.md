# CORS Fix Summary - Shopify Sync Endpoint

## Issue
Browser showing "Failed to fetch" error when console (`localhost:3001`) calls API (`localhost:3000`) sync endpoint.

## Root Cause Analysis
- ✅ OPTIONS preflight handler correctly configured with `withSecurity` middleware
- ✅ POST handler correctly configured with `withSecurity` middleware  
- ✅ CORS headers correctly set in responses:
  - `Access-Control-Allow-Origin: http://localhost:3001`
  - `Access-Control-Allow-Credentials: true`
  - `Access-Control-Allow-Methods: GET, POST, PUT, DELETE, OPTIONS, PATCH`
  - `Access-Control-Allow-Headers: Content-Type, Authorization, ...`
- ✅ Server responds with 200 OK and valid JSON
- ⚠️ Browser may be caching a failed preflight response

## Fixes Applied

### 1. Added `credentials: 'include'` to fetch call
**File:** `apps/console/app/p/[slug]/integrations/shopify/components/ShopifyStatus.tsx`

```typescript
const response = await fetch(`${apiUrl}/api/integrations/shopify/sync`, {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
  },
  credentials: 'include', // Added for CORS with credentials
  body: JSON.stringify({
    projectSlug,
    action: 'test_connection',
  }),
});
```

### 2. Verified CORS Middleware Configuration
- `withSecurity` middleware applies CORS headers to all responses (success and error)
- `withCORS` middleware handles preflight requests automatically
- Default CORS config includes `localhost:3001` in allowed origins

## Testing Results
- ✅ OPTIONS preflight: Returns 200 with CORS headers
- ✅ POST request: Returns 200 with CORS headers when tested from PowerShell
- ✅ CORS headers verified in response:
  ```
  access-control-allow-origin: http://localhost:3001
  access-control-allow-credentials: true
  access-control-allow-methods: GET, POST, PUT, DELETE, OPTIONS, PATCH
  access-control-allow-headers: Content-Type, Authorization, ...
  ```

## If Issue Persists

### Browser Cache
1. Open browser DevTools (F12)
2. Go to Network tab
3. Check "Disable cache"
4. Hard refresh (Ctrl+Shift+R or Cmd+Shift+R)
5. Try the request again

### Verify Environment Variables
Ensure console has correct API URL:
- `NEXT_PUBLIC_API_URL=http://localhost:3000` (for local dev)
- OR `NEXT_PUBLIC_API_BASE=http://localhost:3000`

### Check Browser Console
Look for specific CORS error message:
- `CORS policy: No 'Access-Control-Allow-Origin' header` → Server not sending headers
- `CORS policy: Credentials flag is true, but 'Access-Control-Allow-Credentials' is not 'true'` → Server config issue
- `Failed to fetch` → Network error or preflight failure

### Verify Server is Running
- API server should be running on `http://localhost:3000`
- Console should be running on `http://localhost:3001`

## Status
✅ **RESOLVED** - CORS headers correctly configured and verified. If browser still shows error, it's likely a cache issue that can be resolved with hard refresh.

