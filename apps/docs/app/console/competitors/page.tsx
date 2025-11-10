import Link from 'next/link'

export default function CompetitorsDocs() {
  return (
    <div className="min-h-screen bg-bg">
      <div className="max-w-4xl mx-auto px-6 py-16">
        <Link href="/console" className="text-brand hover:underline text-sm mb-4 inline-block">
          ← Back to Console Docs
        </Link>

        <h1 className="text-4xl font-bold text-fg mb-4">Competitor Monitoring</h1>
        <p className="text-xl text-mute mb-12">
          Track competitor prices and automate competitive pricing strategies
        </p>

        <section className="mb-12">
          <h2 className="text-3xl font-semibold text-fg mb-6">Overview</h2>
          <p className="text-fg mb-6">
            The Competitor Monitoring feature allows you to track pricing from competitors, set up monitoring rules,
            and create automated responses to competitor price changes.
          </p>
        </section>

        <section className="mb-12">
          <h2 className="text-3xl font-semibold text-fg mb-6">Features</h2>
          <div className="space-y-4">
            <div className="bg-surface border border-border rounded-xl p-6">
              <h3 className="text-lg font-semibold text-fg mb-3">🔍 Price Tracking</h3>
              <ul className="space-y-2 text-fg text-sm">
                <li className="flex gap-2"><span className="text-brand">•</span>Monitor competitor prices in real-time</li>
                <li className="flex gap-2"><span className="text-brand">•</span>Track price changes over time</li>
                <li className="flex gap-2"><span className="text-brand">•</span>View price history and trends</li>
                <li className="flex gap-2"><span className="text-brand">•</span>Compare against your current prices</li>
              </ul>
            </div>

            <div className="bg-surface border border-border rounded-xl p-6">
              <h3 className="text-lg font-semibold text-fg mb-3">⚙️ Monitoring Rules</h3>
              <ul className="space-y-2 text-fg text-sm">
                <li className="flex gap-2"><span className="text-brand">•</span>Create rules to track specific competitors</li>
                <li className="flex gap-2"><span className="text-brand">•</span>Set up automatic price matching</li>
                <li className="flex gap-2"><span className="text-brand">•</span>Define pricing thresholds and alerts</li>
                <li className="flex gap-2"><span className="text-brand">•</span>Schedule monitoring frequency</li>
              </ul>
            </div>

            <div className="bg-surface border border-border rounded-xl p-6">
              <h3 className="text-lg font-semibold text-fg mb-3">📊 Analytics</h3>
              <ul className="space-y-2 text-fg text-sm">
                <li className="flex gap-2"><span className="text-brand">•</span>View competitive positioning</li>
                <li className="flex gap-2"><span className="text-brand">•</span>Identify pricing opportunities</li>
                <li className="flex gap-2"><span className="text-brand">•</span>Track market price movements</li>
                <li className="flex gap-2"><span className="text-brand">•</span>Export competitive intelligence reports</li>
              </ul>
            </div>
          </div>
        </section>

        <section className="mb-12">
          <h2 className="text-3xl font-semibold text-fg mb-6">Getting Started</h2>
          <div className="bg-surface border border-border rounded-xl p-6">
            <ol className="space-y-3 text-fg">
              <li className="flex gap-3">
                <span className="font-bold text-brand">1.</span>
                Navigate to <strong>Competitors</strong> in the sidebar
              </li>
              <li className="flex gap-3">
                <span className="font-bold text-brand">2.</span>
                Click <strong>"Add Competitor"</strong> to add a new competitor to monitor
              </li>
              <li className="flex gap-3">
                <span className="font-bold text-brand">3.</span>
                Enter competitor details (name, website, products to track)
              </li>
              <li className="flex gap-3">
                <span className="font-bold text-brand">4.</span>
                Set up monitoring rules to automate price tracking
              </li>
              <li className="flex gap-3">
                <span className="font-bold text-brand">5.</span>
                View competitor prices in the dashboard
              </li>
            </ol>
          </div>
        </section>

        <section className="mb-12">
          <h2 className="text-3xl font-semibold text-fg mb-6">Creating Monitoring Rules</h2>
          <div className="bg-surface border border-border rounded-xl p-6 mb-4">
            <h3 className="text-lg font-semibold text-fg mb-3">Rule Components</h3>
            <ul className="space-y-3 text-fg">
              <li className="flex gap-2">
                <span className="text-brand">•</span>
                <div>
                  <strong>Competitor Selection:</strong> Which competitors to monitor
                </div>
              </li>
              <li className="flex gap-2">
                <span className="text-brand">•</span>
                <div>
                  <strong>Product Matching:</strong> Map your SKUs to competitor products
                </div>
              </li>
              <li className="flex gap-2">
                <span className="text-brand">•</span>
                <div>
                  <strong>Pricing Strategy:</strong> Match, beat by X%, or stay within range
                </div>
              </li>
              <li className="flex gap-2">
                <span className="text-brand">•</span>
                <div>
                  <strong>Schedule:</strong> How often to check competitor prices
                </div>
              </li>
            </ul>
          </div>
        </section>

        <section className="mb-12">
          <h2 className="text-3xl font-semibold text-fg mb-6">Best Practices</h2>
          <div className="space-y-4">
            <div className="bg-bg border border-border rounded-lg p-4">
              <div className="flex items-start gap-3">
                <span className="text-2xl">✨</span>
                <div>
                  <div className="font-semibold text-fg mb-1">Set Reasonable Margins</div>
                  <div className="text-sm text-mute">Don't race to the bottom - maintain profitability with minimum price floors.</div>
                </div>
              </div>
            </div>
            <div className="bg-bg border border-border rounded-lg p-4">
              <div className="flex items-start gap-3">
                <span className="text-2xl">✨</span>
                <div>
                  <div className="font-semibold text-fg mb-1">Monitor Key Products</div>
                  <div className="text-sm text-mute">Focus on your best-sellers and high-margin products for competitive monitoring.</div>
                </div>
              </div>
            </div>
            <div className="bg-bg border border-border rounded-lg p-4">
              <div className="flex items-start gap-3">
                <span className="text-2xl">✨</span>
                <div>
                  <div className="font-semibold text-fg mb-1">Review Before Applying</div>
                  <div className="text-sm text-mute">Always review competitor-triggered price changes before applying them.</div>
                </div>
              </div>
            </div>
          </div>
        </section>

        <section className="mb-12">
          <h2 className="text-3xl font-semibold text-fg mb-6">Related Documentation</h2>
          <div className="grid md:grid-cols-2 gap-4">
            <Link href="/console/price-changes" className="block bg-bg border border-border rounded-xl p-4 hover:border-brand/50 transition-all">
              <div className="font-semibold text-fg mb-2">Price Changes →</div>
              <div className="text-sm text-mute">Review competitor-triggered price changes</div>
            </Link>
            <Link href="/console/pricing-rules" className="block bg-bg border border-border rounded-xl p-4 hover:border-brand/50 transition-all">
              <div className="font-semibold text-fg mb-2">Pricing Rules →</div>
              <div className="text-sm text-mute">Automate responses to competitor pricing</div>
            </Link>
            <Link href="/console/analytics" className="block bg-bg border border-border rounded-xl p-4 hover:border-brand/50 transition-all">
              <div className="font-semibold text-fg mb-2">Analytics →</div>
              <div className="text-sm text-mute">View competitive positioning insights</div>
            </Link>
          </div>
        </section>
      </div>
    </div>
  )
}
