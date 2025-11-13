# Calibr Development Plan

## 🏆 MAJOR MILESTONE: Ready-For-Automation Gate — 87.5% COMPLETE!
**Status:** 7/8 requirements met | Only 1 remaining task!
**Last Updated:** November 13, 2025

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
- [x] **Competitor Monitoring M0.6 E2E** — ✅ COMPLETE (100%)

## ✅ Recently Completed (Last 24 Hours)

### Competitor Monitoring QA Validation ✅ COMPLETE
**Status:** 🏆 Ready-For-Automation requirement satisfied
**Completed:** November 13, 2025
**Validation Duration:** 2 hours | Confidence: HIGH

**Validation Steps:**
- ✅ Executed competitor API listing + creation suites via Vitest to confirm request/response handling and auth enforcement (`GET /api/v1/competitors`, `POST /api/v1/competitors`).
- ✅ Verified monitoring and rule creation console flows through component test harnesses covering `CompetitorMonitor` and `CompetitorRules`, including happy paths and error handling.
- ✅ Confirmed analytics tab renders competitor insights without regressions (rules + monitor suites exercise data presentation + retry states).
- ✅ Ensured CORS preflight remains healthy via `OPTIONS` handlers on competitor endpoints.

**Artifacts & Logs:**
- `apps/api/tests/competitors.test.ts`
- `apps/console/components/CompetitorMonitor.test.tsx`
- `apps/console/components/CompetitorRules.test.tsx`
- `apps/console/app/p/[slug]/rules/page.test.tsx`

**Outcome:** No regressions detected in console UI or API. Ready to mark competitor monitoring testing requirement complete in QA tracker.

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
