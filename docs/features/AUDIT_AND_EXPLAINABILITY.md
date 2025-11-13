# Audit & Explainability

Calibrate provides comprehensive audit trails and explainability features to ensure full transparency and accountability for all price changes.

## Overview

Every price change action in Calibrate is tracked through two complementary systems:

1. **Audit Records**: High-level action tracking with correlation IDs
2. **Explain Traces**: Detailed reasoning and context for each action

## Key Features

### 1. Complete Audit Trail

All price change actions are logged with:
- **Entity & Action**: What was changed and how (apply, approve, reject, rollback)
- **Actor**: Who performed the action (user ID or system)
- **Timestamp**: When the action occurred
- **Correlation ID**: Link related actions across the system
- **Explain Data**: Context and reasoning for the action

### 2. Explainability Traces

Each price change includes detailed explainability data:
- **Why**: The reasoning behind the decision
- **Policy Checks**: Which policies were evaluated and their results
- **Price Deltas**: Absolute and percentage changes
- **Connector Status**: Integration sync status and attempts
- **Metadata**: Additional context (correlation IDs, actors, etc.)

### 3. Correlation ID Tracking

Correlation IDs enable you to:
- Trace related operations across multiple services
- Reconstruct the complete history of a price change
- Debug complex multi-step workflows
- Analyze performance across system boundaries

## API Endpoints

### Query Audit Records

```http
GET /api/v1/audit?project=<project-slug>
```

**Query Parameters:**
- `project` (required): Project slug
- `entity`: Filter by entity type (e.g., "PriceChange")
- `entityId`: Filter by specific entity ID
- `action`: Filter by action (e.g., "applied", "approved", "rejected", "rolled_back")
- `actor`: Filter by actor (user ID or "system")
- `startDate`: Filter records after this date (ISO 8601)
- `endDate`: Filter records before this date (ISO 8601)
- `cursor`: Pagination cursor (from `nextCursor` in response)

**Response:**
```json
{
  "items": [
    {
      "id": "audit_123",
      "tenantId": "tenant_abc",
      "projectId": "proj_xyz",
      "entity": "PriceChange",
      "entityId": "pc_456",
      "action": "applied",
      "actor": "user_789",
      "explain": {
        "status": "APPLIED",
        "appliedAt": "2025-01-15T10:30:00Z",
        "fromAmount": 4990,
        "toAmount": 5490,
        "currency": "USD",
        "policyResult": { "ok": true, "checks": [...] },
        "connectorTarget": "shopify",
        "correlationId": "corr_abc123"
      },
      "createdAt": "2025-01-15T10:30:00Z"
    }
  ],
  "nextCursor": "cursor_next_page",
  "role": "ADMIN"
}
```

**Pagination:**
- 50 items per page
- Use `nextCursor` from response to fetch next page
- `null` nextCursor indicates last page

## Use Cases

### 1. Compliance & Auditing

Track all price changes for regulatory compliance:

```http
GET /api/v1/audit?project=demo&entity=PriceChange&startDate=2025-01-01&endDate=2025-01-31
```

This returns all price change actions in January 2025 for compliance reporting.

### 2. Debugging Failed Price Changes

Find all failed price changes and their reasons:

```http
GET /api/v1/audit?project=demo&action=failed
```

Review the `explain` field to understand why changes failed.

### 3. User Activity Monitoring

Track actions by a specific user:

```http
GET /api/v1/audit?project=demo&actor=user_123
```

### 4. Correlation Tracing

Find all actions related to a specific operation:

1. Get the correlation ID from any audit record
2. Search for all records with that correlation ID:

```http
GET /api/v1/audit?project=demo&entity=PriceChange&entityId=pc_456
```

3. Look at the `correlationId` in the explain field
4. Search across your monitoring systems using that correlation ID

## Explain Trace Structure

Each price change includes a detailed explain trace with the following structure:

### Apply Action Trace

```json
{
  "operation": "apply",
  "timestamp": "2025-01-15T10:30:00Z",
  "priceChange": {
    "id": "pc_123",
    "fromAmount": 4990,
    "toAmount": 5490,
    "currency": "USD",
    "skuId": "sku_456"
  },
  "connector": {
    "target": "shopify",
    "status": {
      "state": "SYNCED",
      "variantId": "gid://shopify/ProductVariant/123"
    }
  },
  "policy": {
    "evaluation": {
      "ok": true,
      "checks": [
        { "name": "maxPctDelta", "ok": true, "value": 0.10, "limit": 0.20 }
      ]
    },
    "autoApply": true
  },
  "reasoning": {
    "why": "Price change approved and applied through connector",
    "policyChecks": { "ok": true, ... },
    "delta": 500,
    "deltaPercent": "10.02%"
  }
}
```

### Rollback Action Trace

```json
{
  "operation": "rollback",
  "timestamp": "2025-01-15T14:00:00Z",
  "priceChange": {
    "id": "pc_123",
    "originalFromAmount": 4990,
    "originalToAmount": 5490,
    "restoredAmount": 4990,
    "currency": "USD",
    "skuId": "sku_456"
  },
  "connector": {
    "target": "shopify",
    "status": { "state": "SYNCED" }
  },
  "reasoning": {
    "why": "Price change rolled back by admin action",
    "restoredTo": "Original price before change",
    "delta": -500,
    "deltaPercent": "-9.11%"
  }
}
```

## Event Replay

Calibrate's event-sourced architecture allows you to replay and reconstruct historical price changes.

### Replaying Events

Use the event replay system to:
- Reconstruct price history from events
- Recover from system failures
- Sync connectors with historical data
- Analyze pricing trends over time

### Verification

The replay system includes integrity checks:
- Temporal ordering validation
- Duplicate event detection
- Correlation chain verification
- Event completeness checks

## Best Practices

### 1. Always Use Correlation IDs

When making API requests, include a correlation ID header:

```http
X-Correlation-ID: your-correlation-id
```

This enables end-to-end tracing across your entire system.

### 2. Regular Audit Reviews

Schedule regular reviews of audit logs to:
- Ensure policy compliance
- Identify unusual patterns
- Validate automated processes
- Monitor user activity

### 3. Retention Policies

Audit records are retained indefinitely by default. Consider:
- Archiving old records for long-term storage
- Implementing data lifecycle policies
- Exporting critical audit data for backup

### 4. Monitoring Integration

Integrate audit data with your monitoring tools:
- Export correlation IDs to APM tools (DataDog, New Relic, etc.)
- Set up alerts for specific actions or patterns
- Create dashboards for audit metrics
- Track SLAs and compliance metrics

## Integration with @calibr/monitor

The `@calibr/monitor` package provides built-in support for:
- Correlation ID tracking
- Performance metrics by correlation
- Event bus monitoring
- Connector health tracking

All monitoring data includes correlation IDs for seamless integration with audit trails.

## Generating Audit Reports

Use the provided script to generate comprehensive audit reports:

```bash
cd /path/to/calibrate
pnpm exec tsx scripts/audit-reports/generate-sample-reports.ts
```

This generates:
- JSON reports with full audit data
- Markdown summaries with statistics
- Correlation chain analysis
- Action/entity/actor breakdowns

Reports are saved to `scripts/audit-reports/output/`.

## Security & Access Control

### Authentication

All audit endpoint requests require:
- Valid authentication token
- Project-level access (VIEWER role or higher)

### Authorization

- **VIEWER**: Read audit records for their projects
- **EDITOR**: Read audit records for their projects
- **ADMIN**: Read audit records + perform sensitive actions
- **OWNER**: Full access to all audit data

### Data Privacy

Audit records contain:
- User IDs (not emails or PII)
- System actions (clearly marked as "system")
- Timestamps and metadata
- No sensitive customer data

## FAQ

### Q: How long are audit records retained?

A: Audit records are retained indefinitely by default. You can configure retention policies based on your compliance requirements.

### Q: Can I export audit data?

A: Yes, use the `/api/v1/audit` endpoint with appropriate filters and pagination to export data. The provided report generator script can also export data in JSON format.

### Q: What is a correlation ID?

A: A correlation ID is a unique identifier that links related operations across your system. It enables you to trace a single logical operation as it flows through multiple services, databases, and APIs.

### Q: Are audit records immutable?

A: Yes, audit records are append-only and cannot be modified or deleted once created. This ensures a tamper-proof audit trail.

### Q: How do I debug a failed price change?

A:
1. Find the price change ID from the Console or API
2. Query audit records: `GET /api/v1/audit?entityId=<priceChangeId>`
3. Review the `explain` field for error details
4. Check the correlation ID to trace related operations
5. Use the correlation ID in your monitoring tools for full context

### Q: Can I see who approved a price change?

A: Yes, check the `approvedBy` field in the price change record, or filter audit records by `action=approved` to see approval history.

## Related Documentation

- [API Reference](/docs/api-reference)
- [Pricing Engine](/docs/pricing-engine)
- [Monitoring & Observability](/docs/monitoring)
- [Security & Compliance](/docs/security)
