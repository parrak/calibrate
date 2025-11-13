import { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Audit & Explainability | Calibrate Documentation',
  description: 'Complete audit trails and explainability for price changes',
}

export default function AuditPage() {
  return (
    <div className="prose prose-slate max-w-none dark:prose-invert">
      <h1>Audit & Explainability</h1>

      <p className="lead">
        Calibrate provides comprehensive audit trails and explainability features to ensure full
        transparency and accountability for all price changes.
      </p>

      <h2>Overview</h2>

      <p>
        Every price change action in Calibrate is tracked through two complementary systems:
      </p>

      <ul>
        <li><strong>Audit Records</strong>: High-level action tracking with correlation IDs</li>
        <li><strong>Explain Traces</strong>: Detailed reasoning and context for each action</li>
      </ul>

      <h2>Key Features</h2>

      <h3>Complete Audit Trail</h3>

      <p>All price change actions are logged with:</p>

      <ul>
        <li><strong>Entity & Action</strong>: What was changed and how (apply, approve, reject, rollback)</li>
        <li><strong>Actor</strong>: Who performed the action (user ID or system)</li>
        <li><strong>Timestamp</strong>: When the action occurred</li>
        <li><strong>Correlation ID</strong>: Link related actions across the system</li>
        <li><strong>Explain Data</strong>: Context and reasoning for the action</li>
      </ul>

      <h3>Explainability Traces</h3>

      <p>Each price change includes detailed explainability data showing:</p>

      <ul>
        <li><strong>Why</strong>: The reasoning behind the decision</li>
        <li><strong>Policy Checks</strong>: Which policies were evaluated and their results</li>
        <li><strong>Price Deltas</strong>: Absolute and percentage changes</li>
        <li><strong>Connector Status</strong>: Integration sync status and attempts</li>
        <li><strong>Metadata</strong>: Additional context (correlation IDs, actors, etc.)</li>
      </ul>

      <h3>Correlation ID Tracking</h3>

      <p>Correlation IDs enable you to:</p>

      <ul>
        <li>Trace related operations across multiple services</li>
        <li>Reconstruct the complete history of a price change</li>
        <li>Debug complex multi-step workflows</li>
        <li>Analyze performance across system boundaries</li>
      </ul>

      <h2>Viewing Audit Logs</h2>

      <h3>API Endpoint</h3>

      <pre className="language-http">
        <code>{`GET /api/v1/audit?project=<project-slug>`}</code>
      </pre>

      <h3>Query Parameters</h3>

      <table>
        <thead>
          <tr>
            <th>Parameter</th>
            <th>Description</th>
            <th>Example</th>
          </tr>
        </thead>
        <tbody>
          <tr>
            <td><code>project</code></td>
            <td>Project slug (required)</td>
            <td><code>demo</code></td>
          </tr>
          <tr>
            <td><code>entity</code></td>
            <td>Filter by entity type</td>
            <td><code>PriceChange</code></td>
          </tr>
          <tr>
            <td><code>entityId</code></td>
            <td>Filter by specific entity ID</td>
            <td><code>pc_123</code></td>
          </tr>
          <tr>
            <td><code>action</code></td>
            <td>Filter by action</td>
            <td><code>applied</code>, <code>approved</code>, <code>rejected</code></td>
          </tr>
          <tr>
            <td><code>actor</code></td>
            <td>Filter by actor (user ID)</td>
            <td><code>user_789</code></td>
          </tr>
          <tr>
            <td><code>startDate</code></td>
            <td>Filter records after date</td>
            <td><code>2025-01-01T00:00:00Z</code></td>
          </tr>
          <tr>
            <td><code>endDate</code></td>
            <td>Filter records before date</td>
            <td><code>2025-01-31T23:59:59Z</code></td>
          </tr>
          <tr>
            <td><code>cursor</code></td>
            <td>Pagination cursor</td>
            <td><code>cursor_next_page</code></td>
          </tr>
        </tbody>
      </table>

      <h3>Response Format</h3>

      <pre className="language-json">
        <code>{`{
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
        "policyResult": { "ok": true },
        "correlationId": "corr_abc123"
      },
      "createdAt": "2025-01-15T10:30:00Z"
    }
  ],
  "nextCursor": "cursor_next_page",
  "role": "ADMIN"
}`}</code>
      </pre>

      <h2>Common Use Cases</h2>

      <h3>1. Compliance Auditing</h3>

      <p>Track all price changes for regulatory compliance:</p>

      <pre className="language-http">
        <code>{`GET /api/v1/audit?project=demo&entity=PriceChange&startDate=2025-01-01&endDate=2025-01-31`}</code>
      </pre>

      <h3>2. Debugging Failed Changes</h3>

      <p>Find all failed price changes:</p>

      <pre className="language-http">
        <code>{`GET /api/v1/audit?project=demo&action=failed`}</code>
      </pre>

      <h3>3. User Activity Monitoring</h3>

      <p>Track actions by a specific user:</p>

      <pre className="language-http">
        <code>{`GET /api/v1/audit?project=demo&actor=user_123`}</code>
      </pre>

      <h2>Understanding Explain Traces</h2>

      <h3>Apply Action</h3>

      <p>When a price change is applied, the explain trace includes:</p>

      <ul>
        <li>Price change details (from/to amounts, currency, SKU)</li>
        <li>Policy evaluation results</li>
        <li>Connector status and sync information</li>
        <li>Reasoning: why the change was applied</li>
        <li>Delta calculations (absolute and percentage)</li>
      </ul>

      <h3>Rollback Action</h3>

      <p>When a price change is rolled back, the explain trace includes:</p>

      <ul>
        <li>Original price change details</li>
        <li>Restored amount</li>
        <li>Who initiated the rollback</li>
        <li>Reasoning: why the change was rolled back</li>
        <li>Connector restoration status</li>
      </ul>

      <h2>Best Practices</h2>

      <h3>1. Use Correlation IDs</h3>

      <p>
        When making API requests, include a correlation ID header to enable end-to-end tracing:
      </p>

      <pre className="language-http">
        <code>{`X-Correlation-ID: your-correlation-id`}</code>
      </pre>

      <h3>2. Regular Audit Reviews</h3>

      <p>Schedule regular reviews of audit logs to:</p>

      <ul>
        <li>Ensure policy compliance</li>
        <li>Identify unusual patterns</li>
        <li>Validate automated processes</li>
        <li>Monitor user activity</li>
      </ul>

      <h3>3. Export Critical Data</h3>

      <p>
        Use the audit API with pagination to export critical data for:
      </p>

      <ul>
        <li>Long-term archival</li>
        <li>Compliance reporting</li>
        <li>Data warehouse integration</li>
        <li>Business intelligence</li>
      </ul>

      <h2>Security & Access Control</h2>

      <h3>Authentication</h3>

      <p>All audit endpoint requests require:</p>

      <ul>
        <li>Valid authentication token</li>
        <li>Project-level access (VIEWER role or higher)</li>
      </ul>

      <h3>Authorization Levels</h3>

      <table>
        <thead>
          <tr>
            <th>Role</th>
            <th>Access</th>
          </tr>
        </thead>
        <tbody>
          <tr>
            <td>VIEWER</td>
            <td>Read audit records for their projects</td>
          </tr>
          <tr>
            <td>EDITOR</td>
            <td>Read audit records for their projects</td>
          </tr>
          <tr>
            <td>ADMIN</td>
            <td>Read audit records + perform sensitive actions</td>
          </tr>
          <tr>
            <td>OWNER</td>
            <td>Full access to all audit data</td>
          </tr>
        </tbody>
      </table>

      <h3>Data Privacy</h3>

      <p>Audit records contain:</p>

      <ul>
        <li>User IDs (not emails or personally identifiable information)</li>
        <li>System actions (clearly marked as "system")</li>
        <li>Timestamps and metadata</li>
        <li>No sensitive customer data</li>
      </ul>

      <h2>FAQ</h2>

      <h3>How long are audit records retained?</h3>

      <p>
        Audit records are retained indefinitely by default. You can configure retention
        policies based on your compliance requirements.
      </p>

      <h3>Can I export audit data?</h3>

      <p>
        Yes, use the <code>/api/v1/audit</code> endpoint with appropriate filters and
        pagination to export data in JSON format.
      </p>

      <h3>What is a correlation ID?</h3>

      <p>
        A correlation ID is a unique identifier that links related operations across your
        system. It enables you to trace a single logical operation as it flows through
        multiple services, databases, and APIs.
      </p>

      <h3>Are audit records immutable?</h3>

      <p>
        Yes, audit records are append-only and cannot be modified or deleted once created.
        This ensures a tamper-proof audit trail.
      </p>

      <h3>How do I debug a failed price change?</h3>

      <ol>
        <li>Find the price change ID from the Console or API</li>
        <li>Query audit records: <code>GET /api/v1/audit?entityId=&lt;priceChangeId&gt;</code></li>
        <li>Review the <code>explain</code> field for error details</li>
        <li>Check the correlation ID to trace related operations</li>
        <li>Use the correlation ID in your monitoring tools for full context</li>
      </ol>

      <h2>Related Documentation</h2>

      <ul>
        <li><a href="/console/api-reference">API Reference</a></li>
        <li><a href="/console/price-changes">Price Changes</a></li>
        <li><a href="/console/pricing-rules">Pricing Rules</a></li>
        <li><a href="/console/best-practices">Best Practices</a></li>
        <li><a href="/console/troubleshooting">Troubleshooting</a></li>
      </ul>
    </div>
  )
}
