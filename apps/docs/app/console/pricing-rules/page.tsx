import Link from 'next/link'

export default function PricingRulesDocs() {
  return (
    <div className="min-h-screen bg-bg">
      <div className="max-w-4xl mx-auto px-6 py-16">
        <Link href="/console" className="text-brand hover:underline text-sm mb-4 inline-block">
          ← Back to Console Docs
        </Link>

        <h1 className="text-4xl font-bold text-fg mb-4">Pricing Rules</h1>
        <p className="text-xl text-mute mb-12">
          Automate your pricing strategy with intelligent rules and schedules
        </p>

        {/* Overview */}
        <section className="mb-12">
          <h2 className="text-3xl font-semibold text-fg mb-6">Overview</h2>
          <p className="text-fg mb-6">
            Pricing Rules allow you to automate price changes based on product selectors, transforms, and schedules.
            Create sophisticated pricing strategies that execute automatically without manual intervention.
          </p>

          <div className="bg-brand/10 border border-brand/20 rounded-xl p-4">
            <p className="text-fg text-sm">
              <strong className="text-brand">Access:</strong> Navigate to <strong>Rules</strong> in the project sidebar,
              or visit <code className="bg-bg px-2 py-1 rounded">/p/[your-project]/rules</code>
            </p>
          </div>
        </section>

        {/* Rule Components */}
        <section className="mb-12">
          <h2 className="text-3xl font-semibold text-fg mb-6">Rule Components</h2>

          <p className="text-fg mb-6">Every pricing rule consists of three main components:</p>

          <div className="space-y-6">
            <ComponentCard
              number="1"
              title="Product Selector"
              description="Define which products the rule applies to"
              details={[
                "SKU code patterns (exact match or wildcard)",
                "Product tags (category, brand, collection)",
                "Price ranges (minimum/maximum price filters)",
                "Custom field conditions (metadata matching)"
              ]}
            />

            <ComponentCard
              number="2"
              title="Price Transform"
              description="Specify how to calculate the new price"
              details={[
                "Percentage change (+20% or -15%)",
                "Absolute adjustment (+$5 or -$10)",
                "Set fixed price ($29.99)",
                "Multiply by factor (×1.5)"
              ]}
            />

            <ComponentCard
              number="3"
              title="Schedule"
              description="Control when the rule executes"
              details={[
                "Immediate: Execute once when saved",
                "Scheduled: Run at specific date/time",
                "Recurring: Repeat on cron schedule (hourly, daily, weekly)"
              ]}
            />
          </div>
        </section>

        {/* Creating a Rule */}
        <section className="mb-12">
          <h2 className="text-3xl font-semibold text-fg mb-6">Creating a Pricing Rule</h2>

          <div className="bg-surface border border-border rounded-xl p-6 mb-6">
            <h3 className="text-xl font-semibold text-fg mb-4">Step-by-Step Guide</h3>
            <ol className="space-y-4 text-fg">
              <li className="flex gap-3">
                <span className="font-bold text-brand shrink-0">1.</span>
                <div>
                  <strong>Navigate to Rules page</strong> and click "New Rule" or "Create Rule" button
                </div>
              </li>
              <li className="flex gap-3">
                <span className="font-bold text-brand shrink-0">2.</span>
                <div>
                  <strong>Enter basic information:</strong>
                  <ul className="mt-2 space-y-1 text-mute">
                    <li>• Rule name (e.g., "Summer Sale 20% Off")</li>
                    <li>• Description (optional, for documentation)</li>
                    <li>• Enable/Disable toggle</li>
                  </ul>
                </div>
              </li>
              <li className="flex gap-3">
                <span className="font-bold text-brand shrink-0">3.</span>
                <div>
                  <strong>Define product selector:</strong>
                  <ul className="mt-2 space-y-1 text-mute">
                    <li>• Add predicates (conditions) to match products</li>
                    <li>• Combine multiple predicates with AND/OR logic</li>
                    <li>• Use SKU patterns, tags, price ranges, or custom fields</li>
                  </ul>
                </div>
              </li>
              <li className="flex gap-3">
                <span className="font-bold text-brand shrink-0">4.</span>
                <div>
                  <strong>Set price transform:</strong>
                  <ul className="mt-2 space-y-1 text-mute">
                    <li>• Choose transform type (percentage, absolute, set, multiply)</li>
                    <li>• Enter the value (e.g., -20 for 20% discount)</li>
                    <li>• Optional: Set constraints (floor, ceiling, max % delta)</li>
                  </ul>
                </div>
              </li>
              <li className="flex gap-3">
                <span className="font-bold text-brand shrink-0">5.</span>
                <div>
                  <strong>Configure schedule:</strong>
                  <ul className="mt-2 space-y-1 text-mute">
                    <li>• Immediate: Run once when saved</li>
                    <li>• Scheduled: Pick date and time</li>
                    <li>• Recurring: Enter cron expression and timezone</li>
                  </ul>
                </div>
              </li>
              <li className="flex gap-3">
                <span className="font-bold text-brand shrink-0">6.</span>
                <div>
                  <strong>Preview impact:</strong> See how many products match and estimated price changes
                </div>
              </li>
              <li className="flex gap-3">
                <span className="font-bold text-brand shrink-0">7.</span>
                <div>
                  <strong>Save the rule:</strong> Click "Save" to create the rule
                </div>
              </li>
            </ol>
          </div>
        </section>

        {/* Product Selectors */}
        <section className="mb-12">
          <h2 className="text-3xl font-semibold text-fg mb-6">Product Selectors in Detail</h2>

          <div className="space-y-6">
            <SelectorCard
              type="SKU Code"
              description="Match products by SKU pattern"
              examples={[
                { pattern: "SHIRT-001", desc: "Exact SKU match" },
                { pattern: "SHIRT-*", desc: "All SKUs starting with SHIRT-" },
                { pattern: "*-BLUE", desc: "All SKUs ending with -BLUE" }
              ]}
            />

            <SelectorCard
              type="Tags"
              description="Match products by tags or categories"
              examples={[
                { pattern: "summer", desc: "Products tagged 'summer'" },
                { pattern: "clearance", desc: "Clearance items" },
                { pattern: "brand:nike", desc: "Nike brand products" }
              ]}
            />

            <SelectorCard
              type="Price Range"
              description="Match products within price boundaries"
              examples={[
                { pattern: "min: $50", desc: "Products $50 and above" },
                { pattern: "max: $100", desc: "Products $100 and below" },
                { pattern: "$20 - $50", desc: "Products between $20 and $50" }
              ]}
            />

            <SelectorCard
              type="Custom Fields"
              description="Match products by metadata or custom attributes"
              examples={[
                { pattern: "color: blue", desc: "Blue products" },
                { pattern: "season: winter", desc: "Winter collection" },
                { pattern: "stock > 10", desc: "Well-stocked items" }
              ]}
            />
          </div>

          <div className="mt-6 bg-surface border border-border rounded-xl p-6">
            <h3 className="text-xl font-semibold text-fg mb-4">Combining Selectors</h3>
            <p className="text-fg mb-4">Use logical operators to create complex selection criteria:</p>
            <div className="space-y-3 text-fg">
              <div className="bg-bg border border-border p-4 rounded-lg">
                <div className="font-mono text-sm mb-2 text-brand">AND Logic</div>
                <div className="text-sm">All conditions must match. Example: SKU starts with "SHIRT-" <strong>AND</strong> price &gt; $50</div>
              </div>
              <div className="bg-bg border border-border p-4 rounded-lg">
                <div className="font-mono text-sm mb-2 text-brand">OR Logic</div>
                <div className="text-sm">Any condition can match. Example: Tagged "sale" <strong>OR</strong> tagged "clearance"</div>
              </div>
            </div>
          </div>
        </section>

        {/* Price Transforms */}
        <section className="mb-12">
          <h2 className="text-3xl font-semibold text-fg mb-6">Price Transforms</h2>

          <div className="space-y-4">
            <TransformCard
              type="Percentage"
              icon="📊"
              description="Increase or decrease price by a percentage"
              examples={[
                "+20% → $100 becomes $120",
                "-15% → $100 becomes $85",
                "+50% → $50 becomes $75"
              ]}
              useCase="Sales, seasonal discounts, margin adjustments"
            />

            <TransformCard
              type="Absolute"
              icon="💵"
              description="Add or subtract a fixed amount"
              examples={[
                "+$5 → $100 becomes $105",
                "-$10 → $100 becomes $90",
                "+$2.50 → $20 becomes $22.50"
              ]}
              useCase="Flat discounts, shipping adjustments, fixed markups"
            />

            <TransformCard
              type="Set Price"
              icon="🎯"
              description="Replace price with a specific value"
              examples={[
                "Set to $29.99 → Any price becomes $29.99",
                "Set to $99.00 → Standardize premium tier",
                "Set to $0.00 → Free items"
              ]}
              useCase="Price standardization, promotional pricing, clearance"
            />

            <TransformCard
              type="Multiply"
              icon="✖️"
              description="Multiply price by a factor"
              examples={[
                "×1.5 → $100 becomes $150",
                "×0.8 → $100 becomes $80",
                "×2 → $50 becomes $100"
              ]}
              useCase="Bulk markups, volume discounts, regional pricing"
            />
          </div>
        </section>

        {/* Constraints */}
        <section className="mb-12">
          <h2 className="text-3xl font-semibold text-fg mb-6">Price Constraints</h2>

          <div className="bg-surface border border-border rounded-xl p-6 mb-6">
            <h3 className="text-xl font-semibold text-fg mb-4">Safety Limits</h3>
            <p className="text-fg mb-4">
              Add constraints to prevent unwanted price changes:
            </p>
            <ul className="space-y-3 text-fg">
              <li className="flex items-start gap-2">
                <span className="text-brand">•</span>
                <div>
                  <strong>Price Floor:</strong> Minimum allowed price (e.g., never below $10)
                </div>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-brand">•</span>
                <div>
                  <strong>Price Ceiling:</strong> Maximum allowed price (e.g., never above $1000)
                </div>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-brand">•</span>
                <div>
                  <strong>Max % Delta:</strong> Maximum percentage change (e.g., never change more than 30%)
                </div>
              </li>
            </ul>
          </div>

          <div className="bg-bg border border-border rounded-xl p-4">
            <p className="text-fg text-sm">
              💡 <strong>Example:</strong> A -20% discount rule with floor of $15 ensures products never drop below $15,
              even if the discount would normally make them cheaper.
            </p>
          </div>
        </section>

        {/* Scheduling */}
        <section className="mb-12">
          <h2 className="text-3xl font-semibold text-fg mb-6">Scheduling Rules</h2>

          <div className="space-y-6">
            <ScheduleCard
              type="Immediate Execution"
              description="Rule runs once when you save it"
              useCase="One-time sales events, manual bulk updates, testing rules"
              config={["No additional configuration needed", "Price changes appear in pending state immediately"]}
            />

            <ScheduleCard
              type="Scheduled Execution"
              description="Rule runs at a specific date and time"
              useCase="Flash sales, time-limited promotions, planned price changes"
              config={[
                "Pick date using date picker",
                "Set time (24-hour format)",
                "Specify timezone for execution"
              ]}
            />

            <ScheduleCard
              type="Recurring Execution"
              description="Rule runs repeatedly on a schedule"
              useCase="Daily competitive pricing, weekly markdowns, monthly adjustments"
              config={[
                "Enter cron expression (e.g., '0 9 * * *' for daily at 9 AM)",
                "Select timezone for cron schedule",
                "Rule continues running until disabled"
              ]}
            />
          </div>

          <div className="mt-6 bg-surface border border-border rounded-xl p-6">
            <h3 className="text-xl font-semibold text-fg mb-4">Cron Expression Examples</h3>
            <div className="space-y-2 font-mono text-sm text-fg">
              <div className="flex items-start gap-3">
                <code className="bg-bg px-2 py-1 rounded text-brand shrink-0">0 9 * * *</code>
                <span className="text-mute">Every day at 9:00 AM</span>
              </div>
              <div className="flex items-start gap-3">
                <code className="bg-bg px-2 py-1 rounded text-brand shrink-0">0 0 * * 0</code>
                <span className="text-mute">Every Sunday at midnight</span>
              </div>
              <div className="flex items-start gap-3">
                <code className="bg-bg px-2 py-1 rounded text-brand shrink-0">0 */6 * * *</code>
                <span className="text-mute">Every 6 hours</span>
              </div>
              <div className="flex items-start gap-3">
                <code className="bg-bg px-2 py-1 rounded text-brand shrink-0">0 0 1 * *</code>
                <span className="text-mute">First day of every month at midnight</span>
              </div>
            </div>
          </div>
        </section>

        {/* Preview */}
        <section className="mb-12">
          <h2 className="text-3xl font-semibold text-fg mb-6">Previewing Rule Impact</h2>

          <div className="bg-surface border border-border rounded-xl p-6">
            <h3 className="text-xl font-semibold text-fg mb-4">Before Saving</h3>
            <p className="text-fg mb-4">
              Before saving a rule, use the Preview feature to see its impact:
            </p>
            <ul className="space-y-2 text-fg">
              <li className="flex items-start gap-2">
                <span className="text-brand">•</span>
                <strong>Matched Products:</strong> How many products meet the selector criteria
              </li>
              <li className="flex items-start gap-2">
                <span className="text-brand">•</span>
                <strong>Price Changes:</strong> Example products showing old → new prices
              </li>
              <li className="flex items-start gap-2">
                <span className="text-brand">•</span>
                <strong>Average Change:</strong> Average price increase or decrease
              </li>
              <li className="flex items-start gap-2">
                <span className="text-brand">•</span>
                <strong>Constraint Violations:</strong> Products that hit floor/ceiling limits
              </li>
            </ul>
            <div className="mt-4 bg-bg border border-border p-3 rounded-lg">
              <p className="text-mute text-sm">
                <strong className="text-fg">Note:</strong> Preview is currently a mock feature showing estimated impact.
                Actual results may vary based on real-time catalog data.
              </p>
            </div>
          </div>
        </section>

        {/* Managing Rules */}
        <section className="mb-12">
          <h2 className="text-3xl font-semibold text-fg mb-6">Managing Rules</h2>

          <div className="space-y-6">
            <ManagementCard
              title="Enable / Disable"
              description="Toggle rules on or off without deleting them"
              steps={[
                "Find the rule in the rules list",
                "Click the enable/disable toggle switch",
                "Disabled rules won't execute on their schedule"
              ]}
            />

            <ManagementCard
              title="Edit Rules"
              description="Modify existing rules to adjust behavior"
              steps={[
                "Click on a rule to open it",
                "Update selectors, transforms, or schedule",
                "Preview the new impact",
                "Save changes"
              ]}
            />

            <ManagementCard
              title="Delete Rules"
              description="Permanently remove rules you no longer need"
              steps={[
                "Click the delete button on a rule",
                "Confirm deletion in the modal",
                "Deleted rules cannot be recovered"
              ]}
            />
          </div>
        </section>

        {/* Best Practices */}
        <section className="mb-12">
          <h2 className="text-3xl font-semibold text-fg mb-6">Best Practices</h2>

          <div className="space-y-4">
            <BestPractice
              title="Start with Narrow Selectors"
              tip="Test rules on a small subset of products before applying broadly. Use specific SKU patterns or tags."
            />
            <BestPractice
              title="Always Use Constraints"
              tip="Set price floors and ceilings to prevent unexpected pricing extremes, especially for percentage-based rules."
            />
            <BestPractice
              title="Preview Before Saving"
              tip="Always check the preview to understand how many products will be affected and by how much."
            />
            <BestPractice
              title="Use Descriptive Names"
              tip="Name rules clearly (e.g., 'Summer Sale -20%' instead of 'Rule 1') for easier management."
            />
            <BestPractice
              title="Test Schedules in Dev"
              tip="For recurring rules, test with a short interval first to ensure the schedule works as expected."
            />
            <BestPractice
              title="Monitor Price Changes"
              tip="Check the Price Changes page after rules execute to review and approve the generated changes."
            />
          </div>
        </section>

        {/* Related Docs */}
        <section className="mb-12">
          <h2 className="text-3xl font-semibold text-fg mb-6">Related Documentation</h2>
          <div className="grid md:grid-cols-2 gap-4">
            <RelatedLink
              href="/console/price-changes"
              title="Price Changes"
              description="Review and approve rule-generated price changes"
            />
            <RelatedLink
              href="/console/catalog"
              title="Product Catalog"
              description="Browse products to understand selector matching"
            />
            <RelatedLink
              href="/console/ai-assistant"
              title="AI Assistant"
              description="Query which products match rule criteria"
            />
            <RelatedLink
              href="/console/best-practices"
              title="Best Practices"
              description="Advanced pricing strategy tips"
            />
          </div>
        </section>
      </div>
    </div>
  )
}

// Helper components
function ComponentCard({ number, title, description, details }: any) {
  return (
    <div className="bg-surface border border-border rounded-xl p-6">
      <div className="flex items-start gap-3 mb-3">
        <div className="w-8 h-8 rounded-full bg-brand/20 text-brand flex items-center justify-center font-bold shrink-0">
          {number}
        </div>
        <div>
          <h3 className="text-xl font-semibold text-fg">{title}</h3>
          <p className="text-mute text-sm mt-1">{description}</p>
        </div>
      </div>
      <ul className="space-y-2 mt-4">
        {details.map((detail: string, i: number) => (
          <li key={i} className="flex items-start gap-2 text-fg text-sm">
            <span className="text-brand">•</span>
            {detail}
          </li>
        ))}
      </ul>
    </div>
  )
}

function SelectorCard({ type, description, examples }: any) {
  return (
    <div className="bg-surface border border-border rounded-xl p-6">
      <h3 className="text-lg font-semibold text-fg mb-2">{type}</h3>
      <p className="text-mute text-sm mb-4">{description}</p>
      <div className="space-y-2">
        {examples.map((ex: any, i: number) => (
          <div key={i} className="bg-bg border border-border p-3 rounded-lg">
            <code className="text-brand font-mono text-sm">{ex.pattern}</code>
            <p className="text-mute text-xs mt-1">→ {ex.desc}</p>
          </div>
        ))}
      </div>
    </div>
  )
}

function TransformCard({ type, icon, description, examples, useCase }: any) {
  return (
    <div className="bg-surface border border-border rounded-xl p-6">
      <div className="flex items-center gap-3 mb-3">
        <span className="text-2xl">{icon}</span>
        <h3 className="text-lg font-semibold text-fg">{type}</h3>
      </div>
      <p className="text-fg text-sm mb-3">{description}</p>
      <div className="bg-bg border border-border p-3 rounded-lg mb-3">
        <div className="text-xs font-semibold text-mute mb-2">EXAMPLES:</div>
        {examples.map((ex: string, i: number) => (
          <div key={i} className="text-sm text-fg font-mono">{ex}</div>
        ))}
      </div>
      <div className="text-xs text-mute">
        <strong className="text-fg">Use case:</strong> {useCase}
      </div>
    </div>
  )
}

function ScheduleCard({ type, description, useCase, config }: any) {
  return (
    <div className="bg-surface border border-border rounded-xl p-6">
      <h3 className="text-lg font-semibold text-fg mb-2">{type}</h3>
      <p className="text-fg text-sm mb-3">{description}</p>
      <div className="text-xs text-mute mb-3">
        <strong className="text-fg">Use case:</strong> {useCase}
      </div>
      <div className="bg-bg border border-border p-3 rounded-lg">
        <div className="text-xs font-semibold text-fg mb-2">CONFIGURATION:</div>
        <ul className="space-y-1">
          {config.map((item: string, i: number) => (
            <li key={i} className="text-sm text-mute flex items-start gap-2">
              <span className="text-brand">•</span>
              {item}
            </li>
          ))}
        </ul>
      </div>
    </div>
  )
}

function ManagementCard({ title, description, steps }: any) {
  return (
    <div className="bg-surface border border-border rounded-xl p-6">
      <h3 className="text-lg font-semibold text-fg mb-2">{title}</h3>
      <p className="text-mute text-sm mb-3">{description}</p>
      <ol className="space-y-2">
        {steps.map((step: string, i: number) => (
          <li key={i} className="flex gap-3 text-fg text-sm">
            <span className="font-bold text-brand">{i + 1}.</span>
            {step}
          </li>
        ))}
      </ol>
    </div>
  )
}

function BestPractice({ title, tip }: any) {
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

function RelatedLink({ href, title, description }: any) {
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
