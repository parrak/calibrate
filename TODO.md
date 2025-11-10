# Calibr Development Plan

## 🏆 MAJOR MILESTONE: Ready-For-Automation Gate — 87.5% COMPLETE!
**Status:** 7/8 requirements met | Only 1 remaining task!
**Last Updated:** November 10, 2025

### Ready-For-Automation Gate Checklist:
- [x] Engine supports schedule + revert — ✅ READY
- [x] Audit/explain complete — ✅ READY
- [x] Console shows lineage — ✅ READY
- [x] Connectors resilient (retry/backoff) — ✅ READY
- [x] Error surfacing — ✅ READY
- [x] Health checks — ✅ READY
- [x] **Amazon validation** — ✅ COMPLETE (PR #85)
- [ ] **Staging deployment validation** — 🟡 PENDING

**Next Action:** Deploy to staging and validate all services end-to-end

---

## ✅ Completed Tasks
- [x] AI Copilot UI implementation (M1.4)
- [x] Infrastructure setup and monitoring
- [x] Database schema corrections
- [x] BigInt serialization handling
- [x] Amazon M0.4 Connector validation
- [x] Competitor monitoring E2E testing

## ✅ Recently Completed (Last 24 Hours)

### Amazon M0.4 Connector Validation ✅ COMPLETE
**Status:** 🏆 Validated and ready for staging deployment
**Completed:** November 10, 2025 (PR #85)
**Validation Duration:** 4 hours | Confidence: HIGH

**Achievements:**
- ✅ **812-line acceptance report** — M0.4_ACCEPTANCE_REPORT.md
- ✅ **8/8 tests passing** (100% pass rate)
- ✅ **Feature flag system** — AMAZON_CONNECTOR_ENABLED implemented
- ✅ **Database schema validated** — Multi-connector architecture confirmed
- ✅ **Dry-run mode working** — Safe testing without credentials
- ✅ **Catalog ingest complete** — Database persistence validated
- ✅ **Ready-For-Automation gate** — Requirement #7 COMPLETE

**Test Coverage:**
- Configuration loading + dry-run mode
- Price change operations (without credentials)
- Connector registry interface compliance
- Feed status polling + parsing
- Competitive pricing data retrieval

**Documentation:**
- [M0.4_ACCEPTANCE_REPORT.md](M0.4_ACCEPTANCE_REPORT.md)
- [.env.example](.env.example) — Feature flag docs
- Protected API endpoints with flag checks

---

### Competitor Monitoring E2E Testing ✅ COMPLETE
**Status:** 🎯 All authentication issues resolved
**Completed:** November 10, 2025 (PR #83)

**Achievements:**
- ✅ **E2E test results** — COMPETITOR_MONITORING_E2E_TEST_RESULTS.md (269 lines)
- ✅ **Authentication fixes** — Components now pass API tokens
- ✅ **433+ lines of tests** — CompetitorMonitor + CompetitorRules
- ✅ **API validation complete** — Browser testing passed
- ✅ **CORS verified** — No preflight errors
- ✅ **UI improvements** — Better error messages with sign-out

**Changes Made:**
- ✅ Fixed CompetitorMonitor to use `useSession()` hook
- ✅ Fixed CompetitorRules authentication
- ✅ Updated competitorsApi client with `token` parameter
- ✅ Added clear 401 error messages with sign-out button
- ✅ Manual API testing: CORS + OPTIONS handlers functional

**Files Updated:**
- [apps/console/components/CompetitorMonitor.tsx](apps/console/components/CompetitorMonitor.tsx) + tests (207 lines)
- [apps/console/components/CompetitorRules.tsx](apps/console/components/CompetitorRules.tsx) + tests (226 lines)
- [apps/console/lib/api-client.ts](apps/console/lib/api-client.ts) — Token support
- [COMPETITOR_MONITORING_E2E_TEST_RESULTS.md](COMPETITOR_MONITORING_E2E_TEST_RESULTS.md)

---

### Competitors Integration (COMPLETE - All API Issues Resolved)
**Status:** ✅ API fully functional with CORS support
**Completed:** November 9, 2025 (PRs #57, #58, #59, #60)

**Changes Made:**
- ✅ Removed HMAC authentication from all competitor endpoints
- ✅ Added `withSecurity` wrapper for consistent security headers
- ✅ Updated to use `projectSlug` instead of tenantId/projectId
- ✅ Added OPTIONS handlers to all endpoints (PR #60)
- ✅ Fixed "Failed to fetch" errors (PR #60)
- ✅ Fixed test failures — 26 regression tests passing (PR #58)
- ✅ Improved Shopify sync error handling (PR #59)

---

## 🔄 In Progress

### Staging Deployment Validation
**Priority:** ⭐⭐⭐ CRITICAL — Last gate requirement
**Estimated Time:** 2-3 hours

**Tasks:**
1. Deploy all services to staging
2. Run end-to-end integration tests
3. Validate health endpoints
4. Verify feature flags working
5. Test authentication flows
6. Document staging validation results

**Success Criteria:**
- All services healthy and responding
- Feature flags operational
- Auth flows working
- No critical errors in logs

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
