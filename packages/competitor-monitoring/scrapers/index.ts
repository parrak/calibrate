export * from './shopify'
export * from './amazon'
export * from './google-shopping'

import { CompetitorPriceData } from '../types'
import { scrapeShopifyPrice, isShopifyUrl } from './shopify'
import { scrapeAmazonPrice, isAmazonUrl } from './amazon'
import { scrapeGoogleShoppingPrice, isGoogleShoppingUrl } from './google-shopping'

export interface ScraperResult {
  price: CompetitorPriceData | null
  error?: string
}

/**
 * Auto-detect channel and scrape price from product URL
 */
export async function scrapePrice(
  url: string,
  productId: string,
  channel?: string
): Promise<ScraperResult> {
  // If channel is specified, use it directly
  if (channel) {
    return scrapeByChannel(url, productId, channel)
  }

  // Auto-detect channel from URL
  if (isShopifyUrl(url)) {
    return scrapeShopifyPrice(url, productId)
  }

  if (isAmazonUrl(url)) {
    return scrapeAmazonPrice(url, productId)
  }

  if (isGoogleShoppingUrl(url)) {
    return scrapeGoogleShoppingPrice(url, productId)
  }

  return {
    price: null,
    error: 'Could not detect channel from URL. Supported: Shopify, Amazon, Google Shopping'
  }
}

/**
 * Scrape price using specific channel scraper
 */
export async function scrapeByChannel(
  url: string,
  productId: string,
  channel: string
): Promise<ScraperResult> {
  switch (channel.toLowerCase()) {
    case 'shopify':
      return scrapeShopifyPrice(url, productId)

    case 'amazon':
      return scrapeAmazonPrice(url, productId)

    case 'google_shopping':
    case 'google-shopping':
      return scrapeGoogleShoppingPrice(url, productId)

    default:
      return {
        price: null,
        error: `Unsupported channel: ${channel}. Supported: shopify, amazon, google_shopping`
      }
  }
}

/**
 * Detect channel from URL
 */
export function detectChannel(url: string): string | null {
  if (isShopifyUrl(url)) return 'shopify'
  if (isAmazonUrl(url)) return 'amazon'
  if (isGoogleShoppingUrl(url)) return 'google_shopping'
  return null
}
