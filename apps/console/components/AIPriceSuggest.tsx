'use client'

import { useState } from 'react'
import type { PriceSuggestion } from '@calibr/ai-engine'

interface AIPriceSuggestProps {
  sku: string
  currentPrice: number
  currency: string
  cost?: number
  onApply?: (suggestion: PriceSuggestion) => void
}

export function AIPriceSuggest({
  currentPrice,
  currency,
  onApply,
}: AIPriceSuggestProps) {
  const [loading, setLoading] = useState(false)
  const [suggestion, setSuggestion] = useState<PriceSuggestion | null>(null)
  const [error, setError] = useState<string | null>(null)

  async function getSuggestion() {
    setLoading(true)
    setError(null)
    setSuggestion(null)

    try {
      // In production, this would call an API endpoint
      // For now, using mock data
      const mockSuggestion: PriceSuggestion = {
        delta: Math.round(currentPrice * 0.05), // 5% increase
        suggestedPrice: Math.round(currentPrice * 1.05),
        confidence: 0.82,
        rationale:
          'Recommend increase of 5.0% (50¢) based on competitive positioning (60th percentile) and high sales velocity. Raising price may increase revenue without significantly impacting demand.',
        reasoning: {
          marketPosition: {
            percentile: 60,
            belowAverage: true,
            lowestPrice: currentPrice - 100,
            highestPrice: currentPrice + 300,
            averagePrice: currentPrice + 50,
          },
          salesPerformance: {
            velocity: 'high',
            trend: 'increasing',
            message: 'High demand detected - price increase recommended',
          },
          factors: [
            'Strong competitive position - slight increase possible',
            'High demand detected - price increase recommended',
          ],
        },
        generatedAt: new Date(),
      }

      // Simulate API delay
      await new Promise((resolve) => setTimeout(resolve, 1000))

      setSuggestion(mockSuggestion)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to get AI suggestion')
    } finally {
      setLoading(false)
    }
  }

  function handleApply() {
    if (suggestion && onApply) {
      onApply(suggestion)
    }
  }

  return (
    <div className="bg-white rounded-lg border p-4">
      <div className="flex items-center justify-between mb-4">
        <div>
          <h3 className="font-semibold text-lg">AI Price Suggestion</h3>
          <p className="text-sm text-gray-500">
            Get intelligent pricing recommendations
          </p>
        </div>
        {!suggestion && (
          <button
            onClick={getSuggestion}
            disabled={loading}
            className="px-4 py-2 bg-purple-600 text-white rounded hover:bg-purple-700 disabled:bg-gray-400 disabled:cursor-not-allowed flex items-center gap-2"
          >
            {loading ? (
              <>
                <span className="animate-spin">⚙️</span>
                <span>Analyzing...</span>
              </>
            ) : (
              <>
                <span>✨</span>
                <span>Get AI Suggestion</span>
              </>
            )}
          </button>
        )}
      </div>

      {error && (
        <div className="bg-red-50 border border-red-200 rounded p-3 text-red-800 text-sm">
          {error}
        </div>
      )}

      {suggestion && (
        <div className="space-y-4">
          {/* Suggested Price */}
          <div className="bg-purple-50 border border-purple-200 rounded-lg p-4">
            <div className="flex items-center justify-between mb-2">
              <div>
                <div className="text-sm text-gray-600">Suggested Price</div>
                <div className="text-3xl font-bold text-purple-600">
                  {currency === 'USD' ? '$' : ''}
                  {(suggestion.suggestedPrice / 100).toFixed(2)}
                </div>
                <div className="text-sm text-gray-600">
                  {suggestion.delta > 0 ? '+' : ''}
                  {(suggestion.delta / 100).toFixed(2)} (
                  {((suggestion.delta / currentPrice) * 100).toFixed(1)}%)
                </div>
              </div>
              <div className="text-right">
                <div className="text-sm text-gray-600">Confidence</div>
                <div className="text-2xl font-bold">
                  {(suggestion.confidence * 100).toFixed(0)}%
                </div>
                <div className="text-sm">
                  <ConfidenceBadge confidence={suggestion.confidence} />
                </div>
              </div>
            </div>
          </div>

          {/* Rationale */}
          <div>
            <div className="text-sm font-medium text-gray-700 mb-2">
              Reasoning:
            </div>
            <p className="text-sm text-gray-600 bg-gray-50 rounded p-3">
              {suggestion.rationale}
            </p>
          </div>

          {/* Detailed Analysis */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {suggestion.reasoning.marketPosition && (
              <div className="border rounded p-3">
                <div className="text-sm font-medium mb-2">Market Position</div>
                <div className="text-xs text-gray-600 space-y-1">
                  <div>
                    Percentile: {suggestion.reasoning.marketPosition.percentile}
                    th
                  </div>
                  <div>
                    Range: $
                    {(suggestion.reasoning.marketPosition.lowestPrice! / 100).toFixed(
                      2
                    )}{' '}
                    - $
                    {(suggestion.reasoning.marketPosition.highestPrice! / 100).toFixed(
                      2
                    )}
                  </div>
                  <div>
                    Avg: $
                    {(suggestion.reasoning.marketPosition.averagePrice! / 100).toFixed(
                      2
                    )}
                  </div>
                </div>
              </div>
            )}

            {suggestion.reasoning.salesPerformance && (
              <div className="border rounded p-3">
                <div className="text-sm font-medium mb-2">Sales Performance</div>
                <div className="text-xs text-gray-600 space-y-1">
                  <div>
                    Velocity:{' '}
                    <span className="capitalize">
                      {suggestion.reasoning.salesPerformance.velocity}
                    </span>
                  </div>
                  <div>
                    Trend:{' '}
                    <span className="capitalize">
                      {suggestion.reasoning.salesPerformance.trend}
                    </span>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Actions */}
          <div className="flex gap-3 pt-4 border-t">
            <button
              onClick={handleApply}
              className="flex-1 px-4 py-2 bg-purple-600 text-white rounded hover:bg-purple-700"
            >
              Apply Suggestion
            </button>
            <button
              onClick={() => setSuggestion(null)}
              className="px-4 py-2 border rounded hover:bg-gray-50"
            >
              Dismiss
            </button>
          </div>
        </div>
      )}
    </div>
  )
}

function ConfidenceBadge({ confidence }: { confidence: number }) {
  if (confidence >= 0.8) {
    return (
      <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-green-100 text-green-800">
        High
      </span>
    )
  }
  if (confidence >= 0.6) {
    return (
      <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-yellow-100 text-yellow-800">
        Medium
      </span>
    )
  }
  return (
    <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-red-100 text-red-800">
      Low
    </span>
  )
}
