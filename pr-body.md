## Summary

This PR fixes multiple console website errors that were causing API calls to fail.

## Issues Fixed

- ✅ **Price Changes API 400 errors** - Fixed API_BASE defaults from empty string to proper URL
- ✅ **Catalog API 500 errors** - Added proper error handling with try-catch blocks
- ✅ **Analytics API 404 errors** - Endpoint now accepts both projectId and project slug, fixed API base URL
- ✅ **Shopify Sync 500 errors** - Made SHOPIFY_WEBHOOK_SECRET optional to prevent failures

## Changes

### API Changes
- `apps/api/app/api/v1/analytics/[projectId]/route.ts` - Now accepts project slugs
- `apps/api/app/api/v1/catalog/route.ts` - Added error handling
- `apps/api/lib/shopify-connector.ts` - Made webhook secret optional

### Console Changes
- Fixed `API_BASE` defaults in 7 files to use `'https://api.calibr.lat'` instead of empty string
- Updated analytics dashboard to use correct API base URL

### Tests
- Added regression test suite: `apps/api/tests/regression-console-errors.test.ts`

## Testing

- ✅ All fixes tested locally
- ✅ Regression tests added (9 passing)
- ✅ No breaking changes

## Related Errors Fixed

```
GET https://api.calibr.lat/api/v1/price-changes?project=demo 400 (Bad Request)
GET https://api.calibr.lat/api/v1/catalog?project=demo 500 (Internal Server Error)
GET https://console.calibr.lat/api/v1/analytics/demo?days=30 404 (Not Found)
POST https://api.calibr.lat/api/platforms/shopify/sync 500 (Internal Server Error)
```

