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

        <div className="mb-12">
          <h2 className="text-3xl font-semibold text-fg mb-6">Documentation Index</h2>

          <div className="space-y-6">
            {/* Getting Started */}
            <div className="bg-surface border border-border rounded-xl p-6">
              <h3 className="text-xl font-semibold text-fg mb-4">Getting Started</h3>
              <div className="grid md:grid-cols-2 gap-3">
                <a href="/console/getting-started" className="text-brand hover:underline text-sm">
                  → Setup & Onboarding Guide
                </a>
              </div>
            </div>

            {/* Core Features */}
            <div className="bg-surface border border-border rounded-xl p-6">
              <h3 className="text-xl font-semibold text-fg mb-4">Core Features</h3>
              <div className="grid md:grid-cols-2 gap-3">
                <a href="/console/catalog" className="text-brand hover:underline text-sm">
                  → Product Catalog
                </a>
                <a href="/console/catalog#api-reference" className="text-mute hover:text-brand text-sm ml-4">
                  ↳ Catalog API
                </a>
                <a href="/console/price-changes" className="text-brand hover:underline text-sm">
                  → Price Changes Workflow
                </a>
                <a href="/console/price-changes#api-reference" className="text-mute hover:text-brand text-sm ml-4">
                  ↳ Price Changes API
                </a>
                <a href="/console/pricing-rules" className="text-brand hover:underline text-sm">
                  → Pricing Rules & Automation
                </a>
                <a href="/console/integrations" className="text-brand hover:underline text-sm">
                  → Platform Integrations
                </a>
                <a href="/console/integrations#api-reference" className="text-mute hover:text-brand text-sm ml-4">
                  ↳ Platforms API
                </a>
              </div>
            </div>

            {/* Intelligence & Insights */}
            <div className="bg-surface border border-border rounded-xl p-6">
              <h3 className="text-xl font-semibold text-fg mb-4">Intelligence & Insights</h3>
              <div className="grid md:grid-cols-2 gap-3">
                <a href="/console/ai-assistant" className="text-brand hover:underline text-sm">
                  → AI Assistant
                </a>
                <a href="/console/ai-assistant#api-reference" className="text-mute hover:text-brand text-sm ml-4">
                  ↳ Assistant API
                </a>
                <a href="/console/analytics" className="text-brand hover:underline text-sm">
                  → Analytics & Reporting
                </a>
                <a href="/console/competitors" className="text-brand hover:underline text-sm">
                  → Competitor Monitoring
                </a>
              </div>
            </div>

            {/* Reference & Help */}
            <div className="bg-surface border border-border rounded-xl p-6">
              <h3 className="text-xl font-semibold text-fg mb-4">Reference & Help</h3>
              <div className="grid md:grid-cols-2 gap-3">
                <a href="/console/roles-permissions" className="text-brand hover:underline text-sm">
                  → Roles & Permissions
                </a>
                <a href="/console/troubleshooting" className="text-brand hover:underline text-sm">
                  → Troubleshooting Guide
                </a>
                <a href="/console/best-practices" className="text-brand hover:underline text-sm">
                  → Best Practices
                </a>
              </div>
            </div>
          </div>
        </div>

        <div className="bg-brand/5 border border-brand/20 rounded-xl p-6 mb-6">
          <div className="flex items-start gap-3">
            <span className="text-2xl">⚡</span>
            <div className="flex-1">
              <h3 className="text-lg font-semibold text-fg mb-2">API Documentation</h3>
              <p className="text-mute text-sm mb-4">
                API references are integrated into each feature page. Navigate to any feature (Price Changes, Catalog, Integrations, etc.) to find relevant API endpoints, request/response examples, and integration guides.
              </p>
              <div className="flex items-center gap-4">
                <a
                  href="/api-spec"
                  target="_blank"
                  className="inline-flex items-center gap-2 text-brand hover:underline text-sm font-semibold"
                >
                  <span>📖 View Full OpenAPI Specification</span>
                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                  </svg>
                </a>
              </div>
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
