/**
 * Validation Utilities Tests
 */

import { describe, it, expect } from 'vitest';
import {
  isValidPlatform,
  isValidPrice,
  isValidCurrency,
  isValidSku,
  isValidExternalId,
  validatePriceUpdate,
  validateBatchPriceUpdate,
  validateProductFilter,
  sanitizeString,
  sanitizeMetadata,
} from '../src/utils/validation';

describe('Validation Utilities', () => {
  describe('isValidPlatform', () => {
    it('should validate correct platform types', () => {
      expect(isValidPlatform('shopify')).toBe(true);
      expect(isValidPlatform('amazon')).toBe(true);
      expect(isValidPlatform('google_shopping')).toBe(true);
      expect(isValidPlatform('woocommerce')).toBe(true);
      expect(isValidPlatform('bigcommerce')).toBe(true);
      expect(isValidPlatform('custom')).toBe(true);
    });

    it('should reject invalid platform types', () => {
      expect(isValidPlatform('invalid')).toBe(false);
      expect(isValidPlatform('etsy')).toBe(false);
      expect(isValidPlatform('')).toBe(false);
    });
  });

  describe('isValidPrice', () => {
    it('should validate positive integers', () => {
      expect(isValidPrice(0)).toBe(true);
      expect(isValidPrice(100)).toBe(true);
      expect(isValidPrice(999999)).toBe(true);
    });

    it('should reject negative numbers', () => {
      expect(isValidPrice(-1)).toBe(false);
      expect(isValidPrice(-100)).toBe(false);
    });

    it('should reject decimal numbers', () => {
      expect(isValidPrice(10.5)).toBe(false);
      expect(isValidPrice(99.99)).toBe(false);
    });
  });

  describe('isValidCurrency', () => {
    it('should validate ISO 4217 currency codes', () => {
      expect(isValidCurrency('USD')).toBe(true);
      expect(isValidCurrency('EUR')).toBe(true);
      expect(isValidCurrency('GBP')).toBe(true);
      expect(isValidCurrency('JPY')).toBe(true);
    });

    it('should reject invalid currency codes', () => {
      expect(isValidCurrency('usd')).toBe(false); // lowercase
      expect(isValidCurrency('US')).toBe(false); // too short
      expect(isValidCurrency('USDA')).toBe(false); // too long
      expect(isValidCurrency('')).toBe(false);
    });
  });

  describe('isValidSku', () => {
    it('should validate non-empty SKUs', () => {
      expect(isValidSku('SKU-123')).toBe(true);
      expect(isValidSku('A')).toBe(true);
      expect(isValidSku('PROD-ABC-001')).toBe(true);
    });

    it('should reject empty SKUs', () => {
      expect(isValidSku('')).toBe(false);
    });

    it('should reject SKUs longer than 255 characters', () => {
      const longSku = 'A'.repeat(256);
      expect(isValidSku(longSku)).toBe(false);
    });
  });

  describe('isValidExternalId', () => {
    it('should validate non-empty external IDs', () => {
      expect(isValidExternalId('ext-123')).toBe(true);
      expect(isValidExternalId('1')).toBe(true);
      expect(isValidExternalId('shopify-prod-456')).toBe(true);
    });

    it('should reject empty external IDs', () => {
      expect(isValidExternalId('')).toBe(false);
    });

    it('should reject external IDs longer than 255 characters', () => {
      const longId = 'A'.repeat(256);
      expect(isValidExternalId(longId)).toBe(false);
    });
  });

  describe('validatePriceUpdate', () => {
    it('should validate correct price update', () => {
      const validUpdate = {
        externalId: 'prod-123',
        price: 2999,
        currency: 'USD',
      };

      const result = validatePriceUpdate(validUpdate);
      expect(result.success).toBe(true);
    });

    it('should validate price update with optional fields', () => {
      const validUpdate = {
        externalId: 'prod-123',
        sku: 'SKU-001',
        price: 2999,
        compareAtPrice: 3999,
        currency: 'USD',
        metadata: { source: 'test' },
      };

      const result = validatePriceUpdate(validUpdate);
      expect(result.success).toBe(true);
    });

    it('should reject price update with missing required fields', () => {
      const invalidUpdate = {
        price: 2999,
        // missing externalId and currency
      };

      const result = validatePriceUpdate(invalidUpdate);
      expect(result.success).toBe(false);
    });

    it('should reject price update with negative price', () => {
      const invalidUpdate = {
        externalId: 'prod-123',
        price: -100,
        currency: 'USD',
      };

      const result = validatePriceUpdate(invalidUpdate);
      expect(result.success).toBe(false);
    });

    it('should reject price update with invalid currency', () => {
      const invalidUpdate = {
        externalId: 'prod-123',
        price: 2999,
        currency: 'usd', // lowercase
      };

      const result = validatePriceUpdate(invalidUpdate);
      expect(result.success).toBe(false);
    });
  });

  describe('validateBatchPriceUpdate', () => {
    it('should validate batch update with multiple items', () => {
      const validBatch = {
        updates: [
          { externalId: 'prod-1', price: 1999, currency: 'USD' },
          { externalId: 'prod-2', price: 2999, currency: 'USD' },
        ],
      };

      const result = validateBatchPriceUpdate(validBatch);
      expect(result.success).toBe(true);
    });

    it('should validate batch update with options', () => {
      const validBatch = {
        updates: [
          { externalId: 'prod-1', price: 1999, currency: 'USD' },
        ],
        validateOnly: true,
        stopOnError: false,
        metadata: { batchId: 'batch-1' },
      };

      const result = validateBatchPriceUpdate(validBatch);
      expect(result.success).toBe(true);
    });

    it('should reject batch update with empty updates array', () => {
      const invalidBatch = {
        updates: [],
      };

      const result = validateBatchPriceUpdate(invalidBatch);
      expect(result.success).toBe(false);
    });

    it('should reject batch update with invalid update', () => {
      const invalidBatch = {
        updates: [
          { externalId: 'prod-1', price: 1999, currency: 'USD' },
          { externalId: 'prod-2', price: -100, currency: 'USD' }, // Invalid
        ],
      };

      const result = validateBatchPriceUpdate(invalidBatch);
      expect(result.success).toBe(false);
    });
  });

  describe('validateProductFilter', () => {
    it('should validate empty filter', () => {
      const result = validateProductFilter({});
      expect(result.success).toBe(true);
    });

    it('should validate filter with all options', () => {
      const validFilter = {
        status: 'active',
        vendor: 'Acme Corp',
        productType: 'Widget',
        tags: ['sale', 'featured'],
        search: 'blue widget',
        sku: 'SKU-001',
        updatedAfter: new Date(),
        limit: 50,
        page: 1,
        cursor: 'cursor-123',
      };

      const result = validateProductFilter(validFilter);
      expect(result.success).toBe(true);
    });

    it('should reject filter with invalid status', () => {
      const invalidFilter = {
        status: 'invalid',
      };

      const result = validateProductFilter(invalidFilter);
      expect(result.success).toBe(false);
    });

    it('should reject filter with invalid limit', () => {
      const invalidFilter = {
        limit: 1000, // exceeds max of 250
      };

      const result = validateProductFilter(invalidFilter);
      expect(result.success).toBe(false);
    });
  });

  describe('sanitizeString', () => {
    it('should trim whitespace', () => {
      expect(sanitizeString('  hello  ')).toBe('hello');
      expect(sanitizeString('\n\ttest\n\t')).toBe('test');
    });

    it('should truncate to max length', () => {
      const longString = 'a'.repeat(300);
      const sanitized = sanitizeString(longString, 100);
      expect(sanitized.length).toBe(100);
    });

    it('should handle empty strings', () => {
      expect(sanitizeString('')).toBe('');
      expect(sanitizeString('   ')).toBe('');
    });
  });

  describe('sanitizeMetadata', () => {
    it('should keep valid primitive values', () => {
      const metadata = {
        string: 'value',
        number: 123,
        boolean: true,
        null: null,
      };

      const sanitized = sanitizeMetadata(metadata);
      expect(sanitized).toEqual(metadata);
    });

    it('should remove invalid values', () => {
      const metadata = {
        valid: 'value',
        object: { nested: 'value' },
        array: [1, 2, 3],
        undefined: undefined,
        function: () => {},
      };

      const sanitized = sanitizeMetadata(metadata);
      expect(sanitized).toEqual({ valid: 'value' });
    });

    it('should handle empty metadata', () => {
      const sanitized = sanitizeMetadata({});
      expect(sanitized).toEqual({});
    });
  });
});
