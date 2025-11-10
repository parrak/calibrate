import Link from 'next/link'

export default function ConsoleDocsHome() {
  return (
    <div className="min-h-screen bg-bg">
      <div className="max-w-5xl mx-auto px-6 py-16">
        {/* Header */}
        <div className="mb-12">
          <Link href="/" className="text-brand hover:underline text-sm mb-4 inline-block">
            ← Back to Documentation Home
          </Link>
          <h1 className="text-5xl font-bold text-fg mb-4">
            Console User Guide
          </h1>
          <p className="text-xl text-mute">
            Complete guide to using the Calibrate pricing management console
          </p>
        </div>

        {/* Quick Start Card */}
        <div className="bg-surface border border-brand/30 rounded-2xl p-8 shadow-xl mb-12">
          <h2 className="text-2xl font-semibold text-fg mb-4">🚀 Quick Start</h2>
          <ol className="space-y-3 text-fg">
            <li className="flex gap-3">
              <span className="font-bold text-brand">1.</span>
              <span><strong>Sign up</strong> at <a href="https://console.calibr.lat/signup" className="text-brand hover:underline">console.calibr.lat/signup</a></span>
            </li>
            <li className="flex gap-3">
              <span className="font-bold text-brand">2.</span>
              <span><strong>Create your first project</strong> during onboarding</span>
            </li>
            <li className="flex gap-3">
              <span className="font-bold text-brand">3.</span>
              <span><strong>Connect a platform</strong> (Shopify or Amazon)</span>
            </li>
            <li className="flex gap-3">
              <span className="font-bold text-brand">4.</span>
              <span><strong>Start managing prices</strong> from your dashboard</span>
            </li>
          </ol>
        </div>

        {/* Documentation Sections */}
        <div className="grid md:grid-cols-2 gap-6 mb-12">
          <DocCard
            title="Getting Started"
            href="/console/getting-started"
            description="Account setup, project creation, and platform integration basics"
            icon="📖"
          />

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
            title="AI Assistant"
            href="/console/ai-assistant"
            description="Query your pricing data with natural language"
            icon="🤖"
          />

          <DocCard
            title="Platform Integrations"
            href="/console/integrations"
            description="Connect Shopify, Amazon, and other e-commerce platforms"
            icon="🔗"
          />

          <DocCard
            title="Competitor Monitoring"
            href="/console/competitors"
            description="Track competitor prices and create monitoring rules"
            icon="👀"
          />

          <DocCard
            title="Analytics"
            href="/console/analytics"
            description="View pricing trends and performance insights"
            icon="📊"
          />
        </div>

        {/* Additional Resources */}
        <div className="bg-surface border border-border rounded-2xl p-8">
          <h2 className="text-2xl font-semibold text-fg mb-6">Additional Resources</h2>
          <div className="grid md:grid-cols-2 gap-4">
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
              href="/console/api-reference"
              title="API Reference"
              description="API endpoints used by the console"
            />
            <ResourceLink
              href="/console/best-practices"
              title="Best Practices"
              description="Tips for effective pricing management"
            />
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
      className="block bg-surface border border-border rounded-xl p-6 hover:border-brand/50 hover:shadow-lg transition-all group"
    >
      <div className="flex items-start gap-3 mb-3">
        <span className="text-3xl">{icon}</span>
        <h3 className="text-xl font-semibold text-fg group-hover:text-brand transition-colors">
          {title}
        </h3>
      </div>
      <p className="text-mute text-sm">
        {description}
      </p>
    </Link>
  )
}

function ResourceLink({ href, title, description }: { href: string; title: string; description: string }) {
  return (
    <Link
      href={href}
      className="block p-4 bg-bg border border-border rounded-lg hover:border-brand/30 transition-all"
    >
      <div className="font-semibold text-fg mb-1">{title}</div>
      <div className="text-sm text-mute">{description}</div>
    </Link>
  )
}
