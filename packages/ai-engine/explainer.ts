/**
 * Enhanced AI Rationale Explainer
 *
 * Provides detailed, human-friendly explanations for AI pricing suggestions
 * with improved clarity, visual formatting, and actionable insights
 */

import type { PriceSuggestion, PriceSuggestionInput } from './types'

export interface EnhancedExplanation {
  /** One-line summary for quick understanding */
  summary: string

  /** Detailed explanation with context */
  detailedExplanation: string

  /** Key factors that influenced the decision */
  keyFactors: ExplanationFactor[]

  /** What this means for the business */
  businessImpact: {
    revenueImpact: string
    demandImpact: string
    competitivePosition: string
  }

  /** Step-by-step reasoning chain */
  reasoningSteps: string[]

  /** Visual indicators for quick scanning */
  indicators: {
    priceDirection: 'increase' | 'decrease' | 'maintain'
    confidenceLevel: 'very high' | 'high' | 'moderate' | 'low'
    urgency: 'immediate' | 'recommended' | 'optional'
    riskLevel: 'low' | 'medium' | 'high'
  }

  /** Actionable next steps */
  nextSteps: string[]

  /** Warnings or caveats */
  warnings?: string[]
}

export interface ExplanationFactor {
  /** Factor name */
  name: string

  /** Weight/importance (0-100) */
  weight: number

  /** What this factor indicates */
  description: string

  /** Specific data point */
  dataPoint: string

  /** How this influenced the suggestion */
  influence: 'increase' | 'decrease' | 'neutral'
}

/**
 * Generate enhanced explanation for AI price suggestion
 */
export function explainSuggestion(
  suggestion: PriceSuggestion,
  input: PriceSuggestionInput
): EnhancedExplanation {
  const deltaPercent = Math.abs((suggestion.delta / input.currentPrice) * 100)
  const isIncrease = suggestion.delta > 0
  const direction = isIncrease ? 'increase' : suggestion.delta < 0 ? 'decrease' : 'maintain'

  // Build key factors
  const keyFactors = buildKeyFactors(suggestion, input)

  // Determine confidence level
  const confidenceLevel =
    suggestion.confidence >= 0.8 ? 'very high' :
    suggestion.confidence >= 0.7 ? 'high' :
    suggestion.confidence >= 0.5 ? 'moderate' : 'low'

  // Determine urgency
  const urgency =
    deltaPercent > 10 && suggestion.confidence > 0.75 ? 'immediate' :
    deltaPercent > 5 || suggestion.confidence > 0.65 ? 'recommended' : 'optional'

  // Calculate risk level
  const riskLevel = calculateRiskLevel(suggestion, input)

  // Generate summary
  const summary = generateSummary(suggestion, input, deltaPercent, direction)

  // Generate detailed explanation
  const detailedExplanation = generateDetailedExplanation(suggestion, input, keyFactors)

  // Generate business impact analysis
  const businessImpact = analyzeBusinessImpact(suggestion, input)

  // Build reasoning steps
  const reasoningSteps = buildReasoningSteps(suggestion, input, keyFactors)

  // Generate next steps
  const nextSteps = generateNextSteps(suggestion, input, urgency)

  // Check for warnings
  const warnings = generateWarnings(suggestion, input)

  return {
    summary,
    detailedExplanation,
    keyFactors,
    businessImpact,
    reasoningSteps,
    indicators: {
      priceDirection: direction,
      confidenceLevel,
      urgency,
      riskLevel,
    },
    nextSteps,
    warnings: warnings.length > 0 ? warnings : undefined,
  }
}

/**
 * Build key factors that influenced the suggestion
 */
function buildKeyFactors(
  suggestion: PriceSuggestion,
  input: PriceSuggestionInput
): ExplanationFactor[] {
  const factors: ExplanationFactor[] = []
  const reasoning = suggestion.reasoning

  // Competitor positioning
  if (reasoning.marketPosition) {
    const { percentile, averagePrice, belowAverage } = reasoning.marketPosition
    const influence = percentile > 60 ? 'decrease' : percentile < 40 ? 'increase' : 'neutral'

    factors.push({
      name: 'Market Positioning',
      weight: 40,
      description: `Your price is at the ${percentile}th percentile in the market`,
      dataPoint: `Current: ${formatPrice(input.currentPrice)} vs Market Avg: ${formatPrice(averagePrice || 0)}`,
      influence,
    })
  }

  // Sales velocity
  if (reasoning.salesPerformance) {
    const { velocity, trend, message } = reasoning.salesPerformance
    const influence =
      (velocity === 'high' && trend === 'increasing') ? 'increase' :
      (velocity === 'low' && trend === 'decreasing') ? 'decrease' : 'neutral'

    factors.push({
      name: 'Sales Performance',
      weight: 35,
      description: message,
      dataPoint: `Velocity: ${velocity.toUpperCase()}, Trend: ${trend}`,
      influence,
    })
  }

  // Margin protection
  if (reasoning.marginAnalysis && reasoning.marginAnalysis.currentMargin !== undefined) {
    const { currentMargin, suggestedMargin, maintainsMinMargin } = reasoning.marginAnalysis

    factors.push({
      name: 'Margin Protection',
      weight: 25,
      description: maintainsMinMargin
        ? 'Suggested price maintains healthy margins'
        : 'Margin constraints applied to protect profitability',
      dataPoint: `Current: ${currentMargin.toFixed(1)}% → Suggested: ${suggestedMargin?.toFixed(1)}%`,
      influence: 'neutral',
    })
  }

  return factors
}

/**
 * Calculate risk level for the suggestion
 */
function calculateRiskLevel(
  suggestion: PriceSuggestion,
  input: PriceSuggestionInput
): 'low' | 'medium' | 'high' {
  const deltaPercent = Math.abs((suggestion.delta / input.currentPrice) * 100)
  const hasCompetitorData = input.competitorPrices && input.competitorPrices.length > 0
  const hasSalesData = !!input.salesVelocity

  // High risk: Large change without sufficient data
  if (deltaPercent > 10 && (!hasCompetitorData || !hasSalesData)) {
    return 'high'
  }

  // Medium risk: Moderate change or limited data
  if (deltaPercent > 5 || suggestion.confidence < 0.7) {
    return 'medium'
  }

  // Low risk: Small change with good confidence
  return 'low'
}

/**
 * Generate one-line summary
 */
function generateSummary(
  suggestion: PriceSuggestion,
  input: PriceSuggestionInput,
  deltaPercent: number,
  direction: string
): string {
  if (suggestion.delta === 0) {
    return 'Your current price is well-optimized. No change recommended at this time.'
  }

  const action = direction === 'increase' ? 'Increase' : 'Decrease'
  const confidence = suggestion.confidence >= 0.75 ? 'highly' : 'moderately'

  return `${action} price by ${deltaPercent.toFixed(1)}% to ${formatPrice(suggestion.suggestedPrice)} (${confidence} confident based on market analysis and sales data).`
}

/**
 * Generate detailed explanation
 */
function generateDetailedExplanation(
  suggestion: PriceSuggestion,
  input: PriceSuggestionInput,
  factors: ExplanationFactor[]
): string {
  const parts: string[] = []

  // Opening context
  if (suggestion.delta > 0) {
    parts.push('Our analysis suggests a price increase opportunity.')
  } else if (suggestion.delta < 0) {
    parts.push('Our analysis recommends a price reduction to optimize performance.')
  } else {
    parts.push('Our analysis indicates your current price is well-positioned.')
  }

  // Add factor-specific context
  factors.forEach((factor) => {
    if (factor.influence !== 'neutral') {
      parts.push(`${factor.description} (${factor.dataPoint}).`)
    }
  })

  // Add confidence context
  if (suggestion.confidence >= 0.8) {
    parts.push('We have high confidence in this recommendation based on comprehensive market and sales data.')
  } else if (suggestion.confidence < 0.6) {
    parts.push('This recommendation is based on limited data and should be validated with additional market research.')
  }

  return parts.join(' ')
}

/**
 * Analyze business impact
 */
function analyzeBusinessImpact(
  suggestion: PriceSuggestion,
  input: PriceSuggestionInput
): {
  revenueImpact: string
  demandImpact: string
  competitivePosition: string
} {
  const isIncrease = suggestion.delta > 0
  const deltaPercent = Math.abs((suggestion.delta / input.currentPrice) * 100)

  // Revenue impact
  let revenueImpact = ''
  if (isIncrease) {
    revenueImpact = `Expected revenue increase of ~${deltaPercent.toFixed(1)}% per unit, assuming demand remains stable. `
    if (input.salesVelocity) {
      const estimatedUnits = input.salesVelocity.last30Days
      const estimatedRevenue = (estimatedUnits * suggestion.delta) / 100
      revenueImpact += `Projected monthly impact: +${formatPrice(estimatedRevenue)}.`
    }
  } else {
    revenueImpact = `Lower price per unit, but may increase overall revenue through higher sales volume. Monitor conversion rates closely.`
  }

  // Demand impact
  let demandImpact = ''
  if (isIncrease && deltaPercent > 5) {
    demandImpact = 'Moderate price increase may reduce demand by 2-5%. Recommended to monitor sales velocity for first week.'
  } else if (isIncrease) {
    demandImpact = 'Small price increase unlikely to significantly impact demand, especially if product has strong differentiation.'
  } else {
    demandImpact = 'Price reduction typically stimulates demand. Expected sales increase of 5-15% based on typical price elasticity.'
  }

  // Competitive position
  let competitivePosition = ''
  if (suggestion.reasoning.marketPosition) {
    const { percentile, belowAverage } = suggestion.reasoning.marketPosition
    if (belowAverage) {
      competitivePosition = `Price remains competitive at ${percentile}th percentile. Strong value proposition vs competitors.`
    } else {
      competitivePosition = `Price moves toward market average, improving competitive position without sacrificing margins.`
    }
  } else {
    competitivePosition = 'Competitive impact uncertain due to limited competitor data. Consider monitoring competitor reactions.'
  }

  return {
    revenueImpact,
    demandImpact,
    competitivePosition,
  }
}

/**
 * Build step-by-step reasoning
 */
function buildReasoningSteps(
  suggestion: PriceSuggestion,
  input: PriceSuggestionInput,
  factors: ExplanationFactor[]
): string[] {
  const steps: string[] = []

  steps.push(`Starting price: ${formatPrice(input.currentPrice)}`)

  // Add each factor's contribution
  factors.forEach((factor) => {
    if (factor.influence !== 'neutral') {
      const direction = factor.influence === 'increase' ? '↑' : '↓'
      steps.push(`${direction} ${factor.name}: ${factor.description}`)
    }
  })

  // Margin constraint
  if (input.cost && suggestion.reasoning.marginAnalysis) {
    const minMarginPrice = input.cost * 1.2 // Assume 20% min margin
    if (suggestion.suggestedPrice < minMarginPrice) {
      steps.push(`⚠️ Margin protection applied (minimum ${formatPrice(minMarginPrice)})`)
    }
  }

  steps.push(`Final suggestion: ${formatPrice(suggestion.suggestedPrice)} (${suggestion.delta > 0 ? '+' : ''}${formatPrice(Math.abs(suggestion.delta))})`)

  return steps
}

/**
 * Generate next steps
 */
function generateNextSteps(
  suggestion: PriceSuggestion,
  input: PriceSuggestionInput,
  urgency: string
): string[] {
  const steps: string[] = []

  if (urgency === 'immediate') {
    steps.push('Review this suggestion immediately - significant optimization opportunity identified')
    steps.push('Approve price change to capture market advantage')
  } else if (urgency === 'recommended') {
    steps.push('Review competitor pricing to validate market position')
    steps.push('Consider implementing this change within the next week')
  } else {
    steps.push('Monitor performance with current price for another week')
    steps.push('Re-evaluate if market conditions change')
  }

  // Add monitoring step
  if (suggestion.delta !== 0) {
    steps.push('After applying: Monitor sales velocity and conversion rates for 7-14 days')
  }

  // Add rollback plan for large changes
  if (Math.abs((suggestion.delta / input.currentPrice) * 100) > 8) {
    steps.push('Prepare rollback plan if sales decline by >20% in first week')
  }

  return steps
}

/**
 * Generate warnings
 */
function generateWarnings(
  suggestion: PriceSuggestion,
  input: PriceSuggestionInput
): string[] {
  const warnings: string[] = []
  const deltaPercent = Math.abs((suggestion.delta / input.currentPrice) * 100)

  // Large change warning
  if (deltaPercent > 15) {
    warnings.push('⚠️ Large price change (>15%) - consider implementing gradually to minimize demand shock')
  }

  // Low confidence warning
  if (suggestion.confidence < 0.6) {
    warnings.push('⚠️ Low confidence due to limited data - validate with additional market research')
  }

  // Missing data warnings
  if (!input.competitorPrices || input.competitorPrices.length === 0) {
    warnings.push('ℹ️ No competitor data available - recommendation based on sales performance only')
  }

  if (!input.salesVelocity) {
    warnings.push('ℹ️ No sales data available - unable to assess demand elasticity')
  }

  // Margin warning
  if (input.cost && suggestion.reasoning.marginAnalysis) {
    const suggestedMargin = suggestion.reasoning.marginAnalysis.suggestedMargin || 0
    if (suggestedMargin < 15) {
      warnings.push('⚠️ Low margin (<15%) - ensure cost structure supports this price point')
    }
  }

  return warnings
}

/**
 * Format price for display
 */
function formatPrice(cents: number): string {
  return `$${(cents / 100).toFixed(2)}`
}
