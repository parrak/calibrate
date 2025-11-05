# Shopify Connector Registration Fix

**Date:** October 28, 2025  
**Priority:** CRITICAL  
**Status:** ✅ FIXED

## Issue

Integrations page showing:
- "Failed to fetch" error
- "No platforms available" message
- All stats showing 0 (Total Platforms: 0, Connected: 0, etc.)

## Root Cause

Only Amazon connector was being registered. Shopify connector was NOT imported, so not registered.

**File:** `apps/api/lib/platforms/register.ts`

**Before:**
```typescript
import { ConnectorRegistry } from '@calibr/platform-connector'
import { registerAmazonConnector } from '@calibr/amazon-connector'

export function registerKnownConnectors() {
  if (!ConnectorRegistry.isRegistered('amazon')) {
    registerAmazonConnector()
  }
}
```

## Fix

**After:**
```typescript
import { ConnectorRegistry } from '@calibr/platform-connector'
import { registerAmazonConnector } from '@calibr/amazon-connector'
// Import Shopify connector to trigger auto-registration
import '@calibr/shopify-connector'

export function registerKnownConnectors() {
  if (!ConnectorRegistry.isRegistered('amazon')) {
    registerAmazonConnector()
  }
  // Shopify auto-registers on import (see packages/shopify-connector/src/index.ts)
}
```

## Key Learning

The Shopify connector auto-registers on import (see `packages/shopify-connector/src/index.ts`), but it was never imported in the registration file.

## Testing

After fix, `/api/platforms` should return both Shopify and Amazon platforms.

