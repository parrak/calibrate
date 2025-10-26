/**
 * Shopify Products Tests
 * Tests for Shopify products operations
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { ShopifyProducts } from '../src/products';
import { ShopifyClient } from '../src/client';
import { ShopifyProduct, ShopifyVariant, ShopifyPriceUpdate } from '../src/types';

describe('ShopifyProducts', () => {
  let products: ShopifyProducts;
  let mockClient: any;

  beforeEach(() => {
    mockClient = {
      get: vi.fn(),
      put: vi.fn(),
      waitIfNeeded: vi.fn(),
    };

    products = new ShopifyProducts(mockClient as ShopifyClient);
  });

  describe('listProducts', () => {
    it('should list products with default options', async () => {
      const mockResponse = {
        products: [
          {
            id: '1',
            title: 'Test Product',
            handle: 'test-product',
            variants: [],
            createdAt: '2024-01-01T00:00:00Z',
            updatedAt: '2024-01-01T00:00:00Z',
          },
        ],
      };

      mockClient.get.mockResolvedValue(mockResponse);

      const result = await products.listProducts();

      expect(mockClient.get).toHaveBeenCalledWith('/products.json', {
        limit: 50,
        page: 1,
      });
      expect(result).toEqual(mockResponse);
    });

    it('should list products with custom options', async () => {
      const mockResponse = { products: [] };
      mockClient.get.mockResolvedValue(mockResponse);

      const options = {
        limit: 25,
        page: 2,
        vendor: 'Test Vendor',
        product_type: 'Electronics',
      };

      await products.listProducts(options);

      expect(mockClient.get).toHaveBeenCalledWith('/products.json', options);
    });
  });

  describe('getProduct', () => {
    it('should get a single product by ID', async () => {
      const mockResponse = {
        product: {
          id: '1',
          title: 'Test Product',
          handle: 'test-product',
          variants: [],
          createdAt: '2024-01-01T00:00:00Z',
          updatedAt: '2024-01-01T00:00:00Z',
        },
      };

      mockClient.get.mockResolvedValue(mockResponse);

      const result = await products.getProduct('1');

      expect(mockClient.get).toHaveBeenCalledWith('/products/1.json');
      expect(result).toEqual(mockResponse.product);
    });
  });

  describe('getProductByHandle', () => {
    it('should get product by handle', async () => {
      const mockResponse = {
        product: {
          id: '1',
          title: 'Test Product',
          handle: 'test-product',
          variants: [],
          createdAt: '2024-01-01T00:00:00Z',
          updatedAt: '2024-01-01T00:00:00Z',
        },
      };

      mockClient.get.mockResolvedValue(mockResponse);

      const result = await products.getProductByHandle('test-product');

      expect(mockClient.get).toHaveBeenCalledWith('/products.json?handle=test-product');
      expect(result).toEqual(mockResponse.product);
    });

    it('should return null for non-existent product', async () => {
      mockClient.get.mockRejectedValue({ response: { status: 404 } });

      const result = await products.getProductByHandle('non-existent');

      expect(result).toBeNull();
    });
  });

  describe('getProductVariants', () => {
    it('should get variants for a product', async () => {
      const mockProduct = {
        id: '1',
        title: 'Test Product',
        variants: [
          {
            id: '1',
            productId: '1',
            title: 'Default Title',
            price: '10.00',
            createdAt: '2024-01-01T00:00:00Z',
            updatedAt: '2024-01-01T00:00:00Z',
          },
        ],
      };

      mockClient.get.mockResolvedValue({ product: mockProduct });

      const result = await products.getProductVariants('1');

      expect(result).toEqual(mockProduct.variants);
    });
  });

  describe('getVariant', () => {
    it('should get a single variant by ID', async () => {
      const mockResponse = {
        variant: {
          id: '1',
          productId: '1',
          title: 'Default Title',
          price: '10.00',
          createdAt: '2024-01-01T00:00:00Z',
          updatedAt: '2024-01-01T00:00:00Z',
        },
      };

      mockClient.get.mockResolvedValue(mockResponse);

      const result = await products.getVariant('1');

      expect(mockClient.get).toHaveBeenCalledWith('/variants/1.json');
      expect(result).toEqual(mockResponse.variant);
    });
  });

  describe('updateVariantPrices', () => {
    it('should update multiple variant prices', async () => {
      const updates: ShopifyPriceUpdate[] = [
        { variantId: '1', price: '15.00' },
        { variantId: '2', price: '20.00' },
      ];

      const mockResponses = [
        { variant: { id: '1', price: '15.00' } },
        { variant: { id: '2', price: '20.00' } },
      ];

      mockClient.put
        .mockResolvedValueOnce(mockResponses[0])
        .mockResolvedValueOnce(mockResponses[1]);

      const result = await products.updateVariantPrices(updates);

      expect(mockClient.put).toHaveBeenCalledTimes(2);
      expect(mockClient.put).toHaveBeenCalledWith('/variants/1.json', {
        variant: {
          id: '1',
          price: '15.00',
          compare_at_price: null,
        },
      });
      expect(result).toEqual(mockResponses.map(r => r.variant));
    });

    it('should handle errors during price updates', async () => {
      const updates: ShopifyPriceUpdate[] = [
        { variantId: '1', price: '15.00' },
      ];

      mockClient.put.mockRejectedValue(new Error('Update failed'));

      await expect(products.updateVariantPrices(updates)).rejects.toThrow('Update failed');
    });
  });

  describe('updateVariantPrice', () => {
    it('should update a single variant price', async () => {
      const update: ShopifyPriceUpdate = { variantId: '1', price: '15.00' };
      const mockResponse = { variant: { id: '1', price: '15.00' } };

      mockClient.put.mockResolvedValue(mockResponse);

      const result = await products.updateVariantPrice(update);

      expect(result).toEqual(mockResponse.variant);
    });
  });

  describe('searchProducts', () => {
    it('should search products by query', async () => {
      const mockResponse = { products: [] };
      mockClient.get.mockResolvedValue(mockResponse);

      await products.searchProducts('test query');

      expect(mockClient.get).toHaveBeenCalledWith('/products.json', {
        title: 'test query',
        limit: 50,
        page: 1,
      });
    });
  });

  describe('getProductsByVendor', () => {
    it('should get products by vendor', async () => {
      const mockResponse = { products: [] };
      mockClient.get.mockResolvedValue(mockResponse);

      await products.getProductsByVendor('Test Vendor');

      expect(mockClient.get).toHaveBeenCalledWith('/products.json', {
        vendor: 'Test Vendor',
        limit: 50,
        page: 1,
      });
    });
  });

  describe('getProductsByType', () => {
    it('should get products by product type', async () => {
      const mockResponse = { products: [] };
      mockClient.get.mockResolvedValue(mockResponse);

      await products.getProductsByType('Electronics');

      expect(mockClient.get).toHaveBeenCalledWith('/products.json', {
        product_type: 'Electronics',
        limit: 50,
        page: 1,
      });
    });
  });

  describe('getRecentlyUpdatedProducts', () => {
    it('should get recently updated products', async () => {
      const mockResponse = { products: [] };
      mockClient.get.mockResolvedValue(mockResponse);

      await products.getRecentlyUpdatedProducts(24);

      expect(mockClient.get).toHaveBeenCalledWith('/products.json', {
        updated_at_min: expect.any(String),
        limit: 50,
        page: 1,
      });
    });
  });

  describe('getProductCount', () => {
    it('should get total product count', async () => {
      const mockResponse = { count: 100 };
      mockClient.get.mockResolvedValue(mockResponse);

      const result = await products.getProductCount();

      expect(mockClient.get).toHaveBeenCalledWith('/products/count.json');
      expect(result).toBe(100);
    });
  });

  describe('productExists', () => {
    it('should return true if product exists', async () => {
      mockClient.get.mockResolvedValue({ product: { id: '1' } });

      const result = await products.productExists('1');

      expect(result).toBe(true);
    });

    it('should return false if product does not exist', async () => {
      mockClient.get.mockRejectedValue({ response: { status: 404 } });

      const result = await products.productExists('999');

      expect(result).toBe(false);
    });
  });

  describe('variantExists', () => {
    it('should return true if variant exists', async () => {
      mockClient.get.mockResolvedValue({ variant: { id: '1' } });

      const result = await products.variantExists('1');

      expect(result).toBe(true);
    });

    it('should return false if variant does not exist', async () => {
      mockClient.get.mockRejectedValue({ response: { status: 404 } });

      const result = await products.variantExists('999');

      expect(result).toBe(false);
    });
  });
});
