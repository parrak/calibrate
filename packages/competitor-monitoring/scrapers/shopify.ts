import { CompetitorPriceData } from '../types'

export interface ShopifyScrapeResult {
  price: CompetitorPriceData | null
  error?: string
}

/**
 * Scrape price data from Shopify product page
 * Uses Shopify's JSON endpoint for reliable data extraction
 */
export async function scrapeShopifyPrice(
  productUrl: string,
  productId: string
): Promise<ShopifyScrapeResult> {
  try {
    // Extract Shopify domain and handle from URL
    const url = new URL(productUrl)

    // Shopify provides JSON endpoint at /products/{handle}.json
    let jsonUrl = productUrl
    if (!productUrl.endsWith('.json')) {
      // Convert /products/product-handle to /products/product-handle.json
      if (productUrl.includes('/products/')) {
        jsonUrl = productUrl.split('?')[0] + '.json'
      } else {
        return { price: null, error: 'Invalid Shopify product URL format' }
      }
    }

    // Fetch product JSON data
    const response = await fetch(jsonUrl, {
      headers: {
        'User-Agent': 'Calibr-PriceMonitor/1.0',
        'Accept': 'application/json'
      }
    })

    if (!response.ok) {
      return {
        price: null,
        error: `HTTP ${response.status}: ${response.statusText}`
      }
    }

    const data = await response.json()

    // Extract price from first variant (Shopify stores prices in cents as strings)
    const product = data.product
    if (!product || !product.variants || product.variants.length === 0) {
      return { price: null, error: 'No product variants found' }
    }

    const variant = product.variants[0]
    const priceInCents = Math.round(parseFloat(variant.price) * 100)
    const comparePriceInCents = variant.compare_at_price
      ? Math.round(parseFloat(variant.compare_at_price) * 100)
      : null

    // Determine if on sale
    const isOnSale = comparePriceInCents ? priceInCents < comparePriceInCents : false

    // Extract stock status
    let stockStatus: 'in_stock' | 'out_of_stock' | 'limited' = 'in_stock'
    if (!variant.available) {
      stockStatus = 'out_of_stock'
    } else if (variant.inventory_quantity !== undefined && variant.inventory_quantity < 10) {
      stockStatus = 'limited'
    }

    return {
      price: {
        id: '', // Will be set by database
        productId,
        amount: priceInCents,
        currency: 'USD', // Shopify default, could be enhanced to detect currency
        channel: 'shopify',
        isOnSale,
        saleEndsAt: undefined, // Shopify doesn't provide sale end dates in JSON
        stockStatus,
        createdAt: new Date()
      }
    }
  } catch (error) {
    return {
      price: null,
      error: error instanceof Error ? error.message : String(error)
    }
  }
}

/**
 * Extract product handle from Shopify URL
 * Example: https://example.myshopify.com/products/cool-product => cool-product
 */
export function extractShopifyHandle(url: string): string | null {
  try {
    const match = url.match(/\/products\/([^/?]+)/)
    return match ? match[1] : null
  } catch {
    return null
  }
}

/**
 * Validate if URL is a Shopify store
 */
export function isShopifyUrl(url: string): boolean {
  try {
    const urlObj = new URL(url)
    return urlObj.hostname.includes('myshopify.com') ||
           urlObj.pathname.includes('/products/')
  } catch {
    return false
  }
}
