# Agent B: Amazon Connector Implementation Guide

**Package:** `packages/amazon-connector`
**Branch:** `feature/phase3-amazon-connector`
**Interfaces:** `@calibr/platform-connector`

---

## 🎯 Your Mission

Build a complete Amazon Seller Central integration using SP-API (Selling Partner API) that implements the platform-connector interfaces. You'll enable Calibrate to authenticate via LWA (Login with Amazon), sync products, and submit price feeds.

---

## 📦 Setup

### 1. Create Your Branch

```bash
git checkout master
git pull origin master
git checkout -b feature/phase3-amazon-connector
```

### 2. Create Package Structure

```bash
mkdir -p packages/amazon-connector/src
mkdir -p packages/amazon-connector/tests
cd packages/amazon-connector
```

### 3. Initialize Package

Create `package.json`:

```json
{
  "name": "@calibr/amazon-connector",
  "version": "0.1.0",
  "description": "Amazon SP-API connector for Calibrate",
  "main": "./src/index.ts",
  "types": "./src/index.ts",
  "scripts": {
    "test": "vitest",
    "test:run": "vitest run",
    "typecheck": "tsc --noEmit"
  },
  "dependencies": {
    "@calibr/platform-connector": "workspace:*",
    "amazon-sp-api": "^2.0.0",
    "zod": "^3.22.4",
    "fast-xml-parser": "^4.3.0"
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
// src/AmazonConnector.ts
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

export interface AmazonCredentials extends PlatformCredentials {
  platform: 'amazon';
  clientId: string;
  clientSecret: string;
  refreshToken: string;
  sellerId: string;
  marketplaceId: string;
  region: 'na' | 'eu' | 'fe'; // North America, Europe, Far East
}

export class AmazonConnector implements PlatformConnector {
  readonly platform = 'amazon' as const;
  readonly name = 'Amazon';
  readonly version = '1.0.0';

  readonly capabilities: PlatformCapabilities = {
    supportsOAuth: false, // Uses LWA instead
    supportsWebhooks: true,
    supportsBatchUpdates: true,
    supportsInventoryTracking: true,
    supportsVariants: false, // Amazon doesn't use variants
    supportsCompareAtPrice: false,
    maxBatchSize: 10000, // Feed can handle many items
    rateLimit: {
      requestsPerSecond: 0.5, // Dynamic throttling by SP-API
    },
  };

  private spApiClient: any; // SP-API client
  private accessToken?: string;
  private tokenExpiry?: Date;

  constructor(
    public config: PlatformConfig,
    private credentials?: AmazonCredentials
  ) {
    if (credentials) {
      this.initializeClient(credentials);
    }
  }

  // Implement required properties
  readonly auth: AuthOperations = new AmazonAuthOperations(this);
  readonly products: ProductOperations = new AmazonProductOperations(this);
  readonly pricing: PricingOperations = new AmazonPricingOperations(this);

  // Implement required methods
  async isAuthenticated(): Promise<boolean> {
    if (!this.credentials || !this.accessToken) {
      return false;
    }

    // Check if token is expired
    if (this.tokenExpiry && new Date() >= this.tokenExpiry) {
      // Try to refresh
      try {
        await this.auth.refreshToken();
        return true;
      } catch {
        return false;
      }
    }

    return true;
  }

  async initialize(credentials: PlatformCredentials): Promise<void> {
    this.credentials = credentials as AmazonCredentials;
    await this.initializeClient(this.credentials);

    // Get initial access token
    await this.auth.refreshToken();
  }

  async disconnect(): Promise<void> {
    this.credentials = undefined;
    this.spApiClient = null;
    this.accessToken = undefined;
    this.tokenExpiry = undefined;
  }

  async healthCheck(): Promise<PlatformHealth> {
    const startTime = Date.now();

    try {
      // Make a lightweight API call
      await this.spApiClient.sellers.getMarketplaceParticipations();

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
      await this.spApiClient.sellers.getMarketplaceParticipations();
      return true;
    } catch {
      return false;
    }
  }

  private async initializeClient(credentials: AmazonCredentials): Promise<void> {
    // Initialize SP-API client
    // Use amazon-sp-api package
  }

  setAccessToken(token: string, expiresIn: number): void {
    this.accessToken = token;
    this.tokenExpiry = new Date(Date.now() + expiresIn * 1000);
  }
}
```

---

## 1️⃣ Implementing AuthOperations

```typescript
// src/auth/AmazonAuthOperations.ts
import {
  AuthOperations,
  AuthStatus,
  OAuthTokenResponse,
  PlatformCredentials,
} from '@calibr/platform-connector';

export class AmazonAuthOperations implements AuthOperations {
  constructor(private connector: AmazonConnector) {}

  async isAuthenticated(): Promise<boolean> {
    return this.connector.isAuthenticated();
  }

  async getAuthStatus(): Promise<AuthStatus> {
    const isAuth = await this.isAuthenticated();

    if (!isAuth) {
      return {
        isAuthenticated: false,
        error: 'No valid access token',
      };
    }

    return {
      isAuthenticated: true,
      expiresAt: this.connector.tokenExpiry,
      userId: this.connector.credentials.sellerId,
    };
  }

  async authenticate(credentials: PlatformCredentials): Promise<void> {
    await this.connector.initialize(credentials);
  }

  async revoke(): Promise<void> {
    await this.connector.disconnect();
  }

  // LWA Token Refresh
  async refreshToken(): Promise<OAuthTokenResponse> {
    const credentials = this.connector.credentials;

    if (!credentials) {
      throw new Error('No credentials available');
    }

    // Call LWA token endpoint
    const tokenUrl = 'https://api.amazon.com/auth/o2/token';

    const params = new URLSearchParams({
      grant_type: 'refresh_token',
      refresh_token: credentials.refreshToken,
      client_id: credentials.clientId,
      client_secret: credentials.clientSecret,
    });

    const response = await fetch(tokenUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: params.toString(),
    });

    if (!response.ok) {
      throw new Error(`Token refresh failed: ${response.statusText}`);
    }

    const data = await response.json();

    // Update connector with new token
    this.connector.setAccessToken(data.access_token, data.expires_in);

    return {
      accessToken: data.access_token,
      expiresIn: data.expires_in,
      expiresAt: new Date(Date.now() + data.expires_in * 1000),
      tokenType: 'bearer',
    };
  }

  async validateCredentials(credentials: PlatformCredentials): Promise<boolean> {
    try {
      const temp = new AmazonConnector(
        { platform: 'amazon', name: 'temp', isActive: false },
        credentials as AmazonCredentials
      );
      await temp.initialize(credentials);
      return await temp.testConnection();
    } catch {
      return false;
    }
  }
}
```

---

## 2️⃣ Implementing ProductOperations

```typescript
// src/products/AmazonProductOperations.ts
import {
  ProductOperations,
  NormalizedProduct,
  NormalizedVariant,
  ProductFilter,
  ProductSyncResult,
  PaginatedResponse,
} from '@calibr/platform-connector';

export class AmazonProductOperations implements ProductOperations {
  constructor(private connector: AmazonConnector) {}

  async list(filter?: ProductFilter): Promise<PaginatedResponse<NormalizedProduct>> {
    // Use Catalog Items API
    const response = await this.connector.spApiClient.catalogItems.searchCatalogItems({
      marketplaceIds: [this.connector.credentials.marketplaceId],
      keywords: filter?.search,
      pageSize: filter?.limit || 20,
      pageToken: filter?.cursor,
    });

    return {
      data: response.items.map(this.normalizeProduct),
      pagination: {
        total: undefined, // Amazon doesn't provide total count
        hasNext: !!response.pagination?.nextToken,
        hasPrev: false,
        nextCursor: response.pagination?.nextToken,
      },
    };
  }

  async get(externalId: string): Promise<NormalizedProduct> {
    // externalId is ASIN for Amazon
    const response = await this.connector.spApiClient.catalogItems.getCatalogItem(
      externalId,
      {
        marketplaceIds: [this.connector.credentials.marketplaceId],
        includedData: ['attributes', 'images', 'salesRanks', 'summaries'],
      }
    );

    return this.normalizeProduct(response);
  }

  async getBySku(sku: string): Promise<NormalizedProduct | null> {
    try {
      // Search by seller SKU
      const response = await this.connector.spApiClient.catalogItems.searchCatalogItems({
        marketplaceIds: [this.connector.credentials.marketplaceId],
        sellerSKU: sku,
      });

      if (response.items.length === 0) return null;

      return this.normalizeProduct(response.items[0]);
    } catch {
      return null;
    }
  }

  async sync(productId: string, externalId: string): Promise<ProductSyncResult> {
    try {
      const product = await this.get(externalId);

      // Update local database with product data
      // This will be implemented in your API layer

      return {
        productId,
        externalId,
        platform: 'amazon',
        success: true,
        syncedAt: new Date(),
      };
    } catch (error) {
      return {
        productId,
        externalId,
        platform: 'amazon',
        success: false,
        error: error.message,
        syncedAt: new Date(),
      };
    }
  }

  async syncAll(filter?: ProductFilter): Promise<ProductSyncResult[]> {
    const results: ProductSyncResult[] = [];
    let nextToken: string | undefined;

    do {
      const response = await this.list({ ...filter, cursor: nextToken });

      for (const product of response.data) {
        const result = await this.sync(
          `cal-${product.externalId}`,
          product.externalId
        );
        results.push(result);
      }

      nextToken = response.pagination.nextCursor;
    } while (nextToken);

    return results;
  }

  async count(filter?: ProductFilter): Promise<number> {
    // Amazon doesn't provide count endpoint
    // Would need to fetch all pages and count
    throw new Error('Count operation not supported by Amazon SP-API');
  }

  private normalizeProduct(amazonProduct: any): NormalizedProduct {
    const attributes = amazonProduct.attributes || {};
    const summaries = amazonProduct.summaries?.[0] || {};

    return {
      externalId: amazonProduct.asin,
      platform: 'amazon',
      title: summaries.itemName || attributes.item_name?.[0]?.value || '',
      description: attributes.product_description?.[0]?.value,
      vendor: attributes.brand?.[0]?.value,
      productType: summaries.productType,
      tags: [],
      status: 'active', // Amazon doesn't have draft/archived states
      images: amazonProduct.images?.map((img: any) => img.link) || [],
      variants: [this.normalizeVariant(amazonProduct)], // Amazon items are single variants
      createdAt: undefined, // Not provided by API
      updatedAt: undefined,
      metadata: {
        asin: amazonProduct.asin,
        marketplaceId: this.connector.credentials.marketplaceId,
        salesRank: amazonProduct.salesRanks,
      },
    };
  }

  private normalizeVariant(amazonProduct: any): NormalizedVariant {
    const summaries = amazonProduct.summaries?.[0] || {};

    return {
      externalId: amazonProduct.asin,
      sku: undefined, // SKU is seller-specific, not in catalog API
      title: summaries.itemName || '',
      price: 0, // Need to get from Pricing API
      currency: 'USD',
      metadata: {
        asin: amazonProduct.asin,
      },
    };
  }
}
```

---

## 3️⃣ Implementing PricingOperations

```typescript
// src/pricing/AmazonPricingOperations.ts
import {
  PricingOperations,
  NormalizedPrice,
  PriceUpdate,
  PriceUpdateResult,
  BatchPriceUpdate,
  BatchUpdateResult,
} from '@calibr/platform-connector';
import { XMLBuilder } from 'fast-xml-parser';

export class AmazonPricingOperations implements PricingOperations {
  constructor(private connector: AmazonConnector) {}

  async getPrice(externalId: string): Promise<NormalizedPrice> {
    // Use Product Pricing API
    const response = await this.connector.spApiClient.productPricing.getPricing({
      marketplaceId: this.connector.credentials.marketplaceId,
      asins: [externalId],
      itemType: 'Asin',
    });

    const pricing = response[0];

    return {
      externalId,
      platform: 'amazon',
      price: Math.round(pricing.Product.Offers[0].BuyingPrice.ListingPrice.Amount * 100),
      currency: pricing.Product.Offers[0].BuyingPrice.ListingPrice.CurrencyCode,
      updatedAt: new Date(),
      metadata: {
        asin: externalId,
        fulfillmentChannel: pricing.Product.Offers[0].FulfillmentChannel,
      },
    };
  }

  async getPrices(externalIds: string[]): Promise<NormalizedPrice[]> {
    // Can batch up to 20 ASINs
    const prices: NormalizedPrice[] = [];

    for (let i = 0; i < externalIds.length; i += 20) {
      const batch = externalIds.slice(i, i + 20);
      const response = await this.connector.spApiClient.productPricing.getPricing({
        marketplaceId: this.connector.credentials.marketplaceId,
        asins: batch,
        itemType: 'Asin',
      });

      prices.push(...response.map((p: any, idx: number) => ({
        externalId: batch[idx],
        platform: 'amazon' as const,
        price: Math.round(p.Product.Offers[0].BuyingPrice.ListingPrice.Amount * 100),
        currency: p.Product.Offers[0].BuyingPrice.ListingPrice.CurrencyCode,
        updatedAt: new Date(),
      })));
    }

    return prices;
  }

  async updatePrice(update: PriceUpdate): Promise<PriceUpdateResult> {
    // Amazon uses feeds for price updates
    // We'll submit a single-item feed
    const feed = this.buildPriceFeed([update]);

    try {
      const feedResult = await this.submitFeed(feed);

      return {
        externalId: update.externalId,
        platform: 'amazon',
        success: feedResult.success,
        newPrice: update.price,
        currency: update.currency,
        updatedAt: new Date(),
        metadata: {
          feedId: feedResult.feedId,
        },
      };
    } catch (error) {
      return {
        externalId: update.externalId,
        platform: 'amazon',
        success: false,
        currency: update.currency,
        updatedAt: new Date(),
        error: error.message,
        retryable: true,
      };
    }
  }

  async batchUpdatePrices(batchUpdate: BatchPriceUpdate): Promise<BatchUpdateResult> {
    // Build XML feed for all updates
    const feed = this.buildPriceFeed(batchUpdate.updates);

    try {
      const feedResult = await this.submitFeed(feed);

      // Poll for feed completion
      const processingResult = await this.waitForFeedProcessing(feedResult.feedId);

      return {
        total: batchUpdate.updates.length,
        successful: processingResult.successful,
        failed: processingResult.failed,
        results: batchUpdate.updates.map((update) => ({
          externalId: update.externalId,
          platform: 'amazon' as const,
          success: true, // Detailed results would come from processing report
          newPrice: update.price,
          currency: update.currency,
          updatedAt: new Date(),
        })),
        completedAt: new Date(),
      };
    } catch (error) {
      return {
        total: batchUpdate.updates.length,
        successful: 0,
        failed: batchUpdate.updates.length,
        results: [],
        completedAt: new Date(),
        errors: [{
          externalId: 'batch',
          error: error.message,
        }],
      };
    }
  }

  async validatePriceUpdate(update: PriceUpdate): Promise<{
    valid: boolean;
    errors?: string[];
  }> {
    const errors: string[] = [];

    if (update.price < 0) {
      errors.push('Price must be positive');
    }

    if (!update.sku) {
      errors.push('SKU is required for Amazon price updates');
    }

    return {
      valid: errors.length === 0,
      errors: errors.length > 0 ? errors : undefined,
    };
  }

  private buildPriceFeed(updates: PriceUpdate[]): string {
    const builder = new XMLBuilder({
      ignoreAttributes: false,
      format: true,
    });

    const feed = {
      AmazonEnvelope: {
        '@_xmlns:xsi': 'http://www.w3.org/2001/XMLSchema-instance',
        '@_xsi:noNamespaceSchemaLocation': 'amzn-envelope.xsd',
        Header: {
          DocumentVersion: '1.01',
          MerchantIdentifier: this.connector.credentials.sellerId,
        },
        MessageType: 'Price',
        Message: updates.map((update, index) => ({
          MessageID: index + 1,
          Price: {
            SKU: update.sku,
            StandardPrice: {
              '@_currency': update.currency,
              '#text': (update.price / 100).toFixed(2),
            },
          },
        })),
      },
    };

    return builder.build(feed);
  }

  private async submitFeed(feedContent: string): Promise<{
    feedId: string;
    success: boolean;
  }> {
    const response = await this.connector.spApiClient.feeds.createFeed({
      feedType: 'POST_PRODUCT_PRICING_DATA',
      marketplaceIds: [this.connector.credentials.marketplaceId],
      inputFeedDocumentId: await this.uploadFeedDocument(feedContent),
    });

    return {
      feedId: response.feedId,
      success: true,
    };
  }

  private async uploadFeedDocument(content: string): Promise<string> {
    // Create feed document
    const docResponse = await this.connector.spApiClient.feeds.createFeedDocument({
      contentType: 'text/xml; charset=UTF-8',
    });

    // Upload content
    await fetch(docResponse.url, {
      method: 'PUT',
      headers: {
        'Content-Type': 'text/xml; charset=UTF-8',
      },
      body: content,
    });

    return docResponse.feedDocumentId;
  }

  private async waitForFeedProcessing(feedId: string): Promise<{
    successful: number;
    failed: number;
  }> {
    // Poll feed status
    let attempts = 0;
    const maxAttempts = 30;

    while (attempts < maxAttempts) {
      const feed = await this.connector.spApiClient.feeds.getFeed(feedId);

      if (feed.processingStatus === 'DONE') {
        // Get processing report
        // Parse and return results
        return { successful: 1, failed: 0 }; // Simplified
      }

      if (feed.processingStatus === 'FATAL' || feed.processingStatus === 'CANCELLED') {
        throw new Error(`Feed processing failed: ${feed.processingStatus}`);
      }

      // Wait before next poll
      await new Promise((resolve) => setTimeout(resolve, 5000));
      attempts++;
    }

    throw new Error('Feed processing timeout');
  }
}
```

---

## 4️⃣ Register Your Connector

```typescript
// src/index.ts
import { ConnectorRegistry } from '@calibr/platform-connector';
import { AmazonConnector } from './AmazonConnector';

export * from './AmazonConnector';
export * from './auth/AmazonAuthOperations';
export * from './products/AmazonProductOperations';
export * from './pricing/AmazonPricingOperations';

// Auto-register when package is imported
ConnectorRegistry.register('amazon', async (config, credentials) => {
  const connector = new AmazonConnector(config, credentials);
  if (credentials) {
    await connector.initialize(credentials);
  }
  return connector;
});
```

---

## ✅ Testing

```typescript
// tests/AmazonConnector.test.ts
import { describe, it, expect } from 'vitest';
import { AmazonConnector } from '../src/AmazonConnector';

describe('AmazonConnector', () => {
  it('should implement PlatformConnector interface', () => {
    const connector = new AmazonConnector({
      platform: 'amazon',
      name: 'Test Seller',
      isActive: true,
    });

    expect(connector.platform).toBe('amazon');
    expect(connector.name).toBe('Amazon');
    expect(connector.capabilities).toBeDefined();
  });

  // Add more tests...
});
```

---

## 📝 Checklist

- [ ] Package structure created
- [ ] Dependencies installed
- [ ] `AmazonConnector` implements `PlatformConnector`
- [ ] `AmazonAuthOperations` implements `AuthOperations`
- [ ] `AmazonProductOperations` implements `ProductOperations`
- [ ] `AmazonPricingOperations` implements `PricingOperations`
- [ ] LWA token refresh working
- [ ] Feed submission and polling working
- [ ] Product catalog normalization correct
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

Good luck, Agent B! 🎉
