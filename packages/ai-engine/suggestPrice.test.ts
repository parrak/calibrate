import { describe, it, expect } from 'vitest'
import { suggestPrice } from './suggestPrice'
import type { PriceSuggestionInput } from './types'

describe('suggestPrice', () => {
  describe('basic functionality', () => {
    it('returns a valid suggestion structure', () => {
      const input: PriceSuggestionInput = {
        sku: 'TEST-001',
        currentPrice: 1000,
        currency: 'USD',
      }

      const result = suggestPrice(input)

      expect(result).toHaveProperty('delta')
      expect(result).toHaveProperty('suggestedPrice')
      expect(result).toHaveProperty('confidence')
      expect(result).toHaveProperty('rationale')
      expect(result).toHaveProperty('reasoning')
      expect(result).toHaveProperty('generatedAt')
      expect(result.generatedAt).toBeInstanceOf(Date)
    })

    it('maintains current price when no data available', () => {
      const input: PriceSuggestionInput = {
        sku: 'TEST-001',
        currentPrice: 1000,
        currency: 'USD',
      }

      const result = suggestPrice(input)

      expect(result.delta).toBe(0)
      expect(result.suggestedPrice).toBe(1000)
      expect(result.rationale).toContain('optimal')
    })
  })

  describe('competitor-based pricing', () => {
    it('suggests decrease when price is significantly above competitors', () => {
      const input: PriceSuggestionInput = {
        sku: 'TEST-002',
        currentPrice: 2000,
        currency: 'USD',
        competitorPrices: [
          { competitorId: 'c1', price: 1500, observedAt: new Date() },
          { competitorId: 'c2', price: 1600, observedAt: new Date() },
          { competitorId: 'c3', price: 1550, observedAt: new Date() },
        ],
      }

      const result = suggestPrice(input)

      expect(result.delta).toBeLessThan(0)
      expect(result.suggestedPrice).toBeLessThan(2000)
      expect(result.reasoning.marketPosition).toBeDefined()
      expect(result.reasoning.marketPosition?.belowAverage).toBe(false)
    })

    it('suggests increase when price is below market minimum', () => {
      const input: PriceSuggestionInput = {
        sku: 'TEST-003',
        currentPrice: 800,
        currency: 'USD',
        competitorPrices: [
          { competitorId: 'c1', price: 1500, observedAt: new Date() },
          { competitorId: 'c2', price: 1600, observedAt: new Date() },
          { competitorId: 'c3', price: 1550, observedAt: new Date() },
        ],
      }

      const result = suggestPrice(input)

      expect(result.delta).toBeGreaterThan(0)
      expect(result.reasoning.marketPosition?.belowAverage).toBe(true)
    })

    it('provides market percentile information', () => {
      const input: PriceSuggestionInput = {
        sku: 'TEST-004',
        currentPrice: 1500,
        currency: 'USD',
        competitorPrices: [
          { competitorId: 'c1', price: 1400, observedAt: new Date() },
          { competitorId: 'c2', price: 1600, observedAt: new Date() },
        ],
      }

      const result = suggestPrice(input)

      expect(result.reasoning.marketPosition?.percentile).toBeGreaterThanOrEqual(0)
      expect(result.reasoning.marketPosition?.percentile).toBeLessThanOrEqual(100)
      expect(result.reasoning.marketPosition?.averagePrice).toBe(1500)
    })
  })

  describe('sales velocity adjustments', () => {
    it('suggests increase for high velocity + increasing trend', () => {
      const input: PriceSuggestionInput = {
        sku: 'TEST-005',
        currentPrice: 1000,
        currency: 'USD',
        salesVelocity: {
          last7Days: 100,
          last30Days: 350,
          averageDailySales: 12,
          trend: 'increasing',
        },
      }

      const result = suggestPrice(input)

      expect(result.delta).toBeGreaterThan(0)
      expect(result.reasoning.salesPerformance?.velocity).toBe('high')
      expect(result.reasoning.salesPerformance?.trend).toBe('increasing')
    })

    it('suggests decrease for low velocity + decreasing trend', () => {
      const input: PriceSuggestionInput = {
        sku: 'TEST-006',
        currentPrice: 1000,
        currency: 'USD',
        salesVelocity: {
          last7Days: 5,
          last30Days: 30,
          averageDailySales: 1,
          trend: 'decreasing',
        },
      }

      const result = suggestPrice(input)

      expect(result.delta).toBeLessThan(0)
      expect(result.reasoning.salesPerformance?.velocity).toBe('low')
    })

    it('minor adjustment for stable medium velocity', () => {
      const input: PriceSuggestionInput = {
        sku: 'TEST-007',
        currentPrice: 1000,
        currency: 'USD',
        salesVelocity: {
          last7Days: 35,
          last30Days: 150,
          averageDailySales: 5,
          trend: 'stable',
        },
      }

      const result = suggestPrice(input)

      expect(Math.abs(result.delta)).toBeLessThan(50)
    })
  })

  describe('margin protection', () => {
    it('enforces minimum margin constraint', () => {
      const input: PriceSuggestionInput = {
        sku: 'TEST-008',
        currentPrice: 1000,
        currency: 'USD',
        cost: 900,
        competitorPrices: [
          { competitorId: 'c1', price: 950, observedAt: new Date() },
        ],
      }

      const result = suggestPrice(input, { minMarginPercent: 20 })

      // With 20% min margin and cost of 900, min price is 1080
      expect(result.suggestedPrice).toBeGreaterThanOrEqual(1080)
      expect(result.reasoning.marginAnalysis?.maintainsMinMargin).toBe(true)
    })

    it('provides margin analysis when cost available', () => {
      const input: PriceSuggestionInput = {
        sku: 'TEST-009',
        currentPrice: 1200,
        currency: 'USD',
        cost: 800,
      }

      const result = suggestPrice(input)

      expect(result.reasoning.marginAnalysis?.currentMargin).toBe(50) // (1200-800)/800 * 100
      expect(result.reasoning.marginAnalysis?.suggestedMargin).toBeDefined()
    })
  })

  describe('configuration options', () => {
    it('respects maxChangePercent limit', () => {
      const input: PriceSuggestionInput = {
        sku: 'TEST-010',
        currentPrice: 1000,
        currency: 'USD',
        salesVelocity: {
          last7Days: 200,
          last30Days: 800,
          averageDailySales: 25,
          trend: 'increasing',
        },
      }

      const result = suggestPrice(input, { maxChangePercent: 5 })

      expect(Math.abs(result.delta)).toBeLessThanOrEqual(50) // 5% of 1000
    })

    it('can disable competitor data influence', () => {
      const input: PriceSuggestionInput = {
        sku: 'TEST-011',
        currentPrice: 2000,
        currency: 'USD',
        competitorPrices: [
          { competitorId: 'c1', price: 1000, observedAt: new Date() },
        ],
      }

      const result = suggestPrice(input, { useCompetitorData: false })

      expect(result.delta).toBe(0)
    })

    it('allows custom weight configuration', () => {
      const input: PriceSuggestionInput = {
        sku: 'TEST-012',
        currentPrice: 1000,
        currency: 'USD',
        competitorPrices: [
          { competitorId: 'c1', price: 1200, observedAt: new Date() },
        ],
        salesVelocity: {
          last7Days: 100,
          last30Days: 400,
          averageDailySales: 12,
          trend: 'increasing',
        },
      }

      const result = suggestPrice(input, {
        customWeights: {
          competitorInfluence: 0.8,
          salesVelocityInfluence: 0.2,
        },
      })

      expect(result.reasoning.weights).toBeDefined()
    })
  })

  describe('confidence scoring', () => {
    it('has low confidence with minimal data', () => {
      const input: PriceSuggestionInput = {
        sku: 'TEST-013',
        currentPrice: 1000,
        currency: 'USD',
      }

      const result = suggestPrice(input)

      expect(result.confidence).toBeLessThan(0.7)
    })

    it('has higher confidence with comprehensive data', () => {
      const input: PriceSuggestionInput = {
        sku: 'TEST-014',
        currentPrice: 1000,
        currency: 'USD',
        cost: 700,
        competitorPrices: [
          { competitorId: 'c1', price: 950, observedAt: new Date() },
          { competitorId: 'c2', price: 1050, observedAt: new Date() },
          { competitorId: 'c3', price: 1000, observedAt: new Date() },
        ],
        salesVelocity: {
          last7Days: 70,
          last30Days: 300,
          averageDailySales: 10,
          trend: 'stable',
        },
        priceHistory: [
          { date: new Date('2024-01-01'), price: 950, unitsSold: 100 },
          { date: new Date('2024-01-15'), price: 1000, unitsSold: 90 },
          { date: new Date('2024-02-01'), price: 1050, unitsSold: 80 },
          { date: new Date('2024-02-15'), price: 1000, unitsSold: 95 },
          { date: new Date('2024-03-01'), price: 1000, unitsSold: 90 },
        ],
      }

      const result = suggestPrice(input)

      expect(result.confidence).toBeGreaterThan(0.7)
    })

    it('caps confidence at 0.95', () => {
      const input: PriceSuggestionInput = {
        sku: 'TEST-015',
        currentPrice: 1000,
        currency: 'USD',
        cost: 700,
        competitorPrices: Array.from({ length: 10 }, (_, i) => ({
          competitorId: `c${i}`,
          price: 1000 + i * 10,
          observedAt: new Date(),
        })),
        salesVelocity: {
          last7Days: 100,
          last30Days: 400,
          averageDailySales: 12,
          trend: 'stable',
        },
        priceHistory: Array.from({ length: 20 }, (_, i) => ({
          date: new Date(),
          price: 1000,
          unitsSold: 90,
        })),
      }

      const result = suggestPrice(input)

      expect(result.confidence).toBeLessThanOrEqual(0.95)
    })
  })

  describe('rationale generation', () => {
    it('provides clear explanation for price increase', () => {
      const input: PriceSuggestionInput = {
        sku: 'TEST-016',
        currentPrice: 1000,
        currency: 'USD',
        salesVelocity: {
          last7Days: 100,
          last30Days: 400,
          averageDailySales: 12,
          trend: 'increasing',
        },
      }

      const result = suggestPrice(input)

      expect(result.rationale).toContain('increase')
      expect(result.rationale).toContain('%')
    })

    it('provides clear explanation for price decrease', () => {
      const input: PriceSuggestionInput = {
        sku: 'TEST-017',
        currentPrice: 1000,
        currency: 'USD',
        salesVelocity: {
          last7Days: 5,
          last30Days: 30,
          averageDailySales: 1,
          trend: 'decreasing',
        },
      }

      const result = suggestPrice(input)

      expect(result.rationale).toContain('decrease')
    })

    it('lists considered factors', () => {
      const input: PriceSuggestionInput = {
        sku: 'TEST-018',
        currentPrice: 1000,
        currency: 'USD',
        competitorPrices: [
          { competitorId: 'c1', price: 1100, observedAt: new Date() },
        ],
        salesVelocity: {
          last7Days: 70,
          last30Days: 300,
          averageDailySales: 10,
          trend: 'stable',
        },
      }

      const result = suggestPrice(input)

      expect(result.reasoning.factors.length).toBeGreaterThan(0)
    })
  })
})
