# Next.js 15 Dynamic Route Parameters Fix

**Date:** October 29, 2025  
**Issue:** API deployed to Railway failing with `TypeError: Cannot read properties of undefined`

## Root Cause

Next.js 15 changed dynamic route parameters from object to Promise. Routes were not awaiting the `params` Promise.

## Fix

**Before (broken):**
```typescript
export const GET = async (req: NextRequest, { params }: { params: { id: string } }) => {
  const { id } = params;
  // ...
}
```

**After (fixed):**
```typescript
export const GET = async (req: NextRequest, context: { params: Promise<{ id: string }> }) => {
  const { id } = await context.params;
  // ...
}
```

## Files Affected

11 dynamic route handlers across:
- `/api/v1/price-changes/[id]`
- `/api/v1/analytics/[projectId]`
- `/api/platforms/[platform]`
- `/api/integrations/[platform]`

## Key Learning

In Next.js 15, `params` is always a Promise and must be awaited before use.

