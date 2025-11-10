import Link from 'next/link'

export default function CatalogDocs() {
  return (
    <div className="min-h-screen bg-bg">
      <div className="max-w-4xl mx-auto px-6 py-16">
        <Link href="/console" className="text-brand hover:underline text-sm mb-4 inline-block">
          ← Back to Console Docs
        </Link>

        <h1 className="text-4xl font-bold text-fg mb-4">Product Catalog</h1>
        <p className="text-xl text-mute mb-12">
          Browse, search, and manage your product catalog
        </p>

        {/* Overview */}
        <section className="mb-12">
          <h2 className="text-3xl font-semibold text-fg mb-6">Overview</h2>
          <p className="text-fg mb-6">
            The Product Catalog page displays all products and SKUs synced from your connected platforms.
            You can search, filter, and view detailed pricing information for each product.
          </p>

          <div className="bg-brand/10 border border-brand/20 rounded-xl p-4">
            <p className="text-fg text-sm">
              <strong className="text-brand">Access:</strong> Navigate to <strong>Catalog</strong> in the project sidebar,
              or visit <code className="bg-bg px-2 py-1 rounded">/p/[your-project]/catalog</code>
            </p>
          </div>
        </section>

        {/* Catalog Interface */}
        <section className="mb-12">
          <h2 className="text-3xl font-semibold text-fg mb-6">Catalog Interface</h2>

          <div className="bg-surface border border-border rounded-xl p-6 mb-6">
            <h3 className="text-xl font-semibold text-fg mb-4">Main View</h3>
            <p className="text-fg mb-4">The catalog displays products in a table format with the following columns:</p>
            <ul className="space-y-2 text-fg">
              <li className="flex items-start gap-2">
                <span className="text-brand">•</span>
                <div>
                  <strong>Product Code:</strong> Unique identifier for the product
                </div>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-brand">•</span>
                <div>
                  <strong>Product Name:</strong> Display name of the product
                </div>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-brand">•</span>
                <div>
                  <strong>SKUs:</strong> Number of variants/SKUs for each product
                </div>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-brand">•</span>
                <div>
                  <strong>Prices:</strong> Current pricing information across all currencies
                </div>
              </li>
            </ul>
          </div>

          <div className="bg-surface border border-border rounded-xl p-6">
            <h3 className="text-xl font-semibold text-fg mb-4">Expandable Product Details</h3>
            <p className="text-fg mb-4">Click on any product row to expand and view:</p>
            <ul className="space-y-2 text-fg">
              <li className="flex items-start gap-2">
                <span className="text-brand">→</span>
                <strong>SKU List:</strong> All variants with their codes
              </li>
              <li className="flex items-start gap-2">
                <span className="text-brand">→</span>
                <strong>Multi-Currency Pricing:</strong> Current prices in all configured currencies
              </li>
              <li className="flex items-start gap-2">
                <span className="text-brand">→</span>
                <strong>Price History:</strong> Recent price changes and trends
              </li>
            </ul>
          </div>
        </section>

        {/* Search and Filter */}
        <section className="mb-12">
          <h2 className="text-3xl font-semibold text-fg mb-6">Search & Filter</h2>

          <div className="space-y-6">
            <div className="bg-surface border border-border rounded-xl p-6">
              <h3 className="text-xl font-semibold text-fg mb-4">Search Functionality</h3>
              <p className="text-fg mb-4">Use the search bar at the top of the catalog to find products by:</p>
              <ul className="space-y-2 text-fg">
                <li className="flex items-start gap-2">
                  <span className="text-brand">•</span>
                  <strong>Product Code:</strong> Exact or partial match
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-brand">•</span>
                  <strong>Product Name:</strong> Case-insensitive text search
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-brand">•</span>
                  <strong>SKU Code:</strong> Search within product variants
                </li>
              </ul>
              <div className="mt-4 bg-bg border border-border p-3 rounded-lg">
                <p className="text-mute text-sm">
                  <strong>Example:</strong> Search for "shirt" to find all products with "shirt" in their name,
                  or "SKU-123" to find specific variants.
                </p>
              </div>
            </div>

            <div className="bg-surface border border-border rounded-xl p-6">
              <h3 className="text-xl font-semibold text-fg mb-4">Currency Filter</h3>
              <p className="text-fg mb-3">Filter products by specific currencies to:</p>
              <ul className="space-y-2 text-fg">
                <li className="flex items-start gap-2">
                  <span className="text-brand">•</span>
                  View pricing in a specific market (USD, EUR, GBP, etc.)
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-brand">•</span>
                  Show only products with prices in selected currency
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-brand">•</span>
                  Compare prices across different regions
                </li>
              </ul>
            </div>
          </div>
        </section>

        {/* Pagination */}
        <section className="mb-12">
          <h2 className="text-3xl font-semibold text-fg mb-6">Pagination</h2>

          <div className="bg-surface border border-border rounded-xl p-6">
            <p className="text-fg mb-4">
              For catalogs with many products, the catalog view uses pagination to improve performance:
            </p>
            <ul className="space-y-2 text-fg">
              <li className="flex items-start gap-2">
                <span className="text-brand">•</span>
                Default page size: 50 products per page
              </li>
              <li className="flex items-start gap-2">
                <span className="text-brand">•</span>
                Use the navigation controls at the bottom to move between pages
              </li>
              <li className="flex items-start gap-2">
                <span className="text-brand">•</span>
                Search and filter settings persist across pages
              </li>
            </ul>
          </div>
        </section>

        {/* Working with Products */}
        <section className="mb-12">
          <h2 className="text-3xl font-semibold text-fg mb-6">Working with Products</h2>

          <div className="space-y-6">
            <div className="bg-surface border border-border rounded-xl p-6">
              <h3 className="text-xl font-semibold text-fg mb-4">Viewing Product Details</h3>
              <ol className="space-y-3 text-fg">
                <li className="flex gap-3">
                  <span className="font-bold text-brand">1.</span>
                  Click on any product row to expand it
                </li>
                <li className="flex gap-3">
                  <span className="font-bold text-brand">2.</span>
                  View all SKUs and their individual pricing
                </li>
                <li className="flex gap-3">
                  <span className="font-bold text-brand">3.</span>
                  See multi-currency prices formatted with currency symbols
                </li>
                <li className="flex gap-3">
                  <span className="font-bold text-brand">4.</span>
                  Click again to collapse the details
                </li>
              </ol>
            </div>

            <div className="bg-surface border border-border rounded-xl p-6">
              <h3 className="text-xl font-semibold text-fg mb-4">Quick Actions</h3>
              <p className="text-fg mb-3">From the catalog view, you can:</p>
              <ul className="space-y-2 text-fg">
                <li className="flex items-start gap-2">
                  <span className="text-brand">→</span>
                  <strong>Create Price Changes:</strong> Navigate to Price Changes to create manual adjustments
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-brand">→</span>
                  <strong>Create Pricing Rules:</strong> Set up automated rules targeting specific products
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-brand">→</span>
                  <strong>View in Platform:</strong> Link to the product in your connected platform (coming soon)
                </li>
              </ul>
            </div>
          </div>
        </section>

        {/* Sync Status */}
        <section className="mb-12">
          <h2 className="text-3xl font-semibold text-fg mb-6">Catalog Sync</h2>

          <div className="bg-surface border border-border rounded-xl p-6 mb-6">
            <h3 className="text-xl font-semibold text-fg mb-4">Automatic Synchronization</h3>
            <p className="text-fg mb-4">
              Your catalog automatically syncs with connected platforms:
            </p>
            <ul className="space-y-2 text-fg">
              <li className="flex items-start gap-2">
                <span className="text-brand">•</span>
                <strong>Initial Import:</strong> When you first connect a platform, all products are imported
              </li>
              <li className="flex items-start gap-2">
                <span className="text-brand">•</span>
                <strong>Periodic Sync:</strong> Regular updates keep your catalog current
              </li>
              <li className="flex items-start gap-2">
                <span className="text-brand">•</span>
                <strong>Real-time Updates:</strong> Changes in your platform appear in the catalog (webhook-based)
              </li>
            </ul>
          </div>

          <div className="bg-surface border border-border rounded-xl p-6">
            <h3 className="text-xl font-semibold text-fg mb-4">Manual Refresh</h3>
            <p className="text-fg mb-3">To manually trigger a catalog sync:</p>
            <ol className="space-y-2 text-fg">
              <li className="flex gap-3">
                <span className="font-bold text-brand">1.</span>
                Go to <strong>Integrations</strong> page
              </li>
              <li className="flex gap-3">
                <span className="font-bold text-brand">2.</span>
                Select your platform (Shopify or Amazon)
              </li>
              <li className="flex gap-3">
                <span className="font-bold text-brand">3.</span>
                Click <strong>"Sync Now"</strong> button
              </li>
              <li className="flex gap-3">
                <span className="font-bold text-brand">4.</span>
                Monitor sync progress and check for errors
              </li>
            </ol>
          </div>
        </section>

        {/* Understanding Pricing */}
        <section className="mb-12">
          <h2 className="text-3xl font-semibold text-fg mb-6">Understanding Pricing Display</h2>

          <div className="bg-surface border border-border rounded-xl p-6">
            <h3 className="text-xl font-semibold text-fg mb-4">Price Formatting</h3>
            <p className="text-fg mb-4">Prices in the catalog are displayed with the following conventions:</p>
            <ul className="space-y-3 text-fg">
              <li className="flex items-start gap-2">
                <span className="text-brand">•</span>
                <div>
                  <strong>Currency Symbol:</strong> Automatically displayed based on currency code (e.g., $, €, £)
                </div>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-brand">•</span>
                <div>
                  <strong>Decimal Precision:</strong> 2 decimal places for most currencies
                </div>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-brand">•</span>
                <div>
                  <strong>Zero-decimal Currencies:</strong> Some currencies (like JPY) display without decimals
                </div>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-brand">•</span>
                <div>
                  <strong>Storage Format:</strong> Prices are stored in cents/smallest units (e.g., $10.00 = 1000 cents)
                </div>
              </li>
            </ul>

            <div className="mt-4 bg-bg border border-border p-3 rounded-lg">
              <p className="text-mute text-sm font-mono">
                <strong className="text-fg">Example:</strong><br />
                • USD: $29.99 (stored as 2999)<br />
                • EUR: €49.00 (stored as 4900)<br />
                • JPY: ¥3,000 (stored as 3000)
              </p>
            </div>
          </div>
        </section>

        {/* Tips */}
        <section className="mb-12">
          <h2 className="text-3xl font-semibold text-fg mb-6">Tips & Best Practices</h2>

          <div className="space-y-4">
            <TipBox
              title="Use Search Effectively"
              tip="Start with broad searches and refine as needed. Product codes are faster for exact matches."
            />
            <TipBox
              title="Monitor Sync Status"
              tip="Check the Integrations page regularly to ensure your catalog stays in sync with your platforms."
            />
            <TipBox
              title="Multi-Currency Management"
              tip="Use currency filters to review pricing strategy in specific markets before making bulk changes."
            />
            <TipBox
              title="Combine with Rules"
              tip="After browsing the catalog, use Pricing Rules to automate changes for product groups."
            />
          </div>
        </section>

        {/* Next Steps */}
        <section className="mb-12">
          <h2 className="text-3xl font-semibold text-fg mb-6">Related Documentation</h2>
          <div className="grid md:grid-cols-2 gap-4">
            <RelatedLink
              href="/console/price-changes"
              title="Price Changes"
              description="Learn how to manage price changes for your products"
            />
            <RelatedLink
              href="/console/pricing-rules"
              title="Pricing Rules"
              description="Automate pricing for product groups"
            />
            <RelatedLink
              href="/console/integrations"
              title="Platform Integrations"
              description="Manage catalog sync with Shopify and Amazon"
            />
            <RelatedLink
              href="/console/ai-assistant"
              title="AI Assistant"
              description="Query your catalog with natural language"
            />
          </div>
        </section>
      </div>
    </div>
  )
}

function TipBox({ title, tip }: { title: string; tip: string }) {
  return (
    <div className="bg-bg border border-border rounded-lg p-4">
      <div className="flex items-start gap-3">
        <span className="text-2xl">💡</span>
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
