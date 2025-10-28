# CRITICAL: CORS Middleware Required for All API v1 Endpoints

## ⚠️ DO NOT SKIP THIS

All endpoints in `apps/api/app/api/v1/` **MUST** use the `withSecurity` middleware to enable CORS headers.

## Why This Matters

The console frontend (`console.calibr.lat` and Vercel previews) calls the API from a different domain. Without CORS headers, browsers block these requests.

## How to Apply

### Pattern to Use

```typescript
import { NextRequest, NextResponse } from 'next/server'
import { withSecurity } from '@/lib/security-headers'

export const GET = withSecurity(async (req: NextRequest) => {
  // Your handler code
  return NextResponse.json({ data })
})

export const POST = withSecurity(async (req: NextRequest) => {
  // Your handler code
  return NextResponse.json({ data })
})

// CRITICAL: Always add OPTIONS handler for CORS preflight
export const OPTIONS = withSecurity(async (req: NextRequest) => {
  return new NextResponse(null, { status: 204 })
})
```

**⚠️ CRITICAL**: You MUST export an OPTIONS handler wrapped with `withSecurity`. Without it, Next.js will use its default OPTIONS handler which does NOT include CORS headers, causing preflight requests to fail.

### What withSecurity Does

1. **Applies CORS headers**:
   - `Access-Control-Allow-Origin` (checks against allowlist)
   - `Access-Control-Allow-Methods`
   - `Access-Control-Allow-Headers`
   - `Access-Control-Allow-Credentials`

2. **Applies security headers**:
   - Content-Security-Policy
   - Strict-Transport-Security
   - X-Frame-Options
   - etc.

3. **Handles preflight** (OPTIONS requests) - **BUT ONLY if you export an OPTIONS handler!**

## CORS Configuration

**File**: `apps/api/lib/security-headers.ts`

**Allowed Origins**:
- `https://calibr.lat`
- `https://console.calibr.lat`
- `https://docs.calibr.lat`
- `http://localhost:3000-3002`
- **Any Vercel preview URL containing "console"**

```typescript
// Allow Vercel preview deployments for console
if (origin.includes('.vercel.app') && origin.includes('console')) {
  return true
}
```

## Endpoints Status

### ✅ Has withSecurity + OPTIONS Handler
- `/api/projects` - GET, POST, OPTIONS *(Fixed Oct 27, 2025)*
- `/api/v1/catalog` - GET, OPTIONS *(Fixed Oct 27, 2025)*
- `/api/v1/price-changes` - GET, OPTIONS *(Fixed Oct 27, 2025)*
- `/api/staging/manage` - GET, POST, OPTIONS *(Fixed Oct 27, 2025)*
- `/api/admin/dashboard` - GET, OPTIONS *(Fixed Oct 27, 2025)*
- `/api/platforms` - GET, OPTIONS *(Fixed Oct 28, 2025)*
- `/api/platforms/[platform]` - GET, POST, DELETE, OPTIONS *(Fixed Oct 28, 2025)* ⭐ NEW
- `/api/v1/competitors` - GET, POST, OPTIONS *(Fixed Oct 28, 2025)*
- `/api/v1/price-changes/[id]/approve` - POST
- `/api/v1/price-changes/[id]/reject` - POST
- `/api/v1/price-changes/[id]/apply` - POST

### ❌ Needs withSecurity
- `/api/v1/competitors/[id]` - GET
- `/api/v1/competitors/[id]/products` - GET
- `/api/v1/competitors/rules` - GET, POST
- `/api/v1/competitors/monitor` - POST

## Symptoms of Missing CORS

If an endpoint is missing `withSecurity`:

**Browser Console**:
```
Access to fetch at 'https://api.calibr.lat/api/v1/catalog?project=demo'
from origin 'https://console-xxx.vercel.app' has been blocked by CORS policy:
No 'Access-Control-Allow-Origin' header is present on the requested resource.
```

**Network Tab**:
- Request shows as failed (red)
- No `Access-Control-Allow-Origin` header in response
- Status might show as `(failed)` or CORS error

**Console UI**:
- "Failed to fetch" errors
- Empty data / loading states never resolve
- Red error banners

## Testing CORS

### From Browser Console
```javascript
fetch('https://api.calibr.lat/api/v1/catalog?project=demo')
  .then(r => r.json())
  .then(console.log)
  .catch(console.error)
```

Should see data, not CORS error.

### From curl
```bash
curl -I -H "Origin: https://console-xxx.vercel.app" \
  "https://api.calibr.lat/api/v1/catalog?project=demo"
```

Should include:
```
Access-Control-Allow-Origin: https://console-xxx.vercel.app
```

## The OPTIONS Handler Issue (CRITICAL LEARNING)

**Problem Discovered**: Oct 27, 2025 (commit 7227171)

Even with `withSecurity` wrapping GET/POST handlers, **CORS was still failing** because:

1. Browser sends **OPTIONS preflight request** before actual request
2. Next.js has a **built-in OPTIONS handler** that returns 204
3. This built-in handler **does NOT run middleware** like withSecurity
4. Preflight returns 204 **without CORS headers**
5. Browser **blocks the actual request** due to failed preflight

**Solution**: ALWAYS export an explicit OPTIONS handler:

```typescript
export const OPTIONS = withSecurity(async (req: NextRequest) => {
  return new NextResponse(null, { status: 204 })
})
```

This ensures withSecurity runs for OPTIONS requests and adds CORS headers.

**Testing**: After adding OPTIONS handler, verify with:
```bash
curl -X OPTIONS -H "Origin: https://console-xxx.vercel.app" \
  -H "Access-Control-Request-Method: GET" \
  -i "https://api.calibr.lat/api/endpoint"
```

You should see:
- `Access-Control-Allow-Origin: https://console-xxx.vercel.app`
- `X-Cors-Allowed: true`
- `X-Cors-Debug: origin=https://console-xxx.vercel.app`

## Related Issues Fixed

- **Oct 27, 2025**: NextAuth 500 errors (commit 32adfc4)
- **Oct 27, 2025**: Redirect loops (commit b5cb4d0)
- **Oct 27, 2025**: Catalog CORS (commit a05ea57)
- **Oct 27, 2025**: CORS for Vercel previews (commit 321d43f)
- **Oct 27, 2025**: Missing withSecurity on /projects (commit 4340d8b)
- **Oct 27, 2025**: **Missing OPTIONS handlers** (commit 7227171) ⚠️ CRITICAL
- **Oct 28, 2025**: **Platforms endpoint CORS** (commit 3d6d114)
- **Oct 28, 2025**: **Competitors endpoint CORS** (commit 60432b1)
- **Oct 28, 2025**: **Platform-specific endpoints CORS** (/api/platforms/[platform]) ⭐ LATEST

## For Other Agents

**BEFORE creating new v1 endpoints:**
1. ✅ Import `withSecurity` from `@/lib/security-headers`
2. ✅ Wrap ALL route handlers (GET, POST, PUT, DELETE, PATCH, **OPTIONS**)
3. ✅ **ALWAYS export OPTIONS handler** with withSecurity wrapper
4. ✅ Test with browser console to verify CORS works
5. ✅ Test OPTIONS request with curl to verify preflight works
6. ✅ Update this document's "Endpoints Status" section

**WHEN modifying existing endpoints:**
1. ⚠️ DO NOT remove `withSecurity` wrapper
2. ⚠️ DO NOT change CORS config without coordination
3. ⚠️ Test that existing console functionality still works

## Emergency Contact

If console shows CORS errors after your changes:
1. Check if you removed or bypassed `withSecurity`
2. Check if you modified `security-headers.ts` CORS config
3. Restore from commit a05ea57 or later
4. Contact Agent C or check AGENT_C_OCT27_SUMMARY.md

---

**Last Updated**: Oct 28, 2025
**Maintained By**: Agent C
**Critical Priority**: ⚠️ HIGH
