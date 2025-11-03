/**
 * AI Pricing Engine - Core Suggestion Algorithm
 *
 * Uses heuristic analysis combining:
 * - Competitor pricing positioning
 * - Sales velocity trends
 * - Historical performance
 * - Margin protection
 */

import type {
  PriceSuggestionInput,
  PriceSuggestion,
  AIEngineConfig,
  PriceReasoning,
} from './types'

const DEFAULT_CONFIG: Required<AIEngineConfig> = {
  minConfidence: 0.6,
  maxChangePercent: 15,
  minMarginPercent: 20,
  useCompetitorData: true,
  useSalesVelocity: true,
  customWeights: {
    competitorInfluence: 0.4,
    salesVelocityInfluence: 0.35,
    historicalInfluence: 0.25,
  },
}

/**
 * Generate AI-powered price suggestion
 */
export function suggestPrice(
  input: PriceSuggestionInput,
  config: AIEngineConfig = {}
): PriceSuggestion {
  const cfg = { ...DEFAULT_CONFIG, ...config }
  const weights = { ...DEFAULT_CONFIG.customWeights, ...config.customWeights }

  // Analyze each factor
  const competitorAnalysis = analyzeCompetitorPosition(input)
  const salesAnalysis = analyzeSalesVelocity(input)
  const marginAnalysis = analyzeMargin(input, cfg)

  // Calculate weighted delta
  let totalDelta = 0
  let totalWeight = 0
  const factors: string[] = []

  // Competitor-based adjustment
  if (cfg.useCompetitorData && competitorAnalysis.delta !== 0) {
    totalDelta += competitorAnalysis.delta * weights.competitorInfluence!
    totalWeight += weights.competitorInfluence!
    factors.push(competitorAnalysis.factor)
  }

  // Sales velocity adjustment
  if (cfg.useSalesVelocity && salesAnalysis.delta !== 0) {
    totalDelta += salesAnalysis.delta * weights.salesVelocityInfluence!
    totalWeight += weights.salesVelocityInfluence!
    factors.push(salesAnalysis.factor)
  }

  // Historical performance (if available)
  if (input.priceHistory && input.priceHistory.length > 0) {
    const historicalDelta = analyzeHistoricalPerformance(input)
    totalDelta += historicalDelta * weights.historicalInfluence!
    totalWeight += weights.historicalInfluence!
    if (historicalDelta !== 0) {
      factors.push('Historical performance analysis')
    }
  }

  // Normalize delta if we have weights
  const rawDelta = totalWeight > 0 ? totalDelta / totalWeight : 0

  // Apply constraints
  const maxDelta = (input.currentPrice * cfg.maxChangePercent) / 100
  const constrainedDelta = Math.max(-maxDelta, Math.min(maxDelta, rawDelta))

  // Round to nearest cent
  const finalDelta = Math.round(constrainedDelta)
  const suggestedPrice = input.currentPrice + finalDelta

  // Ensure minimum margin if cost is provided
  let adjustedPrice = suggestedPrice
  if (input.cost && cfg.minMarginPercent > 0) {
    const minPrice = input.cost * (1 + cfg.minMarginPercent / 100)
    adjustedPrice = Math.max(suggestedPrice, Math.ceil(minPrice))
  }

  // Calculate confidence
  const confidence = calculateConfidence(input, factors.length, cfg)

  // Build reasoning
  const reasoning: PriceReasoning = {
    marketPosition: competitorAnalysis.marketPosition,
    salesPerformance: salesAnalysis.performance,
    marginAnalysis: {
      currentMargin: input.cost
        ? ((input.currentPrice - input.cost) / input.cost) * 100
        : undefined,
      suggestedMargin: input.cost
        ? ((adjustedPrice - input.cost) / input.cost) * 100
        : undefined,
      maintainsMinMargin: input.cost
        ? (adjustedPrice - input.cost) / input.cost >= cfg.minMarginPercent / 100
        : true,
    },
    factors,
    weights: totalWeight > 0 ? weights : undefined,
  }

  // Generate rationale
  const rationale = generateRationale(
    finalDelta,
    adjustedPrice,
    input.currentPrice,
    reasoning
  )

  return {
    delta: adjustedPrice - input.currentPrice,
    suggestedPrice: adjustedPrice,
    confidence,
    rationale,
    reasoning,
    generatedAt: new Date(),
  }
}

/**
 * Analyze competitive positioning
 */
function analyzeCompetitorPosition(input: PriceSuggestionInput): {
  delta: number
  factor: string
  marketPosition?: any
} {
  if (!input.competitorPrices || input.competitorPrices.length === 0) {
    return { delta: 0, factor: '' }
  }

  const prices = input.competitorPrices.map((c) => c.price)
  const avgPrice = prices.reduce((a, b) => a + b, 0) / prices.length
  const minPrice = Math.min(...prices)
  const maxPrice = Math.max(...prices)

  const currentPrice = input.currentPrice
  const belowAverage = currentPrice < avgPrice

  // Calculate percentile position
  const sortedPrices = [...prices, currentPrice].sort((a, b) => a - b)
  const position = sortedPrices.indexOf(currentPrice)
  const percentile = (position / (sortedPrices.length - 1)) * 100

  let delta = 0
  let factor = ''

  // Strategy: Price slightly below average for competitiveness
  const targetPrice = avgPrice * 0.97 // 3% below average

  if (currentPrice > avgPrice * 1.1) {
    // Too expensive - suggest decrease
    delta = targetPrice - currentPrice
    factor = `Price ${Math.round(percentile)}% above market - suggest decrease`
  } else if (currentPrice < minPrice * 0.9) {
    // Pricing too low - suggest increase
    delta = minPrice - currentPrice
    factor = `Price significantly below market - suggest increase`
  } else if (belowAverage && percentile < 40) {
    // Good competitive position - minor increase
    delta = (avgPrice - currentPrice) * 0.3
    factor = `Strong competitive position - slight increase possible`
  }

  return {
    delta,
    factor,
    marketPosition: {
      percentile: Math.round(percentile),
      belowAverage,
      lowestPrice: minPrice,
      highestPrice: maxPrice,
      averagePrice: Math.round(avgPrice),
    },
  }
}

/**
 * Analyze sales velocity and trends
 */
function analyzeSalesVelocity(input: PriceSuggestionInput): {
  delta: number
  factor: string
  performance?: any
} {
  if (!input.salesVelocity) {
    return { delta: 0, factor: '' }
  }

  const { last7Days, last30Days, averageDailySales, trend } = input.salesVelocity

  // Classify velocity
  let velocity: 'high' | 'medium' | 'low' = 'medium'
  if (averageDailySales > 10) velocity = 'high'
  else if (averageDailySales < 2) velocity = 'low'

  let delta = 0
  let message = ''

  // High velocity + increasing trend = price increase opportunity
  if (velocity === 'high' && trend === 'increasing') {
    delta = input.currentPrice * 0.05 // 5% increase
    message = 'High demand detected - price increase recommended'
  }
  // Low velocity + decreasing trend = price decrease to stimulate
  else if (velocity === 'low' && trend === 'decreasing') {
    delta = input.currentPrice * -0.08 // 8% decrease
    message = 'Low demand - price decrease may stimulate sales'
  }
  // Stable sales = minor optimization
  else if (trend === 'stable' && velocity === 'medium') {
    delta = input.currentPrice * 0.02 // 2% increase
    message = 'Stable performance - minor optimization'
  }

  return {
    delta,
    factor: message,
    performance: {
      velocity,
      trend: trend || 'stable',
      message,
    },
  }
}

/**
 * Analyze historical price performance
 */
function analyzeHistoricalPerformance(input: PriceSuggestionInput): number {
  if (!input.priceHistory || input.priceHistory.length < 2) {
    return 0
  }

  // Find best performing price point
  const performanceByPrice = input.priceHistory
    .filter((p) => p.unitsSold && p.unitsSold > 0)
    .map((point) => ({
      price: point.price,
      revenue: point.revenue || point.price * (point.unitsSold || 0),
      units: point.unitsSold || 0,
    }))

  if (performanceByPrice.length === 0) return 0

  // Find price with highest revenue
  const bestPerformer = performanceByPrice.reduce((best, current) =>
    current.revenue > best.revenue ? current : best
  )

  // Suggest moving toward best historical price
  const deltaToBest = bestPerformer.price - input.currentPrice
  return deltaToBest * 0.4 // Conservative 40% move toward best
}

/**
 * Analyze margin constraints
 */
function analyzeMargin(
  input: PriceSuggestionInput,
  config: Required<AIEngineConfig>
): any {
  if (!input.cost) return {}

  const currentMargin = ((input.currentPrice - input.cost) / input.cost) * 100
  const minMargin = config.minMarginPercent

  return {
    currentMargin,
    meetsMinimum: currentMargin >= minMargin,
  }
}

/**
 * Calculate confidence score
 */
function calculateConfidence(
  input: PriceSuggestionInput,
  factorsCount: number,
  config: Required<AIEngineConfig>
): number {
  let confidence = 0.5 // Base confidence

  // More data = higher confidence
  if (input.competitorPrices && input.competitorPrices.length >= 3) {
    confidence += 0.15
  }
  if (input.salesVelocity) {
    confidence += 0.15
  }
  if (input.priceHistory && input.priceHistory.length >= 5) {
    confidence += 0.1
  }
  if (input.cost) {
    confidence += 0.1
  }

  // Multiple factors = higher confidence
  confidence += factorsCount * 0.05

  // Cap at 0.95
  return Math.min(0.95, confidence)
}

/**
 * Generate human-readable rationale
 */
function generateRationale(
  delta: number,
  suggestedPrice: number,
  currentPrice: number,
  reasoning: PriceReasoning
): string {
  if (delta === 0) {
    return 'Current price is optimal based on available data.'
  }

  const changePercent = Math.abs((delta / currentPrice) * 100).toFixed(1)
  const direction = delta > 0 ? 'increase' : 'decrease'
  const action = delta > 0 ? 'raising' : 'lowering'

  let rationale = `Recommend ${direction} of ${changePercent}% (${Math.abs(
    delta
  )}¢) based on `

  const reasons: string[] = []

  if (reasoning.marketPosition) {
    const { percentile, belowAverage } = reasoning.marketPosition
    if (belowAverage) {
      reasons.push(`competitive positioning (${percentile}th percentile)`)
    } else {
      reasons.push(`market analysis showing price above average`)
    }
  }

  if (reasoning.salesPerformance) {
    reasons.push(`${reasoning.salesPerformance.velocity} sales velocity`)
  }

  if (reasoning.factors.length > 0) {
    rationale += reasons.slice(0, 2).join(' and ')
  }

  rationale += `. ${action.charAt(0).toUpperCase() + action.slice(1)} price`

  if (delta > 0) {
    rationale += ' may increase revenue without significantly impacting demand.'
  } else {
    rationale += ' may stimulate demand and improve competitive position.'
  }

  return rationale
}
