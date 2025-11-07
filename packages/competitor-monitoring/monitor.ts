import { PrismaClient } from '@prisma/client'
import { 
  CompetitorData, 
  CompetitorProductData, 
  CompetitorPriceData, 
  MonitoringResult,
  PriceComparison 
} from './types'

export class CompetitorMonitor {
  constructor(private db: PrismaClient) {}

  /**
   * Monitor all active competitors for a project
   */
  async monitorProject(tenantId: string, projectId: string): Promise<MonitoringResult[]> {
    const competitors = await this.db.competitor.findMany({
      where: {
        tenantId,
        projectId,
        isActive: true
      },
      include: {
        CompetitorProduct: {
          where: { isActive: true },
          include: { CompetitorPrice: { orderBy: { createdAt: 'desc' }, take: 1 } }
        }
      }
    })

    const results: MonitoringResult[] = []

    for (const competitor of competitors) {
      const startTime = Date.now()
      const result = await this.monitorCompetitor(competitor)
      const duration = Date.now() - startTime

      results.push({
        ...result,
        duration
      })
    }

    return results
  }

  /**
   * Monitor a specific competitor
   */
  async monitorCompetitor(competitor: any): Promise<Omit<MonitoringResult, 'duration'>> {
    const errors: string[] = []
    let productsChecked = 0
    let pricesUpdated = 0

    try {
      // Update last checked timestamp
      await this.db.competitor.update({
        where: { id: competitor.id },
        data: { lastChecked: new Date() }
      })

      // For each product, fetch current price
      for (const product of competitor.CompetitorProduct) {
        try {
          productsChecked++
          
          // TODO: Implement actual price scraping based on competitor channel
          const currentPrice = await this.scrapePrice(competitor, product)
          
          if (currentPrice) {
            await this.db.competitorPrice.create({
              data: {
                id: (crypto as any).randomUUID ? (crypto as any).randomUUID() : `${Date.now()}-${Math.random()}`,
                amount: currentPrice.amount,
                currency: currentPrice.currency,
                channel: currentPrice.channel,
                isOnSale: currentPrice.isOnSale,
                saleEndsAt: currentPrice.saleEndsAt,
                stockStatus: currentPrice.stockStatus,
                productId: product.id
              }
            })
            pricesUpdated++
          }
        } catch (error) {
          errors.push(`Failed to scrape product ${product.name}: ${error instanceof Error ? error.message : String(error)}`)
        }
      }
    } catch (error) {
      errors.push(`Failed to monitor competitor ${competitor.name}: ${error instanceof Error ? error.message : String(error)}`)
    }

    return {
      success: errors.length === 0,
      competitorId: competitor.id,
      productsChecked,
      pricesUpdated,
      errors
    }
  }

  /**
   * Scrape price from competitor using channel-specific scraper
   */
  private async scrapePrice(competitor: any, product: any): Promise<CompetitorPriceData | null> {
    console.log(`[MONITOR] Scraping ${competitor.name} - ${product.name} (${competitor.channel})`)

    // Import scrapers dynamically to avoid circular dependencies
    const { scrapePrice } = await import('./scrapers')

    try {
      const result = await scrapePrice(product.url, product.id, competitor.channel)

      if (result.error) {
        console.error(`[MONITOR] Scrape error for ${product.name}: ${result.error}`)
        return null
      }

      return result.price
    } catch (error) {
      console.error(`[MONITOR] Failed to scrape ${product.name}:`, error)
      return null
    }
  }

  /**
   * Get price comparisons for a SKU across all competitors
   */
  async getPriceComparisons(tenantId: string, projectId: string, skuId: string): Promise<PriceComparison[]> {
    const sku = await this.db.sku.findFirst({
      where: { id: skuId },
      include: {
        Price: { where: { status: 'ACTIVE' } },
        CompetitorProduct: {
          include: {
            Competitor: true,
            CompetitorPrice: {
              orderBy: { createdAt: 'desc' },
              take: 1
            }
          }
        }
      }
    })

    if (!sku) return []

    const ourPrice = sku.Price[0]?.amount || 0
    const competitorPrices = []

    for (const competitorProduct of sku.CompetitorProduct) {
      const latestPrice = competitorProduct.CompetitorPrice[0]
      if (latestPrice) {
        competitorPrices.push({
          competitorId: competitorProduct.Competitor.id,
          competitorName: competitorProduct.Competitor.name,
          price: latestPrice.amount,
          currency: latestPrice.currency,
          isOnSale: latestPrice.isOnSale,
          stockStatus: latestPrice.stockStatus || undefined
        })
      }
    }

    // Return single comparison with all competitor prices aggregated
    return competitorPrices.length > 0 ? [{
      skuId,
      ourPrice,
      competitorPrices
    }] : []
  }

  /**
   * Get historical price data for a competitor product
   */
  async getPriceHistory(competitorProductId: string, days: number = 30): Promise<CompetitorPriceData[]> {
    const since = new Date(Date.now() - days * 24 * 60 * 60 * 1000)
    
    const prices = await this.db.competitorPrice.findMany({
      where: {
        productId: competitorProductId,
        createdAt: { gte: since }
      },
      orderBy: { createdAt: 'asc' }
    })

    return prices.map((price: typeof prices[0]) => ({
      id: price.id,
      productId: price.productId,
      amount: price.amount,
      currency: price.currency,
      channel: price.channel || undefined,
      isOnSale: price.isOnSale,
      saleEndsAt: price.saleEndsAt || undefined,
      stockStatus: price.stockStatus as any,
      createdAt: price.createdAt
    }))
  }
}
