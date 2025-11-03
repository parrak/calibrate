# Price Changes API Quick Reference

Endpoints introduced for the price change workflow.

## List Price Changes

```bash
curl -H "Authorization: Bearer <token>" \
     "https://api.calibr.lat/api/v1/price-changes?project=demo&status=APPROVED&q=SKU"
```

Response:

```json
{
  "items": [
    {
      "id": "pc_1",
      "status": "APPROVED",
      "currency": "USD",
      "fromAmount": 4990,
      "toAmount": 5290,
      "createdAt": "2025-10-01T00:00:00Z",
      "source": "AI",
      "context": { "skuCode": "PRO-M" },
      "policyResult": { "ok": true, "checks": [] },
      "connectorStatus": { "target": "shopify", "state": "SYNCED" }
    }
  ],
  "nextCursor": "pc_2",
  "role": "ADMIN"
}
```

Query params:

- `project` (required) project slug
- `status` optional (`ALL` to disable filtering)
- `q` optional search across `source` and `context.skuCode`
- `cursor` optional pagination cursor (50 items per page)

## Actions

Shared headers:

```
Authorization: Bearer <token>
X-Calibr-Project: <project-slug>
Idempotency-Key: <uuid>
```

### Approve

```bash
curl -X POST \
     -H "Authorization: Bearer <token>" \
     -H "X-Calibr-Project: demo" \
     -H "Idempotency-Key: $(uuidgen)" \
     https://api.calibr.lat/api/v1/price-changes/pc_1/approve
```

### Apply

```bash
curl -X POST \
     -H "Authorization: Bearer <token>" \
     -H "X-Calibr-Project: demo" \
     -H "Idempotency-Key: $(uuidgen)" \
     https://api.calibr.lat/api/v1/price-changes/pc_1/apply
```

- `422 PolicyViolation` body includes `{ details }`
- `502 ConnectorError` body includes `{ target, message }`

### Reject

```bash
curl -X POST -H "Authorization: Bearer <token>" -H "X-Calibr-Project: demo" \
     https://api.calibr.lat/api/v1/price-changes/pc_1/reject
```

### Rollback

```bash
curl -X POST -H "Authorization: Bearer <token>" -H "X-Calibr-Project: demo" \
     https://api.calibr.lat/api/v1/price-changes/pc_1/rollback
```

Error payload (example):

```json
{
  "ok": false,
  "error": "Forbidden"
}
```

- `403 Forbidden` insufficient project role (viewer/editor restrictions)
- `404 NotFound` absent project or price change
- `409 AlreadyApplied|AlreadyRejected`
- `400 InvalidStatus` invalid state transitions
