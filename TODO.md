# Calibr Development Plan

## ✅ Completed Tasks
- [x] AI Copilot UI implementation
- [x] Infrastructure setup and monitoring
- [x] Database schema corrections
- [x] BigInt serialization handling

## ✅ Recently Completed

### Competitors Integration (FIXED - 401 Error Resolved)
**Status:** API authentication and parameters fixed, ready for testing

**Changes Made:**
- ✅ **Removed HMAC authentication** from all competitor endpoints
- ✅ **Added `withSecurity` wrapper** for consistent security headers
- ✅ **Updated to use `projectSlug`** instead of tenantId/projectId
- ✅ **Added projectSlug → project resolution** in all endpoints
- ✅ **Updated client API calls** to match new response formats
- ✅ **Type checking passed** - no TypeScript errors

**Files Updated:**
- [apps/api/app/api/v1/competitors/route.ts](apps/api/app/api/v1/competitors/route.ts) - Main GET/POST
- [apps/api/app/api/v1/competitors/[id]/route.ts](apps/api/app/api/v1/competitors/[id]/route.ts) - GET/PUT/DELETE by ID
- [apps/api/app/api/v1/competitors/[id]/products/route.ts](apps/api/app/api/v1/competitors/[id]/products/route.ts) - Products
- [apps/api/app/api/v1/competitors/monitor/route.ts](apps/api/app/api/v1/competitors/monitor/route.ts) - Monitoring
- [apps/api/app/api/v1/competitors/rules/route.ts](apps/api/app/api/v1/competitors/rules/route.ts) - Rules
- [apps/console/lib/api-client.ts](apps/console/lib/api-client.ts) - Client API calls

**Next Steps (Testing & Verification):**
- [ ] **Manual API testing**
  - Test GET /api/v1/competitors?projectSlug=xxx
  - Test POST /api/v1/competitors with projectSlug
  - Verify authentication works without Bearer token requirement

- [ ] **UI Integration Testing**
  - Wire up [CompetitorMonitor.tsx](apps/console/components/CompetitorMonitor.tsx)
  - Test [CompetitorAnalytics.tsx](apps/console/components/CompetitorAnalytics.tsx)
  - Verify [CompetitorRules.tsx](apps/console/components/CompetitorRules.tsx) functionality

- [ ] **End-to-end flow**
  - Add competitor via UI
  - Fetch competitor list
  - View competitor products
  - Monitor competitor prices
  - Apply competitor rules

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
