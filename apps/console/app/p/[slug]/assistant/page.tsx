'use client'

import { useState } from 'react'
import { useParams } from 'next/navigation'
import { useSession } from 'next-auth/react'
import { Button, useToast } from '@/lib/components'

type QueryResponse = {
  answer: string
  data?: unknown
  sql?: string
  method?: 'ai' | 'pattern'
  suggestions?: string[]
}

type Message = {
  id: string
  type: 'user' | 'assistant'
  content: string
  response?: QueryResponse
  timestamp: Date
}

const API_BASE = process.env.NEXT_PUBLIC_API_BASE || 'https://api.calibr.lat'

const SUGGESTED_QUERIES = [
  "Why was this price changed?",
  "What if I increase prices by 10%?",
  "Show me products with low margins",
  "How many price changes were made last week?",
  "Which products have the highest margins?",
  "What's my average price change percentage?",
]

export default function AssistantPage() {
  const params = useParams()
  const slug = params.slug as string
  const { data: session } = useSession()
  const token = (session as { apiToken?: string })?.apiToken
  const { Toast, setMsg } = useToast()

  const [messages, setMessages] = useState<Message[]>([])
  const [query, setQuery] = useState('')
  const [loading, setLoading] = useState(false)

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
      const res = await fetch(`${API_BASE}/api/v1/assistant/query`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          projectId: slug,
          query: queryText,
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
        response,
        timestamp: new Date(),
      }

      setMessages((prev) => [...prev, assistantMessage])
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to process query'
      setMsg(errorMessage)

      const assistantMessage: Message = {
        id: `assistant-${Date.now()}`,
        type: 'assistant',
        content: `Error: ${errorMessage}`,
        timestamp: new Date(),
      }
      setMessages((prev) => [...prev, assistantMessage])
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

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <header>
        <h1 className="text-2xl font-semibold">AI Pricing Assistant</h1>
        <p className="text-sm text-mute mt-1">
          Ask questions about your pricing data in natural language
        </p>
      </header>

      {/* Messages */}
      <div className="bg-surface border border-border rounded-xl min-h-[400px] max-h-[600px] overflow-y-auto p-4 space-y-4">
        {messages.length === 0 && (
          <div className="text-center text-mute py-12">
            <div className="text-4xl mb-4">💬</div>
            <p className="text-lg mb-2">Ask me anything about your pricing data</p>
            <p className="text-sm">Try one of the suggested questions below to get started</p>
          </div>
        )}

        {messages.map((message) => (
          <div
            key={message.id}
            className={`flex ${message.type === 'user' ? 'justify-end' : 'justify-start'}`}
          >
            <div
              className={`max-w-[80%] rounded-lg px-4 py-3 ${
                message.type === 'user'
                  ? 'bg-blue-600 text-white'
                  : 'bg-muted/40 text-fg'
              }`}
            >
              <div className="text-sm whitespace-pre-wrap">{message.content}</div>

              {/* Show data if available */}
              {message.response?.data ? (
                <div className="mt-3 pt-3 border-t border-border/30">
                  <details className="text-xs">
                    <summary className="cursor-pointer font-medium mb-2">
                      View Data ({message.response.method === 'ai' ? 'AI-powered' : 'Pattern-based'})
                    </summary>
                    <pre className="bg-black/5 dark:bg-white/5 p-2 rounded overflow-x-auto text-fg">
                      {JSON.stringify(message.response.data, null, 2)}
                    </pre>
                  </details>
                </div>
              ) : null}

              {/* Show SQL if available */}
              {message.response?.sql && (
                <div className="mt-2 pt-2 border-t border-border/30">
                  <details className="text-xs">
                    <summary className="cursor-pointer font-medium mb-2">
                      View SQL Query
                    </summary>
                    <pre className="bg-black/5 dark:bg-white/5 p-2 rounded overflow-x-auto font-mono text-xs text-fg">
                      {message.response.sql}
                    </pre>
                  </details>
                </div>
              )}

              {/* Show suggestions */}
              {message.response?.suggestions && message.response.suggestions.length > 0 && (
                <div className="mt-3 pt-3 border-t border-border/30">
                  <div className="text-xs font-medium mb-2">Try asking:</div>
                  <div className="space-y-1">
                    {message.response.suggestions.map((suggestion, idx) => (
                      <button
                        key={idx}
                        onClick={() => handleSuggestionClick(suggestion)}
                        className="block text-xs text-left w-full px-2 py-1 rounded hover:bg-muted/20 transition"
                      >
                        • {suggestion}
                      </button>
                    ))}
                  </div>
                </div>
              )}

              <div className="text-xs opacity-60 mt-2">
                {message.timestamp.toLocaleTimeString()}
              </div>
            </div>
          </div>
        ))}

        {loading && (
          <div className="flex justify-start">
            <div className="bg-muted/40 rounded-lg px-4 py-3 max-w-[80%]">
              <div className="flex items-center space-x-2">
                <div className="w-2 h-2 bg-blue-500 rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
                <div className="w-2 h-2 bg-blue-500 rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
                <div className="w-2 h-2 bg-blue-500 rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Input Form */}
      <form onSubmit={handleSubmit} className="flex gap-3">
        <input
          type="text"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Ask a question about your pricing data..."
          className="flex-1 px-4 py-3 rounded-lg border border-border bg-surface focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/30"
          disabled={loading || !token}
        />
        <Button
          type="submit"
          variant="primary"
          disabled={!query.trim() || loading || !token}
        >
          {loading ? 'Thinking...' : 'Ask'}
        </Button>
      </form>

      {/* Suggested Questions */}
      {messages.length === 0 && (
        <div className="bg-surface border border-border rounded-xl p-4">
          <h3 className="text-sm font-medium mb-3">Suggested Questions</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
            {SUGGESTED_QUERIES.map((suggestion, idx) => (
              <button
                key={idx}
                onClick={() => handleSuggestionClick(suggestion)}
                disabled={loading || !token}
                className="text-left text-sm px-3 py-2 rounded-lg border border-border hover:bg-muted/20 hover:border-blue-500 transition disabled:opacity-50 disabled:cursor-not-allowed"
              >
                💡 {suggestion}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Warning if no token */}
      {!token && (
        <div className="bg-amber-500/10 border border-amber-500/40 rounded-lg px-4 py-3 text-sm text-amber-200">
          Please sign in to use the AI Assistant
        </div>
      )}

      {Toast}
    </div>
  )
}
