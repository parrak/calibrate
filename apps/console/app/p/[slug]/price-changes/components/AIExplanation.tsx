'use client'

import { useState } from 'react'
import { Button } from '@/lib/components'

type Props = {
  priceChangeId: string
  skuCode?: string
  fromAmount: number
  toAmount: number
  currency: string
  projectSlug: string
  token?: string
}

const API_BASE = process.env.NEXT_PUBLIC_API_BASE || 'https://api.calibr.lat'

export function AIExplanation({
  skuCode,
  fromAmount,
  toAmount,
  currency,
  projectSlug,
  token,
}: Props) {
  const [loading, setLoading] = useState(false)
  const [explanation, setExplanation] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)

  const getExplanation = async () => {
    if (!token) {
      setError('Please sign in to use AI features')
      return
    }

    setLoading(true)
    setError(null)

    try {
      const delta = toAmount - fromAmount
      const deltaPercent = ((delta / fromAmount) * 100).toFixed(1)
      const direction = delta > 0 ? 'increased' : 'decreased'

      const query = `Why was the price ${direction} by ${Math.abs(
        parseFloat(deltaPercent)
      )}% for ${skuCode || 'this product'}? The price changed from ${(
        fromAmount / 100
      ).toFixed(2)} ${currency} to ${(toAmount / 100).toFixed(2)} ${currency}.`

      const res = await fetch(`${API_BASE}/api/v1/assistant/query`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          projectId: projectSlug,
          query,
        }),
      })

      const response = await res.json()

      if (!res.ok) {
        throw new Error(
          response.error || response.message || 'Failed to get explanation'
        )
      }

      setExplanation(response.answer)
    } catch (err) {
      const errorMessage =
        err instanceof Error ? err.message : 'Failed to get explanation'
      setError(errorMessage)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="rounded-xl border border-border bg-surface p-4">
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <span className="text-sm font-medium">AI Explanation</span>
          <span className="text-xs text-mute">Powered by GPT-4</span>
        </div>
        {!explanation && (
          <Button
            variant="ghost"
            size="sm"
            onClick={getExplanation}
            disabled={loading || !token}
          >
            {loading ? 'Analyzing...' : 'Explain with AI'}
          </Button>
        )}
      </div>

      {explanation && (
        <div className="text-sm text-fg bg-muted/20 rounded-lg p-3">
          {explanation}
        </div>
      )}

      {error && (
        <div className="text-sm text-red-400 bg-red-500/10 rounded-lg p-3">
          {error}
        </div>
      )}

      {!explanation && !error && !loading && (
        <div className="text-sm text-mute">
          Click "Explain with AI" to get intelligent insights about this price
          change based on your historical data, policy checks, and market
          context.
        </div>
      )}
    </div>
  )
}
