# CORS Debugging Session - Oct 27, 2025

## Current Status: CORS Still Failing

### Symptoms (Latest)
- Preflight (OPTIONS) succeeds: 204
- Actual request (GET) fails with CORS error
- Endpoint: `/api/v1/price-changes?project=demo`
- Origin: Vercel preview URL

### Network Log Evidence
```
price-changes?project=demo    CORS error    fetch    214 ms
price-changes?project=demo    204           preflight 207 ms
```

This pattern means:
1. ✅ Preflight request sent → approved (204)
2. ✅ Browser sends actual GET request
3. ❌ Response missing `Access-Control-Allow-Origin` header
4. ❌ Browser blocks the response

## Code Analysis

### Endpoint Configuration
**File**: `apps/api/app/api/v1/price-changes/route.ts`
```typescript
export const GET = withSecurity(trackPerformance(async (req: NextRequest) => {
  // handler
}))
```

**Status**: HAS withSecurity middleware ✅

### CORS Middleware
**File**: `apps/api/lib/security-headers.ts`

**Origin Check** (lines 188-208):
```typescript
origin: (origin) => {
  if (!origin) return true

  const allowedOrigins = [
    'https://calibr.lat',
    'https://console.calibr.lat',
    'https://docs.calibr.lat',
    'http://localhost:3000',
    'http://localhost:3001',
    'http://localhost:3002'
  ]

  // Allow Vercel preview deployments for console
  if (origin.includes('.vercel.app') && origin.includes('console')) {
    return true
  }

  return allowedOrigins.includes(origin)
}
```

**Status**: Should allow Vercel previews ✅

### withSecurity Flow
```
Request → withCORS → withSecurityHeaders → handler → response
                ↓                                        ↓
          Handle preflight                    Apply CORS headers
```

**Line 340-341**:
```typescript
const securityHandler = withSecurityHeaders(handler, options?.securityHeaders)
return withCORS(securityHandler, options?.cors)
```

**Line 318-326** (withCORS actual request):
```typescript
// Process the request
const response = await handler(req)

// Apply CORS headers
return corsManager.applyCORSHeaders(req, response)
```

**Status**: Should apply CORS to response ✅

## Theories

### Theory 1: Railway Hasn't Deployed Latest ⚠️
**Likelihood**: HIGH

**Evidence**:
- Latest commit: a05ea57 (catalog fix)
- Commit with CORS Vercel support: 321d43f
- Railway may be running older commit

**How to Check**:
1. Check Railway dashboard - deployment history
2. Look for SHA of currently running deployment
3. Verify it includes commit 321d43f or later

**Fix**: Wait for Railway to finish deploying

### Theory 2: Next.js Response Caching
**Likelihood**: MEDIUM

**Evidence**:
- Preflight works (fresh each time)
- GET response fails (might be cached)

**Fix**:
- Add cache headers to prevent caching
- Or wait for cache TTL to expire

### Theory 3: trackPerformance Breaking CORS
**Likelihood**: LOW

**Evidence**:
- trackPerformance wraps the handler
- Returns the response from handler
- Shouldn't interfere with outer withSecurity

**Code Review Needed**:
Check if trackPerformance modifies response object

### Theory 4: Origin Value Mismatch
**Likelihood**: LOW

**Evidence**:
- Code checks for `.vercel.app` AND `console`
- Should match `console-xxx.vercel.app`

**How to Check**:
- Console.log the actual origin value in security-headers.ts
- Verify it matches our pattern

## Commits Timeline

| Time | Commit | Description |
|------|--------|-------------|
| Earlier | 321d43f | CORS Vercel preview support |
| Recent | a05ea57 | Catalog withSecurity |
| Latest | 4e50cdf | CORS documentation |

## Next Steps

1. **Verify Railway Deployment**
   - Check Railway dashboard
   - Confirm running commit SHA
   - Look for deployment logs/errors

2. **If Railway is Current**
   - Add debug logging to security-headers.ts
   - Log actual origin values
   - Log CORS decision (allow/deny)

3. **If Still Failing**
   - Check if Next.js has special CORS handling
   - Verify middleware order (maybe swap trackPerformance and withSecurity)
   - Add explicit CORS headers in Next.js config

## Testing Commands

### Check Current API Response Headers
```bash
curl -I -H "Origin: https://console-xxx.vercel.app" \
  "https://api.calibr.lat/api/v1/price-changes?project=demo"
```

**Expected**:
```
Access-Control-Allow-Origin: https://console-xxx.vercel.app
Access-Control-Allow-Methods: GET, POST, PUT, DELETE, OPTIONS, PATCH
```

### Check Preflight
```bash
curl -X OPTIONS \
  -H "Origin: https://console-xxx.vercel.app" \
  -H "Access-Control-Request-Method: GET" \
  "https://api.calibr.lat/api/v1/price-changes?project=demo"
```

**Expected**: 200 or 204 with CORS headers

## Browser Debug

**In Console** (while on Vercel preview):
```javascript
fetch('https://api.calibr.lat/api/v1/price-changes?project=demo', {
  headers: { 'Origin': window.location.origin }
})
.then(r => { console.log('Headers:', r.headers); return r.json() })
.then(console.log)
.catch(console.error)
```

Look for `access-control-allow-origin` in response headers.

## Temporary Workaround

If Railway deployment is stuck, can manually trigger:
```bash
cd apps/api
railway service
# Select API service
# Trigger manual redeploy
```

Or via Railway dashboard: Deployments → Redeploy

---

**Session**: Oct 27, 2025
**Agent**: Agent C
**Status**: Investigating CORS failure despite code being correct
**Next**: Verify Railway deployment status
