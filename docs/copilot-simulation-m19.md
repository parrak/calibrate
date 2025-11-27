# M1.9: Copilot Simulation — Implementation Complete

**Status:** ✅ Complete (API + validation + logging)
**Endpoints:** `POST /api/v1/copilot/simulate`

## Executive Summary

Introduced a dedicated Copilot Simulation API that lets editors preview pricing rule impact without persisting changes. The endpoint performs strict schema validation, enforces RBAC (EDITOR+), runs the pricing-engine `simulateRule` pipeline, and writes detailed audit metadata to `CopilotQueryLog` for every request.

## What Shipped

- **Simulation API**: New Next.js route at `/api/v1/copilot/simulate` that accepts a full PricingRule payload, optional guardrail policies, and simulation metadata.
- **Schema validation**: Zod schemas cover selector predicates, transforms, optional constraints, and policy guardrails to prevent malformed requests.
- **RBAC enforcement**: Editors/Admins/Owners only; Viewer or unauthenticated requests receive 403 responses.
- **Audit logging**: Every simulation is logged with summary stats (matched, would change, delta) and custom metadata for downstream analytics.
- **Test coverage**: Vitest suite exercises payload validation, RBAC enforcement, successful simulation, and log creation.

## API Usage

```http
POST /api/v1/copilot/simulate
Content-Type: application/json

{
  "projectSlug": "demo",
  "userId": "editor1",
  "rule": {
    "name": "Raise accessory prices 10%",
    "selector": { "predicates": [{ "type": "tag", "tags": ["accessories"] }] },
    "transform": { "transform": { "type": "percentage", "value": 10 } }
  },
  "policyRules": { "maxPctDelta": 20 },
  "metadata": { "requestId": "req-123" }
}
```

**Response**

```json
{
  "tenantId": "tenant1",
  "projectId": "proj1",
  "summary": {
    "total": 1,
    "matched": 1,
    "wouldChange": 1,
    "totalDelta": 1
  },
  "results": [
    {
      "skuId": "sku1",
      "skuCode": "SKU-1",
      "currentPrice": 10,
      "proposedPrice": 11,
      "delta": 1,
      "deltaPct": 10,
      "matched": true,
      "reason": "Would change price"
    }
  ],
  "explainTrace": {
    "rule": { "name": "Raise accessory prices 10%", "selector": { "predicates": [{ "type": "tag", "tags": ["accessories"] }] } },
    "timestamp": "2025-11-26T00:00:00.000Z",
    "summary": { "total": 1, "matched": 1, "wouldChange": 1, "totalDelta": 1 }
  }
}
```

## Operational Notes

- **RBAC**: Requires project membership with EDITOR or higher; failures are logged as denied attempts.
- **Logging**: Writes `queryType: "simulate"` entries with per-run deltas and custom metadata.
- **Safety**: Simulation always runs in dry-run mode—no price change records are created.
- **Extensibility**: Policy guardrails (floor/ceiling/maxPctDelta/budget) can be expanded without API changes thanks to zod validation.

## Validation

- ✅ Vitest coverage for payload validation, RBAC gating, and successful simulation logging (`apps/api/tests/copilot-simulation.test.ts`).

