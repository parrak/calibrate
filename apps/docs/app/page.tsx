export default function Home() {
  return (
    <div className="min-h-screen bg-bg">
      <div className="max-w-5xl mx-auto px-6 py-20">
        {/* Hero Section */}
        <div className="mb-16 text-center max-w-3xl mx-auto">
          <h1 className="text-5xl md:text-6xl font-bold text-fg mb-6 tracking-tight">
            Calibrate Documentation
          </h1>
          <p className="text-xl text-fg-muted leading-relaxed">
            Complete guide to using the Calibrate pricing management platform.
            Learn how to automate pricing, manage your catalog, and integrate with your systems.
          </p>
        </div>

        {/* Featured Card */}
        <div className="mb-20">
          <a
            href="/console"
            className="block bg-gradient-to-br from-brand-light to-accent-light border border-border/50 rounded-xl p-8 shadow-md hover:shadow-xl transition-all duration-200 group relative overflow-hidden"
          >
            <div className="absolute inset-0 bg-gradient-to-br from-brand/5 to-accent/5 opacity-0 group-hover:opacity-100 transition-opacity duration-200" />
            <div className="relative">
              <div className="flex items-center gap-3 mb-4">
                <div className="flex items-center justify-center w-12 h-12 rounded-lg bg-brand/10 text-brand text-2xl">
                  🖥️
                </div>
                <h2 className="text-3xl font-bold text-fg group-hover:text-brand transition-colors">
                  Console User Guide
                </h2>
              </div>
              <p className="text-fg-muted text-lg mb-6 leading-relaxed">
                Complete guide to using the Calibrate pricing management console, including feature documentation and integrated API references
              </p>
              <div className="grid md:grid-cols-2 gap-x-8 gap-y-3 mb-6">
                <div className="flex items-center gap-2 text-fg-muted">
                  <svg className="w-5 h-5 text-brand flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  <span className="text-sm">Getting Started & Onboarding</span>
                </div>
                <div className="flex items-center gap-2 text-fg-muted">
                  <svg className="w-5 h-5 text-brand flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  <span className="text-sm">Product Catalog Management</span>
                </div>
                <div className="flex items-center gap-2 text-fg-muted">
                  <svg className="w-5 h-5 text-brand flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  <span className="text-sm">Price Changes Workflow</span>
                </div>
                <div className="flex items-center gap-2 text-fg-muted">
                  <svg className="w-5 h-5 text-brand flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  <span className="text-sm">Automated Pricing Rules</span>
                </div>
                <div className="flex items-center gap-2 text-fg-muted">
                  <svg className="w-5 h-5 text-brand flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  <span className="text-sm">Platform Integrations</span>
                </div>
                <div className="flex items-center gap-2 text-fg-muted">
                  <svg className="w-5 h-5 text-brand flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  <span className="text-sm">Integrated API References</span>
                </div>
              </div>
              <div className="flex items-center gap-2 text-brand font-semibold group-hover:gap-3 transition-all">
                <span>View Console Docs</span>
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 8l4 4m0 0l-4 4m4-4H3" />
                </svg>
              </div>
            </div>
          </a>
        </div>

        {/* Documentation Index */}
        <div className="mb-16">
          <div className="flex items-center gap-3 mb-8">
            <h2 className="text-3xl font-bold text-fg">Documentation</h2>
            <div className="flex-1 h-px bg-gradient-to-r from-border to-transparent" />
          </div>

          <div className="grid gap-6">
            {/* Getting Started */}
            <div className="bg-surface border border-border/60 rounded-lg p-6 shadow-sm hover:shadow-md transition-shadow">
              <div className="flex items-center gap-2 mb-4">
                <div className="w-8 h-8 rounded-lg bg-brand/10 flex items-center justify-center text-brand text-lg">
                  🚀
                </div>
                <h3 className="text-xl font-semibold text-fg">Getting Started</h3>
              </div>
              <div className="grid md:grid-cols-2 gap-3">
                <a href="/console/getting-started" className="flex items-center gap-2 text-fg-muted hover:text-brand transition-colors text-sm group">
                  <svg className="w-4 h-4 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" />
                  </svg>
                  <span className="group-hover:underline">Setup & Onboarding Guide</span>
                </a>
              </div>
            </div>

            {/* Core Features */}
            <div className="bg-surface border border-border/60 rounded-lg p-6 shadow-sm hover:shadow-md transition-shadow">
              <div className="flex items-center gap-2 mb-4">
                <div className="w-8 h-8 rounded-lg bg-accent/10 flex items-center justify-center text-accent text-lg">
                  ⚙️
                </div>
                <h3 className="text-xl font-semibold text-fg">Core Features</h3>
              </div>
              <div className="grid md:grid-cols-2 gap-y-3 gap-x-6">
                <div className="space-y-2">
                  <a href="/console/catalog" className="flex items-center gap-2 text-fg-muted hover:text-brand transition-colors text-sm group">
                    <svg className="w-4 h-4 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" />
                    </svg>
                    <span className="group-hover:underline">Product Catalog</span>
                  </a>
                  <a href="/console/catalog#api-reference" className="flex items-center gap-2 text-fg-subtle hover:text-brand transition-colors text-xs ml-6">
                    <svg className="w-3 h-3 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4" />
                    </svg>
                    <span className="group-hover:underline">Catalog API</span>
                  </a>
                </div>
                <div className="space-y-2">
                  <a href="/console/price-changes" className="flex items-center gap-2 text-fg-muted hover:text-brand transition-colors text-sm group">
                    <svg className="w-4 h-4 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" />
                    </svg>
                    <span className="group-hover:underline">Price Changes</span>
                  </a>
                  <a href="/console/price-changes#api-reference" className="flex items-center gap-2 text-fg-subtle hover:text-brand transition-colors text-xs ml-6">
                    <svg className="w-3 h-3 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4" />
                    </svg>
                    <span className="group-hover:underline">Price Changes API</span>
                  </a>
                </div>
                <a href="/console/pricing-rules" className="flex items-center gap-2 text-fg-muted hover:text-brand transition-colors text-sm group">
                  <svg className="w-4 h-4 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" />
                  </svg>
                  <span className="group-hover:underline">Pricing Rules & Automation</span>
                </a>
                <div className="space-y-2">
                  <a href="/console/integrations" className="flex items-center gap-2 text-fg-muted hover:text-brand transition-colors text-sm group">
                    <svg className="w-4 h-4 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" />
                    </svg>
                    <span className="group-hover:underline">Platform Integrations</span>
                  </a>
                  <a href="/console/integrations#api-reference" className="flex items-center gap-2 text-fg-subtle hover:text-brand transition-colors text-xs ml-6">
                    <svg className="w-3 h-3 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4" />
                    </svg>
                    <span className="group-hover:underline">Platforms API</span>
                  </a>
                </div>
              </div>
            </div>

            {/* Intelligence & Insights */}
            <div className="bg-surface border border-border/60 rounded-lg p-6 shadow-sm hover:shadow-md transition-shadow">
              <div className="flex items-center gap-2 mb-4">
                <div className="w-8 h-8 rounded-lg bg-brand/10 flex items-center justify-center text-brand text-lg">
                  🧠
                </div>
                <h3 className="text-xl font-semibold text-fg">Intelligence & Insights</h3>
              </div>
              <div className="grid md:grid-cols-2 gap-y-3 gap-x-6">
                <div className="space-y-2">
                  <a href="/console/ai-assistant" className="flex items-center gap-2 text-fg-muted hover:text-brand transition-colors text-sm group">
                    <svg className="w-4 h-4 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" />
                    </svg>
                    <span className="group-hover:underline">AI Assistant</span>
                  </a>
                  <a href="/console/ai-assistant#api-reference" className="flex items-center gap-2 text-fg-subtle hover:text-brand transition-colors text-xs ml-6">
                    <svg className="w-3 h-3 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4" />
                    </svg>
                    <span className="group-hover:underline">Assistant API</span>
                  </a>
                </div>
                <a href="/console/analytics" className="flex items-center gap-2 text-fg-muted hover:text-brand transition-colors text-sm group">
                  <svg className="w-4 h-4 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" />
                  </svg>
                  <span className="group-hover:underline">Analytics & Reporting</span>
                </a>
                <a href="/console/competitors" className="flex items-center gap-2 text-fg-muted hover:text-brand transition-colors text-sm group">
                  <svg className="w-4 h-4 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" />
                  </svg>
                  <span className="group-hover:underline">Competitor Monitoring</span>
                </a>
              </div>
            </div>

            {/* Reference & Help */}
            <div className="bg-surface border border-border/60 rounded-lg p-6 shadow-sm hover:shadow-md transition-shadow">
              <div className="flex items-center gap-2 mb-4">
                <div className="w-8 h-8 rounded-lg bg-accent/10 flex items-center justify-center text-accent text-lg">
                  📚
                </div>
                <h3 className="text-xl font-semibold text-fg">Reference & Help</h3>
              </div>
              <div className="grid md:grid-cols-2 gap-3">
                <a href="/console/roles-permissions" className="flex items-center gap-2 text-fg-muted hover:text-brand transition-colors text-sm group">
                  <svg className="w-4 h-4 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" />
                  </svg>
                  <span className="group-hover:underline">Roles & Permissions</span>
                </a>
                <a href="/console/troubleshooting" className="flex items-center gap-2 text-fg-muted hover:text-brand transition-colors text-sm group">
                  <svg className="w-4 h-4 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" />
                  </svg>
                  <span className="group-hover:underline">Troubleshooting Guide</span>
                </a>
                <a href="/console/best-practices" className="flex items-center gap-2 text-fg-muted hover:text-brand transition-colors text-sm group">
                  <svg className="w-4 h-4 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" />
                  </svg>
                  <span className="group-hover:underline">Best Practices</span>
                </a>
              </div>
            </div>
          </div>
        </div>

        {/* API Documentation Callout */}
        <div className="bg-gradient-to-br from-brand-light to-accent-light border border-brand/20 rounded-lg p-8 shadow-sm">
          <div className="flex items-start gap-4">
            <div className="flex-shrink-0 w-12 h-12 rounded-lg bg-brand/20 flex items-center justify-center text-2xl">
              ⚡
            </div>
            <div className="flex-1">
              <h3 className="text-2xl font-bold text-fg mb-3">API Documentation</h3>
              <p className="text-fg-muted text-base mb-6 leading-relaxed max-w-2xl">
                API references are integrated into each feature page. Navigate to any feature (Price Changes, Catalog, Integrations, etc.) to find relevant API endpoints, request/response examples, and integration guides.
              </p>
              <a
                href="/api-spec"
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-2 bg-brand text-white px-5 py-2.5 rounded-lg font-semibold hover:bg-brand-hover transition-colors shadow-sm hover:shadow-md"
              >
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
                </svg>
                <span>View Full OpenAPI Specification</span>
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                </svg>
              </a>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
