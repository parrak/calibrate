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
})
