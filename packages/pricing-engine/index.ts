export { evaluatePolicy, type PolicyEval } from './evaluatePolicy'
export { applyPriceChange } from './applyPriceChange'
export * from './competitorRules'

// M1.1: Rules DSL and Engine
export * from './rules-dsl'
export { previewRule, simulateRule, type PreviewResult, type PreviewOptions } from './preview'
export { applyRule, type ApplyRuleOptions, type ApplyRuleResult } from './apply-rule'
export {
  applyPriceChangeEnhanced,
  rollbackPriceChangeEnhanced,
  type ApplyPriceChangeOptions,
  type ApplyPriceChangeResult,
} from './apply-price-change-enhanced'

// Export AI engine integration
export { suggestPrice } from '@calibr/ai-engine'
export type {
  PriceSuggestionInput,
  PriceSuggestion,
  AIEngineConfig,
} from '@calibr/ai-engine'
