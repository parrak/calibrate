/**
 * Shopify Pricing Tests
 * 
 * Tests for the ShopifyPricing class
 */
import { describe, it, expect, beforeEach, vi } from 'vitest';
import { ShopifyPricing } from '../src/pricing';
import { ShopifyClient } from '../src/client';
import type { ShopifyConfig } from '../src/types';

describe('ShopifyPricing', () => {
  let pricing: ShopifyPricing;
  let mockClient: any;

  beforeEach(() => {
    mockClient = {
      post: vi.fn(),
      waitIfNeeded: vi.fn(),
    };

    pricing = new ShopifyPricing(mockClient);
  });

  describe('updateVariantPrice', () => {
    it('should update variant price successfully', async () => {
      const mockResponse = {
        data: {
          productVariantUpdate: {
            productVariant: {
              id: 'gid://shopify/ProductVariant/123',
              price: '29.99',
              compareAtPrice: '39.99',
            },
            userErrors: [],
          },
        },
      };

      mockClient.post.mockResolvedValue(mockResponse);

      const result = await pricing.updateVariantPrice({
        variantId: '123',
        price: '29.99',
        compareAtPrice: '39.99',
      });

      expect(result.success).toBe(true);
      expect(result.variantId).toBe('123');
      expect(mockClient.post).toHaveBeenCalledWith('/graphql.json', expect.any(Object));
    });

    it('should handle user errors from GraphQL', async () => {
      const mockResponse = {
        data: {
          productVariantUpdate: {
            productVariant: null,
            userErrors: [
              { field: ['price'], message: 'Invalid price' },
            ],
          },
        },
      };

      mockClient.post.mockResolvedValue(mockResponse);

      const result = await pricing.updateVariantPrice({
        variantId: '123',
        price: '-10.00',
      });

      expect(result.success).toBe(false);
      expect(result.error).toContain('Invalid price');
    });

    it('should handle multiple user errors and preserve all messages', async () => {
      const mockResponse = {
        data: {
          productVariantUpdate: {
            productVariant: null,
            userErrors: [
              { field: ['price'], message: 'Price must be positive' },
              { field: ['compareAtPrice'], message: 'Compare at price must be greater than price' },
              { message: 'Variant validation failed' },
            ],
          },
        },
      };

      mockClient.post.mockResolvedValue(mockResponse);

      const result = await pricing.updateVariantPrice({
        variantId: '123',
        price: '-10.00',
        compareAtPrice: '5.00',
      });

      expect(result.success).toBe(false);
      expect(result.error).toContain('Price must be positive');
      expect(result.error).toContain('Compare at price must be greater than price');
      expect(result.error).toContain('Variant validation failed');
      // Verify all errors are joined with semicolon separator
      expect(result.error?.split('; ')).toHaveLength(3);
    });
  });

  describe('updateVariantPricesBulk', () => {
    it('should update multiple variant prices', async () => {
      const mockResponse = {
        data: {
          productVariantUpdate: {
            productVariant: {
              id: 'gid://shopify/ProductVariant/123',
              price: '29.99',
            },
            userErrors: [],
          },
        },
      };

      mockClient.post.mockResolvedValue(mockResponse);
      mockClient.waitIfNeeded.mockResolvedValue(undefined);

      const result = await pricing.updateVariantPricesBulk({
        updates: [
          { variantId: '123', price: '29.99' },
          { variantId: '456', price: '39.99' },
        ],
        batchSize: 2,
      });

      expect(result.results).toHaveLength(2);
      expect(result.successCount).toBe(2);
      expect(result.errorCount).toBe(0);
    });
  });

  describe('validatePrice', () => {
    it('should validate correct price format', () => {
      expect(pricing.validatePrice('19.99')).toBe(true);
      expect(pricing.validatePrice('100')).toBe(true);
      expect(pricing.validatePrice('100.5')).toBe(true);
    });

    it('should reject invalid price format', () => {
      expect(pricing.validatePrice('invalid')).toBe(false);
      expect(pricing.validatePrice('19.999')).toBe(false);
      expect(pricing.validatePrice('')).toBe(false);
    });
  });

  describe('formatPrice', () => {
    it('should format price to 2 decimal places', () => {
      expect(pricing.formatPrice('19.9')).toBe('19.90');
      expect(pricing.formatPrice(19.9)).toBe('19.90');
      expect(pricing.formatPrice('100')).toBe('100.00');
    });
  });

  describe('calculatePriceChangePercentage', () => {
    it('should calculate price change percentage', () => {
      const result = pricing.calculatePriceChangePercentage('10.00', '20.00');
      expect(result).toBe(100);
    });

    it('should handle zero old price', () => {
      const result = pricing.calculatePriceChangePercentage('0', '10.00');
      expect(result).toBe(0);
    });
  });

  describe('isSignificantPriceChange', () => {
    it('should detect significant price change', () => {
      const result = pricing.isSignificantPriceChange('10.00', '15.00', 5);
      expect(result).toBe(true);
    });

    it('should not detect insignificant price change', () => {
      const result = pricing.isSignificantPriceChange('10.00', '10.40', 5);
      expect(result).toBe(false);
    });
  });
});

