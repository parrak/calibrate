import { describe, it, expect, vi, beforeEach } from 'vitest'
import { CompetitorMonitor } from './monitor'
import { PrismaClient } from '@prisma/client'

// Mock Prisma client
const mockPrisma = {
  competitor: {
    findMany: vi.fn(),
    findUnique: vi.fn(),
    update: vi.fn(),
  },
  competitorPrice: {
    create: vi.fn(),
    findMany: vi.fn(),
  },
  sku: {
    findFirst: vi.fn(),
  },
} as any

describe('CompetitorMonitor', () => {
  let monitor: CompetitorMonitor

  beforeEach(() => {
    vi.clearAllMocks()
    monitor = new CompetitorMonitor(mockPrisma)
  })

  describe('monitorProject', () => {
    it('should monitor all active competitors in a project', async () => {
      const mockCompetitors = [
        {
          id: 'comp1',
          name: 'Competitor 1',
          products: [
            {
              id: 'prod1',
              name: 'Product 1',
              prices: [{ amount: 1000, currency: 'USD', createdAt: new Date() }]
            }
          ]
        }
      ]

      mockPrisma.competitor.findMany.mockResolvedValue(mockCompetitors)
      mockPrisma.competitor.update.mockResolvedValue({})
      mockPrisma.competitorPrice.create.mockResolvedValue({})

      const results = await monitor.monitorProject('tenant1', 'project1')

      expect(results).toHaveLength(1)
      expect(results[0].competitorId).toBe('comp1')
      expect(results[0].productsChecked).toBe(1)
      expect(mockPrisma.competitor.findMany).toHaveBeenCalledWith({
        where: {
          tenantId: 'tenant1',
          projectId: 'project1',
          isActive: true
        },
        include: {
          products: {
            where: { isActive: true },
            include: { prices: { orderBy: { createdAt: 'desc' }, take: 1 } }
          }
        }
      })
    })
  })

  describe('getPriceComparisons', () => {
    it('should return price comparisons for a SKU', async () => {
      const mockSku = {
        id: 'sku1',
        prices: [{ amount: 1200, status: 'ACTIVE' }],
        competitorProducts: [
          {
            competitor: { id: 'comp1', name: 'Competitor 1' },
            prices: [{ amount: 1000, currency: 'USD', isOnSale: false }]
          }
        ]
      }

      mockPrisma.sku.findFirst.mockResolvedValue(mockSku)

      const comparisons = await monitor.getPriceComparisons('tenant1', 'project1', 'sku1')

      expect(comparisons).toHaveLength(1)
      expect(comparisons[0].skuId).toBe('sku1')
      expect(comparisons[0].ourPrice).toBe(1200)
      expect(comparisons[0].competitorPrices).toHaveLength(1)
      expect(comparisons[0].competitorPrices[0].price).toBe(1000)
    })
  })

  describe('getPriceHistory', () => {
    it('should return price history for a competitor product', async () => {
      const mockPrices = [
        {
          id: 'price1',
          productId: 'prod1',
          amount: 1000,
          currency: 'USD',
          channel: 'shopify',
          isOnSale: false,
          saleEndsAt: null,
          stockStatus: 'in_stock',
          createdAt: new Date('2024-01-01')
        }
      ]

      mockPrisma.competitorPrice.findMany.mockResolvedValue(mockPrices)

      const history = await monitor.getPriceHistory('prod1', 30)

      expect(history).toHaveLength(1)
      expect(history[0].amount).toBe(1000)
      expect(history[0].currency).toBe('USD')
      expect(mockPrisma.competitorPrice.findMany).toHaveBeenCalledWith({
        where: {
          productId: 'prod1',
          createdAt: { gte: expect.any(Date) }
        },
        orderBy: { createdAt: 'asc' }
      })
    })
  })
})
