import Link from 'next/link'

export default function AutomationRunsDocs() {
  return (
    <div className="min-h-screen bg-bg">
      <div className="max-w-4xl mx-auto px-6 py-16">
        <Link href="/console" className="text-brand hover:underline text-sm mb-4 inline-block">
          ← Back to Console Docs
        </Link>

        <h1 className="text-4xl font-bold text-fg mb-4">Automation Runs</h1>
        <p className="text-xl text-mute mb-12">
          Monitor and manage automated pricing rule executions in real-time
        </p>

        {/* What are Automation Runs */}
        <section className="mb-12">
          <h2 className="text-3xl font-semibold text-fg mb-6">What are Automation Runs?</h2>

          <div className="bg-surface border border-border rounded-xl p-6 mb-6">
            <p className="text-fg mb-4">
              Automation Runs are execution records that track when pricing rules are applied to your products.
              Each time you apply a pricing rule, Calibrate creates a Run that monitors the entire execution process,
              from queuing to completion, providing full visibility into what changed and why.
            </p>
            <h3 className="text-lg font-semibold text-fg mb-3">Why Monitor Runs?</h3>
            <ul className="space-y-2 text-fg">
              <li className="flex items-start gap-2">
                <span className="text-brand">•</span>
                <div><strong>Transparency:</strong> See exactly which products were affected and how prices changed</div>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-brand">•</span>
                <div><strong>Reliability:</strong> Monitor execution status and catch failures early</div>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-brand">•</span>
                <div><strong>Recovery:</strong> Retry failed price updates without re-running entire rules</div>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-brand">•</span>
                <div><strong>Audit Trail:</strong> Complete history of all automated price changes for compliance</div>
              </li>
            </ul>
          </div>

          <div className="bg-brand/10 border border-brand/20 rounded-xl p-4">
            <p className="text-fg text-sm">
              <strong className="text-brand">Access:</strong> Navigate to <strong>Automation → Runs</strong> in the project sidebar,
              or visit <code className="bg-bg px-2 py-1 rounded">/p/[your-project]/automation/runs</code>
            </p>
          </div>
        </section>

        {/* Run Statuses */}
        <section className="mb-12">
          <h2 className="text-3xl font-semibold text-fg mb-6">Run Statuses</h2>

          <p className="text-fg mb-6">
            Each run progresses through several statuses as it executes. Understanding these statuses helps you
            monitor execution and troubleshoot issues.
          </p>

          <div className="space-y-4">
            <StatusCard
              status="PREVIEW"
              color="bg-gray-100 text-gray-800"
              description="Rule execution is being previewed. No changes have been applied yet."
            />
            <StatusCard
              status="QUEUED"
              color="bg-yellow-100 text-yellow-800"
              description="Run is waiting to be processed by the automation worker."
            />
            <StatusCard
              status="APPLYING"
              color="bg-blue-100 text-blue-800"
              description="Run is currently executing. Price changes are being applied to your platform."
            />
            <StatusCard
              status="APPLIED"
              color="bg-emerald-100 text-emerald-800"
              description="Run completed successfully. All price changes were applied."
            />
            <StatusCard
              status="FAILED"
              color="bg-red-100 text-red-800"
              description="Run encountered errors. Some or all price changes may have failed."
            />
            <StatusCard
              status="ROLLED_BACK"
              color="bg-orange-100 text-orange-800"
              description="Run was rolled back. All changes have been reverted to previous prices."
            />
          </div>
        </section>

        {/* Viewing Runs */}
        <section className="mb-12">
          <h2 className="text-3xl font-semibold text-fg mb-6">Viewing Automation Runs</h2>

          <div className="bg-surface border border-border rounded-xl p-6 mb-6">
            <h3 className="text-lg font-semibold text-fg mb-4">Runs Table</h3>
            <p className="text-fg mb-4">
              The Automation Runs page displays all rule executions in a sortable table. Each row shows:
            </p>
            <ul className="space-y-2 text-fg mb-4">
              <li className="flex items-start gap-2">
                <span className="text-brand">•</span>
                <div><strong>Rule Name:</strong> The pricing rule that was executed</div>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-brand">•</span>
                <div><strong>Status:</strong> Current execution status with color-coded badge</div>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-brand">•</span>
                <div><strong>Targets:</strong> Number of products affected, with breakdown by status (applied/failed/queued)</div>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-brand">•</span>
                <div><strong>Created:</strong> When the run was initiated</div>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-brand">•</span>
                <div><strong>Actions:</strong> View details or retry failed targets</div>
              </li>
            </ul>
          </div>

          <div className="bg-surface border border-border rounded-xl p-6">
            <h3 className="text-lg font-semibold text-fg mb-4">Filtering Runs</h3>
            <p className="text-fg mb-4">
              Use the status filter buttons at the top of the page to view runs by status:
            </p>
            <ul className="space-y-2 text-fg">
              <li className="flex items-start gap-2">
                <span className="text-brand">•</span>
                <div><strong>All:</strong> Show all runs regardless of status</div>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-brand">•</span>
                <div><strong>Status Filters:</strong> Click any status button (Queued, Applied, Failed, etc.) to filter runs</div>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-brand">•</span>
                <div><strong>Active Filter:</strong> The selected filter is highlighted to show which view is active</div>
              </li>
            </ul>
          </div>
        </section>

        {/* Progress Monitoring */}
        <section className="mb-12">
          <h2 className="text-3xl font-semibold text-fg mb-6">Real-Time Progress Monitoring</h2>

          <div className="bg-surface border border-border rounded-xl p-6 mb-6">
            <p className="text-fg mb-4">
              For runs with status <strong>QUEUED</strong> or <strong>APPLYING</strong>, Calibrate automatically polls
              the execution progress every 2 seconds, updating the UI in real-time.
            </p>
            <h3 className="text-lg font-semibold text-fg mb-3">Progress Indicators</h3>
            <ul className="space-y-2 text-fg">
              <li className="flex items-start gap-2">
                <span className="text-brand">•</span>
                <div><strong>Percentage:</strong> Shows completion percentage (e.g., "50%")</div>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-brand">•</span>
                <div><strong>Count:</strong> Displays completed vs total targets (e.g., "10/20")</div>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-brand">•</span>
                <div><strong>Status Updates:</strong> Toast notifications appear when runs complete or fail</div>
              </li>
            </ul>
          </div>

          <div className="bg-brand/10 border border-brand/20 rounded-xl p-4">
            <p className="text-fg text-sm">
              <strong className="text-brand">Note:</strong> Progress polling automatically stops when a run reaches
              a final status (APPLIED, FAILED, or ROLLED_BACK) to conserve resources.
            </p>
          </div>
        </section>

        {/* Run Details */}
        <section className="mb-12">
          <h2 className="text-3xl font-semibold text-fg mb-6">Run Details</h2>

          <p className="text-fg mb-6">
            Click the <strong>View</strong> button on any run to open a detailed drawer with comprehensive information
            about the execution. The drawer includes four tabs:
          </p>

          <div className="space-y-6">
            <DetailTabCard
              tab="Overview"
              description="Summary information about the run"
              details={[
                "Current status and timestamps (created, started, finished)",
                "Total number of targets affected",
                "Target status breakdown (applied, failed, queued)",
                "Error messages if the run failed",
                "Retry button for runs with failed targets"
              ]}
            />

            <DetailTabCard
              tab="Explain"
              description="Technical details about the rule execution"
              details={[
                "Transform JSON: The exact price transformation that was applied",
                "Explain Trace: Detailed rationale showing why products were selected and how prices were calculated",
                "Useful for debugging and understanding rule behavior"
              ]}
            />

            <DetailTabCard
              tab="Targets"
              description="Individual product price changes"
              details={[
                "Complete list of all products targeted by the run",
                "Before/After price snapshots in JSON format",
                "Per-target status (QUEUED, APPLIED, FAILED)",
                "Error messages for failed targets",
                "Product and variant IDs for reference"
              ]}
            />

            <DetailTabCard
              tab="Audit Trail"
              description="Complete history of actions taken on this run"
              details={[
                "Chronological list of all audit events",
                "Actions performed (apply, retry_failed, etc.)",
                "Actor information (who performed the action)",
                "Timestamps for each event",
                "Full explain data for compliance and debugging"
              ]}
            />
          </div>
        </section>

        {/* Retrying Failed Targets */}
        <section className="mb-12">
          <h2 className="text-3xl font-semibold text-fg mb-6">Retrying Failed Targets</h2>

          <div className="bg-surface border border-border rounded-xl p-6 mb-6">
            <p className="text-fg mb-4">
              If a run has failed targets (products where price updates couldn't be applied), you can retry them
              without re-running the entire rule. This is especially useful when failures are due to temporary issues
              like network timeouts or rate limiting.
            </p>
            <h3 className="text-lg font-semibold text-fg mb-3">How to Retry</h3>
            <ol className="space-y-3 text-fg list-decimal list-inside">
              <li>Navigate to the Automation Runs page</li>
              <li>Find the run with failed targets (status will show "FAILED" or have failed count in Targets column)</li>
              <li>Click the <strong>Retry Failed</strong> button in the Actions column, or open the run details and click Retry Failed in the Overview tab</li>
              <li>Calibrate will reset all failed targets to QUEUED status and the automation worker will process them again</li>
              <li>Monitor progress in real-time as the retry executes</li>
            </ol>
          </div>

          <div className="bg-brand/10 border border-brand/20 rounded-xl p-4 mb-6">
            <p className="text-fg text-sm mb-2">
              <strong className="text-brand">When to Retry:</strong>
            </p>
            <ul className="space-y-1 text-fg text-sm list-disc list-inside ml-4">
              <li>Network connectivity issues that have been resolved</li>
              <li>Platform rate limits that have reset</li>
              <li>Temporary API errors from your e-commerce platform</li>
              <li>Authentication token expiration (after refreshing credentials)</li>
            </ul>
          </div>

          <div className="bg-red-50 border border-red-200 rounded-xl p-4">
            <p className="text-fg text-sm">
              <strong className="text-red-600">Important:</strong> Only retry if you've addressed the root cause of the failure.
              Retrying without fixing underlying issues (like invalid product IDs or pricing constraints) will result in the same failures.
            </p>
          </div>
        </section>

        {/* Best Practices */}
        <section className="mb-12">
          <h2 className="text-3xl font-semibold text-fg mb-6">Best Practices</h2>

          <div className="space-y-4">
            <PracticeCard
              title="Monitor Active Runs"
              description="Keep the Automation Runs page open when executing large rules to monitor progress and catch issues early."
            />
            <PracticeCard
              title="Review Failed Runs Promptly"
              description="Check failed runs within a few hours to retry before data becomes stale or products change."
            />
            <PracticeCard
              title="Use Explain Tab for Debugging"
              description="When a rule doesn't behave as expected, check the Explain tab to see the exact transform logic and rationale."
            />
            <PracticeCard
              title="Check Audit Trail for Compliance"
              description="Use the Audit Trail tab to generate reports showing who executed rules and when, for compliance purposes."
            />
            <PracticeCard
              title="Filter by Status for Quick Actions"
              description="Use status filters to quickly find runs that need attention (e.g., all FAILED runs for retry)."
            />
          </div>
        </section>

        {/* Troubleshooting */}
        <section className="mb-12">
          <h2 className="text-3xl font-semibold text-fg mb-6">Troubleshooting</h2>

          <div className="space-y-4">
            <TroubleshootingCard
              issue="Run stuck in QUEUED status"
              solution="This usually means the automation worker is processing other runs. Wait a few minutes, or check if there are many active runs. If stuck for more than 10 minutes, contact support."
            />
            <TroubleshootingCard
              issue="Many targets failed"
              solution="Check the Targets tab to see error messages. Common causes: invalid product IDs, pricing constraints (floor/ceiling), or platform API errors. Fix the root cause before retrying."
            />
            <TroubleshootingCard
              issue="Progress not updating"
              solution="Refresh the page. Progress polling may have stopped if the run completed. Check the run status badge to see current state."
            />
            <TroubleshootingCard
              issue="Retry Failed button not appearing"
              solution="The button only appears for runs with failed targets. If all targets succeeded, there's nothing to retry. Check the Targets column to see the breakdown."
            />
          </div>
        </section>

        {/* Related Documentation */}
        <section className="mb-12">
          <h2 className="text-3xl font-semibold text-fg mb-6">Related Documentation</h2>
          <div className="bg-surface border border-border rounded-xl p-6">
            <ul className="space-y-2 text-fg">
              <li>
                <Link href="/console/pricing-rules" className="text-brand hover:underline">
                  Pricing Rules
                </Link>
                {' '}— Learn how to create and configure pricing rules
              </li>
              <li>
                <Link href="/console/price-changes" className="text-brand hover:underline">
                  Price Changes
                </Link>
                {' '}— View and manage individual price change proposals
              </li>
              <li>
                <Link href="/console/troubleshooting" className="text-brand hover:underline">
                  Troubleshooting
                </Link>
                {' '}— General troubleshooting guide for common issues
              </li>
            </ul>
          </div>
        </section>
      </div>
    </div>
  )
}

function StatusCard({ status, color, description }: { status: string; color: string; description: string }) {
  return (
    <div className="bg-surface border border-border rounded-xl p-4">
      <div className="flex items-center gap-3 mb-2">
        <span className={`px-3 py-1 rounded-full text-xs font-medium ${color}`}>
          {status}
        </span>
        <span className="text-lg font-semibold text-fg">{status}</span>
      </div>
      <p className="text-fg text-sm">{description}</p>
    </div>
  )
}

function DetailTabCard({ tab, description, details }: { tab: string; description: string; details: string[] }) {
  return (
    <div className="bg-surface border border-border rounded-xl p-6">
      <h3 className="text-xl font-semibold text-fg mb-2">{tab} Tab</h3>
      <p className="text-fg mb-4">{description}</p>
      <ul className="space-y-2 text-fg">
        {details.map((detail, idx) => (
          <li key={idx} className="flex items-start gap-2">
            <span className="text-brand">•</span>
            <div>{detail}</div>
          </li>
        ))}
      </ul>
    </div>
  )
}

function PracticeCard({ title, description }: { title: string; description: string }) {
  return (
    <div className="bg-surface border border-border rounded-xl p-4">
      <h3 className="text-lg font-semibold text-fg mb-2">{title}</h3>
      <p className="text-fg text-sm">{description}</p>
    </div>
  )
}

function TroubleshootingCard({ issue, solution }: { issue: string; solution: string }) {
  return (
    <div className="bg-surface border border-border rounded-xl p-4">
      <h3 className="text-lg font-semibold text-fg mb-2">Issue: {issue}</h3>
      <p className="text-fg text-sm">{solution}</p>
    </div>
  )
}

