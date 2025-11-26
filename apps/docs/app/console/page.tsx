import Link from 'next/link'

export default function ConsoleDocsHome() {
  return (
    <div className="max-w-4xl mx-auto px-6 py-12 lg:px-8">
        {/* Header */}
        <div className="mb-12">
          <Link href="/" className="text-blue-600 hover:underline text-sm mb-4 inline-block">
            ← Back to Documentation Home
          </Link>
          <h1 className="text-5xl font-bold text-gray-900 mb-4">
            Console User Guide
          </h1>
          <p className="text-xl text-gray-600 mb-6">
            Complete guide to using the Calibrate pricing management console
          </p>
          <p className="text-gray-700 max-w-3xl">
            Calibrate Console provides a centralized platform for managing e-commerce pricing across multiple channels.
            Whether you're running flash sales, matching competitor prices, or optimizing margins - this guide will help
            you get started and master advanced features.
          </p>
        </div>

        {/* What's in this guide */}
        <div className="bg-white border border-gray-200 rounded-xl p-8 mb-12">
          <h2 className="text-2xl font-semibold text-gray-900 mb-4">What's in this guide</h2>
          <div className="grid md:grid-cols-3 gap-6 text-gray-700">
            <div>
              <div className="font-semibold mb-2 text-blue-600">Getting Started</div>
              <div className="text-sm text-gray-600">Account setup, project creation, and your first price changes</div>
            </div>
            <div>
              <div className="font-semibold mb-2 text-blue-600">Core Features</div>
              <div className="text-sm text-gray-600">Catalog, price changes, pricing rules, and automation</div>
            </div>
            <div>
              <div className="font-semibold mb-2 text-blue-600">Advanced Topics</div>
              <div className="text-sm text-gray-600">AI assistant, analytics, competitor monitoring, and best practices</div>
            </div>
          </div>
        </div>

        {/* Quick Start Card */}
        <div className="bg-white border-2 border-blue-200 rounded-xl p-8 shadow-sm mb-12">
          <h2 className="text-2xl font-semibold text-gray-900 mb-4">🚀 Quick Start</h2>
          <p className="text-gray-600 mb-4">
            New to Calibrate Console? Follow these steps to get up and running in 10 minutes.
          </p>
          <ol className="space-y-3 text-gray-700 mb-6">
            <li className="flex gap-3">
              <span className="font-bold text-blue-600 shrink-0">1.</span>
              <div>
                <strong>Sign up</strong> at <a href="https://console.calibr.lat/signup" className="text-blue-600 hover:underline">console.calibr.lat/signup</a>
                <div className="text-sm text-gray-600 mt-1">Create your account and verify your email</div>
              </div>
            </li>
            <li className="flex gap-3">
              <span className="font-bold text-blue-600 shrink-0">2.</span>
              <div>
                <strong>Create your first project</strong> during onboarding
                <div className="text-sm text-gray-600 mt-1">Give it a name and URL slug</div>
              </div>
            </li>
            <li className="flex gap-3">
              <span className="font-bold text-blue-600 shrink-0">3.</span>
              <div>
                <strong>Connect a platform</strong> (Shopify or Amazon)
                <div className="text-sm text-gray-600 mt-1">Sync your product catalog automatically</div>
              </div>
            </li>
            <li className="flex gap-3">
              <span className="font-bold text-blue-600 shrink-0">4.</span>
              <div>
                <strong>Start managing prices</strong> from your dashboard
                <div className="text-sm text-gray-600 mt-1">Create rules, review changes, and optimize pricing</div>
              </div>
            </li>
          </ol>
          <Link
            href="/console/getting-started"
            className="inline-block px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-semibold"
          >
            View Full Getting Started Guide →
          </Link>
        </div>

        {/* Popular Topics */}
        <div className="bg-gray-50 border border-gray-200 rounded-xl p-6 mb-12">
          <h2 className="text-xl font-semibold text-gray-900 mb-4">Popular Topics</h2>
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-3">
            <PopularLink href="/console/integrations" text="Connect Shopify Store" />
            <PopularLink href="/console/pricing-rules" text="Create Automated Pricing Rules" />
            <PopularLink href="/console/price-changes" text="Approve & Apply Price Changes" />
            <PopularLink href="/console/ai-assistant" text="Query with AI Assistant" />
            <PopularLink href="/console/troubleshooting" text="Troubleshoot Sync Issues" />
            <PopularLink href="/console/best-practices" text="Pricing Best Practices" />
          </div>
        </div>

        {/* Core Features */}
        <div className="mb-12">
          <h2 className="text-3xl font-semibold text-gray-900 mb-6">Core Features</h2>
          <div className="grid md:grid-cols-2 gap-6">
            <DocCard
              title="Product Catalog"
              href="/console/catalog"
              description="Browse products, view pricing, search and filter your catalog"
              icon="📦"
            />

            <DocCard
              title="Price Changes"
              href="/console/price-changes"
              description="Review, approve, and manage price changes with full workflow control"
              icon="💰"
            />

            <DocCard
              title="Pricing Rules"
              href="/console/pricing-rules"
              description="Automate pricing with rules, selectors, and schedules"
              icon="⚙️"
            />

            <DocCard
              title="Platform Integrations"
              href="/console/integrations"
              description="Connect Shopify, Amazon, and other e-commerce platforms"
              icon="🔗"
            />
          </div>
        </div>

        {/* Intelligence & Insights */}
        <div className="mb-12">
          <h2 className="text-3xl font-semibold text-gray-900 mb-6">Intelligence & Insights</h2>
          <div className="grid md:grid-cols-2 gap-6">
            <DocCard
              title="AI Assistant"
              href="/console/ai-assistant"
              description="Query your pricing data with natural language"
              icon="🤖"
            />

            <DocCard
              title="Analytics"
              href="/console/analytics"
              description="View pricing trends and performance insights"
              icon="📊"
            />

            <DocCard
              title="Competitor Monitoring"
              href="/console/competitors"
              description="Track competitor prices and create monitoring rules"
              icon="👀"
            />

            <DocCard
              title="Best Practices"
              href="/console/best-practices"
              description="Tips and strategies for effective pricing management"
              icon="✨"
            />
          </div>
        </div>

        {/* Reference & Help */}
        <div className="mb-12">
          <h2 className="text-3xl font-semibold text-gray-900 mb-6">Reference & Help</h2>
          <div className="bg-white border border-gray-200 rounded-xl p-6 mb-6">
            <div className="grid md:grid-cols-2 gap-4">
              <ResourceLink
                href="/console/getting-started"
                title="Getting Started Guide"
                description="Step-by-step guide to setting up your account"
              />
              <ResourceLink
                href="/console/roles-permissions"
                title="Roles & Permissions"
                description="Understanding user roles and access control"
              />
              <ResourceLink
                href="/console/troubleshooting"
                title="Troubleshooting"
                description="Common issues and solutions"
              />
              <ResourceLink
                href="/console/best-practices"
                title="Best Practices"
                description="Tips and strategies for effective pricing"
              />
            </div>
          </div>

          <div className="bg-blue-50 border border-blue-200 rounded-xl p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-3">API References</h3>
            <p className="text-gray-600 text-sm mb-4">
              API documentation is integrated into each feature page. Visit any feature page (Price Changes, Catalog, Integrations, AI Assistant) to find relevant API endpoints and examples.
            </p>
            <div className="flex gap-3 text-sm">
              <a href="/console/price-changes#api-reference" className="text-blue-600 hover:underline">Price Changes API</a>
              <span className="text-gray-400">•</span>
              <a href="/console/catalog#api-reference" className="text-blue-600 hover:underline">Catalog API</a>
              <span className="text-gray-400">•</span>
              <a href="/console/integrations#api-reference" className="text-blue-600 hover:underline">Platforms API</a>
              <span className="text-gray-400">•</span>
              <a href="/console/ai-assistant#api-reference" className="text-blue-600 hover:underline">Assistant API</a>
            </div>
          </div>
        </div>

        {/* Help Section */}
        <div className="bg-blue-50 border border-blue-200 rounded-xl p-8">
          <h2 className="text-2xl font-semibold text-gray-900 mb-4">Need Help?</h2>
          <div className="grid md:grid-cols-2 gap-6">
            <div>
              <h3 className="font-semibold text-gray-900 mb-2">Can't find what you're looking for?</h3>
              <p className="text-gray-600 text-sm mb-4">
                Try our AI Assistant within the console, or check the Troubleshooting guide for common issues.
              </p>
              <Link
                href="/console/troubleshooting"
                className="text-blue-600 hover:underline text-sm font-semibold"
              >
                View Troubleshooting Guide →
              </Link>
            </div>
            <div>
              <h3 className="font-semibold text-gray-900 mb-2">Want to see it in action?</h3>
              <p className="text-gray-600 text-sm mb-4">
                Use the demo account to explore all features with sample data before connecting your own store.
              </p>
              <a
                href="https://console.calibr.lat"
                className="text-blue-600 hover:underline text-sm font-semibold"
                target="_blank"
                rel="noopener noreferrer"
              >
                Try Demo Account →
              </a>
            </div>
          </div>
        </div>
    </div>
  )
}

function DocCard({ title, href, description, icon }: { title: string; href: string; description: string; icon: string }) {
  return (
    <Link
      href={href}
      className="block bg-white border border-gray-200 rounded-xl p-6 hover:border-blue-500 hover:shadow-md transition-all group"
    >
      <div className="flex items-start gap-3 mb-3">
        <span className="text-3xl">{icon}</span>
        <h3 className="text-xl font-semibold text-gray-900 group-hover:text-blue-600 transition-colors">
          {title}
        </h3>
      </div>
      <p className="text-gray-600 text-sm">
        {description}
      </p>
    </Link>
  )
}

function ResourceLink({ href, title, description }: { href: string; title: string; description: string }) {
  return (
    <Link
      href={href}
      className="block p-4 bg-gray-50 border border-gray-200 rounded-lg hover:border-blue-300 transition-all"
    >
      <div className="font-semibold text-gray-900 mb-1">{title}</div>
      <div className="text-sm text-gray-600">{description}</div>
    </Link>
  )
}

function PopularLink({ href, text }: { href: string; text: string }) {
  return (
    <Link
      href={href}
      className="block px-4 py-2 text-sm text-gray-700 hover:text-blue-600 border border-gray-200 rounded-lg hover:border-blue-300 transition-all"
    >
      {text} →
    </Link>
  )
}
