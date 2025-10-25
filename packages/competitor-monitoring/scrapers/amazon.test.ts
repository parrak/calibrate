import { describe, it, expect } from 'vitest'
import { extractAmazonAsin, isAmazonUrl } from './amazon'

describe('Amazon Scraper', () => {
  describe('extractAmazonAsin', () => {
    it('should extract ASIN from /dp/ URL', () => {
      const url = 'https://www.amazon.com/dp/B08N5WRWNW'
      expect(extractAmazonAsin(url)).toBe('B08N5WRWNW')
    })

    it('should extract ASIN from /dp/ URL with product name', () => {
      const url = 'https://www.amazon.com/Some-Product-Name/dp/B08N5WRWNW'
      expect(extractAmazonAsin(url)).toBe('B08N5WRWNW')
    })

    it('should extract ASIN from /gp/product/ URL', () => {
      const url = 'https://www.amazon.com/gp/product/B08N5WRWNW'
      expect(extractAmazonAsin(url)).toBe('B08N5WRWNW')
    })

    it('should return null for invalid URLs', () => {
      const url = 'https://www.amazon.com/something-else'
      expect(extractAmazonAsin(url)).toBe(null)
    })
  })

  describe('isAmazonUrl', () => {
    it('should return true for amazon.com /dp/ URLs', () => {
      expect(isAmazonUrl('https://www.amazon.com/dp/B08N5WRWNW')).toBe(true)
    })

    it('should return true for amazon.com /gp/product/ URLs', () => {
      expect(isAmazonUrl('https://www.amazon.com/gp/product/B08N5WRWNW')).toBe(true)
    })

    it('should return false for non-Amazon URLs', () => {
      expect(isAmazonUrl('https://example.com')).toBe(false)
    })

    it('should return false for Amazon URLs without product path', () => {
      expect(isAmazonUrl('https://www.amazon.com')).toBe(false)
    })

    it('should return false for invalid URLs', () => {
      expect(isAmazonUrl('not-a-url')).toBe(false)
    })
  })
})
