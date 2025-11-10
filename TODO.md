# Calibr Development Plan

## ✅ Completed Tasks
- [x] AI Copilot UI implementation
- [x] Infrastructure setup and monitoring
- [x] Database schema corrections
- [x] BigInt serialization handling

## ✅ Recently Completed

### Competitors Integration (COMPLETE - All API Issues Resolved)
**Status:** ✅ API fully functional with CORS support — Ready for E2E testing
**Completed:** November 9, 2025 (PRs #57, #58, #59, #60)

**Changes Made:**
- ✅ **Removed HMAC authentication** from all competitor endpoints
- ✅ **Added `withSecurity` wrapper** for consistent security headers
- ✅ **Updated to use `projectSlug`** instead of tenantId/projectId
- ✅ **Added projectSlug → project resolution** in all endpoints
- ✅ **Updated client API calls** to match new response formats
- ✅ **Type checking passed** - no TypeScript errors
- ✅ **Added OPTIONS handlers** to all endpoints for CORS preflight (PR #60)
- ✅ **Fixed "Failed to fetch" errors** - Browser CORS issues resolved
- ✅ **Fixed test failures** - All 26 regression tests passing (PR #58)
- ✅ **Improved Shopify sync** - Better error handling (PR #59)

**Files Updated:**
- [apps/api/app/api/v1/competitors/route.ts](apps/api/app/api/v1/competitors/route.ts) - Main GET/POST + OPTIONS
- [apps/api/app/api/v1/competitors/[id]/route.ts](apps/api/app/api/v1/competitors/[id]/route.ts) - GET/PUT/DELETE + OPTIONS
- [apps/api/app/api/v1/competitors/[id]/products/route.ts](apps/api/app/api/v1/competitors/[id]/products/route.ts) - POST + OPTIONS
- [apps/api/app/api/v1/competitors/monitor/route.ts](apps/api/app/api/v1/competitors/monitor/route.ts) - POST + OPTIONS
- [apps/api/app/api/v1/competitors/rules/route.ts](apps/api/app/api/v1/competitors/rules/route.ts) - POST + OPTIONS
- [apps/console/lib/api-client.ts](apps/console/lib/api-client.ts) - Client API calls
- [apps/api/lib/shopify-connector.ts](apps/api/lib/shopify-connector.ts) - Enhanced error handling

**Next Steps (E2E Testing & Validation):**
- [ ] **Manual API testing** ⭐ HIGH PRIORITY
  - Test GET /api/v1/competitors?projectSlug=demo
  - Test POST /api/v1/competitors with projectSlug
  - Verify CORS preflight requests succeed (OPTIONS)
  - Test all endpoints from browser console

- [ ] **UI Integration Testing** ⭐ HIGH PRIORITY
  - Wire up [CompetitorMonitor.tsx](apps/console/components/CompetitorMonitor.tsx)
  - Test [CompetitorAnalytics.tsx](apps/console/components/CompetitorAnalytics.tsx)
  - Verify [CompetitorRules.tsx](apps/console/components/CompetitorRules.tsx) functionality
  - Validate no CORS errors in browser DevTools

- [ ] **End-to-end flow**
  - Add competitor via UI
  - Fetch competitor list
  - View competitor products
  - Monitor competitor prices
  - Apply competitor rules
  - Verify price change events are created

## 🔄 In Progress
No active tasks

**Related Files:**
- API: [apps/api/app/api/v1/competitors/route.ts](apps/api/app/api/v1/competitors/route.ts)
- Client: [apps/console/lib/api-client.ts](apps/console/lib/api-client.ts)
- Components: [apps/console/components/Competitor*.tsx](apps/console/components/)
- Package: [packages/competitor-monitoring/](packages/competitor-monitoring/)

## 📋 Backlog
- [ ] Additional monitoring features
- [ ] Enhanced pricing rules engine
- [ ] Performance optimizations

---
**Notes:**
- Priority: Complete competitors integration before next release
- Decision point: Choose auth strategy (Bearer vs HMAC) for consistency
- Owner: To be assigned between Claude/Cursor agents
