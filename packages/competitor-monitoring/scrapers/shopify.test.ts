import { describe, it, expect } from 'vitest'
import { extractShopifyHandle, isShopifyUrl } from './shopify'

describe('Shopify Scraper', () => {
  describe('extractShopifyHandle', () => {
    it('should extract handle from standard Shopify URL', () => {
      const url = 'https://example.myshopify.com/products/cool-product'
      expect(extractShopifyHandle(url)).toBe('cool-product')
    })

    it('should extract handle from custom domain', () => {
      const url = 'https://shop.example.com/products/awesome-item'
      expect(extractShopifyHandle(url)).toBe('awesome-item')
    })

    it('should handle URLs with query parameters', () => {
      const url = 'https://example.myshopify.com/products/test-product?variant=123'
      expect(extractShopifyHandle(url)).toBe('test-product')
    })

    it('should return null for invalid URLs', () => {
      const url = 'https://example.com/something-else'
      expect(extractShopifyHandle(url)).toBe(null)
    })
  })

  describe('isShopifyUrl', () => {
    it('should return true for myshopify.com URLs', () => {
      expect(isShopifyUrl('https://store.myshopify.com/products/item')).toBe(true)
    })

    it('should return true for URLs with /products/ path', () => {
      expect(isShopifyUrl('https://shop.example.com/products/item')).toBe(true)
    })

    it('should return false for non-Shopify URLs', () => {
      expect(isShopifyUrl('https://example.com')).toBe(false)
    })

    it('should return false for invalid URLs', () => {
      expect(isShopifyUrl('not-a-url')).toBe(false)
    })
  })
})
