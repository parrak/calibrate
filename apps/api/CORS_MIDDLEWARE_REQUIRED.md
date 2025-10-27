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
```

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

3. **Handles preflight** (OPTIONS requests)

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

### ✅ Has withSecurity
- `/api/v1/price-changes` - GET
- `/api/v1/price-changes/[id]/approve` - POST
- `/api/v1/price-changes/[id]/reject` - POST
- `/api/v1/price-changes/[id]/apply` - POST
- `/api/v1/catalog` - GET *(Fixed Oct 27, 2025)*

### ❌ Needs withSecurity
- `/api/v1/competitors` - GET
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

## Related Issues Fixed

- **Oct 27, 2025**: NextAuth 500 errors (commit 32adfc4)
- **Oct 27, 2025**: Redirect loops (commit b5cb4d0)
- **Oct 27, 2025**: Catalog CORS (commit a05ea57)
- **Oct 27, 2025**: CORS for Vercel previews (commit 321d43f)

## For Other Agents

**BEFORE creating new v1 endpoints:**
1. ✅ Import `withSecurity` from `@/lib/security-headers`
2. ✅ Wrap ALL route handlers (GET, POST, PUT, DELETE, PATCH)
3. ✅ Test with browser console to verify CORS works
4. ✅ Update this document's "Endpoints Status" section

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

**Last Updated**: Oct 27, 2025
**Maintained By**: Agent C
**Critical Priority**: ⚠️ HIGH
