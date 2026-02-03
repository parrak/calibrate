'use client'

/**
 * Copilot Drawer Component — M1.4
 *
 * A slide-out drawer for asking pricing questions via natural language
 * Integrates with /api/v1/copilot endpoint
 */

import { useState, useRef, useEffect } from 'react'
import { useSession } from 'next-auth/react'

interface Message {
  id: string
  type: 'user' | 'assistant' | 'system'
  content: string
  data?: unknown
  sql?: string
  method?: 'ai' | 'pattern'
  suggestions?: string[]
  timestamp: Date
}

interface CopilotDrawerProps {
  isOpen: boolean
  onClose: () => void
  projectSlug: string
  apiBase?: string
}

const SUGGESTED_QUERIES = [
  'Why was this price changed?',
  'What if I increase prices by 10%?',
  'Show me products with low margins',
  'How many price changes were made last week?',
  'Which products have the highest margins?',
  "What's my average price change percentage?",
  'Show me price changes from the last 30 days',
  'Analyze margin trends for active products',
]

interface PricingRule {
  name: string
  description?: string
  selector: {
    operator: 'AND' | 'OR'
    predicates: Array<{ type: string;[key: string]: unknown }>
  }
  transform: {
    transform: { type: string; value: number }
    constraints?: { floor?: number; ceiling?: number; maxPctDelta?: number }
  }
}

interface SimulationData {
  type: 'simulation'
  answer: string
  rule: PricingRule
  summary: {
    total: number
    matched: number
    wouldChange: number
    totalDelta: number
  }
  results: unknown[]
  confidence?: number
}

export function CopilotDrawer({ isOpen, onClose, projectSlug, apiBase }: CopilotDrawerProps) {
  const { data: session } = useSession()
  const userId = (session as { user?: { id?: string } })?.user?.id
  const token = (session as { apiToken?: string })?.apiToken

  const [messages, setMessages] = useState<Message[]>([])
  const [query, setQuery] = useState('')
  const [loading, setLoading] = useState(false)
  const messagesEndRef = useRef<HTMLDivElement>(null)

  const API_BASE = apiBase || process.env.NEXT_PUBLIC_API_BASE || 'https://api.calibr.lat'

  const [simulationData, setSimulationData] = useState<SimulationData | null>(null)
  const [actionLoading, setActionLoading] = useState<'save' | 'apply' | null>(null)

  // Auto-scroll to bottom when new messages arrive
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  const sendQuery = async (queryText: string) => {
    if (!queryText.trim() || !token) return

    const userMessage: Message = {
      id: `user-${Date.now()}`,
      type: 'user',
      content: queryText,
      timestamp: new Date(),
    }

    setMessages((prev) => [...prev, userMessage])
    setQuery('')
    setLoading(true)
    setSimulationData(null) // Reset simulation data on new query

    try {
      const res = await fetch(`${API_BASE}/api/v1/copilot`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          projectSlug,
          query: queryText,
          userId,
        }),
      })

      const response = await res.json()

      if (!res.ok) {
        throw new Error(response.error || response.message || 'Failed to process query')
      }

      // Handle Simulation Response
      if (response.type === 'simulation') {
        setSimulationData(response)
      }

      const assistantMessage: Message = {
        id: `assistant-${Date.now()}`,
        type: 'assistant',
        content: response.answer,
        data: response.data,
        sql: response.sql,
        method: response.method,
        suggestions: response.suggestions,
        timestamp: new Date(),
      }

      setMessages((prev) => [...prev, assistantMessage])
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to process query'

      const errorMsg: Message = {
        id: `error-${Date.now()}`,
        type: 'system',
        content: `Error: ${errorMessage}`,
        timestamp: new Date(),
      }

      setMessages((prev) => [...prev, errorMsg])
    } finally {
      setLoading(false)
    }
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    sendQuery(query)
  }

  const handleSuggestionClick = (suggestion: string) => {
    sendQuery(suggestion)
  }

  const handleClear = () => {
    setMessages([])
    setQuery('')
    setSimulationData(null)
  }

  const handleApplyAsRule = async () => {
    if (!simulationData?.rule) return

    const userQuery = messages[messages.length - 2]?.content || 'Copilot suggestion'

    try {
      setLoading(true)
      setActionLoading('save')

      // Use M1.8 propose endpoint to persist rule + preview run
      const res = await fetch(`${API_BASE}/api/v1/copilot/propose`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          projectSlug,
          query: userQuery,
          userId,
          rule: simulationData.rule,
          explanation: simulationData.answer,
          confidence: simulationData.confidence,
          metadata: {
            source: 'copilot_drawer',
            confidence: simulationData.confidence,
          },
        }),
      })

      if (!res.ok) {
        const error = await res.json()
        throw new Error(error.message || 'Failed to propose rule')
      }

      const { rule } = await res.json()

      // Redirect to rule builder (Open in Rule Builder handoff)
      window.location.href = `/p/${projectSlug}/rules?edit=${rule.id}`
    } catch (error) {
      console.error('Failed to propose rule:', error)

      const errorMsg: Message = {
        id: `error-${Date.now()}`,
        type: 'system',
        content: `Error: ${error instanceof Error ? error.message : 'Failed to save proposed rule'}`,
        timestamp: new Date(),
      }
      setMessages((prev) => [...prev, errorMsg])
    } finally {
      setLoading(false)
      setActionLoading(null)
    }
  }

  const handleApplyOnce = async () => {
    if (!simulationData?.rule || !token) return

    const userQuery = messages[messages.length - 2]?.content || 'Copilot suggestion'
    const confirmApply = window.confirm('Apply this rule now? This will queue a run in Automation.')
    if (!confirmApply) return

    try {
      setLoading(true)
      setActionLoading('apply')

      const res = await fetch(`${API_BASE}/api/v1/copilot/propose`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          projectSlug,
          query: userQuery,
          userId,
          rule: simulationData.rule,
          explanation: simulationData.answer,
          confidence: simulationData.confidence,
          metadata: {
            source: 'copilot_drawer_apply',
            confidence: simulationData.confidence,
          },
        }),
      })

      if (!res.ok) {
        const error = await res.json()
        throw new Error(error.message || 'Failed to propose rule')
      }

      const proposed = await res.json()
      const runId = proposed.previewRun?.id
      if (!runId) {
        throw new Error('Preview run missing from proposal response')
      }

      const applyRes = await fetch(
        `${API_BASE}/api/v1/runs/${runId}/apply?project=${projectSlug}`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${token}`,
          },
        }
      )

      if (!applyRes.ok) {
        const error = await applyRes.json().catch(() => ({}))
        throw new Error(error.message || 'Failed to queue run')
      }

      const systemMsg: Message = {
        id: `system-${Date.now()}`,
        type: 'system',
        content: `Queued run ${runId.slice(0, 8)} for application. Redirecting to Automation Runs...`,
        timestamp: new Date(),
      }
      setMessages((prev) => [...prev, systemMsg])

      window.location.href = `/p/${projectSlug}/automation/runs`
    } catch (error) {
      console.error('Failed to apply rule:', error)

      const errorMsg: Message = {
        id: `error-${Date.now()}`,
        type: 'system',
        content: `Error: ${error instanceof Error ? error.message : 'Failed to apply rule'}`,
        timestamp: new Date(),
      }
      setMessages((prev) => [...prev, errorMsg])
    } finally {
      setLoading(false)
      setActionLoading(null)
    }
  }

  if (!isOpen) return null

  const isSimulationMode = !!simulationData

  return (
    <>
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-gray-900/20 backdrop-blur-sm z-40 transition-opacity"
        onClick={onClose}
        aria-hidden="true"
      />

      {/* Drawer */}
      <div
        className={`fixed top-0 right-0 h-full bg-surface border-l border-border z-50 shadow-2xl flex transition-all duration-300 ${isSimulationMode ? 'w-[90vw] md:w-[1000px]' : 'w-full md:w-[500px] lg:w-[600px]'
          }`}
      >
        {/* Left Panel: Chat */}
        <div className="flex-1 flex flex-col h-full border-r border-border">
          {/* Header */}
          <div className="flex items-center justify-between px-6 py-4 border-b border-border bg-surface sticky top-0">
            <div>
              <h2 className="text-lg font-semibold text-fg">Ask Copilot</h2>
              <p className="text-sm text-mute">Ask questions about your pricing data</p>
            </div>
            <div className="flex items-center gap-2">
              {messages.length > 0 && (
                <button
                  onClick={handleClear}
                  className="px-3 py-1.5 text-sm rounded-lg bg-muted/20 hover:bg-muted/40 transition text-fg"
                >
                  Clear
                </button>
              )}
              <button
                onClick={onClose}
                className="p-2 rounded-lg hover:bg-muted/20 transition text-fg"
                aria-label="Close drawer"
              >
                <svg
                  className="w-5 h-5"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M6 18L18 6M6 6l12 12"
                  />
                </svg>
              </button>
            </div>
          </div>

          {/* Messages */}
          <div className="flex-1 overflow-y-auto px-6 py-4 space-y-4">
            {messages.length === 0 && (
              <div className="text-center py-12">
                <div className="text-5xl mb-4">🤖</div>
                <p className="text-lg text-fg mb-2">Welcome to Copilot!</p>
                <p className="text-sm text-mute mb-6">
                  I can help you analyze your pricing data in natural language
                </p>

                {/* Suggested Queries */}
                <div className="text-left max-w-md mx-auto">
                  <h3 className="text-sm font-medium text-fg mb-3">Try asking:</h3>
                  <div className="grid gap-2">
                    {SUGGESTED_QUERIES.slice(0, 4).map((suggestion, idx) => (
                      <button
                        key={idx}
                        onClick={() => handleSuggestionClick(suggestion)}
                        disabled={loading || !token}
                        className="text-left text-sm px-4 py-3 rounded-lg border border-border bg-surface hover:bg-muted/10 hover:border-blue-500 transition disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        <span className="text-blue-500 mr-2">💡</span>
                        {suggestion}
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            )}

            {messages.map((message) => (
              <div
                key={message.id}
                className={`flex ${message.type === 'user' ? 'justify-end' : 'justify-start'}`}
              >
                <div
                  className={`max-w-[85%] rounded-lg px-4 py-3 ${message.type === 'user'
                    ? 'bg-blue-600 text-white'
                    : message.type === 'system'
                      ? 'bg-red-500/10 border border-red-500/40 text-red-400'
                      : 'bg-muted/40 text-fg'
                    }`}
                >
                  <div className="text-sm whitespace-pre-wrap">{message.content}</div>

                  {/* Method badge */}
                  {message.method ? (
                    <div className="mt-2 pt-2 border-t border-border/30">
                      <span className="text-xs px-2 py-1 rounded bg-gray-100 text-gray-700">
                        {message.method === 'ai' ? '✨ AI-powered' : '🔍 Pattern-based'}
                      </span>
                    </div>
                  ) : null}

                  {/* Show data if available */}
                  {message.data ? (
                    <div className="mt-3 pt-3 border-t border-border/30">
                      <details className="text-xs">
                        <summary className="cursor-pointer font-medium mb-2">
                          View Data
                        </summary>
                        <pre className="bg-gray-50 border border-gray-200 p-3 rounded overflow-x-auto text-xs font-mono text-gray-800">
                          {JSON.stringify(message.data, null, 2)}
                        </pre>
                      </details>
                    </div>
                  ) : null}
                </div>
              </div>
            ))}

            {loading && (
              <div className="flex justify-start">
                <div className="bg-muted/40 rounded-lg px-4 py-3">
                  <div className="flex items-center space-x-2">
                    <div className="w-2 h-2 bg-blue-500 rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
                    <div className="w-2 h-2 bg-blue-500 rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
                    <div className="w-2 h-2 bg-blue-500 rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
                  </div>
                </div>
              </div>
            )}

            <div ref={messagesEndRef} />
          </div>

          {/* Input Form */}
          <div className="px-6 py-4 border-t border-border bg-surface sticky bottom-0">
            {!token ? (
              <div className="bg-amber-500/10 border border-amber-500/40 rounded-lg px-4 py-3 text-sm text-amber-200 mb-4">
                Please sign in to use Copilot
              </div>
            ) : null}

            <form onSubmit={handleSubmit} className="flex gap-3">
              <input
                type="text"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Ask a question about your pricing..."
                className="flex-1 px-4 py-3 rounded-lg border border-border bg-surface focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/30 text-fg placeholder:text-mute"
                disabled={loading || !token}
              />
              <button
                type="submit"
                disabled={!query.trim() || loading || !token}
                className="px-6 py-3 rounded-lg bg-blue-600 hover:bg-blue-700 disabled:bg-muted disabled:cursor-not-allowed text-white font-medium transition"
              >
                {loading ? 'Thinking...' : 'Ask'}
              </button>
            </form>
          </div>
        </div>

        {/* Right Panel: Simulation */}
        {isSimulationMode && (
          <div className="w-[400px] md:w-[500px] flex flex-col bg-gray-50/50">
            <div className="px-6 py-4 border-b border-border bg-surface">
              <h2 className="text-lg font-semibold text-fg">Simulation Results</h2>
              <p className="text-sm text-mute">Projected impact of proposed changes</p>
            </div>

            <div className="flex-1 overflow-y-auto p-6 space-y-6">
              {/* Impact Cards */}
              <div className="grid grid-cols-2 gap-4">
                <div className="bg-surface p-4 rounded-lg border border-border shadow-sm">
                  <div className="text-sm text-mute mb-1">Matched Products</div>
                  <div className="text-2xl font-bold text-fg">{simulationData.summary.matched}</div>
                </div>
                <div className="bg-surface p-4 rounded-lg border border-border shadow-sm">
                  <div className="text-sm text-mute mb-1">Would Change</div>
                  <div className="text-2xl font-bold text-blue-600">{simulationData.summary.wouldChange}</div>
                </div>
                <div className="bg-surface p-4 rounded-lg border border-border shadow-sm">
                  <div className="text-sm text-mute mb-1">Total Revenue Δ</div>
                  <div className={`text-2xl font-bold ${simulationData.summary.totalDelta >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                    {simulationData.summary.totalDelta >= 0 ? '+' : ''}{simulationData.summary.totalDelta}¢
                  </div>
                </div>
                <div className="bg-surface p-4 rounded-lg border border-border shadow-sm">
                  <div className="text-sm text-mute mb-1">Confidence</div>
                  <div className="text-2xl font-bold text-purple-600">
                    {Math.round((simulationData.confidence || 0.9) * 100)}%
                  </div>
                </div>
              </div>

              {/* Proposed Rule */}
              <div className="bg-surface p-4 rounded-lg border border-border shadow-sm">
                <h3 className="font-medium mb-3">Proposed Rule</h3>
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between py-1 border-b border-border/50">
                    <span className="text-mute">Name</span>
                    <span className="font-medium">{simulationData.rule.name}</span>
                  </div>
                  <div className="flex justify-between py-1 border-b border-border/50">
                    <span className="text-mute">Transform</span>
                    <span className="font-medium">
                      {simulationData.rule.transform.transform.type === 'percentage'
                        ? `${simulationData.rule.transform.transform.value}%`
                        : simulationData.rule.transform.transform.type}
                    </span>
                  </div>
                  <div className="flex justify-between py-1 border-b border-border/50">
                    <span className="text-mute">Selector</span>
                    <span className="font-medium">
                      {simulationData.rule.selector.predicates.length} condition(s)
                    </span>
                  </div>
                </div>
              </div>

              {/* Actions */}
              <div className="space-y-3 pt-4">
                <button
                  onClick={handleApplyAsRule}
                  disabled={loading || !token}
                  className="w-full py-3 px-4 bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400 disabled:cursor-not-allowed text-white rounded-lg font-medium transition flex items-center justify-center gap-2"
                  title="Save proposed rule and open in Rule Builder for review"
                >
                  {actionLoading === 'save' ? (
                    <>
                      <span className="animate-spin">⏳</span> Saving...
                    </>
                  ) : (
                    <>
                      <span>📝</span> Open in Rule Builder
                    </>
                  )}
                </button>
                <button
                  onClick={handleApplyOnce}
                  disabled={loading || !token}
                  className="w-full py-3 px-4 bg-emerald-600 hover:bg-emerald-700 disabled:bg-emerald-300 disabled:cursor-not-allowed text-white rounded-lg font-medium transition flex items-center justify-center gap-2"
                  title="Queue this rule to apply now"
                >
                  {actionLoading === 'apply' ? (
                    <>
                      <span className="animate-spin">⏳</span> Applying...
                    </>
                  ) : (
                    <>
                      <span>⚡</span> Approve & Apply Now
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </>
  )
}
