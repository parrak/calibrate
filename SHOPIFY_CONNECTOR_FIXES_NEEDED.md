# Shopify Connector TypeScript Errors - URGENT

**Blocking**: Console deployment on Vercel
**Branch**: master
**Package**: `packages/shopify-connector`

## Build Command to Test
```bash
cd packages/shopify-connector && pnpm build
```

## Critical Errors to Fix

### 1. Duplicate property declarations (ShopifyConnector.ts)
- Lines 56-57 and 74-81: `products` and `pricing` declared twice
- Fix: Remove duplicate declarations

### 2. Missing type exports from platform-connector
- `BatchPriceUpdateResult` - should be `PriceUpdateResult`
- `PriceValidationResult` - doesn't exist
- `Product` - should be `NormalizedProduct`
- `ProductCountResult` - doesn't exist

### 3. Type assertions needed for 'unknown'
- Multiple `response` variables are type 'unknown'
- Add type assertions: `as ShopifyResponse` or proper typing

### 4. Null safety issues
- `credentials` possibly null (ShopifyAuthOperations.ts:34-35)
- `this.client` possibly null (multiple files)
- Add null checks or non-null assertions

### 5. Missing ProductFilter properties
- `createdAfter`, `createdBefore`, `updatedBefore` don't exist on ProductFilter
- Either add to platform-connector interface or remove usage

## Quick Fixes

1. Add tsconfig.json with `"strict": false` temporarily
2. Or fix type errors properly per above

## Agent A Action Required
Please fix these errors ASAP - they're blocking console deployment.
