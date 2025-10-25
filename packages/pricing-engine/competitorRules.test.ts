import { describe, it, expect } from 'vitest'
import { evaluateCompetitorRules, getCompetitorInsights } from './competitorRules'
import type { CompetitorRule, PriceComparison } from '@calibrate/competitor-monitoring'

describe('Competitor Rules', () => {
  describe('evaluateCompetitorRules', () => {
    it('should apply beat by percentage rule', () => {
      const rules: CompetitorRule[] = [
        {
          id: 'rule1',
          name: 'Beat by 5%',
          isActive: true,
          rules: {
            type: 'beat_by_percent',
            value: 5,
            minMargin: 10
          }
        }
      ]

      const priceComparisons: PriceComparison[] = [
        {
          skuId: 'sku1',
          ourPrice: 1200,
          competitorPrices: [
            {
              competitorId: 'comp1',
              competitorName: 'Competitor 1',
              price: 1000,
              currency: 'USD',
              isOnSale: false
            }
          ]
        }
      ]

      const result = evaluateCompetitorRules(1200, 1200, priceComparisons, rules)

      expect(result.ok).toBe(true)
      expect(result.suggestedPrice).toBe(950) // 1000 * 0.95
      expect(result.ruleApplied).toBe('Beat by 5%')
    })

    it('should apply beat by amount rule', () => {
      const rules: CompetitorRule[] = [
        {
          id: 'rule1',
          name: 'Beat by $1',
          isActive: true,
          rules: {
            type: 'beat_by_amount',
            value: 100, // $1 in cents
            minMargin: 10
          }
        }
      ]

      const priceComparisons: PriceComparison[] = [
        {
          skuId: 'sku1',
          ourPrice: 1200,
          competitorPrices: [
            {
              competitorId: 'comp1',
              competitorName: 'Competitor 1',
              price: 1000,
              currency: 'USD',
              isOnSale: false
            }
          ]
        }
      ]

      const result = evaluateCompetitorRules(1200, 1200, priceComparisons, rules)

      expect(result.ok).toBe(true)
      expect(result.suggestedPrice).toBe(900) // 1000 - 100
      expect(result.ruleApplied).toBe('Beat by $1')
    })

    it('should apply match rule', () => {
      const rules: CompetitorRule[] = [
        {
          id: 'rule1',
          name: 'Match lowest',
          isActive: true,
          rules: {
            type: 'match',
            minMargin: 10
          }
        }
      ]

      const priceComparisons: PriceComparison[] = [
        {
          skuId: 'sku1',
          ourPrice: 1200,
          competitorPrices: [
            {
              competitorId: 'comp1',
              competitorName: 'Competitor 1',
              price: 1000,
              currency: 'USD',
              isOnSale: false
            }
          ]
        }
      ]

      const result = evaluateCompetitorRules(1200, 1200, priceComparisons, rules)

      expect(result.ok).toBe(true)
      expect(result.suggestedPrice).toBe(1000) // Match lowest price
      expect(result.ruleApplied).toBe('Match lowest')
    })

    it('should apply avoid race to bottom rule', () => {
      const rules: CompetitorRule[] = [
        {
          id: 'rule1',
          name: 'Avoid race to bottom',
          isActive: true,
          rules: {
            type: 'avoid_race_to_bottom',
            minMargin: 10
          }
        }
      ]

      const priceComparisons: PriceComparison[] = [
        {
          skuId: 'sku1',
          ourPrice: 1200,
          competitorPrices: [
            {
              competitorId: 'comp1',
              competitorName: 'Competitor 1',
              price: 1000,
              currency: 'USD',
              isOnSale: false
            },
            {
              competitorId: 'comp2',
              competitorName: 'Competitor 2',
              price: 1200,
              currency: 'USD',
              isOnSale: false
            }
          ]
        }
      ]

      const result = evaluateCompetitorRules(1200, 800, priceComparisons, rules) // Proposed price is very low

      expect(result.ok).toBe(true)
      expect(result.suggestedPrice).toBe(880) // 1100 * 0.8 (20% below average)
      expect(result.ruleApplied).toBe('Avoid race to bottom')
    })

    it('should respect min/max price constraints', () => {
      const rules: CompetitorRule[] = [
        {
          id: 'rule1',
          name: 'Beat with constraints',
          isActive: true,
          rules: {
            type: 'beat_by_percent',
            value: 10,
            minPrice: 500,
            maxPrice: 1500
          }
        }
      ]

      const priceComparisons: PriceComparison[] = [
        {
          skuId: 'sku1',
          ourPrice: 1200,
          competitorPrices: [
            {
              competitorId: 'comp1',
              competitorName: 'Competitor 1',
              price: 1000,
              currency: 'USD',
              isOnSale: false
            }
          ]
        }
      ]

      const result = evaluateCompetitorRules(1200, 1200, priceComparisons, rules)

      expect(result.ok).toBe(true)
      expect(result.suggestedPrice).toBe(900) // 1000 * 0.9, within constraints
    })
  })

  describe('getCompetitorInsights', () => {
    it('should calculate competitor insights correctly', () => {
      const priceComparisons: PriceComparison[] = [
        {
          skuId: 'sku1',
          ourPrice: 1200,
          competitorPrices: [
            {
              competitorId: 'comp1',
              competitorName: 'Competitor 1',
              price: 1000,
              currency: 'USD',
              isOnSale: false
            },
            {
              competitorId: 'comp2',
              competitorName: 'Competitor 2',
              price: 1400,
              currency: 'USD',
              isOnSale: false
            }
          ]
        }
      ]

      const insights = getCompetitorInsights(priceComparisons)

      expect(insights.minPrice).toBe(1000)
      expect(insights.maxPrice).toBe(1400)
      expect(insights.avgPrice).toBe(1200) // (1000 + 1200 + 1400) / 3
      expect(insights.ourPosition).toBe('middle')
      expect(insights.priceSpread).toBe(400)
      expect(insights.competitorCount).toBe(2)
    })

    it('should handle empty price comparisons', () => {
      const insights = getCompetitorInsights([])

      expect(insights.minPrice).toBe(0)
      expect(insights.maxPrice).toBe(0)
      expect(insights.avgPrice).toBe(0)
      expect(insights.ourPosition).toBe('middle')
      expect(insights.priceSpread).toBe(0)
      expect(insights.competitorCount).toBe(0)
    })
  })
})
