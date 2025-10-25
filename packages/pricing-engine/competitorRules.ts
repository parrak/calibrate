import { CompetitorRule, PriceComparison } from '@calibrate/competitor-monitoring'

export interface CompetitorPolicyEval {
  ok: boolean
  checks: Array<{
    name: string
    ok: boolean
    [key: string]: any
  }>
  suggestedPrice?: number
  ruleApplied?: string
}

export function evaluateCompetitorRules(
  currentAmount: number,
  proposedAmount: number,
  priceComparisons: PriceComparison[],
  rules: CompetitorRule[]
): CompetitorPolicyEval {
  const checks: Array<{ name: string; ok: boolean; [key: string]: any }> = []
  let suggestedPrice = proposedAmount
  let ruleApplied: string | undefined

  // Filter active rules
  const activeRules = rules.filter(rule => rule.isActive)

  for (const rule of activeRules) {
    const ruleResult = evaluateRule(rule, currentAmount, proposedAmount, priceComparisons)
    
    if (ruleResult.applied) {
      suggestedPrice = ruleResult.suggestedPrice
      ruleApplied = rule.name
    }

    checks.push({
      name: `competitor_rule_${rule.id}`,
      ok: ruleResult.ok,
      ruleName: rule.name,
      suggestedPrice: ruleResult.suggestedPrice,
      applied: ruleResult.applied
    })
  }

  return {
    ok: checks.every(c => c.ok),
    checks,
    suggestedPrice,
    ruleApplied
  }
}

function evaluateRule(
  rule: CompetitorRule,
  currentAmount: number,
  proposedAmount: number,
  priceComparisons: PriceComparison[]
): {
  ok: boolean
  applied: boolean
  suggestedPrice: number
} {
  const { rules: ruleConfig } = rule
  let suggestedPrice = proposedAmount
  let applied = false

  // Get all competitor prices for this SKU
  const allCompetitorPrices = priceComparisons.flatMap(pc => pc.competitorPrices)
  
  if (allCompetitorPrices.length === 0) {
    return { ok: true, applied: false, suggestedPrice }
  }

  // Filter by specific competitors if specified
  const relevantPrices = ruleConfig.competitors 
    ? allCompetitorPrices.filter(cp => ruleConfig.competitors!.includes(cp.competitorId))
    : allCompetitorPrices

  if (relevantPrices.length === 0) {
    return { ok: true, applied: false, suggestedPrice }
  }

  // Filter by channels if specified
  const channelFilteredPrices = ruleConfig.channels
    ? relevantPrices.filter(cp => ruleConfig.channels!.includes(cp.channel || ''))
    : relevantPrices

  if (channelFilteredPrices.length === 0) {
    return { ok: true, applied: false, suggestedPrice }
  }

  const competitorPrices = channelFilteredPrices.map(cp => cp.price)
  const minCompetitorPrice = Math.min(...competitorPrices)
  const maxCompetitorPrice = Math.max(...competitorPrices)
  const avgCompetitorPrice = competitorPrices.reduce((sum, price) => sum + price, 0) / competitorPrices.length

  switch (ruleConfig.type) {
    case 'beat_by_percent':
      if (ruleConfig.value) {
        const beatPrice = minCompetitorPrice * (1 - ruleConfig.value / 100)
        suggestedPrice = Math.max(beatPrice, ruleConfig.minPrice || 0)
        applied = true
      }
      break

    case 'beat_by_amount':
      if (ruleConfig.value) {
        const beatPrice = minCompetitorPrice - ruleConfig.value
        suggestedPrice = Math.max(beatPrice, ruleConfig.minPrice || 0)
        applied = true
      }
      break

    case 'match':
      suggestedPrice = minCompetitorPrice
      applied = true
      break

    case 'avoid_race_to_bottom':
      // Only apply if we're significantly below average competitor price
      const threshold = avgCompetitorPrice * 0.8 // 20% below average
      if (proposedAmount < threshold) {
        suggestedPrice = Math.max(threshold, ruleConfig.minPrice || 0)
        applied = true
      }
      break
  }

  // Apply min/max constraints
  if (ruleConfig.minPrice && suggestedPrice < ruleConfig.minPrice) {
    suggestedPrice = ruleConfig.minPrice
    applied = true
  }
  
  if (ruleConfig.maxPrice && suggestedPrice > ruleConfig.maxPrice) {
    suggestedPrice = ruleConfig.maxPrice
    applied = true
  }

  // For competitor rules, we consider them successful if they can be applied
  // Margin checks would be handled by the main pricing policy engine
  const ok = true

  return { ok, applied, suggestedPrice }
}

export function getCompetitorInsights(priceComparisons: PriceComparison[]): {
  minPrice: number
  maxPrice: number
  avgPrice: number
  ourPosition: 'lowest' | 'highest' | 'middle'
  priceSpread: number
  competitorCount: number
} {
  if (priceComparisons.length === 0) {
    return {
      minPrice: 0,
      maxPrice: 0,
      avgPrice: 0,
      ourPosition: 'middle',
      priceSpread: 0,
      competitorCount: 0
    }
  }

  const allPrices = priceComparisons.flatMap(pc => [
    pc.ourPrice,
    ...pc.competitorPrices.map(cp => cp.price)
  ])

  const minPrice = Math.min(...allPrices)
  const maxPrice = Math.max(...allPrices)
  const avgPrice = allPrices.reduce((sum, price) => sum + price, 0) / allPrices.length
  const ourPrice = priceComparisons[0]?.ourPrice || 0

  let ourPosition: 'lowest' | 'highest' | 'middle' = 'middle'
  if (ourPrice === minPrice) ourPosition = 'lowest'
  else if (ourPrice === maxPrice) ourPosition = 'highest'

  return {
    minPrice,
    maxPrice,
    avgPrice,
    ourPosition,
    priceSpread: maxPrice - minPrice,
    competitorCount: priceComparisons[0]?.competitorPrices.length || 0
  }
}
