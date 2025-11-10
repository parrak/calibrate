import Link from 'next/link'

export default function PriceChangesDocs() {
  return (
    <div className="min-h-screen bg-bg">
      <div className="max-w-4xl mx-auto px-6 py-16">
        <Link href="/console" className="text-brand hover:underline text-sm mb-4 inline-block">
          ← Back to Console Docs
        </Link>

        <h1 className="text-4xl font-bold text-fg mb-4">Price Changes</h1>
        <p className="text-xl text-mute mb-12">
          Review, approve, and manage price changes with complete workflow control
        </p>

        {/* Overview */}
        <section className="mb-12">
          <h2 className="text-3xl font-semibold text-fg mb-6">Overview</h2>
          <p className="text-fg mb-6">
            The Price Changes page is the heart of Calibrate's pricing governance system. Every proposed price change
            goes through a controlled workflow with human-in-the-loop approval before being applied to your platforms.
          </p>

          <div className="bg-brand/10 border border-brand/20 rounded-xl p-4">
            <p className="text-fg text-sm">
              <strong className="text-brand">Access:</strong> Navigate to <strong>Price Changes</strong> in the project sidebar,
              or visit <code className="bg-bg px-2 py-1 rounded">/p/[your-project]/price-changes</code>
            </p>
          </div>
        </section>

        {/* Workflow States */}
        <section className="mb-12">
          <h2 className="text-3xl font-semibold text-fg mb-6">Price Change Workflow</h2>

          <p className="text-fg mb-6">
            Every price change moves through a series of states in a controlled workflow:
          </p>

          <div className="space-y-4">
            <StateCard
              state="PENDING"
              color="yellow"
              description="Price change has been proposed but not yet reviewed"
              actions={["Review details", "Approve", "Reject"]}
            />
            <StateCard
              state="APPROVED"
              color="blue"
              description="Price change has been approved and is ready to apply"
              actions={["Apply to platforms", "Reject"]}
            />
            <StateCard
              state="APPLIED"
              color="green"
              description="Price change has been synced to connected platforms"
              actions={["Rollback to previous price"]}
            />
            <StateCard
              state="REJECTED"
              color="red"
              description="Price change was rejected and will not be applied"
              actions={["View reason (read-only)"]}
            />
            <StateCard
              state="ROLLED_BACK"
              color="purple"
              description="Applied price was reverted to its previous value"
              actions={["View history (read-only)"]}
            />
            <StateCard
              state="FAILED"
              color="red"
              description="Error occurred during sync to platform"
              actions={["View error details", "Retry"]}
            />
          </div>
        </section>

        {/* Workflow Actions */}
        <section className="mb-12">
          <h2 className="text-3xl font-semibold text-fg mb-6">Workflow Actions</h2>

          <div className="space-y-6">
            <ActionCard
              title="Approve"
              icon="✅"
              description="Mark a pending price change as approved"
              steps={[
                "Review the price change details",
                "Check policy compliance and AI explanation",
                "Click the 'Approve' button",
                "Price change status changes to APPROVED"
              ]}
              note="Approved changes are NOT automatically applied. You must explicitly apply them."
            />

            <ActionCard
              title="Apply"
              icon="🚀"
              description="Sync an approved price change to your platforms"
              steps={[
                "Ensure price change is in APPROVED status",
                "Click the 'Apply' button",
                "Price change is queued for sync",
                "Monitor connector status for sync progress",
                "Status changes to APPLIED when complete"
              ]}
              note="Applied prices are immediately pushed to connected platforms (Shopify, etc.)."
            />

            <ActionCard
              title="Reject"
              icon="❌"
              description="Reject a price change to prevent it from being applied"
              steps={[
                "Open price change details",
                "Click the 'Reject' button",
                "Optionally provide a reason",
                "Price change status changes to REJECTED"
              ]}
              note="Rejected changes cannot be approved later. You must create a new price change."
            />

            <ActionCard
              title="Rollback"
              icon="↩️"
              description="Revert an applied price change to its previous value"
              steps={[
                "Find an APPLIED price change",
                "Click the 'Rollback' button",
                "Confirm the rollback action",
                "Previous price is restored in platforms",
                "Status changes to ROLLED_BACK"
              ]}
              note="Rollback creates a new price change in reverse. The original change remains in history."
            />
          </div>
        </section>

        {/* Price Change Details */}
        <section className="mb-12">
          <h2 className="text-3xl font-semibold text-fg mb-6">Price Change Details</h2>

          <div className="bg-surface border border-border rounded-xl p-6 mb-6">
            <h3 className="text-xl font-semibold text-fg mb-4">Information Display</h3>
            <p className="text-fg mb-4">Click any price change to open the detail drawer, which shows:</p>
            <ul className="space-y-3 text-fg">
              <li className="flex items-start gap-2">
                <span className="text-brand">•</span>
                <div>
                  <strong>SKU Code:</strong> The specific product variant being changed
                </div>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-brand">•</span>
                <div>
                  <strong>Price Difference:</strong> Old price → New price (with currency symbol)
                </div>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-brand">•</span>
                <div>
                  <strong>Percentage Change:</strong> How much the price increased or decreased
                </div>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-brand">•</span>
                <div>
                  <strong>Source:</strong> Where the change came from (AI, manual, rule, etc.)
                </div>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-brand">•</span>
                <div>
                  <strong>Created Date:</strong> When the price change was proposed
                </div>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-brand">•</span>
                <div>
                  <strong>Policy Checks:</strong> Automated validation results
                </div>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-brand">•</span>
                <div>
                  <strong>AI Explanation:</strong> Context and reasoning for the change
                </div>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-brand">•</span>
                <div>
                  <strong>Connector Status:</strong> Sync progress with platforms
                </div>
              </li>
            </ul>
          </div>

          <div className="bg-surface border border-border rounded-xl p-6">
            <h3 className="text-xl font-semibold text-fg mb-4">Policy Compliance</h3>
            <p className="text-fg mb-4">
              Each price change is automatically checked against your pricing policies:
            </p>
            <ul className="space-y-2 text-fg">
              <li className="flex items-start gap-2">
                <span className="text-green-500">✓</span>
                <strong>Passed Checks:</strong> Policy rules that were satisfied
              </li>
              <li className="flex items-start gap-2">
                <span className="text-red-500">✗</span>
                <strong>Failed Checks:</strong> Policy violations that need review
              </li>
            </ul>
            <div className="mt-4 bg-bg border border-border p-3 rounded-lg">
              <p className="text-mute text-sm">
                <strong>Note:</strong> Failed policy checks don't prevent approval - they're advisory warnings
                to help you make informed decisions.
              </p>
            </div>
          </div>
        </section>

        {/* Search and Filter */}
        <section className="mb-12">
          <h2 className="text-3xl font-semibold text-fg mb-6">Search & Filter</h2>

          <div className="space-y-6">
            <div className="bg-surface border border-border rounded-xl p-6">
              <h3 className="text-xl font-semibold text-fg mb-4">Status Filter</h3>
              <p className="text-fg mb-3">Filter price changes by status to focus on specific workflows:</p>
              <ul className="space-y-2 text-fg">
                <li className="flex items-start gap-2">
                  <span className="text-brand">•</span>
                  <strong>Pending:</strong> Changes awaiting review (default view)
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-brand">•</span>
                  <strong>Approved:</strong> Changes ready to apply
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-brand">•</span>
                  <strong>Applied:</strong> Changes synced to platforms
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-brand">•</span>
                  <strong>Rejected:</strong> Changes that were declined
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-brand">•</span>
                  <strong>Failed:</strong> Changes with sync errors
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-brand">•</span>
                  <strong>Rolled Back:</strong> Reverted changes
                </li>
              </ul>
            </div>

            <div className="bg-surface border border-border rounded-xl p-6">
              <h3 className="text-xl font-semibold text-fg mb-4">Search</h3>
              <p className="text-fg mb-3">Search for specific price changes by:</p>
              <ul className="space-y-2 text-fg">
                <li className="flex items-start gap-2">
                  <span className="text-brand">•</span>
                  <strong>SKU Code:</strong> Find changes for a specific product variant
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-brand">•</span>
                  <strong>Source:</strong> Filter by change source (ai, rule, manual)
                </li>
              </ul>
            </div>
          </div>
        </section>

        {/* Connector Status */}
        <section className="mb-12">
          <h2 className="text-3xl font-semibold text-fg mb-6">Connector Sync Status</h2>

          <div className="bg-surface border border-border rounded-xl p-6 mb-6">
            <h3 className="text-xl font-semibold text-fg mb-4">Understanding Sync States</h3>
            <p className="text-fg mb-4">
              When you apply a price change, it's queued for synchronization with your platforms.
              The connector status shows the sync progress:
            </p>
            <ul className="space-y-3 text-fg">
              <li className="flex items-start gap-2">
                <span className="text-yellow-500">⏳</span>
                <div>
                  <strong>QUEUED:</strong> Price change is waiting to sync
                </div>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-blue-500">🔄</span>
                <div>
                  <strong>SYNCING:</strong> Currently syncing to platform
                </div>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-green-500">✓</span>
                <div>
                  <strong>SYNCED:</strong> Successfully applied to platform
                </div>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-red-500">✗</span>
                <div>
                  <strong>ERROR:</strong> Sync failed (see error message for details)
                </div>
              </li>
            </ul>
          </div>

          <div className="bg-surface border border-border rounded-xl p-6">
            <h3 className="text-xl font-semibold text-fg mb-4">Troubleshooting Sync Errors</h3>
            <p className="text-fg mb-4">If a price change fails to sync:</p>
            <ol className="space-y-2 text-fg">
              <li className="flex gap-3">
                <span className="font-bold text-brand">1.</span>
                Open the price change details drawer
              </li>
              <li className="flex gap-3">
                <span className="font-bold text-brand">2.</span>
                Check the connector status section for error messages
              </li>
              <li className="flex gap-3">
                <span className="font-bold text-brand">3.</span>
                Common issues: platform credentials, product not found, platform API down
              </li>
              <li className="flex gap-3">
                <span className="font-bold text-brand">4.</span>
                Retry the sync after resolving the issue
              </li>
              <li className="flex gap-3">
                <span className="font-bold text-brand">5.</span>
                Check platform integration status on Integrations page
              </li>
            </ol>
          </div>
        </section>

        {/* Pagination */}
        <section className="mb-12">
          <h2 className="text-3xl font-semibold text-fg mb-6">Pagination</h2>

          <div className="bg-surface border border-border rounded-xl p-6">
            <p className="text-fg mb-4">
              Price changes use cursor-based pagination for efficient loading:
            </p>
            <ul className="space-y-2 text-fg">
              <li className="flex items-start gap-2">
                <span className="text-brand">•</span>
                Default: 25 price changes per page
              </li>
              <li className="flex items-start gap-2">
                <span className="text-brand">•</span>
                Use "Next" and "Previous" buttons to navigate
              </li>
              <li className="flex items-start gap-2">
                <span className="text-brand">•</span>
                Filters and search persist across pages
              </li>
              <li className="flex items-start gap-2">
                <span className="text-brand">•</span>
                Most recent changes appear first
              </li>
            </ul>
          </div>
        </section>

        {/* Bulk Actions */}
        <section className="mb-12">
          <h2 className="text-3xl font-semibold text-fg mb-6">Bulk Actions</h2>

          <div className="bg-surface border border-border rounded-xl p-6">
            <h3 className="text-xl font-semibold text-fg mb-4">Working with Multiple Price Changes</h3>
            <p className="text-fg mb-4">
              For large-scale price updates, you can use bulk actions:
            </p>
            <ul className="space-y-3 text-fg">
              <li className="flex items-start gap-2">
                <span className="text-brand">•</span>
                <div>
                  <strong>Select Multiple:</strong> Use checkboxes to select multiple price changes (coming soon)
                </div>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-brand">•</span>
                <div>
                  <strong>Bulk Approve:</strong> Approve all selected pending changes at once
                </div>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-brand">•</span>
                <div>
                  <strong>Bulk Apply:</strong> Apply all approved changes to platforms
                </div>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-brand">•</span>
                <div>
                  <strong>Bulk Reject:</strong> Reject multiple unwanted changes
                </div>
              </li>
            </ul>
            <div className="mt-4 bg-bg border border-border p-3 rounded-lg">
              <p className="text-mute text-sm">
                <strong>Tip:</strong> Use filters to narrow down to the specific changes you want to bulk-process,
                then select all on the current page.
              </p>
            </div>
          </div>
        </section>

        {/* Best Practices */}
        <section className="mb-12">
          <h2 className="text-3xl font-semibold text-fg mb-6">Best Practices</h2>

          <div className="space-y-4">
            <BestPractice
              title="Review Before Approving"
              tip="Always check policy compliance, AI explanation, and price change magnitude before approval."
            />
            <BestPractice
              title="Apply in Batches"
              tip="For large price updates, apply changes in smaller batches to monitor platform sync success."
            />
            <BestPractice
              title="Monitor Connector Status"
              tip="After applying changes, check connector status to ensure successful sync before moving on."
            />
            <BestPractice
              title="Use Rollback Carefully"
              tip="Rollbacks create new price changes. Consider if you want to restore the old price or set a different one."
            />
            <BestPractice
              title="Keep History"
              tip="Don't delete rejected or rolled-back changes - they provide valuable pricing history and audit trail."
            />
          </div>
        </section>

        {/* Related Docs */}
        <section className="mb-12">
          <h2 className="text-3xl font-semibold text-fg mb-6">Related Documentation</h2>
          <div className="grid md:grid-cols-2 gap-4">
            <RelatedLink
              href="/console/pricing-rules"
              title="Pricing Rules"
              description="Automate price change creation with rules"
            />
            <RelatedLink
              href="/console/integrations"
              title="Platform Integrations"
              description="Manage connector status and sync settings"
            />
            <RelatedLink
              href="/console/roles-permissions"
              title="Roles & Permissions"
              description="Who can approve and apply price changes"
            />
            <RelatedLink
              href="/console/ai-assistant"
              title="AI Assistant"
              description="Query price change history with AI"
            />
          </div>
        </section>
      </div>
    </div>
  )
}

function StateCard({ state, color, description, actions }: { state: string; color: string; description: string; actions: string[] }) {
  const colorClasses = {
    yellow: 'border-yellow-500/30 bg-yellow-500/5',
    blue: 'border-blue-500/30 bg-blue-500/5',
    green: 'border-green-500/30 bg-green-500/5',
    red: 'border-red-500/30 bg-red-500/5',
    purple: 'border-purple-500/30 bg-purple-500/5',
  }

  return (
    <div className={`border rounded-xl p-4 ${colorClasses[color as keyof typeof colorClasses]}`}>
      <div className="flex items-start justify-between mb-3">
        <div className="font-mono font-bold text-fg">{state}</div>
      </div>
      <p className="text-fg text-sm mb-3">{description}</p>
      <div className="text-sm text-mute">
        <strong>Available actions:</strong>
        <ul className="mt-2 space-y-1">
          {actions.map((action, i) => (
            <li key={i} className="flex items-start gap-2">
              <span>→</span>
              {action}
            </li>
          ))}
        </ul>
      </div>
    </div>
  )
}

function ActionCard({ title, icon, description, steps, note }: { title: string; icon: string; description: string; steps: string[]; note: string }) {
  return (
    <div className="bg-surface border border-border rounded-xl p-6">
      <div className="flex items-center gap-3 mb-3">
        <span className="text-3xl">{icon}</span>
        <h3 className="text-xl font-semibold text-fg">{title}</h3>
      </div>
      <p className="text-fg mb-4">{description}</p>
      <ol className="space-y-2 mb-4">
        {steps.map((step, i) => (
          <li key={i} className="flex gap-3 text-fg text-sm">
            <span className="font-bold text-brand">{i + 1}.</span>
            {step}
          </li>
        ))}
      </ol>
      <div className="bg-bg border border-border p-3 rounded-lg">
        <p className="text-mute text-sm">
          <strong className="text-fg">Note:</strong> {note}
        </p>
      </div>
    </div>
  )
}

function BestPractice({ title, tip }: { title: string; tip: string }) {
  return (
    <div className="bg-bg border border-border rounded-lg p-4">
      <div className="flex items-start gap-3">
        <span className="text-2xl">✨</span>
        <div>
          <div className="font-semibold text-fg mb-1">{title}</div>
          <div className="text-sm text-mute">{tip}</div>
        </div>
      </div>
    </div>
  )
}

function RelatedLink({ href, title, description }: { href: string; title: string; description: string }) {
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
