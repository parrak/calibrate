# Agent A: Shopify Integration - Detailed Plan

**Timeline:** 2-3 weeks
**Focus:** Production-ready Shopify connector
**Status:** Ready to start

---

## 🎯 Mission

Transform the existing Shopify connector from development state into a production-ready, fully-tested integration that allows Calibrate users to seamlessly connect their Shopify stores and manage pricing updates.

---

## 📅 Week 1: Foundation & Quality

### Day 1-2: Code Cleanup & Type Safety

**Goal:** Remove TypeScript compromises, fix all errors properly

**Tasks:**
1. **Remove strict: false**
   - Update `packages/shopify-connector/tsconfig.json`
   - Enable strict mode
   - Address all revealed type errors

2. **Fix Type Errors Properly**
   - Review current implementation in `src/`
   - Add proper type definitions
   - Remove any type assertions
   - Ensure alignment with `@calibr/platform-connector` interfaces

3. **Interface Implementation Review**
   - Verify `ShopifyConnector` fully implements `PlatformConnector`
   - Ensure `ShopifyProductOperations` implements `ProductOperations`
   - Ensure `ShopifyPricingOperations` implements `PricingOperations`
   - Ensure `ShopifyAuthOperations` implements `AuthOperations`

**Files to Modify:**
```
packages/shopify-connector/
├── tsconfig.json                 # Enable strict mode
├── src/connector.ts              # Fix any type issues
├── src/ShopifyProductOperations.ts
├── src/ShopifyPricingOperations.ts
└── src/ShopifyAuthOperations.ts
```

**Acceptance Criteria:**
- ✅ `pnpm --filter @calibr/shopify-connector typecheck` passes
- ✅ No `@ts-ignore` or `any` types used
- ✅ All interfaces properly implemented

---

### Day 3-4: Testing Infrastructure

**Goal:** Establish comprehensive test coverage

**Tasks:**
1. **Test Setup**
   - Create Vitest configuration
   - Set up test utilities
   - Create mock Shopify API responses
   - Set up test fixtures

2. **Unit Tests - Connector Core**
   ```typescript
   // tests/connector.test.ts
   - Constructor initialization
   - isAuthenticated() checks
   - authenticate() flow
   - disconnect() cleanup
   - healthCheck() status
   ```

3. **Unit Tests - Product Operations**
   ```typescript
   // tests/product-operations.test.ts
   - list() with filters
   - get() by external ID
   - getBySku() lookups
   - sync() individual product
   - syncAll() with pagination
   - count() with filters
   - Error handling (404, rate limits, etc.)
   ```

4. **Unit Tests - Pricing Operations**
   ```typescript
   // tests/pricing-operations.test.ts
   - getPrice() retrieval
   - updatePrice() single variant
   - batchUpdatePrices() multiple variants
   - GraphQL mutation building
   - Rate limit handling
   - Error scenarios
   ```

5. **Unit Tests - Auth Operations**
   ```typescript
   // tests/auth-operations.test.ts
   - validateCredentials()
   - refreshConnection()
   - getAuthUrl() generation
   - handleCallback() OAuth flow
   - Token validation
   ```

**Test Files to Create:**
```
packages/shopify-connector/tests/
├── connector.test.ts
├── product-operations.test.ts
├── pricing-operations.test.ts
├── auth-operations.test.ts
├── utils.test.ts
├── __fixtures__/
│   ├── products.json
│   ├── variants.json
│   └── graphql-responses.json
└── __mocks__/
    └── shopify-api.ts
```

**Acceptance Criteria:**
- ✅ 95%+ code coverage
- ✅ All public methods tested
- ✅ Error scenarios covered
- ✅ `pnpm test` passes in CI

---

### Day 5: Integration Tests

**Goal:** Test real API interactions (with dev store)

**Tasks:**
1. **Shopify Dev Store Setup**
   - Create Shopify Partners account
   - Create development store
   - Create custom app
   - Get Admin API credentials

2. **Integration Test Suite**
   ```typescript
   // tests/integration/shopify-api.test.ts
   describe('Shopify API Integration', () => {
     it('connects to dev store', async () => {
       // Real OAuth flow
     });

     it('fetches products', async () => {
       // Real API call
     });

     it('updates variant price', async () => {
       // Real GraphQL mutation
     });
   });
   ```

3. **Environment Setup**
   - Document required env vars
   - Create `.env.test.example`
   - Add setup instructions

**Files:**
```
packages/shopify-connector/
├── tests/integration/
│   ├── shopify-api.test.ts
│   └── oauth-flow.test.ts
├── .env.test.example
└── TESTING.md
```

**Acceptance Criteria:**
- ✅ Integration tests pass with real dev store
- ✅ OAuth flow works end-to-end
- ✅ Price updates successfully applied
- ✅ Environment documented

---

## 📅 Week 2: API Routes & UI

### Day 6-7: API Routes Implementation

**Goal:** Complete and test all API endpoints

**Tasks:**
1. **OAuth Routes**
   ```typescript
   // apps/api/app/api/platforms/shopify/oauth/install/route.ts
   - Generate OAuth URL
   - Store state parameter
   - Return redirect URL

   // apps/api/app/api/platforms/shopify/oauth/callback/route.ts
   - Validate state
   - Exchange code for token
   - Store in PlatformIntegration
   - Create sync log entry
   ```

2. **Product Routes**
   ```typescript
   // apps/api/app/api/platforms/shopify/products/route.ts
   GET    - List products
   POST   - Sync products

   // apps/api/app/api/platforms/shopify/products/[id]/route.ts
   GET    - Get single product
   PATCH  - Update product/variant
   ```

3. **Webhook Routes**
   ```typescript
   // apps/api/app/api/platforms/shopify/webhooks/route.ts
   POST   - Webhook receiver
   - Verify HMAC signature
   - Process webhook payload
   - Update local data
   - Log webhook event

   // apps/api/app/api/platforms/shopify/webhooks/register/route.ts
   POST   - Register webhooks
   DELETE - Unregister webhooks
   ```

4. **Sync Routes**
   ```typescript
   // apps/api/app/api/platforms/shopify/sync/route.ts
   POST   - Trigger manual sync
   GET    - Get sync status
   ```

**API Route Files:**
```
apps/api/app/api/platforms/shopify/
├── oauth/
│   ├── install/route.ts
│   └── callback/route.ts
├── products/
│   ├── route.ts
│   └── [id]/route.ts
├── webhooks/
│   ├── route.ts
│   └── register/route.ts
└── sync/
    └── route.ts
```

**Route Tests:**
```
apps/api/tests/platforms/shopify/
├── oauth.test.ts
├── products.test.ts
├── webhooks.test.ts
└── sync.test.ts
```

**Acceptance Criteria:**
- ✅ All routes return correct status codes
- ✅ Webhook HMAC verification works
- ✅ OAuth flow creates PlatformIntegration record
- ✅ All routes have tests

---

### Day 8-9: Console UI Components

**Goal:** Build user-friendly Shopify integration UI

**Tasks:**
1. **Main Integration Page**
   ```typescript
   // apps/console/app/p/[slug]/integrations/shopify/page.tsx
   - Show connection status
   - Display connected store info
   - Show sync status
   - List recent sync logs
   - Disconnect button
   ```

2. **Installation Flow**
   ```typescript
   // apps/console/app/p/[slug]/integrations/shopify/install/page.tsx
   - Store domain input
   - OAuth initiation
   - Loading states
   - Error handling
   - Success redirect
   ```

3. **Components**
   ```typescript
   // components/
   - ShopifyAuthButton.tsx    # Connect/Reconnect button
   - ShopifyStatus.tsx        # Connection status indicator
   - ShopifySyncControls.tsx  # Manual sync trigger
   - ShopifyProductList.tsx   # Product sync status
   - ShopifyWebhookStatus.tsx # Webhook health
   ```

**UI Files:**
```
apps/console/app/p/[slug]/integrations/shopify/
├── page.tsx
├── install/
│   └── page.tsx
└── components/
    ├── ShopifyAuthButton.tsx
    ├── ShopifyStatus.tsx
    ├── ShopifySyncControls.tsx
    ├── ShopifyProductList.tsx
    └── ShopifyWebhookStatus.tsx
```

**Design Requirements:**
- Use existing UI components from `packages/ui`
- Follow design system (Tailwind)
- Mobile responsive
- Loading states for all async actions
- Error boundaries

**Acceptance Criteria:**
- ✅ User can connect Shopify store
- ✅ OAuth flow works seamlessly
- ✅ Connection status clearly displayed
- ✅ Manual sync button works
- ✅ Error messages are clear

---

### Day 10: Documentation

**Goal:** Comprehensive setup and usage documentation

**Tasks:**
1. **Package README**
   ```markdown
   # @calibr/shopify-connector

   ## Installation
   ## Configuration
   ## Usage
   ## API Reference
   ## Testing
   ## Troubleshooting
   ```

2. **Setup Guide**
   ```markdown
   # Shopify Integration Setup Guide

   ## Prerequisites
   ## Creating a Shopify App
   ## Configuring OAuth
   ## Setting Environment Variables
   ## Testing the Connection
   ## Common Issues
   ```

3. **API Documentation**
   - Document all endpoints
   - Request/response examples
   - Error codes
   - Rate limits

**Documentation Files:**
```
packages/shopify-connector/
├── README.md
├── SETUP_GUIDE.md
└── API.md

docs/
└── integrations/
    └── shopify/
        ├── setup.md
        ├── oauth.md
        ├── webhooks.md
        └── troubleshooting.md
```

**Acceptance Criteria:**
- ✅ Developer can set up from scratch following docs
- ✅ All public APIs documented
- ✅ Troubleshooting covers common issues
- ✅ Examples for all major flows

---

## 📅 Week 3: Polish & Integration

### Day 11-12: Error Handling & Edge Cases

**Goal:** Robust error handling and edge case coverage

**Tasks:**
1. **Error Scenarios**
   - Invalid credentials
   - Expired access tokens
   - Rate limit exceeded
   - Network failures
   - Webhook signature mismatches
   - Product not found
   - Variant not found
   - Invalid price values

2. **Error Messages**
   - User-friendly error text
   - Actionable guidance
   - Error codes for debugging
   - Logging for support

3. **Rate Limiting**
   - Implement backoff strategy
   - Queue requests when at limit
   - Display rate limit status in UI

**Acceptance Criteria:**
- ✅ All error scenarios tested
- ✅ User sees helpful error messages
- ✅ Rate limits handled gracefully
- ✅ Errors logged for debugging

---

### Day 13-14: E2E Testing & Refinement

**Goal:** End-to-end workflows working smoothly

**Tasks:**
1. **E2E Test Scenarios**
   ```typescript
   // tests/e2e/shopify-integration.test.ts

   test('Complete OAuth and sync flow', async () => {
     // 1. User clicks connect
     // 2. OAuth flow completes
     // 3. Integration created
     // 4. Sync triggered
     // 5. Products synced
     // 6. Price update applied
   });
   ```

2. **Performance Testing**
   - Test with 100+ products
   - Test batch price updates
   - Measure sync times
   - Optimize slow operations

3. **User Acceptance Testing**
   - Internal team testing
   - Document feedback
   - Fix critical issues
   - Polish UX

**Acceptance Criteria:**
- ✅ Complete flow works end-to-end
- ✅ Performance acceptable (< 5s for 100 products)
- ✅ No critical bugs
- ✅ UAT feedback addressed

---

### Day 15: Integration with Other Agents' Work

**Goal:** Ensure compatibility with platform abstraction and automation

**Tasks:**
1. **Platform Connector Integration**
   - Verify ConnectorRegistry.register() works
   - Test with generic `/api/platforms/shopify` routes
   - Ensure PlatformIntegration model usage

2. **Automation Hooks**
   - Support price updates from automation system (Agent B)
   - Expose sync status for monitoring
   - Support batch operations

3. **Analytics Integration**
   - Export pricing data for analytics (Agent C)
   - Track price change performance
   - Support ROI calculation

**Acceptance Criteria:**
- ✅ Works with ConnectorRegistry
- ✅ Automation system can trigger price updates
- ✅ Analytics can access pricing data

---

## 🎯 Success Criteria (Overall)

### Technical
- ✅ 95%+ test coverage
- ✅ TypeScript strict mode enabled
- ✅ No critical vulnerabilities
- ✅ All linting passes
- ✅ API response times < 2s (p95)

### Functional
- ✅ OAuth flow completes successfully
- ✅ Products sync from Shopify to Calibrate
- ✅ Price updates push to Shopify variants
- ✅ Webhooks receive and process events
- ✅ Rate limits handled gracefully

### User Experience
- ✅ Connection setup < 5 minutes
- ✅ Clear error messages
- ✅ Loading states for all actions
- ✅ Mobile responsive UI

### Documentation
- ✅ Complete setup guide
- ✅ API documentation
- ✅ Troubleshooting guide
- ✅ Code examples

---

## 📦 Deliverables Checklist

### Code
- [ ] `packages/shopify-connector/src/` - Production code
- [ ] `packages/shopify-connector/tests/` - Test suite
- [ ] `apps/api/app/api/platforms/shopify/` - API routes
- [ ] `apps/console/app/p/[slug]/integrations/shopify/` - UI

### Tests
- [ ] Unit tests (95%+ coverage)
- [ ] Integration tests (real API)
- [ ] E2E tests (full workflows)
- [ ] Performance tests

### Documentation
- [ ] Package README
- [ ] Setup guide
- [ ] API documentation
- [ ] Troubleshooting guide

### Deployment
- [ ] Environment variables documented
- [ ] Production deployment tested
- [ ] Monitoring configured
- [ ] Runbook created

---

## 🚧 Known Challenges & Solutions

### Challenge 1: Shopify API Rate Limits
**Solution:** Implement request queue with backoff, display rate limit status to user

### Challenge 2: OAuth State Management
**Solution:** Use secure session storage, verify state parameter, handle expiration

### Challenge 3: Webhook Reliability
**Solution:** HMAC verification, idempotency, retry failed webhooks

### Challenge 4: Large Product Catalogs
**Solution:** Pagination, incremental sync, background processing

---

## 🔄 Daily Workflow

1. **Morning:**
   - Review previous day's work
   - Run full test suite
   - Update task checklist

2. **During Work:**
   - Write tests first (TDD)
   - Commit frequently
   - Update documentation as you go

3. **End of Day:**
   - Post update to `PHASE3_DAILY_LOG.md`
   - Push work to feature branch
   - Note blockers/questions

---

## 📞 Coordination Points

### With Agent B (Amazon/Automation)
- **Week 2:** Coordinate on automation hooks
- **Week 3:** Test price update triggers from automation system

### With Agent C (Platform/Console)
- **Week 1:** Confirm PlatformIntegration model usage
- **Week 2:** UI component design review
- **Week 3:** Analytics integration testing

---

## 🎓 Resources

- [Shopify Admin API](https://shopify.dev/docs/api/admin)
- [Shopify GraphQL Reference](https://shopify.dev/docs/api/admin-graphql)
- [OAuth Guide](https://shopify.dev/docs/apps/auth/oauth)
- [Webhooks](https://shopify.dev/docs/apps/webhooks)
- [Rate Limits](https://shopify.dev/docs/api/usage/rate-limits)

---

**Status:** Ready to Start
**Start Date:** October 28, 2025
**Target Completion:** November 15, 2025

Generated with Claude Code
Co-Authored-By: Claude <noreply@anthropic.com>
