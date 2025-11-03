'use client'

import { useState } from 'react'
import { AIPriceSuggest } from '@/components/AIPriceSuggest'
import type { PriceSuggestion } from '@calibr/ai-engine'

interface PriceChangeActionsProps {
  sku: string
  currentPrice: number
  currency: string
  cost?: number
  onCreatePriceChange?: (newPrice: number, rationale: string) => void
}

export function PriceChangeActions({
  sku,
  currentPrice,
  currency,
  cost,
  onCreatePriceChange,
}: PriceChangeActionsProps) {
  const [showAISuggest, setShowAISuggest] = useState(false)

  function handleApplySuggestion(suggestion: PriceSuggestion) {
    if (onCreatePriceChange) {
      onCreatePriceChange(suggestion.suggestedPrice, suggestion.rationale)
    }
    setShowAISuggest(false)
  }

  return (
    <div className="space-y-4">
      {!showAISuggest && (
        <button
          onClick={() => setShowAISuggest(true)}
          className="w-full px-4 py-3 bg-gradient-to-r from-purple-600 to-blue-600 text-white rounded-lg hover:from-purple-700 hover:to-blue-700 flex items-center justify-center gap-2 font-medium"
        >
          <span className="text-xl">✨</span>
          <span>Get AI Price Suggestion</span>
        </button>
      )}

      {showAISuggest && (
        <div className="mt-4">
          <AIPriceSuggest
            sku={sku}
            currentPrice={currentPrice}
            currency={currency}
            cost={cost}
            onApply={handleApplySuggestion}
          />
        </div>
      )}
    </div>
  )
}
