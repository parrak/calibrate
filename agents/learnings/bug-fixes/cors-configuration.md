# CORS Configuration - Critical Requirements

## Issue

Browser showing "Failed to fetch" error when console (`localhost:3001`) calls API (`localhost:3000`) endpoints.

## Root Cause Analysis

CORS (Cross-Origin Resource Sharing) requires:
1. OPTIONS preflight handler with `withSecurity` middleware
2. POST/GET handlers with `withSecurity` middleware  
3. Proper CORS headers in responses
4. `credentials: 'include'` in fetch calls from frontend

## Fix Requirements

### Backend (API Routes)

All API routes called from console must have:

```typescript
import { withSecurity } from '@calibr/security'

// OPTIONS handler for preflight
export const OPTIONS = withSecurity(async function OPTIONS() {
  return NextResponse.json({}, { status: 200 })
})

// POST/GET handlers with security middleware
export const POST = withSecurity(async function POST(req: NextRequest) {
  // Handler logic
})
```

### Frontend (Console)

All fetch calls must include:

```typescript
const response = await fetch(`${apiUrl}/api/endpoint`, {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
  },
  credentials: 'include', // Required for CORS with credentials
  body: JSON.stringify(data),
})
```

## CORS Headers

The `withSecurity` middleware automatically sets:
- `Access-Control-Allow-Origin: http://localhost:3001` (or configured origin)
- `Access-Control-Allow-Credentials: true`
- `Access-Control-Allow-Methods: GET, POST, PUT, DELETE, OPTIONS, PATCH`
- `Access-Control-Allow-Headers: Content-Type, Authorization, ...`

## Testing

If browser still shows error after applying fixes:
1. Hard refresh (Ctrl+Shift+R or Cmd+Shift+R)
2. Check browser DevTools Network tab
3. Verify OPTIONS preflight returns 200
4. Verify POST/GET returns 200 with CORS headers

## Files Modified

- `apps/api/app/api/integrations/shopify/sync/route.ts` - Added OPTIONS handler
- `apps/console/app/p/[slug]/integrations/shopify/components/ShopifyStatus.tsx` - Added credentials

