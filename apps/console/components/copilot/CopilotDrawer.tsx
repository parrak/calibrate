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

export function CopilotDrawer({ isOpen, onClose, projectSlug, apiBase }: CopilotDrawerProps) {
  const { data: session } = useSession()
  const userId = (session as { user?: { id?: string } })?.user?.id
  const token = (session as { apiToken?: string })?.apiToken

  const [messages, setMessages] = useState<Message[]>([])
  const [query, setQuery] = useState('')
  const [loading, setLoading] = useState(false)
  const messagesEndRef = useRef<HTMLDivElement>(null)

  const API_BASE = apiBase || process.env.NEXT_PUBLIC_API_BASE || 'https://api.calibr.lat'

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
  }

  if (!isOpen) return null

  return (
    <>
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-black/50 z-40 transition-opacity"
        onClick={onClose}
        aria-hidden="true"
      />

      {/* Drawer */}
      <div className="fixed top-0 right-0 h-full w-full md:w-[500px] lg:w-[600px] bg-surface border-l border-border z-50 shadow-2xl flex flex-col">
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
                className={`max-w-[85%] rounded-lg px-4 py-3 ${
                  message.type === 'user'
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
                    <span className="text-xs px-2 py-1 rounded bg-black/5 dark:bg-white/5">
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
                      <pre className="bg-black/5 dark:bg-white/5 p-3 rounded overflow-x-auto text-xs font-mono text-fg">
                        {JSON.stringify(message.data, null, 2)}
                      </pre>
                    </details>
                  </div>
                ) : null}

                {/* Show SQL if available */}
                {message.sql ? (
                  <div className="mt-2 pt-2 border-t border-border/30">
                    <details className="text-xs">
                      <summary className="cursor-pointer font-medium mb-2">
                        View SQL Query
                      </summary>
                      <pre className="bg-black/5 dark:bg-white/5 p-3 rounded overflow-x-auto font-mono text-xs text-fg">
                        {message.sql}
                      </pre>
                    </details>
                  </div>
                ) : null}

                {/* Show suggestions */}
                {message.suggestions && message.suggestions.length > 0 ? (
                  <div className="mt-3 pt-3 border-t border-border/30">
                    <div className="text-xs font-medium mb-2">Try asking:</div>
                    <div className="space-y-1">
                      {message.suggestions.slice(0, 3).map((suggestion, idx) => (
                        <button
                          key={idx}
                          onClick={() => handleSuggestionClick(suggestion)}
                          className="block text-xs text-left w-full px-2 py-1.5 rounded hover:bg-muted/20 transition"
                        >
                          • {suggestion}
                        </button>
                      ))}
                    </div>
                  </div>
                ) : null}

                <div className="text-xs opacity-60 mt-2">
                  {message.timestamp.toLocaleTimeString()}
                </div>
              </div>
            </div>
          ))}

          {loading && (
            <div className="flex justify-start">
              <div className="bg-muted/40 rounded-lg px-4 py-3">
                <div className="flex items-center space-x-2">
                  <div
                    className="w-2 h-2 bg-blue-500 rounded-full animate-bounce"
                    style={{ animationDelay: '0ms' }}
                  />
                  <div
                    className="w-2 h-2 bg-blue-500 rounded-full animate-bounce"
                    style={{ animationDelay: '150ms' }}
                  />
                  <div
                    className="w-2 h-2 bg-blue-500 rounded-full animate-bounce"
                    style={{ animationDelay: '300ms' }}
                  />
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
    </>
  )
}
