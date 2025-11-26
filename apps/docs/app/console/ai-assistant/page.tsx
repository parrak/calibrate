import Link from 'next/link'

export default function AIAssistantDocs() {
  return (
    <div className="min-h-screen bg-bg">
      <div className="max-w-4xl mx-auto px-6 py-16">
        <Link href="/console" className="text-brand hover:underline text-sm mb-4 inline-block">
          ← Back to Console Docs
        </Link>

        <h1 className="text-4xl font-bold text-fg mb-4">AI Assistant</h1>
        <p className="text-xl text-mute mb-12">
          Query your pricing data using natural language with AI-powered insights
        </p>

        {/* Overview */}
        <section className="mb-12">
          <h2 className="text-3xl font-semibold text-fg mb-6">Overview</h2>
          <p className="text-fg mb-6">
            The AI Assistant allows you to ask questions about your pricing data in plain English.
            It converts your queries into SQL, retrieves the data, and provides natural language answers
            with context and follow-up suggestions.
          </p>

          <div className="bg-brand/10 border border-brand/20 rounded-xl p-4">
            <p className="text-fg text-sm">
              <strong className="text-brand">Access:</strong> Navigate to <strong>Assistant</strong> in the project sidebar,
              or visit <code className="bg-bg px-2 py-1 rounded">/p/[your-project]/assistant</code>
            </p>
          </div>
        </section>

        {/* How It Works */}
        <section className="mb-12">
          <h2 className="text-3xl font-semibold text-fg mb-6">How It Works</h2>

          <div className="space-y-4">
            <div className="bg-surface border border-border rounded-xl p-6">
              <div className="flex items-center gap-3 mb-4">
                <div className="w-8 h-8 rounded-full bg-brand/20 text-brand flex items-center justify-center font-bold">1</div>
                <h3 className="text-lg font-semibold text-fg">You ask a question</h3>
              </div>
              <p className="text-mute text-sm">
                Type your question in natural language, like "What are my most expensive products?" or
                "Show me all SKUs with prices over $100"
              </p>
            </div>

            <div className="bg-surface border border-border rounded-xl p-6">
              <div className="flex items-center gap-3 mb-4">
                <div className="w-8 h-8 rounded-full bg-brand/20 text-brand flex items-center justify-center font-bold">2</div>
                <h3 className="text-lg font-semibold text-fg">AI processes your query</h3>
              </div>
              <p className="text-mute text-sm">
                The AI understands your intent and converts it into a SQL query against your pricing database
              </p>
            </div>

            <div className="bg-surface border border-border rounded-xl p-6">
              <div className="flex items-center gap-3 mb-4">
                <div className="w-8 h-8 rounded-full bg-brand/20 text-brand flex items-center justify-center font-bold">3</div>
                <h3 className="text-lg font-semibold text-fg">Data is retrieved</h3>
              </div>
              <p className="text-mute text-sm">
                The generated SQL query runs against your database to fetch the relevant data
              </p>
            </div>

            <div className="bg-surface border border-border rounded-xl p-6">
              <div className="flex items-center gap-3 mb-4">
                <div className="w-8 h-8 rounded-full bg-brand/20 text-brand flex items-center justify-center font-bold">4</div>
                <h3 className="text-lg font-semibold text-fg">AI generates answer</h3>
              </div>
              <p className="text-mute text-sm">
                Results are formatted into a natural language answer with tables, charts, or summaries
              </p>
            </div>
          </div>
        </section>

        {/* Example Queries */}
        <section className="mb-12">
          <h2 className="text-3xl font-semibold text-fg mb-6">Example Queries</h2>

          <div className="space-y-4">
            <QueryExample
              category="Product Discovery"
              queries={[
                "What are my top 10 most expensive products?",
                "Show me all products with prices under $20",
                "List SKUs that haven't changed price in 30 days",
                "Which products have the most variants?"
              ]}
            />

            <QueryExample
              category="Price Analysis"
              queries={[
                "What's the average price of my catalog?",
                "Show me products with prices above $100",
                "Which SKUs have the highest profit margins?",
                "What's the price range for my summer collection?"
              ]}
            />

            <QueryExample
              category="Price Changes"
              queries={[
                "Why was SKU-123 price changed?",
                "Show me all pending price changes",
                "What price changes were applied today?",
                "Which products have the most price change history?"
              ]}
            />

            <QueryExample
              category="Trends & Insights"
              queries={[
                "What's my average price increase this month?",
                "Show me products with frequent price changes",
                "Which categories have the most pricing activity?",
                "What's the pricing trend for product XYZ?"
              ]}
            />
          </div>
        </section>

        {/* Response Components */}
        <section className="mb-12">
          <h2 className="text-3xl font-semibold text-fg mb-6">Understanding Responses</h2>

          <p className="text-fg mb-6">Each AI Assistant response includes several components:</p>

          <div className="space-y-4">
            <ResponseCard
              title="Natural Language Answer"
              description="Human-readable summary of the results"
              example="You have 15 products priced over $100, with an average price of $149.99"
            />

            <ResponseCard
              title="Data Results"
              description="Structured data table or chart showing the query results"
              example="Table with columns: Product, SKU, Price, Currency"
            />

            <ResponseCard
              title="Generated SQL Query"
              description="The actual SQL that was executed (for transparency)"
              example="SELECT * FROM products WHERE price > 10000 ORDER BY price DESC LIMIT 10"
            />

            <ResponseCard
              title="Follow-up Suggestions"
              description="Related questions you can ask to dive deeper"
              example="'Show me price history for these products' or 'What's the average discount?'"
            />
          </div>
        </section>

        {/* Suggested Questions */}
        <section className="mb-12">
          <h2 className="text-3xl font-semibold text-fg mb-6">Suggested Questions</h2>

          <div className="bg-surface border border-border rounded-xl p-6">
            <p className="text-fg mb-4">
              When you first open the AI Assistant, you'll see suggested questions to get started.
              These are curated queries that demonstrate the assistant's capabilities:
            </p>
            <ul className="space-y-2 text-fg">
              <li className="flex items-start gap-2">
                <span className="text-brand">•</span>
                "What are my most expensive products?"
              </li>
              <li className="flex items-start gap-2">
                <span className="text-brand">•</span>
                "Show me all pending price changes"
              </li>
              <li className="flex items-start gap-2">
                <span className="text-brand">•</span>
                "Why was this price changed?"
              </li>
              <li className="flex items-start gap-2">
                <span className="text-brand">•</span>
                "What's my average product price?"
              </li>
            </ul>
            <div className="mt-4 bg-bg border border-border p-3 rounded-lg">
              <p className="text-mute text-sm">
                💡 <strong className="text-fg">Tip:</strong> Click on any suggested question to see how the AI responds,
                then modify it for your specific needs.
              </p>
            </div>
          </div>
        </section>

        {/* Conversation History */}
        <section className="mb-12">
          <h2 className="text-3xl font-semibold text-fg mb-6">Conversation History</h2>

          <div className="bg-surface border border-border rounded-xl p-6">
            <p className="text-fg mb-4">
              The AI Assistant maintains a conversation history during your session:
            </p>
            <ul className="space-y-2 text-fg">
              <li className="flex items-start gap-2">
                <span className="text-brand">•</span>
                <strong>Context Aware:</strong> Ask follow-up questions that reference previous queries
              </li>
              <li className="flex items-start gap-2">
                <span className="text-brand">•</span>
                <strong>Scroll Through History:</strong> Review past questions and answers
              </li>
              <li className="flex items-start gap-2">
                <span className="text-brand">•</span>
                <strong>Session-Based:</strong> History clears when you leave the page
              </li>
              <li className="flex items-start gap-2">
                <span className="text-brand">•</span>
                <strong>Refinement:</strong> Iteratively refine queries based on results
              </li>
            </ul>
          </div>
        </section>

        {/* Query Types */}
        <section className="mb-12">
          <h2 className="text-3xl font-semibold text-fg mb-6">Types of Queries</h2>

          <div className="grid md:grid-cols-2 gap-4">
            <QueryTypeCard
              title="AI-Powered Queries"
              icon="🤖"
              description="Complex natural language questions that require AI understanding"
              examples={[
                "Why did prices increase?",
                "What's the impact of my summer sale?",
                "Recommend price adjustments"
              ]}
            />

            <QueryTypeCard
              title="Pattern-Based Queries"
              icon="📋"
              description="Simple lookups that match common patterns"
              examples={[
                "Show product ABC",
                "List all SKUs",
                "Get price for XYZ"
              ]}
            />
          </div>

          <div className="mt-4 bg-bg border border-border rounded-xl p-4">
            <p className="text-fg text-sm">
              <strong>Note:</strong> Pattern-based queries are faster but less flexible.
              AI-powered queries can understand more complex requests and context.
            </p>
          </div>
        </section>

        {/* Best Practices */}
        <section className="mb-12">
          <h2 className="text-3xl font-semibold text-fg mb-6">Best Practices</h2>

          <div className="space-y-4">
            <BestPractice
              title="Be Specific"
              tip="Include details like SKU codes, price ranges, or time periods for better results."
            />
            <BestPractice
              title="Start Simple"
              tip="Begin with straightforward questions, then refine based on the results."
            />
            <BestPractice
              title="Use Follow-ups"
              tip="Click on suggested follow-up questions to explore related data."
            />
            <BestPractice
              title="Review the SQL"
              tip="Check the generated SQL query to understand what data was retrieved."
            />
            <BestPractice
              title="Iterate"
              tip="If the first answer isn't quite right, rephrase your question or ask for clarification."
            />
          </div>
        </section>

        {/* Limitations */}
        <section className="mb-12">
          <h2 className="text-3xl font-semibold text-fg mb-6">Current Limitations</h2>

          <div className="bg-surface border border-border rounded-xl p-6">
            <ul className="space-y-3 text-fg">
              <li className="flex items-start gap-2">
                <span className="text-yellow-500">⚠️</span>
                <div>
                  <strong>Read-Only:</strong> The assistant can query data but cannot create price changes or modify settings
                </div>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-yellow-500">⚠️</span>
                <div>
                  <strong>Session History:</strong> Conversation history doesn't persist across sessions
                </div>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-yellow-500">⚠️</span>
                <div>
                  <strong>Data Scope:</strong> Can only access data for the current project
                </div>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-yellow-500">⚠️</span>
                <div>
                  <strong>Real-time Only:</strong> Responses are based on current database state
                </div>
              </li>
            </ul>
          </div>
        </section>

        {/* API Reference */}
        <section className="mb-12">
          <h2 className="text-3xl font-semibold text-fg mb-6">API Reference</h2>

          <div className="bg-brand/5 border border-brand/20 rounded-xl p-6 mb-6">
            <p className="text-fg text-sm">
              The AI Assistant API allows you to submit natural language queries programmatically and receive structured responses. All endpoints require authentication via Bearer token.
            </p>
          </div>

          <div className="space-y-4">
            <div className="bg-surface border border-border rounded-xl p-6">
              <div className="font-mono text-brand text-sm mb-3">POST /api/v1/assistant/query</div>
              <p className="text-fg mb-4">Submit a natural language query to the AI Assistant</p>
              <div className="bg-bg border border-border p-4 rounded-lg mb-4">
                <div className="text-xs font-semibold text-mute mb-2">REQUEST BODY:</div>
                <pre className="text-sm text-fg font-mono overflow-x-auto">{`{
  "query": "What are my most expensive products?",
  "projectSlug": "demo"
}`}</pre>
              </div>
              <div className="bg-bg border border-border p-4 rounded-lg">
                <div className="text-xs font-semibold text-mute mb-2">RESPONSE:</div>
                <pre className="text-xs text-fg font-mono overflow-x-auto">{`{
  "answer": "Your top 3 most expensive products are...",
  "data": [
    {
      "productCode": "PROD-001",
      "name": "Premium Widget",
      "price": 19999  // in cents ($199.99)
    }
  ],
  "sql": "SELECT * FROM products ORDER BY price DESC LIMIT 10",
  "suggestions": [
    "Show me price history for these products",
    "What's the average price across all products?"
  ]
}`}</pre>
              </div>
            </div>

            <div className="bg-surface border border-border rounded-xl p-6">
              <h3 className="text-lg font-semibold text-fg mb-3">Usage Notes</h3>
              <ul className="space-y-2 text-fg text-sm">
                <li className="flex items-start gap-2">
                  <span className="text-brand">•</span>
                  Queries should be natural language questions about your pricing data
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-brand">•</span>
                  Responses include the natural language answer, structured data, and generated SQL
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-brand">•</span>
                  The API is read-only and cannot modify data or create price changes
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-brand">•</span>
                  Rate limits apply: 20 queries per minute per user
                </li>
              </ul>
            </div>
          </div>
        </section>

        {/* Related Docs */}
        <section className="mb-12">
          <h2 className="text-3xl font-semibold text-fg mb-6">Related Documentation</h2>
          <div className="grid md:grid-cols-2 gap-4">
            <RelatedLink
              href="/console/catalog"
              title="Product Catalog"
              description="Browse products that you can query"
            />
            <RelatedLink
              href="/console/price-changes"
              title="Price Changes"
              description="Query price change history and status"
            />
            <RelatedLink
              href="/console/analytics"
              title="Analytics"
              description="View pre-built pricing insights"
            />
            <RelatedLink
              href="/console/best-practices"
              title="Best Practices"
              description="Tips for effective pricing management"
            />
          </div>
        </section>
      </div>
    </div>
  )
}

// Helper components
function QueryExample({ category, queries }: { category: string; queries: string[] }) {
  return (
    <div className="bg-surface border border-border rounded-xl p-6">
      <h3 className="text-lg font-semibold text-fg mb-3">{category}</h3>
      <ul className="space-y-2">
        {queries.map((query: string, i: number) => (
          <li key={i} className="flex items-start gap-2 text-mute text-sm">
            <span className="text-brand shrink-0">→</span>
            <span className="font-mono">{query}</span>
          </li>
        ))}
      </ul>
    </div>
  )
}

function ResponseCard({ title, description, example }: { title: string; description: string; example: string }) {
  return (
    <div className="bg-surface border border-border rounded-xl p-6">
      <h3 className="text-lg font-semibold text-fg mb-2">{title}</h3>
      <p className="text-mute text-sm mb-3">{description}</p>
      <div className="bg-bg border border-border p-3 rounded-lg">
        <div className="text-xs font-semibold text-mute mb-1">EXAMPLE:</div>
        <div className="text-sm text-fg font-mono">{example}</div>
      </div>
    </div>
  )
}

function QueryTypeCard({ title, icon, description, examples }: { title: string; icon: string; description: string; examples: string[] }) {
  return (
    <div className="bg-surface border border-border rounded-xl p-6">
      <div className="flex items-center gap-2 mb-3">
        <span className="text-2xl">{icon}</span>
        <h3 className="text-lg font-semibold text-fg">{title}</h3>
      </div>
      <p className="text-mute text-sm mb-3">{description}</p>
      <div className="text-xs font-semibold text-fg mb-2">Examples:</div>
      <ul className="space-y-1">
        {examples.map((ex: string, i: number) => (
          <li key={i} className="text-sm text-mute font-mono">• {ex}</li>
        ))}
      </ul>
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
