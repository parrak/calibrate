import Link from 'next/link'

export default function APIReferenceDocs() {
  return (
    <div className="min-h-screen bg-bg">
      <div className="max-w-4xl mx-auto px-6 py-16">
        <Link href="/console" className="text-brand hover:underline text-sm mb-4 inline-block">
          ← Back to Console Docs
        </Link>

        <h1 className="text-4xl font-bold text-fg mb-4">API Reference</h1>
        <p className="text-xl text-mute mb-12">
          API endpoints used by the Calibrate Console
        </p>

        <section className="mb-12">
          <h2 className="text-3xl font-semibold text-fg mb-6">Base URL</h2>
          <div className="bg-surface border border-border rounded-xl p-6">
            <div className="font-mono text-brand mb-2">https://api.calibr.lat</div>
            <p className="text-mute text-sm">
              All API requests from the console are made to this base URL. Authentication is handled via API tokens.
            </p>
          </div>
        </section>

        <section className="mb-12">
          <h2 className="text-3xl font-semibold text-fg mb-6">Authentication</h2>
          <div className="bg-surface border border-border rounded-xl p-6">
            <p className="text-fg mb-3">The console uses Bearer token authentication:</p>
            <div className="bg-bg border border-border p-4 rounded-lg font-mono text-sm mb-3">
              <div className="text-mute">Authorization: Bearer &lt;token&gt;</div>
            </div>
            <p className="text-mute text-sm">
              Tokens are automatically generated during login and included in all API requests.
            </p>
          </div>
        </section>

        <section className="mb-12">
          <h2 className="text-3xl font-semibold text-fg mb-6">Price Changes API</h2>
          <div className="space-y-4">
            <div className="bg-surface border border-border rounded-xl p-6">
              <div className="font-mono text-brand text-sm mb-2">GET /api/v1/price-changes</div>
              <p className="text-fg mb-3">List price changes with filters and pagination</p>
              <div className="bg-bg border border-border p-4 rounded-lg">
                <div className="text-xs font-semibold text-mute mb-2">QUERY PARAMETERS:</div>
                <ul className="space-y-1 text-sm text-fg font-mono">
                  <li>• project: Project slug (required)</li>
                  <li>• status: Filter by status (PENDING, APPROVED, etc.)</li>
                  <li>• q: Search query (SKU or source)</li>
                  <li>• cursor: Pagination cursor</li>
                  <li>• limit: Results per page (default: 25)</li>
                </ul>
              </div>
            </div>

            <div className="bg-surface border border-border rounded-xl p-6">
              <div className="font-mono text-brand text-sm mb-2">POST /api/v1/price-changes/:id/approve</div>
              <p className="text-fg mb-3">Approve a pending price change</p>
            </div>

            <div className="bg-surface border border-border rounded-xl p-6">
              <div className="font-mono text-brand text-sm mb-2">POST /api/v1/price-changes/:id/apply</div>
              <p className="text-fg mb-3">Apply an approved price change to platforms</p>
            </div>

            <div className="bg-surface border border-border rounded-xl p-6">
              <div className="font-mono text-brand text-sm mb-2">POST /api/v1/price-changes/:id/reject</div>
              <p className="text-fg mb-3">Reject a price change</p>
            </div>

            <div className="bg-surface border border-border rounded-xl p-6">
              <div className="font-mono text-brand text-sm mb-2">POST /api/v1/price-changes/:id/rollback</div>
              <p className="text-fg mb-3">Rollback an applied price change</p>
            </div>
          </div>
        </section>

        <section className="mb-12">
          <h2 className="text-3xl font-semibold text-fg mb-6">Catalog API</h2>
          <div className="space-y-4">
            <div className="bg-surface border border-border rounded-xl p-6">
              <div className="font-mono text-brand text-sm mb-2">GET /api/v1/catalog</div>
              <p className="text-fg mb-3">Get product catalog for a project</p>
              <div className="bg-bg border border-border p-4 rounded-lg">
                <div className="text-xs font-semibold text-mute mb-2">QUERY PARAMETERS:</div>
                <ul className="space-y-1 text-sm text-fg font-mono">
                  <li>• project: Project slug (required)</li>
                  <li>• productCode: Filter by specific product</li>
                </ul>
              </div>
            </div>
          </div>
        </section>

        <section className="mb-12">
          <h2 className="text-3xl font-semibold text-fg mb-6">AI Assistant API</h2>
          <div className="space-y-4">
            <div className="bg-surface border border-border rounded-xl p-6">
              <div className="font-mono text-brand text-sm mb-2">POST /api/v1/assistant/query</div>
              <p className="text-fg mb-3">Submit a natural language query</p>
              <div className="bg-bg border border-border p-4 rounded-lg">
                <div className="text-xs font-semibold text-mute mb-2">REQUEST BODY:</div>
                <pre className="text-sm text-fg font-mono overflow-x-auto">{`{
  "query": "What are my most expensive products?",
  "projectSlug": "demo"
}`}</pre>
              </div>
            </div>
          </div>
        </section>

        <section className="mb-12">
          <h2 className="text-3xl font-semibold text-fg mb-6">Platforms API</h2>
          <div className="space-y-4">
            <div className="bg-surface border border-border rounded-xl p-6">
              <div className="font-mono text-brand text-sm mb-2">GET /api/platforms</div>
              <p className="text-fg mb-3">List available platforms</p>
            </div>

            <div className="bg-surface border border-border rounded-xl p-6">
              <div className="font-mono text-brand text-sm mb-2">GET /api/platforms/:platform</div>
              <p className="text-fg mb-3">Get platform connection status</p>
              <div className="bg-bg border border-border p-4 rounded-lg">
                <div className="text-xs font-semibold text-mute mb-2">QUERY PARAMETERS:</div>
                <ul className="space-y-1 text-sm text-fg font-mono">
                  <li>• project: Project slug (required)</li>
                </ul>
              </div>
            </div>

            <div className="bg-surface border border-border rounded-xl p-6">
              <div className="font-mono text-brand text-sm mb-2">POST /api/platforms/:platform/sync</div>
              <p className="text-fg mb-3">Trigger manual sync for a platform</p>
            </div>

            <div className="bg-surface border border-border rounded-xl p-6">
              <div className="font-mono text-brand text-sm mb-2">GET /api/platforms/:platform/sync/status</div>
              <p className="text-fg mb-3">Get sync status and history</p>
            </div>
          </div>
        </section>

        <section className="mb-12">
          <h2 className="text-3xl font-semibold text-fg mb-6">Data Models</h2>
          <div className="space-y-4">
            <div className="bg-surface border border-border rounded-xl p-6">
              <h3 className="text-lg font-semibold text-fg mb-3">PriceChange</h3>
              <div className="bg-bg border border-border p-4 rounded-lg">
                <pre className="text-xs text-fg font-mono overflow-x-auto">{`{
  "id": "string",
  "status": "PENDING" | "APPROVED" | "APPLIED" | "REJECTED" | "ROLLED_BACK" | "FAILED",
  "currency": "USD",
  "fromAmount": 2999,  // in cents
  "toAmount": 3499,    // in cents
  "createdAt": "2024-01-15T10:30:00Z",
  "source": "ai" | "rule" | "manual",
  "context": {
    "skuCode": "SKU-123",
    ...
  },
  "policyResult": {
    "ok": true,
    "checks": [...]
  },
  "connectorStatus": {
    "target": "shopify",
    "state": "QUEUED" | "SYNCING" | "SYNCED" | "ERROR",
    "errorMessage": null,
    "updatedAt": "2024-01-15T10:35:00Z"
  }
}`}</pre>
              </div>
            </div>

            <div className="bg-surface border border-border rounded-xl p-6">
              <h3 className="text-lg font-semibold text-fg mb-3">Product</h3>
              <div className="bg-bg border border-border p-4 rounded-lg">
                <pre className="text-xs text-fg font-mono overflow-x-auto">{`{
  "code": "PROD-001",
  "name": "Example Product",
  "skus": [
    {
      "code": "SKU-001",
      "prices": [
        {
          "currency": "USD",
          "amount": 2999  // in cents
        }
      ]
    }
  ]
}`}</pre>
              </div>
            </div>
          </div>
        </section>

        <section className="mb-12">
          <h2 className="text-3xl font-semibold text-fg mb-6">Rate Limits</h2>
          <div className="bg-surface border border-border rounded-xl p-6">
            <p className="text-fg mb-3">
              API requests are rate-limited to ensure fair usage:
            </p>
            <ul className="space-y-2 text-fg text-sm">
              <li>• 100 requests per minute per user</li>
              <li>• 1000 requests per hour per project</li>
              <li>• Rate limit headers included in responses</li>
            </ul>
          </div>
        </section>

        <section className="mb-12">
          <div className="bg-brand/10 border border-brand/20 rounded-xl p-6">
            <h3 className="text-lg font-semibold text-fg mb-3">Full API Documentation</h3>
            <p className="text-fg mb-3">
              For complete API documentation with interactive examples, visit:
            </p>
            <a href="https://docs.calibr.lat" className="text-brand hover:underline font-mono">
              https://docs.calibr.lat
            </a>
          </div>
        </section>
      </div>
    </div>
  )
}
