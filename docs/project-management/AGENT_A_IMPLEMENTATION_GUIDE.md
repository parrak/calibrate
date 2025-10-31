# Agent A: Shopify Connector Implementation Guide

**Package:** `packages/shopify-connector`
**Branch:** `feature/phase3-shopify-connector`
**Interfaces:** `@calibr/platform-connector`

---

## 🎯 Your Mission

Build a complete Shopify integration that implements the platform-connector interfaces. You'll enable Calibrate to authenticate with Shopify stores, sync products, and update prices via the Shopify Admin API and GraphQL.

---

## 📦 Setup

### 1. Create Your Branch

```bash
git checkout master
git pull origin master
git checkout -b feature/phase3-shopify-connector
```

### 2. Create Package Structure

```bash
mkdir -p packages/shopify-connector/src
mkdir -p packages/shopify-connector/tests
cd packages/shopify-connector
```

### 3. Initialize Package

Create `package.json`:

```json
{
  "name": "@calibr/shopify-connector",
  "version": "0.1.0",
  "description": "Shopify platform connector for Calibrate",
  "main": "./src/index.ts",
  "types": "./src/index.ts",
  "scripts": {
    "test": "vitest",
    "test:run": "vitest run",
    "typecheck": "tsc --noEmit"
  },
  "dependencies": {
    "@calibr/platform-connector": "workspace:*",
    "@shopify/shopify-api": "^10.0.0",
    "zod": "^3.22.4"
  },
  "devDependencies": {
    "@types/node": "^20.10.0",
    "typescript": "^5.3.3",
    "vitest": "^1.0.4"
  }
}
```

### 4. Install Dependencies

```bash
pnpm install
```

---

## 🔌 Implementing the Interfaces

### Core Class Structure

```typescript
// src/ShopifyConnector.ts
import {
  PlatformConnector,
  ProductOperations,
  PricingOperations,
  AuthOperations,
  PlatformConfig,
  PlatformCredentials,
  PlatformHealth,
  PlatformCapabilities,
} from '@calibr/platform-connector';

export interface ShopifyCredentials extends PlatformCredentials {
  platform: 'shopify';
  shopDomain: string;
  accessToken: string;
}

export class ShopifyConnector implements PlatformConnector {
  readonly platform = 'shopify' as const;
  readonly name = 'Shopify';
  readonly version = '1.0.0';

  readonly capabilities: PlatformCapabilities = {
    supportsOAuth: true,
    supportsWebhooks: true,
    supportsBatchUpdates: true,
    supportsInventoryTracking: true,
    supportsVariants: true,
    supportsCompareAtPrice: true,
    maxBatchSize: 100,
    rateLimit: {
      requestsPerSecond: 2,
      requestsPerDay: undefined,
    },
  };

  private shopifyClient: any; // Shopify API client

  constructor(
    public config: PlatformConfig,
    private credentials?: ShopifyCredentials
  ) {
    if (credentials) {
      this.initializeClient(credentials);
    }
  }

  // Implement required properties
  readonly auth: AuthOperations = new ShopifyAuthOperations(this);
  readonly products: ProductOperations = new ShopifyProductOperations(this);
  readonly pricing: PricingOperations = new ShopifyPricingOperations(this);

  // Implement required methods
  async isAuthenticated(): Promise<boolean> {
    return !!this.credentials && !!this.shopifyClient;
  }

  async initialize(credentials: PlatformCredentials): Promise<void> {
    this.credentials = credentials as ShopifyCredentials;
    this.initializeClient(this.credentials);
  }

  async disconnect(): Promise<void> {
    this.credentials = undefined;
    this.shopifyClient = null;
  }

  async healthCheck(): Promise<PlatformHealth> {
    const startTime = Date.now();

    try {
      // Make a lightweight API call to check connection
      await this.shopifyClient.shop.get();

      return {
        isHealthy: true,
        status: 'connected',
        lastChecked: new Date(),
        latency: Date.now() - startTime,
      };
    } catch (error) {
      return {
        isHealthy: false,
        status: 'error',
        lastChecked: new Date(),
        message: error.message,
        latency: Date.now() - startTime,
      };
    }
  }

  async testConnection(): Promise<boolean> {
    try {
      await this.shopifyClient.shop.get();
      return true;
    } catch {
      return false;
    }
  }

  private initializeClient(credentials: ShopifyCredentials): void {
    // Initialize Shopify API client
    // Use @shopify/shopify-api package
  }
}
```

---

## 1️⃣ Implementing AuthOperations

```typescript
// src/auth/ShopifyAuthOperations.ts
import {
  AuthOperations,
  AuthStatus,
  OAuthConfig,
  OAuthTokenResponse,
  PlatformCredentials,
} from '@calibr/platform-connector';

export class ShopifyAuthOperations implements AuthOperations {
  constructor(private connector: ShopifyConnector) {}

  async isAuthenticated(): Promise<boolean> {
    return this.connector.isAuthenticated();
  }

  async getAuthStatus(): Promise<AuthStatus> {
    const isAuth = await this.isAuthenticated();

    if (!isAuth) {
      return {
        isAuthenticated: false,
        error: 'No credentials provided',
      };
    }

    return {
      isAuthenticated: true,
      scope: ['read_products', 'write_products', 'read_inventory'],
      userId: this.connector.credentials.shopDomain,
    };
  }

  async authenticate(credentials: PlatformCredentials): Promise<void> {
    await this.connector.initialize(credentials);
  }

  async revoke(): Promise<void> {
    await this.connector.disconnect();
  }

  // OAuth flow methods
  getAuthorizationUrl(config: OAuthConfig): string {
    const { clientId, redirectUri, scopes, state } = config;
    const shop = this.connector.credentials?.shopDomain || '';

    const params = new URLSearchParams({
      client_id: clientId,
      scope: scopes.join(','),
      redirect_uri: redirectUri,
      state: state || '',
    });

    return `https://${shop}/admin/oauth/authorize?${params.toString()}`;
  }

  async handleOAuthCallback(
    code: string,
    config: OAuthConfig
  ): Promise<OAuthTokenResponse> {
    // Exchange code for access token
    const { clientId, clientSecret, redirectUri } = config;
    const shop = this.connector.credentials?.shopDomain || '';

    const response = await fetch(
      `https://${shop}/admin/oauth/access_token`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          client_id: clientId,
          client_secret: clientSecret,
          code,
        }),
      }
    );

    const data = await response.json();

    return {
      accessToken: data.access_token,
      scope: data.scope,
      tokenType: 'Bearer',
    };
  }
}
```

---

## 2️⃣ Implementing ProductOperations

```typescript
// src/products/ShopifyProductOperations.ts
import {
  ProductOperations,
  NormalizedProduct,
  NormalizedVariant,
  ProductFilter,
  ProductSyncResult,
  PaginatedResponse,
} from '@calibr/platform-connector';

export class ShopifyProductOperations implements ProductOperations {
  constructor(private connector: ShopifyConnector) {}

  async list(filter?: ProductFilter): Promise<PaginatedResponse<NormalizedProduct>> {
    // Call Shopify Admin API to list products
    const response = await this.connector.shopifyClient.product.list({
      limit: filter?.limit || 50,
      status: this.mapStatus(filter?.status),
      vendor: filter?.vendor,
      product_type: filter?.productType,
      // ... map other filters
    });

    return {
      data: response.products.map(this.normalizeProduct),
      pagination: {
        total: response.count,
        page: filter?.page || 1,
        limit: filter?.limit || 50,
        hasNext: response.products.length === (filter?.limit || 50),
        hasPrev: (filter?.page || 1) > 1,
      },
    };
  }

  async get(externalId: string): Promise<NormalizedProduct> {
    const product = await this.connector.shopifyClient.product.get(externalId);
    return this.normalizeProduct(product);
  }

  async getBySku(sku: string): Promise<NormalizedProduct | null> {
    // Search by SKU variant
    const variants = await this.connector.shopifyClient.variant.search({
      query: `sku:${sku}`,
    });

    if (variants.length === 0) return null;

    const productId = variants[0].product_id;
    return this.get(productId);
  }

  async sync(productId: string, externalId: string): Promise<ProductSyncResult> {
    try {
      const product = await this.get(externalId);

      // Update local database with product data
      // This will be implemented in your API layer

      return {
        productId,
        externalId,
        platform: 'shopify',
        success: true,
        syncedAt: new Date(),
      };
    } catch (error) {
      return {
        productId,
        externalId,
        platform: 'shopify',
        success: false,
        error: error.message,
        syncedAt: new Date(),
      };
    }
  }

  async syncAll(filter?: ProductFilter): Promise<ProductSyncResult[]> {
    const results: ProductSyncResult[] = [];
    let page = 1;
    let hasMore = true;

    while (hasMore) {
      const response = await this.list({ ...filter, page, limit: 50 });

      for (const product of response.data) {
        const result = await this.sync(
          `cal-${product.externalId}`,
          product.externalId
        );
        results.push(result);
      }

      hasMore = response.pagination.hasNext;
      page++;
    }

    return results;
  }

  async count(filter?: ProductFilter): Promise<number> {
    const response = await this.connector.shopifyClient.product.count({
      status: this.mapStatus(filter?.status),
      vendor: filter?.vendor,
      product_type: filter?.productType,
    });

    return response.count;
  }

  private normalizeProduct(shopifyProduct: any): NormalizedProduct {
    return {
      externalId: shopifyProduct.id.toString(),
      platform: 'shopify',
      title: shopifyProduct.title,
      description: shopifyProduct.body_html,
      vendor: shopifyProduct.vendor,
      productType: shopifyProduct.product_type,
      tags: shopifyProduct.tags.split(',').map((t: string) => t.trim()),
      status: this.normalizeStatus(shopifyProduct.status),
      images: shopifyProduct.images.map((img: any) => img.src),
      variants: shopifyProduct.variants.map(this.normalizeVariant),
      createdAt: new Date(shopifyProduct.created_at),
      updatedAt: new Date(shopifyProduct.updated_at),
      publishedAt: shopifyProduct.published_at
        ? new Date(shopifyProduct.published_at)
        : undefined,
      metadata: {
        shopifyHandle: shopifyProduct.handle,
        shopifyProductId: shopifyProduct.id,
      },
    };
  }

  private normalizeVariant(shopifyVariant: any): NormalizedVariant {
    return {
      externalId: shopifyVariant.id.toString(),
      sku: shopifyVariant.sku,
      title: shopifyVariant.title,
      price: Math.round(parseFloat(shopifyVariant.price) * 100), // Convert to cents
      compareAtPrice: shopifyVariant.compare_at_price
        ? Math.round(parseFloat(shopifyVariant.compare_at_price) * 100)
        : undefined,
      currency: 'USD', // Get from shop currency
      inventory: {
        quantity: shopifyVariant.inventory_quantity,
        tracked: shopifyVariant.inventory_management === 'shopify',
        available: shopifyVariant.inventory_quantity > 0,
      },
      options: {
        option1: shopifyVariant.option1,
        option2: shopifyVariant.option2,
        option3: shopifyVariant.option3,
      },
      barcode: shopifyVariant.barcode,
      imageUrl: shopifyVariant.image?.src,
      metadata: {
        shopifyVariantId: shopifyVariant.id,
        shopifyInventoryItemId: shopifyVariant.inventory_item_id,
      },
    };
  }

  private normalizeStatus(status: string): 'active' | 'draft' | 'archived' {
    if (status === 'active') return 'active';
    if (status === 'draft') return 'draft';
    return 'archived';
  }

  private mapStatus(status?: 'active' | 'draft' | 'archived'): string | undefined {
    return status; // Shopify uses same status names
  }
}
```

---

## 3️⃣ Implementing PricingOperations

```typescript
// src/pricing/ShopifyPricingOperations.ts
import {
  PricingOperations,
  NormalizedPrice,
  PriceUpdate,
  PriceUpdateResult,
  BatchPriceUpdate,
  BatchUpdateResult,
} from '@calibr/platform-connector';

export class ShopifyPricingOperations implements PricingOperations {
  constructor(private connector: ShopifyConnector) {}

  async getPrice(externalId: string): Promise<NormalizedPrice> {
    // Get variant by ID
    const variant = await this.connector.shopifyClient.variant.get(externalId);

    return {
      externalId: variant.id.toString(),
      platform: 'shopify',
      price: Math.round(parseFloat(variant.price) * 100),
      compareAtPrice: variant.compare_at_price
        ? Math.round(parseFloat(variant.compare_at_price) * 100)
        : undefined,
      currency: 'USD', // Get from shop
      updatedAt: new Date(variant.updated_at),
      metadata: {
        shopifyVariantId: variant.id,
      },
    };
  }

  async getPrices(externalIds: string[]): Promise<NormalizedPrice[]> {
    const prices = await Promise.all(
      externalIds.map((id) => this.getPrice(id))
    );
    return prices;
  }

  async updatePrice(update: PriceUpdate): Promise<PriceUpdateResult> {
    try {
      const oldVariant = await this.connector.shopifyClient.variant.get(
        update.externalId
      );
      const oldPrice = Math.round(parseFloat(oldVariant.price) * 100);

      // Update via GraphQL mutation
      const mutation = `
        mutation variantUpdate($input: ProductVariantInput!) {
          productVariantUpdate(input: $input) {
            productVariant {
              id
              price
              compareAtPrice
            }
            userErrors {
              field
              message
            }
          }
        }
      `;

      const variables = {
        input: {
          id: `gid://shopify/ProductVariant/${update.externalId}`,
          price: (update.price / 100).toFixed(2),
          compareAtPrice: update.compareAtPrice
            ? (update.compareAtPrice / 100).toFixed(2)
            : null,
        },
      };

      const response = await this.connector.shopifyClient.graphql(mutation, variables);

      if (response.data.productVariantUpdate.userErrors.length > 0) {
        const errors = response.data.productVariantUpdate.userErrors;
        throw new Error(errors.map((e: any) => e.message).join(', '));
      }

      return {
        externalId: update.externalId,
        platform: 'shopify',
        success: true,
        oldPrice,
        newPrice: update.price,
        currency: update.currency,
        updatedAt: new Date(),
      };
    } catch (error) {
      return {
        externalId: update.externalId,
        platform: 'shopify',
        success: false,
        currency: update.currency,
        updatedAt: new Date(),
        error: error.message,
        retryable: error.status === 429 || error.status >= 500,
      };
    }
  }

  async batchUpdatePrices(batchUpdate: BatchPriceUpdate): Promise<BatchUpdateResult> {
    const results: PriceUpdateResult[] = [];

    for (const update of batchUpdate.updates) {
      const result = await this.updatePrice(update);
      results.push(result);

      if (!result.success && batchUpdate.stopOnError) {
        break;
      }
    }

    const successful = results.filter((r) => r.success).length;
    const failed = results.filter((r) => !r.success).length;

    return {
      total: batchUpdate.updates.length,
      successful,
      failed,
      results,
      completedAt: new Date(),
      errors: results
        .filter((r) => !r.success)
        .map((r) => ({
          externalId: r.externalId,
          error: r.error || 'Unknown error',
        })),
    };
  }

  async validatePriceUpdate(update: PriceUpdate): Promise<{
    valid: boolean;
    errors?: string[];
  }> {
    const errors: string[] = [];

    // Validate price is positive
    if (update.price < 0) {
      errors.push('Price must be positive');
    }

    // Validate variant exists
    try {
      await this.connector.shopifyClient.variant.get(update.externalId);
    } catch {
      errors.push('Variant not found');
    }

    // Validate currency
    if (update.currency !== 'USD') {
      errors.push('Only USD currency is supported');
    }

    return {
      valid: errors.length === 0,
      errors: errors.length > 0 ? errors : undefined,
    };
  }
}
```

---

## 4️⃣ Register Your Connector

```typescript
// src/index.ts
import { ConnectorRegistry } from '@calibr/platform-connector';
import { ShopifyConnector } from './ShopifyConnector';

export * from './ShopifyConnector';
export * from './auth/ShopifyAuthOperations';
export * from './products/ShopifyProductOperations';
export * from './pricing/ShopifyPricingOperations';

// Auto-register when package is imported
ConnectorRegistry.register('shopify', async (config, credentials) => {
  const connector = new ShopifyConnector(config, credentials);
  if (credentials) {
    await connector.initialize(credentials);
  }
  return connector;
});
```

---

## ✅ Testing

Create comprehensive tests:

```typescript
// tests/ShopifyConnector.test.ts
import { describe, it, expect, beforeEach } from 'vitest';
import { ShopifyConnector } from '../src/ShopifyConnector';

describe('ShopifyConnector', () => {
  it('should implement PlatformConnector interface', () => {
    const connector = new ShopifyConnector({
      platform: 'shopify',
      name: 'Test Store',
      isActive: true,
    });

    expect(connector.platform).toBe('shopify');
    expect(connector.name).toBe('Shopify');
    expect(connector.capabilities).toBeDefined();
  });

  // Add more tests...
});
```

---

## 📝 Checklist

- [ ] Package structure created
- [ ] Dependencies installed
- [ ] `ShopifyConnector` implements `PlatformConnector`
- [ ] `ShopifyAuthOperations` implements `AuthOperations`
- [ ] `ShopifyProductOperations` implements `ProductOperations`
- [ ] `ShopifyPricingOperations` implements `PricingOperations`
- [ ] OAuth flow working
- [ ] GraphQL mutations for price updates
- [ ] Product normalization correct
- [ ] All tests passing
- [ ] README.md created
- [ ] Registered with ConnectorRegistry

---

## 🚀 Next Steps

1. Implement all interface methods
2. Write tests (aim for 95%+ coverage)
3. Update PHASE3_DAILY_LOG.md with progress
4. Commit and push to feature branch
5. Request review when ready

Good luck, Agent A! 🎉
