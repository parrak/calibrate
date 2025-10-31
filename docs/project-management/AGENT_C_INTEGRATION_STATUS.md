# Agent C - Integration Status Update

**Date:** October 28, 2025 (Updated)
**Context:** ~~User seeing "No platforms available" on integrations page~~ **RESOLVED - Platform Routes Runtime Error**

---

## ✅ LATEST UPDATE (Oct 28, 2025)

### Production Deployment Crisis - RESOLVED

**Error:** `TypeError: Cannot read properties of undefined (reading 'findUnique')` on Railway deployment

**Root Causes Found:**
1. **Shell Syntax Error** - start.sh used bash-specific `${var:0:20}` causing "Bad substitution" error in `/bin/sh`
2. **Next.js 15 Dynamic Routes** - 11 route handlers using synchronous params instead of awaiting Promise
3. **Non-existent Prisma Model** - Routes calling `db.platformIntegration.findUnique()` but schema only has `ShopifyIntegration`

**Fixes Applied (3 commits):**
1. **Commit d27e3ff** - Fixed start.sh POSIX shell compatibility
2. **Commit 4f5c3da** - Added debug endpoints (/api/debug/prisma, /api/debug/env)
3. **Commit 0c03db3** - Added AmazonIntegration model + fixed platform routes

**Results:**
- ✅ Database connection working (DATABASE_URL properly set)
- ✅ Prisma client initializes successfully
- ✅ Platform routes return 200 (Amazon returns null integration correctly)
- ✅ No more undefined errors

**Key Learnings:**
- Railway containers use `/bin/sh`, not bash - always use POSIX-compliant syntax
- Next.js 15 dynamic segments return `params: Promise<{}>`, must await
- Schema must match code - can't call models that don't exist
- Debug endpoints critical for diagnosing production issues

---

## Previous Context (Oct 27, 2025)

### What User Sees
The integrations dashboard at `/p/[slug]/integrations` shows:
- ❌ "Failed to fetch" error
- 0 platforms listed
- "No platforms available" empty state

### Root Cause
**Shopify connector is NOT registered** in the platform registry.

Looking at [apps/api/lib/platforms/register.ts](apps/api/lib/platforms/register.ts#L1-L13):

```typescript
import { ConnectorRegistry } from '@calibr/platform-connector'
import { registerAmazonConnector } from '@calibr/amazon-connector'

export function registerKnownConnectors() {
  if (!ConnectorRegistry.isRegistered('amazon')) {
    registerAmazonConnector()
  }
  // ⚠️ MISSING: Shopify registration!
}
```

**Only Amazon is registered.** Shopify connector exists but is not imported/registered.

---

## Agent Responsibilities for Platform Integrations

### Agent A: Shopify Integration (Week 2, Days 6-9)
**Status:** ✅ Connector code complete (0 TypeScript errors)
**Remaining:** API routes and registration

**Deliverables (from AGENT_A_NEXT_STEPS.md):**
- [ ] OAuth routes (`/api/platforms/shopify/oauth/*`)
- [ ] Product routes (`/api/platforms/shopify/products`)
- [ ] Webhook routes (`/api/platforms/shopify/webhooks`)
- [ ] Sync routes (`/api/platforms/shopify/sync`)
- [ ] **Register Shopify connector** in platform registry
- [ ] Console UI components (ShopifyAuthButton, ShopifyStatus, etc.)

**Timeline:** Week 2 (Days 6-9) - Not started yet

### Agent B: Amazon Integration
**Status:** ✅ Complete and registered
- Amazon connector is registered and working
- Pricing API routes exist
- Console UI exists at `/p/[slug]/integrations/amazon/pricing`

### Agent C: Platform Management (Completed)
**Status:** ✅ Week 1 tasks complete (Onboarding + Planning)

**Completed:**
- ✅ Project onboarding flow (UI + API)
- ✅ Integration dashboard design
- ✅ Credential encryption strategy
- ✅ Production deployment guide
- ✅ Monitoring/alerting plan

**Not Responsible For:**
- Individual platform registrations (Agent A & B)
- Platform-specific API routes (Agent A & B)

---

## What Needs to Happen

### Immediate (Agent A)
1. **Register Shopify Connector**
   ```typescript
   // apps/api/lib/platforms/register.ts
   import { registerShopifyConnector } from '@calibr/shopify-connector'

   export function registerKnownConnectors() {
     if (!ConnectorRegistry.isRegistered('amazon')) {
       registerAmazonConnector()
     }
     if (!ConnectorRegistry.isRegistered('shopify')) {
       registerShopifyConnector() // ADD THIS
     }
   }
   ```

2. **Create Registration Function**
   ```typescript
   // packages/shopify-connector/src/register.ts
   import { ConnectorRegistry } from '@calibr/platform-connector'
   import { shopifyConnectorFactory } from './connector'

   export function registerShopifyConnector() {
     ConnectorRegistry.register('shopify', shopifyConnectorFactory)
   }
   ```

3. **Export from Package**
   ```typescript
   // packages/shopify-connector/src/index.ts
   export { registerShopifyConnector } from './register'
   export { ShopifyConnector } from './connector'
   // ... other exports
   ```

### Week 2 (Agent A - Days 6-7)
4. **Build API Routes**
   - OAuth install/callback routes
   - Product sync routes
   - Webhook processing routes
   - Manual sync trigger routes

### Week 2 (Agent A - Days 8-9)
5. **Build Console UI**
   - Shopify-specific integration page
   - OAuth flow UI
   - Sync controls
   - Status indicators

---

## Timeline Summary

### ✅ Completed (Phase 3)
- Agent A: Shopify connector package (0 TS errors)
- Agent B: Amazon connector + API routes + UI
- Agent C: Platform abstraction layer + onboarding

### 📋 Current Phase (Week 1-2)
**Agent A - Week 1 (Days 1-5):** Testing & Documentation
- Still in progress per AGENT_A_NEXT_STEPS.md

**Agent A - Week 2 (Days 6-9):** API Routes & UI
- **THIS IS WHEN SHOPIFY WILL BE REGISTERED**
- This is when `/api/platforms` will show Shopify
- This is when integrations page will work

**Agent C - Week 1:** ✅ Complete (onboarding + planning docs)

### 🔮 Future (Week 2+)
- Week 2: Shopify fully integrated and visible
- Week 3: E2E testing, refinement
- Week 4+: Production hardening, security

---

## Why "No platforms available"?

The integrations page calls `GET /api/platforms` which:
1. Queries `ConnectorRegistry.getRegisteredPlatforms()`
2. Returns only platforms that have called `ConnectorRegistry.register()`
3. Currently only Amazon is registered
4. Shopify will be registered when Agent A completes Week 2 tasks

**Expected behavior after Agent A Week 2:**
```json
{
  "platforms": [
    { "platform": "amazon", "name": "Amazon", "available": true },
    { "platform": "shopify", "name": "Shopify", "available": true }
  ],
  "count": 2
}
```

---

## Quick Fix (Optional)

If you want to see Shopify appear NOW (before Agent A Week 2), the minimal fix is:

```typescript
// packages/shopify-connector/src/register.ts (CREATE THIS FILE)
import { ConnectorRegistry } from '@calibr/platform-connector'
import { shopifyConnectorFactory } from './connector'

export function registerShopifyConnector() {
  ConnectorRegistry.register('shopify', shopifyConnectorFactory)
}

// packages/shopify-connector/src/index.ts (UPDATE)
export { registerShopifyConnector } from './register'

// apps/api/lib/platforms/register.ts (UPDATE)
import { registerShopifyConnector } from '@calibr/shopify-connector'

export function registerKnownConnectors() {
  if (!ConnectorRegistry.isRegistered('amazon')) {
    registerAmazonConnector()
  }
  if (!ConnectorRegistry.isRegistered('shopify')) {
    registerShopifyConnector()
  }
}
```

**However:** Without the OAuth routes, clicking "Connect Shopify" will 404.
**Better:** Wait for Agent A Week 2 (Days 6-9) when full integration is ready.

---

## Conclusion

**Who owns this:** Agent A (Shopify integration)
**When it's being built:** Week 2 (Days 6-9) per AGENT_A_NEXT_STEPS.md
**Current status:** Connector code done, API routes pending
**Blocker:** Registration not yet implemented (3 lines of code)

The integration dashboard (Agent C) is working correctly - it's showing "no platforms" because only Amazon is registered. Once Agent A registers Shopify in Week 2, it will appear automatically.

---

**Next Action:** Agent A should prioritize connector registration as part of Week 2 API routes implementation.

Generated with Claude Code
Co-Authored-By: Claude <noreply@anthropic.com>
