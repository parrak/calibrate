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

        <div className="grid md:grid-cols-2 gap-6 mb-12">
          <a
            href="/console"
            className="block bg-surface border border-border rounded-2xl p-8 shadow-xl hover:border-brand/50 hover:shadow-2xl transition-all group"
          >
            <div className="flex items-center gap-3 mb-4">
              <span className="text-4xl">🖥️</span>
              <h2 className="text-2xl font-semibold text-fg group-hover:text-brand transition-colors">
                Console User Guide
              </h2>
            </div>
            <p className="text-mute mb-4">
              Complete guide to using the Calibrate pricing management console
            </p>
            <ul className="space-y-2 text-sm text-fg">
              <li className="flex items-center gap-2">
                <span className="text-brand">→</span>
                Getting Started & Onboarding
              </li>
              <li className="flex items-center gap-2">
                <span className="text-brand">→</span>
                Product Catalog Management
              </li>
              <li className="flex items-center gap-2">
                <span className="text-brand">→</span>
                Price Changes Workflow
              </li>
              <li className="flex items-center gap-2">
                <span className="text-brand">→</span>
                Automated Pricing Rules
              </li>
              <li className="flex items-center gap-2">
                <span className="text-brand">→</span>
                Platform Integrations
              </li>
            </ul>
            <div className="mt-6 text-brand font-semibold group-hover:underline">
              View Console Docs →
            </div>
          </a>

          <div className="bg-surface border border-border rounded-2xl p-8 shadow-xl">
            <div className="flex items-center gap-3 mb-4">
              <span className="text-4xl">⚡</span>
              <h2 className="text-2xl font-semibold text-fg">API Reference</h2>
            </div>
            <p className="text-mute mb-6">
              RESTful API for programmatic access to Calibrate pricing platform
            </p>

            <div className="space-y-4">
              <div>
                <h3 className="text-sm font-semibold text-fg mb-2">Price Changes API</h3>
                <div className="bg-bg border border-border p-3 rounded-lg font-mono text-xs">
                  <div className="text-brand">GET /api/v1/price-changes</div>
                  <div className="text-mute mt-1">POST /api/v1/price-changes/:id/approve</div>
                </div>
              </div>

              <div>
                <h3 className="text-sm font-semibold text-fg mb-2">Catalog API</h3>
                <div className="bg-bg border border-border p-3 rounded-lg font-mono text-xs">
                  <div className="text-brand">GET /api/v1/catalog</div>
                </div>
              </div>

              <div>
                <h3 className="text-sm font-semibold text-fg mb-2">Platforms API</h3>
                <div className="bg-bg border border-border p-3 rounded-lg font-mono text-xs">
                  <div className="text-brand">GET /api/platforms</div>
                  <div className="text-mute mt-1">POST /api/platforms/:platform/sync</div>
                </div>
              </div>
            </div>

            <div className="mt-6">
              <a href="/console/api-reference" className="text-brand hover:underline font-semibold">
                View Full API Reference →
              </a>
            </div>
          </div>
        </div>

        <div className="bg-surface border border-border rounded-2xl p-8 shadow-xl">
          <h2 className="text-2xl font-semibold text-fg mb-6">Quick Links</h2>
          <div className="grid md:grid-cols-3 gap-4">
            <a
              href="/console/getting-started"
              className="block p-4 bg-bg border border-border rounded-xl hover:border-brand/30 transition-all"
            >
              <div className="font-semibold text-fg mb-1">Getting Started</div>
              <div className="text-sm text-mute">Setup and onboarding guide</div>
            </a>
            <a
              href="/console/price-changes"
              className="block p-4 bg-bg border border-border rounded-xl hover:border-brand/30 transition-all"
            >
              <div className="font-semibold text-fg mb-1">Price Changes</div>
              <div className="text-sm text-mute">Workflow and approval process</div>
            </a>
            <a
              href="/console/pricing-rules"
              className="block p-4 bg-bg border border-border rounded-xl hover:border-brand/30 transition-all"
            >
              <div className="font-semibold text-fg mb-1">Pricing Rules</div>
              <div className="text-sm text-mute">Automate pricing strategies</div>
            </a>
            <a
              href="/console/integrations"
              className="block p-4 bg-bg border border-border rounded-xl hover:border-brand/30 transition-all"
            >
              <div className="font-semibold text-fg mb-1">Integrations</div>
              <div className="text-sm text-mute">Connect Shopify and Amazon</div>
            </a>
            <a
              href="/console/ai-assistant"
              className="block p-4 bg-bg border border-border rounded-xl hover:border-brand/30 transition-all"
            >
              <div className="font-semibold text-fg mb-1">AI Assistant</div>
              <div className="text-sm text-mute">Natural language queries</div>
            </a>
            <a
              href="/console/best-practices"
              className="block p-4 bg-bg border border-border rounded-xl hover:border-brand/30 transition-all"
            >
              <div className="font-semibold text-fg mb-1">Best Practices</div>
              <div className="text-sm text-mute">Tips for effective pricing</div>
            </a>
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
