import { describe, it, expect } from 'vitest'
import { detectChannel } from './index'

describe('Scraper Index', () => {
  describe('detectChannel', () => {
    it('should detect Shopify from myshopify.com domain', () => {
      expect(detectChannel('https://store.myshopify.com/products/test')).toBe('shopify')
    })

    it('should detect Shopify from /products/ path', () => {
      expect(detectChannel('https://shop.example.com/products/test')).toBe('shopify')
    })

    it('should detect Amazon from domain', () => {
      expect(detectChannel('https://www.amazon.com/dp/B08N5WRWNW')).toBe('amazon')
    })

    it('should detect Google Shopping from URL', () => {
      expect(detectChannel('https://www.google.com/shopping/product/12345')).toBe('google_shopping')
    })

    it('should return null for unsupported URLs', () => {
      expect(detectChannel('https://example.com/product')).toBe(null)
    })
  })
})
