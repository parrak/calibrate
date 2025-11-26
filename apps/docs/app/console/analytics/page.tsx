import Link from 'next/link'

export default function AnalyticsDocs() {
  return (
    <div className="min-h-screen bg-bg">
      <div className="max-w-4xl mx-auto px-6 py-16">
        <Link href="/console" className="text-brand hover:underline text-sm mb-4 inline-block">
          ← Back to Console Docs
        </Link>

        <h1 className="text-4xl font-bold text-fg mb-4">Analytics</h1>
        <p className="text-xl text-mute mb-12">
          View pricing trends, performance insights, and revenue impact analysis
        </p>

        <section className="mb-12">
          <h2 className="text-3xl font-semibold text-fg mb-6">Overview</h2>
          <p className="text-fg mb-6">
            The Analytics dashboard provides key insights into your pricing operations,
            including summary metrics, price change trends, and product performance data.
          </p>
        </section>

        <section className="mb-12">
          <h2 className="text-3xl font-semibold text-fg mb-6">Current Features</h2>
          <div className="space-y-4">
            <div className="bg-surface border border-border rounded-xl p-6">
              <h3 className="text-lg font-semibold text-fg mb-3">📊 Summary Metrics</h3>
              <ul className="space-y-2 text-fg text-sm">
                <li className="flex gap-2"><span className="text-brand">•</span>Total SKUs tracked in your catalog</li>
                <li className="flex gap-2"><span className="text-brand">•</span>Total price changes over selected time period</li>
                <li className="flex gap-2"><span className="text-brand">•</span>Approval rate percentage</li>
                <li className="flex gap-2"><span className="text-brand">•</span>Average price across your catalog</li>
              </ul>
            </div>

            <div className="bg-surface border border-border rounded-xl p-6">
              <h3 className="text-lg font-semibold text-fg mb-3">📈 Trend Visualization</h3>
              <ul className="space-y-2 text-fg text-sm">
                <li className="flex gap-2"><span className="text-brand">•</span>Simple bar chart comparing current vs. previous period</li>
                <li className="flex gap-2"><span className="text-brand">•</span>Directional indicators (up/down/stable) with percentage change</li>
                <li className="flex gap-2"><span className="text-brand">•</span>Configurable time ranges (7, 30, or 90 days)</li>
              </ul>
            </div>

            <div className="bg-surface border border-border rounded-xl p-6">
              <h3 className="text-lg font-semibold text-fg mb-3">🏆 Top Performers</h3>
              <ul className="space-y-2 text-fg text-sm">
                <li className="flex gap-2"><span className="text-brand">•</span>Products with highest margins</li>
                <li className="flex gap-2"><span className="text-brand">•</span>Recently added or updated products</li>
                <li className="flex gap-2"><span className="text-brand">•</span>Basic product information (SKU, name, price)</li>
              </ul>
            </div>
          </div>
        </section>

        <section className="mb-12">
          <h2 className="text-3xl font-semibold text-fg mb-6">Using the Analytics Dashboard</h2>
          <div className="bg-surface border border-border rounded-xl p-6">
            <ol className="space-y-3 text-fg">
              <li className="flex gap-3">
                <span className="font-bold text-brand">1.</span>
                Navigate to <strong>Analytics</strong> in the project sidebar
              </li>
              <li className="flex gap-3">
                <span className="font-bold text-brand">2.</span>
                Select a time range using the buttons in the top right (7 days, 30 days, or 90 days)
              </li>
              <li className="flex gap-3">
                <span className="font-bold text-brand">3.</span>
                View the summary metrics cards for quick insights
              </li>
              <li className="flex gap-3">
                <span className="font-bold text-brand">4.</span>
                Review the trend chart to see period-over-period changes
              </li>
              <li className="flex gap-3">
                <span className="font-bold text-brand">5.</span>
                Scroll down to see top performing products by margin
              </li>
            </ol>
          </div>
        </section>

        <section className="mb-12">
          <h2 className="text-3xl font-semibold text-fg mb-6">Understanding Your Data</h2>
          <div className="space-y-4">
            <div className="bg-bg border border-border rounded-lg p-4">
              <div className="flex items-start gap-3">
                <span className="text-2xl">📌</span>
                <div>
                  <div className="font-semibold text-fg mb-1">Period Comparisons</div>
                  <div className="text-sm text-mute">The dashboard compares your selected period against the equivalent previous period to show trends.</div>
                </div>
              </div>
            </div>
            <div className="bg-bg border border-border rounded-lg p-4">
              <div className="flex items-start gap-3">
                <span className="text-2xl">📌</span>
                <div>
                  <div className="font-semibold text-fg mb-1">Approval Rate</div>
                  <div className="text-sm text-mute">Shows the percentage of price changes that have been approved, helping you gauge confidence in automated suggestions.</div>
                </div>
              </div>
            </div>
            <div className="bg-bg border border-border rounded-lg p-4">
              <div className="flex items-start gap-3">
                <span className="text-2xl">📌</span>
                <div>
                  <div className="font-semibold text-fg mb-1">Top Performers</div>
                  <div className="text-sm text-mute">Identify your highest-margin products to understand which items drive profitability.</div>
                </div>
              </div>
            </div>
          </div>
        </section>

        <section className="mb-12">
          <h2 className="text-3xl font-semibold text-fg mb-6">Coming Soon</h2>
          <div className="bg-amber-500/10 border border-amber-500/30 rounded-xl p-6">
            <p className="text-fg mb-3">The following analytics features are planned for future releases:</p>
            <ul className="space-y-2 text-fg text-sm list-disc list-inside">
              <li>Advanced filtering by category and product attributes</li>
              <li>Revenue impact analysis and forecasting</li>
              <li>Competitive positioning insights</li>
              <li>Custom date range selection</li>
              <li>Data export (CSV and PDF)</li>
              <li>Interactive time-series charts</li>
              <li>Price distribution histograms</li>
              <li>Rule performance tracking</li>
            </ul>
          </div>
        </section>

        <section className="mb-12">
          <h2 className="text-3xl font-semibold text-fg mb-6">Related Documentation</h2>
          <div className="grid md:grid-cols-2 gap-4">
            <Link href="/console/price-changes" className="block bg-bg border border-border rounded-xl p-4 hover:border-brand/50 transition-all">
              <div className="font-semibold text-fg mb-2">Price Changes →</div>
              <div className="text-sm text-mute">View the source data for analytics</div>
            </Link>
            <Link href="/console/ai-assistant" className="block bg-bg border border-border rounded-xl p-4 hover:border-brand/50 transition-all">
              <div className="font-semibold text-fg mb-2">AI Assistant →</div>
              <div className="text-sm text-mute">Query custom analytics with natural language</div>
            </Link>
          </div>
        </section>
      </div>
    </div>
  )
}
