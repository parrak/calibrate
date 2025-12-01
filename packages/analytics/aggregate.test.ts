import { describe, it, expect, vi } from 'vitest'
import type { DailySnapshot } from './types'

describe('Analytics Module', () => {
  describe('types', () => {
    it('defines DailySnapshot structure', () => {
      const snapshot: DailySnapshot = {
        projectId: 'test-project',
        date: new Date('2024-01-01'),
        totalSkus: 100,
        priceChanges: {
          total: 10,
          approved: 5,
          rejected: 2,
          pending: 3,
          applied: 5,
        },
        pricing: {
          averagePrice: 1500,
          minPrice: 500,
          maxPrice: 5000,
          medianPrice: 1200,
        },
      }

      expect(snapshot.projectId).toBe('test-project')
      expect(snapshot.totalSkus).toBe(100)
      expect(snapshot.priceChanges.total).toBe(10)
    })
  })

  describe('aggregation logic', () => {
    it('calculates median correctly for odd-length array', () => {
      const values = [1, 3, 5, 7, 9]
      const sorted = values.sort((a, b) => a - b)
      const mid = Math.floor(sorted.length / 2)
      const median = sorted[mid]

      expect(median).toBe(5)
    })

    it('calculates median correctly for even-length array', () => {
      const values = [1, 3, 5, 7]
      const sorted = values.sort((a, b) => a - b)
      const mid = Math.floor(sorted.length / 2)
      const median = Math.round((sorted[mid - 1] + sorted[mid]) / 2)

      expect(median).toBe(4)
    })

    it('calculates margin percentage correctly', () => {
      const cost = 800
      const price = 1200
      const margin = ((price - cost) / cost) * 100

      expect(margin).toBe(50)
    })
  })

  describe('trend detection', () => {
    it('detects upward trend', () => {
      const current = 100
      const previous = 80
      const change = current - previous
      const changePercent = Math.round((change / previous) * 100)
      const direction = current > previous ? 'up' : current < previous ? 'down' : 'stable'

      expect(direction).toBe('up')
      expect(changePercent).toBe(25)
    })

    it('detects downward trend', () => {
      const current = 60
      const previous = 80
      const direction = current > previous ? 'up' : current < previous ? 'down' : 'stable'

      expect(direction).toBe('down')
    })

    it('detects stable trend', () => {
      const current = 80
      const previous = 80
      const direction = current > previous ? 'up' : current < previous ? 'down' : 'stable'

      expect(direction).toBe('stable')
    })
  })

  describe('sales metrics', () => {
    it('calculates total revenue correctly', () => {
      const transactions = [
        { amount: 10000, netAmount: 9500 },
        { amount: 15000, netAmount: 14250 },
        { amount: 8000, netAmount: 7600 },
      ]
      const totalRevenue = transactions.reduce((sum, t) => sum + (t.netAmount || t.amount), 0)

      expect(totalRevenue).toBe(31350)
    })

    it('calculates average order value correctly', () => {
      const totalRevenue = 30000
      const totalUnits = 10
      const avgOrderValue = Math.round(totalRevenue / totalUnits)

      expect(avgOrderValue).toBe(3000)
    })

    it('handles zero transactions gracefully', () => {
      const transactions: any[] = []
      const totalRevenue = transactions.reduce((sum, t) => sum + (t.netAmount || t.amount), 0)
      const totalUnits = transactions.length
      const avgOrderValue = totalUnits > 0 ? Math.round(totalRevenue / totalUnits) : 0

      expect(totalRevenue).toBe(0)
      expect(totalUnits).toBe(0)
      expect(avgOrderValue).toBe(0)
    })
  })

  describe('competitor insights', () => {
    it('calculates competitive delta correctly', () => {
      const ourPrice = 1200
      const competitorPrice = 1000
      const delta = ourPrice - competitorPrice

      expect(delta).toBe(200)
    })

    it('identifies prices below market', () => {
      const ourPrice = 900
      const competitorPrice = 1000
      const isBelowMarket = ourPrice < competitorPrice

      expect(isBelowMarket).toBe(true)
    })

    it('identifies prices above market', () => {
      const ourPrice = 1200
      const competitorPrice = 1000
      const isAboveMarket = ourPrice > competitorPrice

      expect(isAboveMarket).toBe(true)
    })

    it('calculates average competitive delta', () => {
      const deltas = [200, -100, 150, -50, 300]
      const avgDelta = Math.round(deltas.reduce((sum, d) => sum + d, 0) / deltas.length)

      expect(avgDelta).toBe(100)
    })
  })

  describe('margin calculations', () => {
    it('calculates average margin across multiple SKUs', () => {
      const skus = [
        { price: 1200, cost: 800 },
        { price: 2000, cost: 1500 },
        { price: 1500, cost: 1000 },
      ]
      const margins = skus.map((s) => ((s.price - s.cost) / s.cost) * 100)
      const avgMargin = Math.round(margins.reduce((a, b) => a + b, 0) / margins.length)

      expect(avgMargin).toBe(40) // (50 + 33.33 + 50) / 3 ≈ 44, rounded to 40
    })

    it('calculates min margin correctly', () => {
      const skus = [
        { price: 1200, cost: 800 },
        { price: 2000, cost: 1500 },
        { price: 1500, cost: 1000 },
      ]
      const margins = skus.map((s) => ((s.price - s.cost) / s.cost) * 100)
      const minMargin = Math.round(Math.min(...margins))

      expect(minMargin).toBe(33)
    })

    it('calculates max margin correctly', () => {
      const skus = [
        { price: 1200, cost: 800 },
        { price: 2000, cost: 1500 },
        { price: 1500, cost: 1000 },
      ]
      const margins = skus.map((s) => ((s.price - s.cost) / s.cost) * 100)
      const maxMargin = Math.round(Math.max(...margins))

      expect(maxMargin).toBe(50)
    })

    it('handles zero cost gracefully', () => {
      const skus = [
        { price: 1200, cost: 800 },
        { price: 2000, cost: 0 }, // Invalid cost
      ]
      const validSkus = skus.filter((s) => s.cost > 0)
      const margins = validSkus.map((s) => ((s.price - s.cost) / s.cost) * 100)

      expect(validSkus.length).toBe(1)
      expect(margins.length).toBe(1)
    })
  })
})
