import { describe, it, expect } from 'vitest'
import { extractGoogleProductId, isGoogleShoppingUrl } from './google-shopping'

describe('Google Shopping Scraper', () => {
  describe('extractGoogleProductId', () => {
    it('should extract product ID from Google Shopping URL', () => {
      const url = 'https://www.google.com/shopping/product/12345678901234567890'
      expect(extractGoogleProductId(url)).toBe('12345678901234567890')
    })

    it('should return null for invalid URLs', () => {
      const url = 'https://www.google.com/search?q=product'
      expect(extractGoogleProductId(url)).toBe(null)
    })
  })

  describe('isGoogleShoppingUrl', () => {
    it('should return true for Google Shopping product URLs', () => {
      expect(isGoogleShoppingUrl('https://www.google.com/shopping/product/12345678901234567890')).toBe(true)
    })

    it('should return false for regular Google URLs', () => {
      expect(isGoogleShoppingUrl('https://www.google.com/search?q=test')).toBe(false)
    })

    it('should return false for non-Google URLs', () => {
      expect(isGoogleShoppingUrl('https://example.com')).toBe(false)
    })

    it('should return false for invalid URLs', () => {
      expect(isGoogleShoppingUrl('not-a-url')).toBe(false)
    })
  })
})
