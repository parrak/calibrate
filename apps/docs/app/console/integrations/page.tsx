import Link from 'next/link'

export default function IntegrationsDocs() {
  return (
    <div className="min-h-screen bg-bg">
      <div className="max-w-4xl mx-auto px-6 py-16">
        <Link href="/console" className="text-brand hover:underline text-sm mb-4 inline-block">
          ← Back to Console Docs
        </Link>

        <h1 className="text-4xl font-bold text-fg mb-4">Platform Integrations</h1>
        <p className="text-xl text-mute mb-12">
          Connect your e-commerce platforms and sync products automatically
        </p>

        {/* What are Integrations */}
        <section className="mb-12">
          <h2 className="text-3xl font-semibold text-fg mb-6">What are Platform Integrations?</h2>

          <div className="bg-surface border border-border rounded-xl p-6 mb-6">
            <p className="text-fg mb-4">
              Platform Integrations connect Calibrate to your e-commerce systems (like Shopify or Amazon), enabling
              bidirectional data sync. Calibrate imports your product catalog and prices, then can push approved
              price changes back to your storefront - all automatically.
            </p>
            <h3 className="text-lg font-semibold text-fg mb-3">How Integrations Work</h3>
            <ol className="space-y-2 text-fg">
              <li className="flex items-start gap-2">
                <span className="font-bold text-brand">1.</span>
                <div><strong>Authentication:</strong> You authorize Calibrate to access your platform via OAuth (Shopify) or API credentials (Amazon)</div>
              </li>
              <li className="flex items-start gap-2">
                <span className="font-bold text-brand">2.</span>
                <div><strong>Initial Sync:</strong> Calibrate imports your complete product catalog, variants, and current prices</div>
              </li>
              <li className="flex items-start gap-2">
                <span className="font-bold text-brand">3.</span>
                <div><strong>Ongoing Sync:</strong> Periodic and webhook-based updates keep data current</div>
              </li>
              <li className="flex items-start gap-2">
                <span className="font-bold text-brand">4.</span>
                <div><strong>Price Application:</strong> When you apply price changes in Calibrate, they're pushed back to your platform</div>
              </li>
            </ol>
          </div>

          <div className="bg-brand/10 border border-brand/20 rounded-xl p-4">
            <p className="text-fg text-sm">
              <strong className="text-brand">Security:</strong> All credentials are encrypted at rest. Calibrate only requests
              the minimum permissions needed (read products, write prices). You can revoke access anytime from your platform admin.
            </p>
          </div>
        </section>

        {/* Prerequisites */}
        <section className="mb-12">
          <h2 className="text-3xl font-semibold text-fg mb-6">Prerequisites</h2>

          <div className="grid md:grid-cols-2 gap-4">
            <div className="bg-surface border border-border rounded-xl p-6">
              <h3 className="text-lg font-semibold text-fg mb-3">For Shopify Integration</h3>
              <ul className="space-y-2 text-fg text-sm">
                <li className="flex items-start gap-2">
                  <span className="text-brand">✓</span>
                  Active Shopify store (any plan)
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-brand">✓</span>
                  Store Owner or Staff account with "Manage products" permission
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-brand">✓</span>
                  Your Shopify store domain (e.g., mystore.myshopify.com)
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-brand">●</span>
                  Products already created in Shopify (or ready to import)
                </li>
              </ul>
            </div>

            <div className="bg-surface border border-border rounded-xl p-6">
              <h3 className="text-lg font-semibold text-fg mb-3">For Amazon Integration</h3>
              <ul className="space-y-2 text-fg text-sm">
                <li className="flex items-start gap-2">
                  <span className="text-brand">✓</span>
                  Amazon Seller Central account
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-brand">✓</span>
                  Registered SP-API Developer Application
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-brand">✓</span>
                  LWA Client ID, Client Secret, and Refresh Token
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-brand">●</span>
                  Active product listings in Amazon
                </li>
              </ul>
            </div>
          </div>
        </section>

        {/* Overview */}
        <section className="mb-12">
          <h2 className="text-3xl font-semibold text-fg mb-6">Supported Platforms</h2>
          <p className="text-fg mb-6">
            Calibrate currently supports Shopify (full bidirectional sync) and Amazon SP-API (read-only import).
            More platforms coming soon.
          </p>

          <div className="bg-brand/10 border border-brand/20 rounded-xl p-4">
            <p className="text-fg text-sm">
              <strong className="text-brand">Access:</strong> Navigate to <strong>Integrations</strong> in the project sidebar,
              or visit <code className="bg-bg px-2 py-1 rounded">/p/[your-project]/integrations</code>
            </p>
          </div>
        </section>

        {/* Supported Platforms */}
        <section className="mb-12">
          <h2 className="text-3xl font-semibold text-fg mb-6">Supported Platforms</h2>

          <div className="space-y-6">
            <PlatformCard
              name="Shopify"
              icon="🛍️"
              status="Full Integration"
              features={[
                "OAuth-based authentication",
                "Automatic product and variant sync",
                "Real-time price updates via webhooks",
                "Bidirectional sync (read and write)",
                "Price change write-back to store"
              ]}
              capabilities="Read products, variants, and prices. Write price changes back to Shopify."
            />

            <PlatformCard
              name="Amazon SP-API"
              icon="📦"
              status="Read-Only Integration"
              features={[
                "SP-API credential authentication",
                "Catalog import and sync",
                "Pricing data collection",
                "Competitive price monitoring",
                "Read-only access (no write-back)"
              ]}
              capabilities="Import product catalog and pricing data. Monitor competitor prices. No price write-back in MVP."
            />
          </div>
        </section>

        {/* Connecting Shopify */}
        <section className="mb-12">
          <h2 className="text-3xl font-semibold text-fg mb-6">Connecting Shopify</h2>

          <div className="bg-surface border border-border rounded-xl p-6 mb-6">
            <h3 className="text-xl font-semibold text-fg mb-4">Setup Process</h3>
            <ol className="space-y-4 text-fg">
              <li className="flex gap-3">
                <span className="font-bold text-brand shrink-0">1.</span>
                <div>
                  Navigate to <strong>Integrations</strong> page and click on the <strong>Shopify</strong> card
                </div>
              </li>
              <li className="flex gap-3">
                <span className="font-bold text-brand shrink-0">2.</span>
                <div>
                  Click <strong>"Connect Your Store"</strong> button
                </div>
              </li>
              <li className="flex gap-3">
                <span className="font-bold text-brand shrink-0">3.</span>
                <div>
                  Enter your Shopify store domain (e.g., <code className="bg-bg px-2 py-1 rounded text-sm">mystore.myshopify.com</code>)
                </div>
              </li>
              <li className="flex gap-3">
                <span className="font-bold text-brand shrink-0">4.</span>
                <div>
                  You'll be redirected to Shopify to <strong>authorize</strong> Calibrate
                </div>
              </li>
              <li className="flex gap-3">
                <span className="font-bold text-brand shrink-0">5.</span>
                <div>
                  Log in to your Shopify admin and <strong>grant permissions</strong>:
                  <ul className="mt-2 space-y-1 text-mute text-sm">
                    <li>• Read products and variants</li>
                    <li>• Write product prices</li>
                    <li>• Read orders (for analytics)</li>
                  </ul>
                </div>
              </li>
              <li className="flex gap-3">
                <span className="font-bold text-brand shrink-0">6.</span>
                <div>
                  Click <strong>"Install app"</strong> on Shopify
                </div>
              </li>
              <li className="flex gap-3">
                <span className="font-bold text-brand shrink-0">7.</span>
                <div>
                  You'll be redirected back to Calibrate console with a <strong>success message</strong>
                </div>
              </li>
              <li className="flex gap-3">
                <span className="font-bold text-brand shrink-0">8.</span>
                <div>
                  Initial product sync will start automatically
                </div>
              </li>
            </ol>
          </div>

          <div className="bg-bg border border-border rounded-xl p-4">
            <p className="text-fg text-sm">
              💡 <strong>Tip:</strong> Make sure you have admin access to your Shopify store before starting the OAuth flow.
            </p>
          </div>
        </section>

        {/* Connecting Amazon */}
        <section className="mb-12">
          <h2 className="text-3xl font-semibold text-fg mb-6">Connecting Amazon</h2>

          <div className="bg-surface border border-border rounded-xl p-6 mb-6">
            <h3 className="text-xl font-semibold text-fg mb-4">Prerequisites</h3>
            <ul className="space-y-2 text-fg">
              <li className="flex items-start gap-2">
                <span className="text-brand">•</span>
                Active Amazon Seller Central account
              </li>
              <li className="flex items-start gap-2">
                <span className="text-brand">•</span>
                Amazon SP-API credentials (Client ID and Secret)
              </li>
              <li className="flex items-start gap-2">
                <span className="text-brand">•</span>
                Refresh token for your seller account
              </li>
            </ul>
          </div>

          <div className="bg-surface border border-border rounded-xl p-6">
            <h3 className="text-xl font-semibold text-fg mb-4">Setup Process</h3>
            <ol className="space-y-4 text-fg">
              <li className="flex gap-3">
                <span className="font-bold text-brand shrink-0">1.</span>
                <div>
                  Go to <strong>Amazon Seller Central</strong> and register for SP-API access
                </div>
              </li>
              <li className="flex gap-3">
                <span className="font-bold text-brand shrink-0">2.</span>
                <div>
                  Create a <strong>Developer Application</strong> and note your:
                  <ul className="mt-2 space-y-1 text-mute text-sm">
                    <li>• LWA Client ID</li>
                    <li>• LWA Client Secret</li>
                    <li>• Refresh Token</li>
                  </ul>
                </div>
              </li>
              <li className="flex gap-3">
                <span className="font-bold text-brand shrink-0">3.</span>
                <div>
                  In Calibrate console, navigate to <strong>Integrations → Amazon</strong>
                </div>
              </li>
              <li className="flex gap-3">
                <span className="font-bold text-brand shrink-0">4.</span>
                <div>
                  Click <strong>"Connect Amazon SP-API"</strong>
                </div>
              </li>
              <li className="flex gap-3">
                <span className="font-bold text-brand shrink-0">5.</span>
                <div>
                  Enter your SP-API credentials (Client ID, Secret, Refresh Token)
                </div>
              </li>
              <li className="flex gap-3">
                <span className="font-bold text-brand shrink-0">6.</span>
                <div>
                  Select your marketplace (US, UK, EU, etc.)
                </div>
              </li>
              <li className="flex gap-3">
                <span className="font-bold text-brand shrink-0">7.</span>
                <div>
                  Click <strong>"Connect"</strong> to test credentials
                </div>
              </li>
              <li className="flex gap-3">
                <span className="font-bold text-brand shrink-0">8.</span>
                <div>
                  If successful, catalog sync will begin automatically
                </div>
              </li>
            </ol>
          </div>
        </section>

        {/* Managing Integrations */}
        <section className="mb-12">
          <h2 className="text-3xl font-semibold text-fg mb-6">Managing Integrations</h2>

          <div className="space-y-6">
            <FeatureBox
              title="Connection Status"
              description="View the status of your platform connections"
              items={[
                "Connected: Platform is linked and syncing",
                "Not Connected: Platform needs to be set up",
                "Error: Connection issue (check credentials)"
              ]}
            />

            <FeatureBox
              title="Sync History"
              description="Monitor recent sync operations"
              items={[
                "Last sync timestamp",
                "Sync status (Success, Syncing, Error)",
                "Number of products/variants synced",
                "Error messages and troubleshooting info"
              ]}
            />

            <FeatureBox
              title="Manual Sync"
              description="Trigger sync operations on demand"
              items={[
                "Product sync: Import latest catalog",
                "Price sync: Fetch current prices",
                "Full sync: Complete re-import"
              ]}
            />

            <FeatureBox
              title="Disconnect"
              description="Remove platform integration"
              items={[
                "Click 'Disconnect' button",
                "Confirm in the modal",
                "Catalog data is preserved",
                "No more automatic syncs"
              ]}
            />
          </div>
        </section>

        {/* Sync Settings */}
        <section className="mb-12">
          <h2 className="text-3xl font-semibold text-fg mb-6">Sync Settings</h2>

          <div className="bg-surface border border-border rounded-xl p-6 mb-6">
            <h3 className="text-xl font-semibold text-fg mb-4">Automatic Sync</h3>
            <p className="text-fg mb-4">
              Connected platforms sync automatically on the following schedule:
            </p>
            <ul className="space-y-2 text-fg">
              <li className="flex items-start gap-2">
                <span className="text-brand">•</span>
                <strong>Initial Import:</strong> When first connected, full catalog import
              </li>
              <li className="flex items-start gap-2">
                <span className="text-brand">•</span>
                <strong>Periodic Sync:</strong> Every 6 hours for product and price updates
              </li>
              <li className="flex items-start gap-2">
                <span className="text-brand">•</span>
                <strong>Webhook Triggers:</strong> Real-time updates when products change (Shopify only)
              </li>
              <li className="flex items-start gap-2">
                <span className="text-brand">•</span>
                <strong>Price Application:</strong> Immediate sync when applying price changes
              </li>
            </ul>
          </div>

          <div className="bg-surface border border-border rounded-xl p-6">
            <h3 className="text-xl font-semibold text-fg mb-4">Webhook Configuration</h3>
            <p className="text-fg mb-4">
              For Shopify, webhooks are automatically configured during OAuth setup:
            </p>
            <ul className="space-y-2 text-fg">
              <li className="flex items-start gap-2">
                <span className="text-brand">•</span>
                Product create/update/delete events
              </li>
              <li className="flex items-start gap-2">
                <span className="text-brand">•</span>
                Variant update events (price changes)
              </li>
              <li className="flex items-start gap-2">
                <span className="text-brand">•</span>
                Inventory level changes
              </li>
            </ul>
            <div className="mt-4 bg-bg border border-border p-3 rounded-lg">
              <p className="text-mute text-sm">
                <strong className="text-fg">Note:</strong> Webhooks ensure your catalog stays in sync in near real-time
                without manual intervention.
              </p>
            </div>
          </div>
        </section>

        {/* Troubleshooting */}
        <section className="mb-12">
          <h2 className="text-3xl font-semibold text-fg mb-6">Troubleshooting</h2>

          <div className="space-y-4">
            <TroubleshootCard
              issue="Sync Failed"
              causes={[
                "Platform credentials expired or revoked",
                "Platform API is temporarily down",
                "Network connectivity issues"
              ]}
              solutions={[
                "Check connection status on Integrations page",
                "Verify platform credentials are still valid",
                "Disconnect and reconnect the integration",
                "Contact support if issue persists"
              ]}
            />

            <TroubleshootCard
              issue="Products Not Syncing"
              causes={[
                "Products are archived or deleted in platform",
                "Sync is in progress (can take time for large catalogs)",
                "Platform API rate limits"
              ]}
              solutions={[
                "Wait for sync to complete and check again",
                "Trigger manual sync from Integrations page",
                "Check sync history for error messages",
                "Verify products exist in platform admin"
              ]}
            />

            <TroubleshootCard
              issue="Price Changes Not Applying"
              causes={[
                "Connector sync is queued or in progress",
                "Platform credentials don't have write permissions",
                "Product/variant no longer exists in platform"
              ]}
              solutions={[
                "Check connector status in price change details",
                "Verify integration has write permissions",
                "Check platform for product availability",
                "Review error message in connector status"
              ]}
            />
          </div>
        </section>

        {/* Best Practices */}
        <section className="mb-12">
          <h2 className="text-3xl font-semibold text-fg mb-6">Best Practices</h2>

          <div className="space-y-4">
            <BestPractice
              title="Monitor Sync Status Regularly"
              tip="Check the Integrations page weekly to ensure platforms are syncing successfully."
            />
            <BestPractice
              title="Use Manual Sync Sparingly"
              tip="Automatic syncs should handle most updates. Only trigger manual sync if you need immediate refresh."
            />
            <BestPractice
              title="Test with Small Changes First"
              tip="When first connecting a platform, test with a few price changes before bulk operations."
            />
            <BestPractice
              title="Keep Credentials Secure"
              tip="Never share your API credentials. Rotate them periodically for security."
            />
            <BestPractice
              title="Review Sync Logs"
              tip="After major catalog changes in your platform, review sync logs to ensure all updates were captured."
            />
          </div>
        </section>

        {/* Related Docs */}
        <section className="mb-12">
          <h2 className="text-3xl font-semibold text-fg mb-6">Related Documentation</h2>
          <div className="grid md:grid-cols-2 gap-4">
            <RelatedLink
              href="/console/catalog"
              title="Product Catalog"
              description="View synced products from platforms"
            />
            <RelatedLink
              href="/console/price-changes"
              title="Price Changes"
              description="Monitor price sync status"
            />
            <RelatedLink
              href="/console/getting-started"
              title="Getting Started"
              description="Initial platform connection guide"
            />
            <RelatedLink
              href="/console/troubleshooting"
              title="Troubleshooting"
              description="Common integration issues"
            />
          </div>
        </section>
      </div>
    </div>
  )
}

// Helper components
function PlatformCard({ name, icon, status, features, capabilities }: { name: string; icon: string; status: string; features: string[]; capabilities: string }) {
  return (
    <div className="bg-surface border border-border rounded-xl p-6">
      <div className="flex items-center gap-3 mb-4">
        <span className="text-4xl">{icon}</span>
        <div>
          <h3 className="text-xl font-semibold text-fg">{name}</h3>
          <span className="text-sm text-brand">{status}</span>
        </div>
      </div>
      <p className="text-mute text-sm mb-4">{capabilities}</p>
      <div>
        <div className="text-sm font-semibold text-fg mb-2">Features:</div>
        <ul className="space-y-1">
          {features.map((feature: string, i: number) => (
            <li key={i} className="flex items-start gap-2 text-fg text-sm">
              <span className="text-brand">✓</span>
              {feature}
            </li>
          ))}
        </ul>
      </div>
    </div>
  )
}

function FeatureBox({ title, description, items }: { title: string; description: string; items: string[] }) {
  return (
    <div className="bg-surface border border-border rounded-xl p-6">
      <h3 className="text-lg font-semibold text-fg mb-2">{title}</h3>
      <p className="text-mute text-sm mb-3">{description}</p>
      <ul className="space-y-2">
        {items.map((item: string, i: number) => (
          <li key={i} className="flex items-start gap-2 text-fg text-sm">
            <span className="text-brand">•</span>
            {item}
          </li>
        ))}
      </ul>
    </div>
  )
}

function TroubleshootCard({ issue, causes, solutions }: { issue: string; causes: string[]; solutions: string[] }) {
  return (
    <div className="bg-surface border border-border rounded-xl p-6">
      <h3 className="text-lg font-semibold text-fg mb-3">❗ {issue}</h3>
      <div className="mb-4">
        <div className="text-sm font-semibold text-fg mb-2">Common Causes:</div>
        <ul className="space-y-1">
          {causes.map((cause: string, i: number) => (
            <li key={i} className="flex items-start gap-2 text-mute text-sm">
              <span>•</span>
              {cause}
            </li>
          ))}
        </ul>
      </div>
      <div>
        <div className="text-sm font-semibold text-fg mb-2">Solutions:</div>
        <ol className="space-y-1">
          {solutions.map((solution: string, i: number) => (
            <li key={i} className="flex gap-2 text-fg text-sm">
              <span className="font-bold text-brand">{i + 1}.</span>
              {solution}
            </li>
          ))}
        </ol>
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
