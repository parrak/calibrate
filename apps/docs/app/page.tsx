import Link from 'next/link'

export default function Home() {
  return (
    <div className="max-w-4xl mx-auto px-6 py-12 lg:px-8">
      <div className="mb-12">
        <h1 className="text-5xl font-bold text-gray-900 mb-4">
          Calibrate Documentation
        </h1>
        <p className="text-xl text-gray-600">
          Complete guide to using the Calibrate pricing management platform
        </p>
      </div>

        <div className="mb-12">
          <Link
            href="/console"
            className="block bg-white border-2 border-gray-200 rounded-xl p-8 shadow-sm hover:border-blue-500 hover:shadow-md transition-all group"
          >
            <div className="flex items-center gap-3 mb-4">
              <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center">
                <svg className="w-6 h-6 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 17V7m0 10a2 2 0 01-2 2H5a2 2 0 01-2-2V7a2 2 0 012-2h2a2 2 0 012 2m0 10a2 2 0 002 2h2a2 2 0 002-2M9 7a2 2 0 012-2h2a2 2 0 012 2m0 10V7m0 10a2 2 0 002 2h2a2 2 0 002-2V7a2 2 0 00-2-2h-2a2 2 0 00-2 2" />
                </svg>
              </div>
              <h2 className="text-2xl font-semibold text-gray-900 group-hover:text-blue-600 transition-colors">
                Console User Guide
              </h2>
            </div>
            <p className="text-gray-600 mb-4">
              Complete guide to using the Calibrate pricing management console, including feature documentation and integrated API references
            </p>
            <ul className="space-y-2 text-sm text-gray-700">
              <li className="flex items-center gap-2">
                <span className="text-blue-600">→</span>
                Getting Started & Onboarding
              </li>
              <li className="flex items-center gap-2">
                <span className="text-blue-600">→</span>
                Product Catalog Management
              </li>
              <li className="flex items-center gap-2">
                <span className="text-blue-600">→</span>
                Price Changes Workflow
              </li>
              <li className="flex items-center gap-2">
                <span className="text-blue-600">→</span>
                Automated Pricing Rules
              </li>
              <li className="flex items-center gap-2">
                <span className="text-blue-600">→</span>
                Platform Integrations
              </li>
              <li className="flex items-center gap-2">
                <span className="text-blue-600">→</span>
                API References (integrated into each feature)
              </li>
            </ul>
            <div className="mt-6 text-blue-600 font-semibold group-hover:underline">
              View Console Docs →
            </div>
          </Link>
        </div>

        <div className="mb-12">
          <h2 className="text-3xl font-semibold text-gray-900 mb-6">Documentation Index</h2>

          <div className="space-y-6">
            {/* Getting Started */}
            <div className="bg-white border border-gray-200 rounded-xl p-6">
              <h3 className="text-xl font-semibold text-gray-900 mb-4">Getting Started</h3>
              <div className="grid md:grid-cols-2 gap-3">
                <Link href="/console/getting-started" className="text-blue-600 hover:underline text-sm">
                  → Setup & Onboarding Guide
                </Link>
              </div>
            </div>

            {/* Core Features */}
            <div className="bg-white border border-gray-200 rounded-xl p-6">
              <h3 className="text-xl font-semibold text-gray-900 mb-4">Core Features</h3>
              <div className="grid md:grid-cols-2 gap-3">
                <Link href="/console/catalog" className="text-blue-600 hover:underline text-sm">
                  → Product Catalog
                </Link>
                <Link href="/console/catalog#api-reference" className="text-gray-600 hover:text-blue-600 text-sm ml-4">
                  ↳ Catalog API
                </Link>
                <Link href="/console/price-changes" className="text-blue-600 hover:underline text-sm">
                  → Price Changes Workflow
                </Link>
                <Link href="/console/price-changes#api-reference" className="text-gray-600 hover:text-blue-600 text-sm ml-4">
                  ↳ Price Changes API
                </Link>
                <Link href="/console/pricing-rules" className="text-blue-600 hover:underline text-sm">
                  → Pricing Rules & Automation
                </Link>
                <Link href="/console/integrations" className="text-blue-600 hover:underline text-sm">
                  → Platform Integrations
                </Link>
                <Link href="/console/integrations#api-reference" className="text-gray-600 hover:text-blue-600 text-sm ml-4">
                  ↳ Platforms API
                </Link>
              </div>
            </div>

            {/* Intelligence & Insights */}
            <div className="bg-white border border-gray-200 rounded-xl p-6">
              <h3 className="text-xl font-semibold text-gray-900 mb-4">Intelligence & Insights</h3>
              <div className="grid md:grid-cols-2 gap-3">
                <Link href="/console/ai-assistant" className="text-blue-600 hover:underline text-sm">
                  → AI Assistant
                </Link>
                <Link href="/console/ai-assistant#api-reference" className="text-gray-600 hover:text-blue-600 text-sm ml-4">
                  ↳ Assistant API
                </Link>
                <Link href="/console/analytics" className="text-blue-600 hover:underline text-sm">
                  → Analytics & Reporting
                </Link>
                <Link href="/console/competitors" className="text-blue-600 hover:underline text-sm">
                  → Competitor Monitoring
                </Link>
              </div>
            </div>

            {/* Reference & Help */}
            <div className="bg-white border border-gray-200 rounded-xl p-6">
              <h3 className="text-xl font-semibold text-gray-900 mb-4">Reference & Help</h3>
              <div className="grid md:grid-cols-2 gap-3">
                <Link href="/console/roles-permissions" className="text-blue-600 hover:underline text-sm">
                  → Roles & Permissions
                </Link>
                <Link href="/console/troubleshooting" className="text-blue-600 hover:underline text-sm">
                  → Troubleshooting Guide
                </Link>
                <Link href="/console/best-practices" className="text-blue-600 hover:underline text-sm">
                  → Best Practices
                </Link>
              </div>
            </div>
          </div>
        </div>

        <div className="bg-blue-50 border border-blue-200 rounded-xl p-6 mb-6">
          <div className="flex items-start gap-3">
            <div className="w-8 h-8 bg-blue-100 rounded-lg flex items-center justify-center shrink-0">
              <svg className="w-5 h-5 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
              </svg>
            </div>
            <div className="flex-1">
              <h3 className="text-lg font-semibold text-gray-900 mb-2">API Documentation</h3>
              <p className="text-gray-600 text-sm mb-4">
                API references are integrated into each feature page. Navigate to any feature (Price Changes, Catalog, Integrations, etc.) to find relevant API endpoints, request/response examples, and integration guides.
              </p>
              <div className="flex items-center gap-4">
                <a
                  href="/api-spec"
                  target="_blank"
                  className="inline-flex items-center gap-2 text-blue-600 hover:underline text-sm font-semibold"
                >
                  <span>View Full OpenAPI Specification</span>
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
            className="text-gray-600 hover:text-blue-600 transition-colors text-sm"
          >
            ← Back to calibr.lat
          </a>
        </div>
    </div>
  )
}
