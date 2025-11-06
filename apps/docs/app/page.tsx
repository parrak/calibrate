export default function Home() {
  return (
    <div className="min-h-screen bg-bg">
      <div className="max-w-4xl mx-auto px-6 py-16">
        <div className="mb-12">
          <h1 className="text-4xl md:text-5xl font-bold text-fg mb-4">
            Calibrate Documentation
          </h1>
          <p className="text-xl text-mute">
            API reference and integration guides for the Calibrate pricing platform
          </p>
        </div>

        <div className="bg-surface border border-border rounded-2xl p-8 shadow-xl">
          <h2 className="text-2xl font-semibold text-fg mb-6">API Endpoints</h2>

          <div className="space-y-8">
            <div>
              <h3 className="text-lg font-semibold text-fg mb-3">Webhooks</h3>
              <div className="bg-bg border border-border p-4 rounded-xl font-mono text-sm">
                <div className="text-brand font-semibold">POST /api/v1/webhooks/price-suggestion</div>
                <div className="text-mute mt-2">Submit price change suggestions with guardrail checks</div>
              </div>
            </div>

            <div>
              <h3 className="text-lg font-semibold text-fg mb-3">Price Changes</h3>
              <div className="space-y-3">
                <div className="bg-bg border border-border p-4 rounded-xl font-mono text-sm hover:border-brand/30 transition-all">
                  <div className="text-brand font-semibold">GET /api/v1/price-changes</div>
                  <div className="text-mute mt-1">List all price changes with filtering options</div>
                </div>
                <div className="bg-bg border border-border p-4 rounded-xl font-mono text-sm hover:border-brand/30 transition-all">
                  <div className="text-brand font-semibold">POST /api/v1/price-changes/{"{id}"}/approve</div>
                  <div className="text-mute mt-1">Approve a pending price change</div>
                </div>
                <div className="bg-bg border border-border p-4 rounded-xl font-mono text-sm hover:border-brand/30 transition-all">
                  <div className="text-brand font-semibold">POST /api/v1/price-changes/{"{id}"}/apply</div>
                  <div className="text-mute mt-1">Apply an approved price change to connectors</div>
                </div>
              </div>
            </div>

            <div>
              <h3 className="text-lg font-semibold text-fg mb-3">Catalog</h3>
              <div className="bg-bg border border-border p-4 rounded-xl font-mono text-sm hover:border-brand/30 transition-all">
                <div className="text-brand font-semibold">GET /api/v1/catalog?productCode=PRO</div>
                <div className="text-mute mt-2">Retrieve product catalog information and pricing history</div>
              </div>
            </div>
          </div>

          <div className="mt-8 p-4 bg-brand/10 border border-brand/20 rounded-xl">
            <p className="text-fg text-sm">
              <strong className="text-brand">Note:</strong> Full API reference and integration guides coming soon.
              Visit the <a href="https://console.calibr.lat" className="text-brand hover:underline">console</a> to get started.
            </p>
          </div>
        </div>

        <div className="mt-12 text-center">
          <a
            href="https://calibr.lat"
            className="text-mute hover:text-brand transition-colors text-sm"
          >
            ← Back to calibr.lat
          </a>
        </div>
      </div>
    </div>
  )
}
