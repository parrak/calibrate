# Copilot Simulate -> Approve/Apply + Automation Runner Enablement

## Summary
End-to-end Copilot flow (simulate -> propose -> approve/apply) integrated with current Console UI and Automation Runner, plus demo seed data and deployment verification checklist.

## Changes
- **API**: Added RBAC token enforcement on copilot simulate/propose and run apply; materialize preview runs on propose; require project scoping for apply.
- **Automation Runner**: Materialize now uses pricing-engine selector/transform, builds targets from active prices, and records explainJson safely.
- **Console**: Copilot drawer adds "Approve & Apply Now" flow with optimistic UX.
- **Seed data**: Demo tenant includes test data for users to try Copilot and rules.
- **Docs**: Added Deployment Verification Checklist in `AGENTS.md`.
- **Fixes**: Type safety in competitor scrapers and automation-runner JSON writes.

## Verification
- **Tests**: `pnpm test` fails locally due to TLS keychain error. Ran `CI=1 pnpm -r --if-present test` (pass).
- **Deploy**: Railway API deploy SUCCESS; smoke checks: `/api/health` -> 200, Console landing -> 307 redirect.

## Checklist
- [x] API + UI flow verified locally with tests
- [x] Demo tenant seeded for public enablement
- [x] Deployment verification checklist added
