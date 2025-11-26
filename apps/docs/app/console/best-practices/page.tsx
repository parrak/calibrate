import Link from 'next/link'

export default function BestPracticesDocs() {
  return (
    <div className="min-h-screen bg-bg">
      <div className="max-w-4xl mx-auto px-6 py-16">
        <Link href="/console" className="text-brand hover:underline text-sm mb-4 inline-block">
          ← Back to Console Docs
        </Link>

        <h1 className="text-4xl font-bold text-fg mb-4">Best Practices</h1>
        <p className="text-xl text-mute mb-12">
          Tips and strategies for effective pricing management with Calibrate
        </p>

        <section className="mb-12">
          <h2 className="text-3xl font-semibold text-fg mb-6">Workflow Best Practices</h2>
          <div className="space-y-4">
            <div className="bg-surface border border-border rounded-xl p-6">
              <h3 className="text-lg font-semibold text-fg mb-3">✅ Always Review Before Approving</h3>
              <p className="text-mute text-sm mb-3">
                Never blindly approve price changes. Review the details, check policy compliance, and understand the AI's reasoning.
              </p>
              <ul className="space-y-2 text-fg text-sm">
                <li>• Check percentage change and absolute difference</li>
                <li>• Review AI explanation for context</li>
                <li>• Verify policy checks passed</li>
                <li>• Consider market conditions and timing</li>
              </ul>
            </div>

            <div className="bg-surface border border-border rounded-xl p-6">
              <h3 className="text-lg font-semibold text-fg mb-3">✅ Test Changes in Batches</h3>
              <p className="text-mute text-sm mb-3">
                For large price updates, apply changes in smaller batches to monitor impact before proceeding.
              </p>
              <ul className="space-y-2 text-fg text-sm">
                <li>• Start with 10-20 products as a test</li>
                <li>• Monitor platform sync success rate</li>
                <li>• Check customer feedback</li>
                <li>• Gradually expand to full catalog</li>
              </ul>
            </div>

            <div className="bg-surface border border-border rounded-xl p-6">
              <h3 className="text-lg font-semibold text-fg mb-3">✅ Use Constraints on All Rules</h3>
              <p className="text-mute text-sm mb-3">
                Always set price floors and ceilings on automated rules to prevent unexpected pricing extremes.
              </p>
              <ul className="space-y-2 text-fg text-sm">
                <li>• Set minimum price to cover costs</li>
                <li>• Set maximum price based on market research</li>
                <li>• Limit percentage changes (e.g., max 30%)</li>
                <li>• Review constraints quarterly</li>
              </ul>
            </div>

            <div className="bg-surface border border-border rounded-xl p-6">
              <h3 className="text-lg font-semibold text-fg mb-3">✅ Monitor Sync Status</h3>
              <p className="text-mute text-sm mb-3">
                After applying price changes, always check connector status to ensure successful sync.
              </p>
              <ul className="space-y-2 text-fg text-sm">
                <li>• Wait for sync to complete before moving on</li>
                <li>• Review error messages immediately</li>
                <li>• Verify prices updated in platform admin</li>
                <li>• Keep integration credentials current</li>
              </ul>
            </div>
          </div>
        </section>

        <section className="mb-12">
          <h2 className="text-3xl font-semibold text-fg mb-6">Pricing Strategy Tips</h2>
          <div className="space-y-4">
            <div className="bg-bg border border-border rounded-lg p-4">
              <div className="flex items-start gap-3">
                <span className="text-2xl">💡</span>
                <div>
                  <div className="font-semibold text-fg mb-1">Start Conservative</div>
                  <div className="text-sm text-mute">Begin with small price changes (5-10%) and monitor customer response before making larger adjustments.</div>
                </div>
              </div>
            </div>

            <div className="bg-bg border border-border rounded-lg p-4">
              <div className="flex items-start gap-3">
                <span className="text-2xl">💡</span>
                <div>
                  <div className="font-semibold text-fg mb-1">Segment Your Catalog</div>
                  <div className="text-sm text-mute">Use different pricing rules for different product categories, price tiers, and customer segments.</div>
                </div>
              </div>
            </div>

            <div className="bg-bg border border-border rounded-lg p-4">
              <div className="flex items-start gap-3">
                <span className="text-2xl">💡</span>
                <div>
                  <div className="font-semibold text-fg mb-1">Time Your Changes</div>
                  <div className="text-sm text-mute">Consider seasonality, competitor activity, and promotional calendars when scheduling price updates.</div>
                </div>
              </div>
            </div>

            <div className="bg-bg border border-border rounded-lg p-4">
              <div className="flex items-start gap-3">
                <span className="text-2xl">💡</span>
                <div>
                  <div className="font-semibold text-fg mb-1">Monitor Competitors Wisely</div>
                  <div className="text-sm text-mute">Track competitor prices, but don't blindly match them. Maintain your value proposition and margins.</div>
                </div>
              </div>
            </div>

            <div className="bg-bg border border-border rounded-lg p-4">
              <div className="flex items-start gap-3">
                <span className="text-2xl">💡</span>
                <div>
                  <div className="font-semibold text-fg mb-1">Use Data to Decide</div>
                  <div className="text-sm text-mute">Leverage the AI Assistant and Analytics to understand pricing performance before making strategic decisions.</div>
                </div>
              </div>
            </div>
          </div>
        </section>

        <section className="mb-12">
          <h2 className="text-3xl font-semibold text-fg mb-6">Automation Best Practices</h2>
          <div className="space-y-4">
            <div className="bg-surface border border-border rounded-xl p-6">
              <h3 className="text-lg font-semibold text-fg mb-3">🤖 Start Manual, Then Automate</h3>
              <p className="text-mute text-sm mb-3">
                Before creating automated rules, manually manage pricing for a period to understand patterns and requirements.
              </p>
            </div>

            <div className="bg-surface border border-border rounded-xl p-6">
              <h3 className="text-lg font-semibold text-fg mb-3">🤖 Test Rules with Preview</h3>
              <p className="text-mute text-sm mb-3">
                Always use the preview feature to understand rule impact before enabling. Check matched products and estimated changes.
              </p>
            </div>

            <div className="bg-surface border border-border rounded-xl p-6">
              <h3 className="text-lg font-semibold text-fg mb-3">🤖 Review Rule Performance</h3>
              <p className="text-mute text-sm mb-3">
                Regularly audit your pricing rules to ensure they're still achieving desired outcomes. Disable or modify underperforming rules.
              </p>
            </div>

            <div className="bg-surface border border-border rounded-xl p-6">
              <h3 className="text-lg font-semibold text-fg mb-3">🤖 Keep Rules Simple</h3>
              <p className="text-mute text-sm mb-3">
                Use multiple simple rules instead of one complex rule. This makes debugging easier and reduces unintended consequences.
              </p>
            </div>
          </div>
        </section>

        <section className="mb-12">
          <h2 className="text-3xl font-semibold text-fg mb-6">Team Collaboration</h2>
          <div className="space-y-4">
            <div className="bg-bg border border-border rounded-lg p-4">
              <div className="flex items-start gap-3">
                <span className="text-2xl">👥</span>
                <div>
                  <div className="font-semibold text-fg mb-1">Assign Appropriate Roles</div>
                  <div className="text-sm text-mute">Use role-based permissions to implement separation of duties. Different team members should review and apply changes.</div>
                </div>
              </div>
            </div>

            <div className="bg-bg border border-border rounded-lg p-4">
              <div className="flex items-start gap-3">
                <span className="text-2xl">👥</span>
                <div>
                  <div className="font-semibold text-fg mb-1">Document Your Strategy</div>
                  <div className="text-sm text-mute">Use rule descriptions and naming conventions to communicate pricing strategy to your team.</div>
                </div>
              </div>
            </div>

            <div className="bg-bg border border-border rounded-lg p-4">
              <div className="flex items-start gap-3">
                <span className="text-2xl">👥</span>
                <div>
                  <div className="font-semibold text-fg mb-1">Regular Team Reviews</div>
                  <div className="text-sm text-mute">Schedule weekly or bi-weekly pricing reviews to discuss performance, trends, and upcoming changes.</div>
                </div>
              </div>
            </div>
          </div>
        </section>

        <section className="mb-12">
          <h2 className="text-3xl font-semibold text-fg mb-6">Security & Compliance</h2>
          <div className="space-y-4">
            <div className="bg-surface border border-border rounded-xl p-6">
              <h3 className="text-lg font-semibold text-fg mb-3">🔒 Protect Platform Credentials</h3>
              <ul className="space-y-2 text-fg text-sm">
                <li>• Never share API keys or OAuth tokens</li>
                <li>• Rotate credentials periodically</li>
                <li>• Use separate credentials for production and testing</li>
                <li>• Revoke access for departed team members immediately</li>
              </ul>
            </div>

            <div className="bg-surface border border-border rounded-xl p-6">
              <h3 className="text-lg font-semibold text-fg mb-3">🔒 Maintain Audit Trail</h3>
              <ul className="space-y-2 text-fg text-sm">
                <li>• Don't delete price change history</li>
                <li>• Keep rejected and rolled-back changes for reference</li>
                <li>• Document reasons for major pricing decisions</li>
                <li>• Use Analytics to review historical performance</li>
              </ul>
            </div>

            <div className="bg-surface border border-border rounded-xl p-6">
              <h3 className="text-lg font-semibold text-fg mb-3">🔒 Follow Regulatory Requirements</h3>
              <ul className="space-y-2 text-fg text-sm">
                <li>• Ensure price changes comply with local regulations</li>
                <li>• Be aware of price discrimination laws</li>
                <li>• Maintain transparency in pricing</li>
                <li>• Keep records for required retention periods</li>
              </ul>
            </div>
          </div>
        </section>
      </div>
    </div>
  )
}
