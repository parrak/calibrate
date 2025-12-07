# Production Monitoring Setup (Priority 3)

## Summary
This PR establishes the production monitoring infrastructure for Calibrate, enabling observability into API performance, connector health, and system reliability.

## Changes
- **Grafana Dashboard**: Added `packages/monitor/dashboards/main.json` with panels for:
    - API Request Rates & Latency
    - Error Rates
    - Connector Health
    - Event Bus Metrics
    - Worker Queue Depth
- **Documentation**: Added `packages/monitor/docs/grafana-setup.md`.
- **Synthetic Probes**:
    - Added `GET /api/health` (Basic check)
    - Added `GET /api/health/detailed` (Granular dependency check)
    - Configured probe definitions in `packages/monitor/src/probes.ts`
- **Alerts**: Verified existing alert policies in `packages/monitor/src/alerts.ts` cover all requirements.

## Verification
- **Build**: `pnpm build` passed.
- **Lint**: `pnpm lint` passed.
- **Manual**: Verified health endpoints return correct JSON structure.

## Checklist
- [x] Grafana dashboard JSON created
- [x] Alert policies verified
- [x] Health endpoints implemented
- [x] Documentation added
