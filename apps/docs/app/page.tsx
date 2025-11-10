export default function Home() {
  return (
    <div className="min-h-screen bg-bg">
      <div className="max-w-4xl mx-auto px-6 py-16">
        <div className="mb-12">
          <h1 className="text-4xl md:text-5xl font-bold text-fg mb-4">
            Calibrate Documentation
          </h1>
          <p className="text-xl text-mute">
            Complete guide to using the Calibrate pricing management platform
          </p>
        </div>

        <div className="mb-12">
          <a
            href="/console"
            className="block bg-surface border border-brand/30 rounded-2xl p-8 shadow-xl hover:border-brand/50 hover:shadow-2xl transition-all group"
          >
            <div className="flex items-center gap-3 mb-4">
              <span className="text-4xl">🖥️</span>
              <h2 className="text-2xl font-semibold text-fg group-hover:text-brand transition-colors">
                Console User Guide
              </h2>
            </div>
            <p className="text-mute mb-4">
              Complete guide to using the Calibrate pricing management console, including feature documentation and integrated API references
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
              <li className="flex items-center gap-2">
                <span className="text-brand">→</span>
                API References (integrated into each feature)
              </li>
            </ul>
            <div className="mt-6 text-brand font-semibold group-hover:underline">
              View Console Docs →
            </div>
          </a>
        </div>

        <div className="bg-surface border border-border rounded-2xl p-8 shadow-xl mb-12">
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
              <div className="text-sm text-mute">Workflow and API reference</div>
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
              <div className="text-sm text-mute">Connect platforms & API</div>
            </a>
            <a
              href="/console/ai-assistant"
              className="block p-4 bg-bg border border-border rounded-xl hover:border-brand/30 transition-all"
            >
              <div className="font-semibold text-fg mb-1">AI Assistant</div>
              <div className="text-sm text-mute">Natural language queries & API</div>
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

        <div className="bg-brand/5 border border-brand/20 rounded-xl p-6">
          <div className="flex items-start gap-3">
            <span className="text-2xl">⚡</span>
            <div>
              <h3 className="text-lg font-semibold text-fg mb-2">API Documentation</h3>
              <p className="text-mute text-sm">
                API references are integrated into each feature page. Navigate to any feature (Price Changes, Catalog, Integrations, etc.) to find relevant API endpoints, request/response examples, and integration guides.
              </p>
            </div>
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
