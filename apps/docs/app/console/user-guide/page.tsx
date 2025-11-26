import Link from 'next/link'

export default function UserGuidePage() {
  return (
    <div className="max-w-4xl mx-auto space-y-8 py-8 px-4">
      <header>
        <h1 className="text-4xl font-bold mb-4">Calibrate Console User Guide</h1>
        <p className="text-lg text-mute">
          Learn how to use the Calibrate Console to manage your pricing operations
        </p>
      </header>

      <nav className="border-b border-border pb-4">
        <h2 className="text-sm font-semibold text-mute uppercase mb-2">Quick Navigation</h2>
        <ul className="flex flex-wrap gap-4">
          <li><a href="#getting-started" className="text-brand hover:underline">Getting Started</a></li>
          <li><a href="#price-changes" className="text-brand hover:underline">Price Changes</a></li>
          <li><a href="#catalog" className="text-brand hover:underline">Catalog</a></li>
          <li><a href="#analytics" className="text-brand hover:underline">Analytics</a></li>
          <li><a href="#ai-assistant" className="text-brand hover:underline">AI Assistant</a></li>
          <li><a href="#integrations" className="text-brand hover:underline">Integrations</a></li>
        </ul>
      </nav>

      <section id="getting-started" className="space-y-4">
        <h2 className="text-2xl font-semibold">Getting Started</h2>
        <div className="prose prose-invert max-w-none">
          <p>
            Welcome to Calibrate Console! This guide will help you navigate and use all the features
            available in the console.
          </p>

          <h3 className="text-xl font-semibold mt-6 mb-3">First Steps</h3>
          <ol className="list-decimal list-inside space-y-2">
            <li>Log in to your Calibrate account</li>
            <li>Select or create a project</li>
            <li>Connect your commerce platform (Shopify, Amazon, etc.)</li>
            <li>Review your product catalog</li>
            <li>Start managing price changes</li>
          </ol>

          <h3 className="text-xl font-semibold mt-6 mb-3">Navigation</h3>
          <p>
            The console uses a sidebar navigation with the following main sections:
          </p>
          <ul className="list-disc list-inside space-y-2">
            <li><strong>Dashboard</strong> - Overview of your pricing operations</li>
            <li><strong>Catalog</strong> - View and manage your products</li>
            <li><strong>Price Changes</strong> - Review and approve price updates</li>
            <li><strong>Pricing Rules</strong> - Configure pricing policies and guardrails</li>
            <li><strong>AI Suggestions</strong> - Get AI-powered pricing recommendations</li>
            <li><strong>Analytics</strong> - View pricing trends and insights</li>
            <li><strong>Competitors</strong> - Monitor competitor pricing</li>
            <li><strong>Settings</strong> - Manage integrations and project settings</li>
          </ul>
        </div>
      </section>

      <section id="price-changes" className="space-y-4">
        <h2 className="text-2xl font-semibold">Price Changes</h2>
        <div className="prose prose-invert max-w-none">
          <p>
            The Price Changes page is where you review, approve, and apply suggested price updates
            for your products.
          </p>

          <h3 className="text-xl font-semibold mt-6 mb-3">Understanding Price Changes</h3>
          <p>
            Price changes can come from multiple sources:
          </p>
          <ul className="list-disc list-inside space-y-2">
            <li><strong>AI Optimizer</strong> - AI-generated suggestions based on market data</li>
            <li><strong>Competitor Monitor</strong> - Automatic adjustments based on competitor pricing</li>
            <li><strong>Manual</strong> - Changes you create manually</li>
            <li><strong>Webhooks</strong> - External system integrations</li>
          </ul>

          <h3 className="text-xl font-semibold mt-6 mb-3">Status Types</h3>
          <ul className="list-disc list-inside space-y-2">
            <li><strong>PENDING</strong> - Awaiting review and approval</li>
            <li><strong>APPROVED</strong> - Approved but not yet applied to platforms</li>
            <li><strong>APPLIED</strong> - Successfully applied to connected platforms</li>
            <li><strong>REJECTED</strong> - Rejected during review</li>
            <li><strong>FAILED</strong> - Failed to apply to platforms</li>
            <li><strong>ROLLED_BACK</strong> - Reverted to previous price</li>
          </ul>

          <h3 className="text-xl font-semibold mt-6 mb-3">Actions</h3>
          <p>Based on your role, you can perform different actions:</p>
          <ul className="list-disc list-inside space-y-2">
            <li><strong>VIEWER</strong> - Can view price changes only</li>
            <li><strong>EDITOR</strong> - Can approve or reject changes</li>
            <li><strong>ADMIN</strong> - Can apply changes to platforms</li>
            <li><strong>OWNER</strong> - Full access including rollback</li>
          </ul>

          <h3 className="text-xl font-semibold mt-6 mb-3">Policy Checks</h3>
          <p>
            Before a price change can be applied, it must pass policy checks:
          </p>
          <ul className="list-disc list-inside space-y-2">
            <li><strong>maxPctDelta</strong> - Maximum percentage change allowed</li>
            <li><strong>floor</strong> - Minimum price threshold</li>
            <li><strong>ceiling</strong> - Maximum price threshold</li>
          </ul>
        </div>
      </section>

      <section id="catalog" className="space-y-4">
        <h2 className="text-2xl font-semibold">Product Catalog</h2>
        <div className="prose prose-invert max-w-none">
          <p>
            The Catalog page displays all products synced from your connected platforms.
          </p>

          <h3 className="text-xl font-semibold mt-6 mb-3">Features</h3>
          <ul className="list-disc list-inside space-y-2">
            <li>Search products by name, code, or SKU</li>
            <li>Filter by currency</li>
            <li>View product details including SKUs and prices</li>
            <li>See product status and inventory information</li>
          </ul>
        </div>
      </section>

      <section id="analytics" className="space-y-4">
        <h2 className="text-2xl font-semibold">Analytics Dashboard</h2>
        <div className="prose prose-invert max-w-none">
          <p>
            The Analytics page provides insights into your pricing operations and trends.
          </p>

          <h3 className="text-xl font-semibold mt-6 mb-3">Metrics</h3>
          <ul className="list-disc list-inside space-y-2">
            <li><strong>Total SKUs</strong> - Number of products being tracked</li>
            <li><strong>Price Changes</strong> - Count of price changes in the selected period</li>
            <li><strong>Approval Rate</strong> - Percentage of changes that were approved</li>
            <li><strong>Average Price</strong> - Mean price across all products</li>
          </ul>

          <h3 className="text-xl font-semibold mt-6 mb-3">Time Ranges</h3>
          <p>You can view analytics for different time periods:</p>
          <ul className="list-disc list-inside space-y-2">
            <li>7 Days</li>
            <li>30 Days</li>
            <li>90 Days</li>
          </ul>
        </div>
      </section>

      <section id="ai-assistant" className="space-y-4">
        <h2 className="text-2xl font-semibold">AI Pricing Assistant</h2>
        <div className="prose prose-invert max-w-none">
          <p>
            The AI Assistant allows you to ask questions about your pricing data in natural language.
          </p>

          <h3 className="text-xl font-semibold mt-6 mb-3">How to Use</h3>
          <ol className="list-decimal list-inside space-y-2">
            <li>Type your question in the input field</li>
            <li>Click "Ask" or press Enter</li>
            <li>Review the AI-generated answer</li>
            <li>Explore suggested follow-up questions</li>
          </ol>

          <h3 className="text-xl font-semibold mt-6 mb-3">Example Questions</h3>
          <ul className="list-disc list-inside space-y-2">
            <li>"Why was this price changed?"</li>
            <li>"What if I increase prices by 10%?"</li>
            <li>"Show me products with low margins"</li>
            <li>"How many price changes were made last week?"</li>
            <li>"Which products have the highest margins?"</li>
          </ul>
        </div>
      </section>

      <section id="integrations" className="space-y-4">
        <h2 className="text-2xl font-semibold">Integrations</h2>
        <div className="prose prose-invert max-w-none">
          <p>
            Connect your commerce platforms to sync products and apply price changes automatically.
          </p>

          <h3 className="text-xl font-semibold mt-6 mb-3">Supported Platforms</h3>
          <ul className="list-disc list-inside space-y-2">
            <li>Shopify</li>
            <li>Amazon</li>
            <li>More platforms coming soon...</li>
          </ul>

          <h3 className="text-xl font-semibold mt-6 mb-3">Setup Process</h3>
          <ol className="list-decimal list-inside space-y-2">
            <li>Navigate to Settings</li>
            <li>Select your platform</li>
            <li>Follow the authentication flow</li>
            <li>Configure sync settings</li>
            <li>Start syncing products</li>
          </ol>
        </div>
      </section>

      <section className="border-t border-border pt-8 mt-8">
        <h2 className="text-2xl font-semibold mb-4">Need Help?</h2>
        <p className="text-mute mb-4">
          If you have questions or need assistance, please reach out:
        </p>
        <ul className="space-y-2">
          <li>
            <strong>Email:</strong>{' '}
            <a href="mailto:support@calibr.lat" className="text-brand hover:underline">
              support@calibr.lat
            </a>
          </li>
          <li>
            <strong>Documentation:</strong>{' '}
            <Link href="/" className="text-brand hover:underline">
              API Documentation
            </Link>
          </li>
        </ul>
      </section>
    </div>
  )
}
