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
            The Analytics dashboard provides comprehensive insights into your pricing strategy performance,
            historical trends, and revenue impact.
          </p>
        </section>

        <section className="mb-12">
          <h2 className="text-3xl font-semibold text-fg mb-6">Available Dashboards</h2>
          <div className="space-y-4">
            <div className="bg-surface border border-border rounded-xl p-6">
              <h3 className="text-lg font-semibold text-fg mb-3">📈 Pricing Trends</h3>
              <ul className="space-y-2 text-fg text-sm">
                <li className="flex gap-2"><span className="text-brand">•</span>Average price over time</li>
                <li className="flex gap-2"><span className="text-brand">•</span>Price change frequency</li>
                <li className="flex gap-2"><span className="text-brand">•</span>Category-level pricing trends</li>
                <li className="flex gap-2"><span className="text-brand">•</span>Seasonal pricing patterns</li>
              </ul>
            </div>

            <div className="bg-surface border border-border rounded-xl p-6">
              <h3 className="text-lg font-semibold text-fg mb-3">💰 Revenue Impact</h3>
              <ul className="space-y-2 text-fg text-sm">
                <li className="flex gap-2"><span className="text-brand">•</span>Revenue before and after price changes</li>
                <li className="flex gap-2"><span className="text-brand">•</span>Estimated impact of pending changes</li>
                <li className="flex gap-2"><span className="text-brand">•</span>Price elasticity insights</li>
                <li className="flex gap-2"><span className="text-brand">•</span>Margin analysis</li>
              </ul>
            </div>

            <div className="bg-surface border border-border rounded-xl p-6">
              <h3 className="text-lg font-semibold text-fg mb-3">📊 Price Distribution</h3>
              <ul className="space-y-2 text-fg text-sm">
                <li className="flex gap-2"><span className="text-brand">•</span>Price range histogram</li>
                <li className="flex gap-2"><span className="text-brand">•</span>Products by price tier</li>
                <li className="flex gap-2"><span className="text-brand">•</span>Outlier detection</li>
                <li className="flex gap-2"><span className="text-brand">•</span>Currency-specific distributions</li>
              </ul>
            </div>

            <div className="bg-surface border border-border rounded-xl p-6">
              <h3 className="text-lg font-semibold text-fg mb-3">🎯 Performance Metrics</h3>
              <ul className="space-y-2 text-fg text-sm">
                <li className="flex gap-2"><span className="text-brand">•</span>Price change approval rate</li>
                <li className="flex gap-2"><span className="text-brand">•</span>Time to approval (SLA tracking)</li>
                <li className="flex gap-2"><span className="text-brand">•</span>Rollback frequency</li>
                <li className="flex gap-2"><span className="text-brand">•</span>Platform sync success rate</li>
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
                Select a time range (7 days, 30 days, 90 days, or custom)
              </li>
              <li className="flex gap-3">
                <span className="font-bold text-brand">3.</span>
                Choose specific categories or products to analyze
              </li>
              <li className="flex gap-3">
                <span className="font-bold text-brand">4.</span>
                View interactive charts and graphs
              </li>
              <li className="flex gap-3">
                <span className="font-bold text-brand">5.</span>
                Export data as CSV or PDF for reporting
              </li>
            </ol>
          </div>
        </section>

        <section className="mb-12">
          <h2 className="text-3xl font-semibold text-fg mb-6">Key Insights</h2>
          <div className="space-y-4">
            <div className="bg-bg border border-border rounded-lg p-4">
              <div className="flex items-start gap-3">
                <span className="text-2xl">📌</span>
                <div>
                  <div className="font-semibold text-fg mb-1">Historical Comparisons</div>
                  <div className="text-sm text-mute">Compare current pricing against previous periods to identify trends and opportunities.</div>
                </div>
              </div>
            </div>
            <div className="bg-bg border border-border rounded-lg p-4">
              <div className="flex items-start gap-3">
                <span className="text-2xl">📌</span>
                <div>
                  <div className="font-semibold text-fg mb-1">Competitive Positioning</div>
                  <div className="text-sm text-mute">See how your prices compare to competitor averages and market benchmarks.</div>
                </div>
              </div>
            </div>
            <div className="bg-bg border border-border rounded-lg p-4">
              <div className="flex items-start gap-3">
                <span className="text-2xl">📌</span>
                <div>
                  <div className="font-semibold text-fg mb-1">Rule Performance</div>
                  <div className="text-sm text-mute">Track which pricing rules generate the most value and highest approval rates.</div>
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
