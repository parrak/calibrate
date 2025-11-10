import Link from 'next/link'

export default function TroubleshootingDocs() {
  return (
    <div className="min-h-screen bg-bg">
      <div className="max-w-4xl mx-auto px-6 py-16">
        <Link href="/console" className="text-brand hover:underline text-sm mb-4 inline-block">
          ← Back to Console Docs
        </Link>

        <h1 className="text-4xl font-bold text-fg mb-4">Troubleshooting</h1>
        <p className="text-xl text-mute mb-12">
          Common issues and solutions for Calibrate Console
        </p>

        <section className="mb-12">
          <h2 className="text-3xl font-semibold text-fg mb-6">Common Issues</h2>

          <div className="space-y-6">
            <div className="bg-surface border border-border rounded-xl p-6">
              <h3 className="text-xl font-semibold text-fg mb-3">🔐 Login Problems</h3>
              <div className="mb-3">
                <div className="text-sm font-semibold text-mute mb-2">SYMPTOMS:</div>
                <ul className="space-y-1 text-fg text-sm">
                  <li>• Can't log in with email/password</li>
                  <li>• "Invalid credentials" error</li>
                  <li>• Session expires immediately</li>
                </ul>
              </div>
              <div>
                <div className="text-sm font-semibold text-mute mb-2">SOLUTIONS:</div>
                <ol className="space-y-1 text-fg text-sm">
                  <li>1. Verify email and password are correct</li>
                  <li>2. Clear browser cache and cookies</li>
                  <li>3. Try incognito/private browsing mode</li>
                  <li>4. Reset password if needed</li>
                  <li>5. Contact support if issue persists</li>
                </ol>
              </div>
            </div>

            <div className="bg-surface border border-border rounded-xl p-6">
              <h3 className="text-xl font-semibold text-fg mb-3">🔄 Sync Issues</h3>
              <div className="mb-3">
                <div className="text-sm font-semibold text-mute mb-2">SYMPTOMS:</div>
                <ul className="space-y-1 text-fg text-sm">
                  <li>• Products not appearing in catalog</li>
                  <li>• Sync status shows "Error"</li>
                  <li>• Price changes not syncing to platform</li>
                </ul>
              </div>
              <div>
                <div className="text-sm font-semibold text-mute mb-2">SOLUTIONS:</div>
                <ol className="space-y-1 text-fg text-sm">
                  <li>1. Check platform integration status</li>
                  <li>2. Verify platform credentials are valid</li>
                  <li>3. Check sync logs for error messages</li>
                  <li>4. Try manual sync trigger</li>
                  <li>5. Reconnect integration if needed</li>
                </ol>
              </div>
            </div>

            <div className="bg-surface border border-border rounded-xl p-6">
              <h3 className="text-xl font-semibold text-fg mb-3">💰 Price Change Failures</h3>
              <div className="mb-3">
                <div className="text-sm font-semibold text-mute mb-2">SYMPTOMS:</div>
                <ul className="space-y-1 text-fg text-sm">
                  <li>• Price changes stuck in "Queued" status</li>
                  <li>• Connector status shows "Error"</li>
                  <li>• Prices not updating in platform</li>
                </ul>
              </div>
              <div>
                <div className="text-sm font-semibold text-mute mb-2">SOLUTIONS:</div>
                <ol className="space-y-1 text-fg text-sm">
                  <li>1. Check connector status for error details</li>
                  <li>2. Verify product/SKU exists in platform</li>
                  <li>3. Check platform API status</li>
                  <li>4. Verify integration has write permissions</li>
                  <li>5. Try rolling back and reapplying</li>
                </ol>
              </div>
            </div>

            <div className="bg-surface border border-border rounded-xl p-6">
              <h3 className="text-xl font-semibold text-fg mb-3">⚙️ Rules Not Executing</h3>
              <div className="mb-3">
                <div className="text-sm font-semibold text-mute mb-2">SYMPTOMS:</div>
                <ul className="space-y-1 text-fg text-sm">
                  <li>• Scheduled rules not creating price changes</li>
                  <li>• Preview shows 0 matched products</li>
                  <li>• Rules appear disabled</li>
                </ul>
              </div>
              <div>
                <div className="text-sm font-semibold text-mute mb-2">SOLUTIONS:</div>
                <ol className="space-y-1 text-fg text-sm">
                  <li>1. Verify rule is enabled (toggle switch)</li>
                  <li>2. Check product selectors match actual catalog</li>
                  <li>3. Verify schedule is configured correctly</li>
                  <li>4. Check for conflicting rules</li>
                  <li>5. Review rule constraints (floor/ceiling)</li>
                </ol>
              </div>
            </div>

            <div className="bg-surface border border-border rounded-xl p-6">
              <h3 className="text-xl font-semibold text-fg mb-3">🔍 Search Not Working</h3>
              <div className="mb-3">
                <div className="text-sm font-semibold text-mute mb-2">SYMPTOMS:</div>
                <ul className="space-y-1 text-fg text-sm">
                  <li>• Search returns no results</li>
                  <li>• Filters not applying</li>
                  <li>• Products you know exist don't appear</li>
                </ul>
              </div>
              <div>
                <div className="text-sm font-semibold text-mute mb-2">SOLUTIONS:</div>
                <ol className="space-y-1 text-fg text-sm">
                  <li>1. Clear search filters and try again</li>
                  <li>2. Check for typos in search query</li>
                  <li>3. Try partial matches instead of exact</li>
                  <li>4. Refresh the page</li>
                  <li>5. Try different search fields (SKU vs name)</li>
                </ol>
              </div>
            </div>
          </div>
        </section>

        <section className="mb-12">
          <h2 className="text-3xl font-semibold text-fg mb-6">Getting Help</h2>
          <div className="bg-surface border border-border rounded-xl p-6">
            <p className="text-fg mb-4">If you can't resolve an issue using this guide:</p>
            <ol className="space-y-3 text-fg">
              <li className="flex gap-3">
                <span className="font-bold text-brand">1.</span>
                Check the relevant feature documentation page
              </li>
              <li className="flex gap-3">
                <span className="font-bold text-brand">2.</span>
                Review sync logs and error messages for details
              </li>
              <li className="flex gap-3">
                <span className="font-bold text-brand">3.</span>
                Try the solution in a test environment first
              </li>
              <li className="flex gap-3">
                <span className="font-bold text-brand">4.</span>
                Contact support with error details and steps to reproduce
              </li>
            </ol>
          </div>
        </section>
      </div>
    </div>
  )
}
