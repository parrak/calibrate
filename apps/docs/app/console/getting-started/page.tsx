import Link from 'next/link'

export default function GettingStarted() {
  return (
    <div className="min-h-screen bg-bg">
      <div className="max-w-4xl mx-auto px-6 py-16">
        <Link href="/console" className="text-brand hover:underline text-sm mb-4 inline-block">
          ← Back to Console Docs
        </Link>

        <h1 className="text-4xl font-bold text-fg mb-4">Getting Started</h1>
        <p className="text-xl text-mute mb-12">
          Everything you need to know to get started with Calibrate Console
        </p>

        {/* What is Calibrate Console */}
        <section className="mb-12">
          <h2 className="text-3xl font-semibold text-fg mb-6">What is Calibrate Console?</h2>

          <div className="bg-surface border border-border rounded-xl p-6 mb-6">
            <p className="text-fg mb-4">
              Calibrate Console is a pricing management platform that helps e-commerce businesses automate and optimize
              their pricing strategies. It provides a centralized system for managing prices across multiple platforms,
              with built-in approval workflows, competitive monitoring, and AI-powered insights.
            </p>
            <h3 className="text-lg font-semibold text-fg mb-3">Key Benefits</h3>
            <ul className="space-y-2 text-fg">
              <li className="flex items-start gap-2">
                <span className="text-brand">•</span>
                <div><strong>Governance:</strong> Human-in-the-loop approval before any price changes go live</div>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-brand">•</span>
                <div><strong>Automation:</strong> Create rules that automatically adjust prices based on conditions</div>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-brand">•</span>
                <div><strong>Intelligence:</strong> AI-powered pricing recommendations and natural language queries</div>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-brand">•</span>
                <div><strong>Integration:</strong> Seamlessly sync with Shopify, Amazon, and other platforms</div>
              </li>
            </ul>
          </div>

          <div className="bg-brand/10 border border-brand/20 rounded-xl p-4">
            <p className="text-fg text-sm">
              <strong className="text-brand">Time to get started:</strong> 5-10 minutes for account creation and basic setup.
              Full platform integration and first pricing rule: 15-20 minutes.
            </p>
          </div>
        </section>

        {/* Prerequisites */}
        <section className="mb-12">
          <h2 className="text-3xl font-semibold text-fg mb-6">Prerequisites</h2>

          <div className="bg-surface border border-border rounded-xl p-6">
            <p className="text-fg mb-4">Before you begin, make sure you have:</p>
            <ul className="space-y-3 text-fg">
              <li className="flex items-start gap-2">
                <span className="text-brand">✓</span>
                <div>
                  <strong>Valid Email Address:</strong> You'll need this to create your account and receive notifications
                </div>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-brand">✓</span>
                <div>
                  <strong>E-commerce Platform Account:</strong> Admin access to Shopify, Amazon Seller Central, or both
                </div>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-brand">✓</span>
                <div>
                  <strong>Modern Web Browser:</strong> Chrome, Firefox, Safari, or Edge (latest versions)
                </div>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-brand">●</span>
                <div>
                  <strong>Optional: Product Catalog:</strong> At least a few products in your e-commerce platform to test with
                </div>
              </li>
            </ul>
          </div>
        </section>

        {/* Account Creation */}
        <section className="mb-12">
          <h2 className="text-3xl font-semibold text-fg mb-6">Creating Your Account</h2>

          <div className="bg-surface border border-border rounded-xl p-6 mb-6">
            <h3 className="text-xl font-semibold text-fg mb-4">Sign Up Process</h3>
            <ol className="space-y-4 text-fg">
              <li className="flex gap-3">
                <span className="font-bold text-brand shrink-0">1.</span>
                <div>
                  <strong>Visit the signup page:</strong> Navigate to{' '}
                  <a href="https://console.calibr.lat/signup" className="text-brand hover:underline">
                    console.calibr.lat/signup
                  </a>
                </div>
              </li>
              <li className="flex gap-3">
                <span className="font-bold text-brand shrink-0">2.</span>
                <div>
                  <strong>Enter your email:</strong> Use a valid email address for your account
                </div>
              </li>
              <li className="flex gap-3">
                <span className="font-bold text-brand shrink-0">3.</span>
                <div>
                  <strong>Create a password:</strong> Choose a secure password for your account
                </div>
              </li>
              <li className="flex gap-3">
                <span className="font-bold text-brand shrink-0">4.</span>
                <div>
                  <strong>Submit:</strong> Click "Create Account" to complete registration
                </div>
              </li>
            </ol>
          </div>

          <div className="bg-brand/10 border border-brand/20 rounded-xl p-4 mb-4">
            <p className="text-fg text-sm">
              <strong className="text-brand">Demo Account:</strong> Want to try before signing up? Use the demo account:{' '}
              <code className="bg-bg px-2 py-1 rounded">demo@calibr.lat</code>
            </p>
          </div>

          <div className="bg-surface border border-border rounded-xl p-6">
            <h3 className="text-xl font-semibold text-fg mb-4">Expected Outcome</h3>
            <p className="text-fg mb-3">After completing the signup process, you will:</p>
            <ul className="space-y-2 text-fg text-sm">
              <li className="flex items-start gap-2">
                <span className="text-green-500">✓</span>
                Receive a confirmation email (check spam folder if not received within 5 minutes)
              </li>
              <li className="flex items-start gap-2">
                <span className="text-green-500">✓</span>
                Be automatically logged in to the console
              </li>
              <li className="flex items-start gap-2">
                <span className="text-green-500">✓</span>
                See the onboarding wizard to create your first project
              </li>
            </ul>
          </div>
        </section>

        {/* Onboarding */}
        <section className="mb-12">
          <h2 className="text-3xl font-semibold text-fg mb-6">Onboarding Your First Project</h2>

          <p className="text-fg mb-6">
            After creating your account, you'll be guided through a 2-step onboarding process to set up your first project.
          </p>

          <div className="space-y-6">
            <div className="bg-surface border border-border rounded-xl p-6">
              <h3 className="text-xl font-semibold text-fg mb-4">Step 1: Create Your Project</h3>
              <div className="space-y-3 text-fg">
                <p>
                  <strong className="text-brand">Project Name:</strong> Enter a descriptive name for your project (e.g., "My Store", "Summer Shop")
                </p>
                <p>
                  <strong className="text-brand">URL Slug:</strong> A URL-friendly identifier is automatically generated from your project name (e.g., "my-store")
                </p>
                <p className="text-mute text-sm">
                  This slug will be used in your console URLs: <code className="bg-bg px-2 py-1 rounded">/p/my-store</code>
                </p>
              </div>
            </div>

            <div className="bg-surface border border-border rounded-xl p-6">
              <h3 className="text-xl font-semibold text-fg mb-4">Step 2: Connect a Platform</h3>
              <p className="text-fg mb-4">
                Choose your e-commerce platform to sync products and prices:
              </p>
              <div className="space-y-3">
                <div className="bg-bg border border-border p-4 rounded-lg">
                  <div className="flex items-center gap-3 mb-2">
                    <span className="text-2xl">🛍️</span>
                    <strong className="text-fg">Shopify</strong>
                  </div>
                  <p className="text-mute text-sm">
                    Full integration with OAuth authentication. Automatically syncs products, variants, and prices. Supports price change write-back.
                  </p>
                </div>
                <div className="bg-bg border border-border p-4 rounded-lg">
                  <div className="flex items-center gap-3 mb-2">
                    <span className="text-2xl">📦</span>
                    <strong className="text-fg">Amazon</strong>
                  </div>
                  <p className="text-mute text-sm">
                    Connect via Amazon SP-API with read-only catalog import (pricing and competitive monitoring features).
                  </p>
                </div>
              </div>
            </div>
          </div>

          <div className="mt-6 bg-bg border border-border rounded-xl p-4">
            <p className="text-fg text-sm">
              💡 <strong>Tip:</strong> You can skip platform connection during onboarding and set it up later from the Integrations page.
            </p>
          </div>
        </section>

        {/* Dashboard Overview */}
        <section className="mb-12">
          <h2 className="text-3xl font-semibold text-fg mb-6">Your Dashboard</h2>

          <p className="text-fg mb-6">
            After onboarding, you'll land on your project dashboard. Here's what you'll find:
          </p>

          <div className="grid md:grid-cols-2 gap-4 mb-6">
            <FeatureBox
              title="Overview Metrics"
              items={[
                "Total products and SKUs",
                "Pending price changes",
                "Recent activity",
                "Platform sync status"
              ]}
            />
            <FeatureBox
              title="Quick Actions"
              items={[
                "Review pending changes",
                "Create pricing rules",
                "View catalog",
                "Check integrations"
              ]}
            />
          </div>

          <div className="bg-surface border border-border rounded-xl p-6">
            <h3 className="text-xl font-semibold text-fg mb-4">Navigation Sidebar</h3>
            <p className="text-fg mb-3">The left sidebar provides access to all console features:</p>
            <ul className="space-y-2 text-fg">
              <li className="flex items-center gap-2">
                <span className="text-brand">→</span>
                <strong>Dashboard:</strong> <span className="text-mute">Overview and metrics</span>
              </li>
              <li className="flex items-center gap-2">
                <span className="text-brand">→</span>
                <strong>Catalog:</strong> <span className="text-mute">Browse products and SKUs</span>
              </li>
              <li className="flex items-center gap-2">
                <span className="text-brand">→</span>
                <strong>Price Changes:</strong> <span className="text-mute">Manage pricing workflow</span>
              </li>
              <li className="flex items-center gap-2">
                <span className="text-brand">→</span>
                <strong>Rules:</strong> <span className="text-mute">Automated pricing rules</span>
              </li>
              <li className="flex items-center gap-2">
                <span className="text-brand">→</span>
                <strong>Assistant:</strong> <span className="text-mute">AI-powered queries</span>
              </li>
              <li className="flex items-center gap-2">
                <span className="text-brand">→</span>
                <strong>Competitors:</strong> <span className="text-mute">Price monitoring</span>
              </li>
              <li className="flex items-center gap-2">
                <span className="text-brand">→</span>
                <strong>Analytics:</strong> <span className="text-mute">Trends and insights</span>
              </li>
              <li className="flex items-center gap-2">
                <span className="text-brand">→</span>
                <strong>Integrations:</strong> <span className="text-mute">Platform connections</span>
              </li>
            </ul>
          </div>
        </section>

        {/* Managing Multiple Projects */}
        <section className="mb-12">
          <h2 className="text-3xl font-semibold text-fg mb-6">Managing Multiple Projects</h2>

          <div className="bg-surface border border-border rounded-xl p-6 mb-4">
            <h3 className="text-xl font-semibold text-fg mb-4">Switching Between Projects</h3>
            <ol className="space-y-3 text-fg">
              <li className="flex gap-3">
                <span className="font-bold text-brand">1.</span>
                Click the <strong>project dropdown</strong> in the top navigation
              </li>
              <li className="flex gap-3">
                <span className="font-bold text-brand">2.</span>
                Select the project you want to view
              </li>
              <li className="flex gap-3">
                <span className="font-bold text-brand">3.</span>
                You'll be redirected to that project's dashboard
              </li>
            </ol>
          </div>

          <div className="bg-surface border border-border rounded-xl p-6">
            <h3 className="text-xl font-semibold text-fg mb-4">Creating Additional Projects</h3>
            <ol className="space-y-3 text-fg">
              <li className="flex gap-3">
                <span className="font-bold text-brand">1.</span>
                Navigate to the <strong>Projects</strong> page from your account menu
              </li>
              <li className="flex gap-3">
                <span className="font-bold text-brand">2.</span>
                Click <strong>"Create New Project"</strong>
              </li>
              <li className="flex gap-3">
                <span className="font-bold text-brand">3.</span>
                Follow the same onboarding flow as your first project
              </li>
            </ol>
          </div>
        </section>

        {/* Common Issues */}
        <section className="mb-12">
          <h2 className="text-3xl font-semibold text-fg mb-6">Troubleshooting Common Issues</h2>

          <div className="space-y-4">
            <div className="bg-surface border border-border rounded-xl p-6">
              <h3 className="text-lg font-semibold text-fg mb-3">Issue: Can't receive confirmation email</h3>
              <p className="text-mute text-sm mb-3">
                <strong className="text-fg">Solution:</strong> Check your spam/junk folder. Add noreply@calibr.lat to your contacts.
                If still not received after 10 minutes, try resending from the login page.
              </p>
            </div>

            <div className="bg-surface border border-border rounded-xl p-6">
              <h3 className="text-lg font-semibold text-fg mb-3">Issue: Onboarding wizard doesn't appear</h3>
              <p className="text-mute text-sm mb-3">
                <strong className="text-fg">Solution:</strong> Clear your browser cache and cookies, then log in again.
                Alternatively, navigate directly to /onboarding in your browser.
              </p>
            </div>

            <div className="bg-surface border border-border rounded-xl p-6">
              <h3 className="text-lg font-semibold text-fg mb-3">Issue: Platform integration fails during onboarding</h3>
              <p className="text-mute text-sm mb-3">
                <strong className="text-fg">Solution:</strong> You can skip platform integration during onboarding and set it up later
                from the Integrations page. Make sure you have admin access to your e-commerce platform.
              </p>
            </div>
          </div>
        </section>

        {/* FAQ */}
        <section className="mb-12">
          <h2 className="text-3xl font-semibold text-fg mb-6">Frequently Asked Questions</h2>

          <div className="space-y-4">
            <div className="bg-surface border border-border rounded-xl p-6">
              <h3 className="text-lg font-semibold text-fg mb-2">Can I test Calibrate without connecting my store?</h3>
              <p className="text-mute text-sm">
                Yes! Use the demo account (demo@calibr.lat) to explore all features with sample data. You can also create
                your own account and skip platform integration during onboarding.
              </p>
            </div>

            <div className="bg-surface border border-border rounded-xl p-6">
              <h3 className="text-lg font-semibold text-fg mb-2">How long does the initial product sync take?</h3>
              <p className="text-mute text-sm">
                Initial sync time depends on catalog size. Small catalogs (under 100 products) typically complete in 1-2 minutes.
                Larger catalogs (1000+ products) may take 10-15 minutes. You can start using the console while sync is in progress.
              </p>
            </div>

            <div className="bg-surface border border-border rounded-xl p-6">
              <h3 className="text-lg font-semibold text-fg mb-2">Can I manage multiple stores in one account?</h3>
              <p className="text-mute text-sm">
                Yes! You can create multiple projects within one account, each connected to different e-commerce platforms or stores.
                Use the project dropdown to switch between them.
              </p>
            </div>

            <div className="bg-surface border border-border rounded-xl p-6">
              <h3 className="text-lg font-semibold text-fg mb-2">Will Calibrate automatically change my prices?</h3>
              <p className="text-mute text-sm">
                No. Calibrate follows a human-in-the-loop workflow. Price changes are proposed (by rules or AI), but you must
                explicitly approve and apply them before they go live. This ensures full control over your pricing.
              </p>
            </div>

            <div className="bg-surface border border-border rounded-xl p-6">
              <h3 className="text-lg font-semibold text-fg mb-2">What if I make a mistake?</h3>
              <p className="text-mute text-sm">
                Every applied price change can be rolled back with a single click. Calibrate maintains a complete history
                of all price changes, so you can always revert to previous prices.
              </p>
            </div>
          </div>
        </section>

        {/* Next Steps */}
        <section className="mb-12">
          <h2 className="text-3xl font-semibold text-fg mb-6">Next Steps</h2>

          <div className="grid md:grid-cols-2 gap-4">
            <NextStepCard
              href="/console/integrations"
              title="Set Up Integrations"
              description="Connect your e-commerce platforms"
            />
            <NextStepCard
              href="/console/catalog"
              title="Explore Your Catalog"
              description="Browse and search your products"
            />
            <NextStepCard
              href="/console/price-changes"
              title="Review Price Changes"
              description="Learn the approval workflow"
            />
            <NextStepCard
              href="/console/pricing-rules"
              title="Create Pricing Rules"
              description="Automate your pricing strategy"
            />
          </div>
        </section>
      </div>
    </div>
  )
}

function FeatureBox({ title, items }: { title: string; items: string[] }) {
  return (
    <div className="bg-surface border border-border rounded-xl p-4">
      <h4 className="font-semibold text-fg mb-3">{title}</h4>
      <ul className="space-y-2">
        {items.map((item, i) => (
          <li key={i} className="text-sm text-mute flex items-start gap-2">
            <span className="text-brand">•</span>
            {item}
          </li>
        ))}
      </ul>
    </div>
  )
}

function NextStepCard({ href, title, description }: { href: string; title: string; description: string }) {
  return (
    <Link
      href={href}
      className="block bg-bg border border-border rounded-xl p-4 hover:border-brand/50 transition-all"
    >
      <div className="font-semibold text-fg mb-2">{title} →</div>
      <div className="text-sm text-mute">{description}</div>
    </Link>
  )
}
