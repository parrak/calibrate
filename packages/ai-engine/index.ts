/**
 * @calibr/ai-engine
 *
 * AI-powered pricing suggestions for commerce platforms
 */

export { suggestPrice } from './suggestPrice'
export { explainSuggestion } from './explainer'
export type {
  PriceSuggestionInput,
  PriceSuggestion,
  AIEngineConfig,
  PriceReasoning,
  PriceHistoryPoint,
  CompetitorPrice,
  SalesVelocity,
} from './types'
export type { EnhancedExplanation, ExplanationFactor } from './explainer'
