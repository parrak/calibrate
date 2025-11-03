export { evaluatePolicy, type PolicyEval } from './evaluatePolicy'
export { applyPriceChange } from './applyPriceChange'
export * from './competitorRules'

// Export AI engine integration
export { suggestPrice } from '@calibr/ai-engine'
export type {
  PriceSuggestionInput,
  PriceSuggestion,
  AIEngineConfig,
} from '@calibr/ai-engine'
