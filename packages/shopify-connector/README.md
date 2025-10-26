# Shopify Connector

A complete Shopify Admin API integration for the Calibrate pricing platform. This connector implements the `@calibr/platform-connector` interface to provide seamless integration with Shopify stores.

## Features

- **OAuth Authentication** - Secure OAuth 2.0 flow for Shopify app installation
- **Product Management** - Read, sync, and manage Shopify products and variants
- **Price Updates** - Update product prices via GraphQL mutations
- **Webhook Support** - Real-time notifications for inventory and product changes
- **Rate Limiting** - Built-in handling of Shopify's API rate limits
- **Error Handling** - Comprehensive error handling with retry logic

## Installation

```bash
pnpm add @calibr/shopify-connector
```

## Quick Start

### 1. Create Shopify App

First, create a Shopify app in your Partner Dashboard:

1. Go to [Shopify Partners](https://partners.shopify.com/)
2. Create a new app
3. Note your API key and secret
4. Set up OAuth redirect URLs

### 2. Initialize Connector

```typescript
import { ShopifyConnector, ShopifyConfig, ShopifyCredentials } from '@calibr/shopify-connector';

const config: ShopifyConfig = {
  platform: 'shopify',
  name: 'My Shopify Store',
  isActive: true,
  apiKey: 'your-api-key',
  apiSecret: 'your-api-secret',
  scopes: ['read_products', 'write_products', 'read_inventory'],
  webhookSecret: 'your-webhook-secret',
  apiVersion: '2024-10',
};

const credentials: ShopifyCredentials = {
  platform: 'shopify',
  shopDomain: 'your-store.myshopify.com',
  accessToken: 'your-access-token',
  scope: 'read_products,write_products,read_inventory',
};

const connector = new ShopifyConnector(config, credentials);
```

### 3. Test Connection

```typescript
const isConnected = await connector.testConnection();
console.log('Connected:', isConnected);

const health = await connector.healthCheck();
console.log('Health:', health);
```

## API Reference

### ShopifyConnector

Main connector class implementing the `PlatformConnector` interface.

#### Properties

- `platform: 'shopify'` - Platform identifier
- `name: 'Shopify'` - Human-readable name
- `version: '1.0.0'` - Connector version
- `capabilities: PlatformCapabilities` - Platform capabilities
- `config: ShopifyConfig` - Configuration
- `auth: AuthOperations` - Authentication operations
- `products: ProductOperations` - Product operations
- `pricing: PricingOperations` - Pricing operations

#### Methods

##### `isAuthenticated(): Promise<boolean>`

Check if the connector is authenticated and ready.

##### `initialize(credentials: PlatformCredentials): Promise<void>`

Initialize the connector with credentials.

##### `disconnect(): Promise<void>`

Disconnect and cleanup resources.

##### `healthCheck(): Promise<PlatformHealth>`

Perform a health check on the platform connection.

##### `testConnection(): Promise<boolean>`

Test the connection with a lightweight operation.

### Authentication Operations

#### `auth.getAuthStatus(): Promise<AuthStatus>`

Get current authentication status.

```typescript
const status = await connector.auth.getAuthStatus();
console.log('Authenticated:', status.isAuthenticated);
console.log('Scope:', status.scope);
```

#### `auth.getAuthorizationUrl(config: OAuthConfig): string`

Generate OAuth authorization URL.

```typescript
const authUrl = connector.auth.getAuthorizationUrl({
  clientId: 'your-client-id',
  redirectUri: 'https://yourapp.com/callback',
  scopes: ['read_products', 'write_products'],
  state: 'optional-state',
});
```

#### `auth.handleOAuthCallback(code: string, config: OAuthConfig): Promise<OAuthTokenResponse>`

Handle OAuth callback and exchange code for token.

```typescript
const tokenResponse = await connector.auth.handleOAuthCallback(code, {
  clientId: 'your-client-id',
  clientSecret: 'your-client-secret',
  redirectUri: 'https://yourapp.com/callback',
});
```

### Product Operations

#### `products.list(filter?: ProductFilter): Promise<PaginatedResponse<NormalizedProduct>>`

List products with optional filtering.

```typescript
const products = await connector.products.list({
  limit: 50,
  page: 1,
  vendor: 'Nike',
  productType: 'Shoes',
  search: 'running',
});
```

#### `products.get(externalId: string): Promise<NormalizedProduct>`

Get a single product by ID.

```typescript
const product = await connector.products.get('123456789');
```

#### `products.getBySku(sku: string): Promise<NormalizedProduct | null>`

Find product by SKU.

```typescript
const product = await connector.products.getBySku('SKU-123');
```

#### `products.sync(productId: string, externalId: string): Promise<ProductSyncResult>`

Sync a product from Shopify to local database.

```typescript
const result = await connector.products.sync('local-product-id', 'shopify-product-id');
```

#### `products.count(filter?: ProductFilter): Promise<number>`

Get total product count.

```typescript
const count = await connector.products.count({ vendor: 'Nike' });
```

### Pricing Operations

#### `pricing.getPrice(externalId: string): Promise<NormalizedPrice>`

Get current price for a variant.

```typescript
const price = await connector.pricing.getPrice('variant-id');
```

#### `pricing.updatePrice(update: PriceUpdate): Promise<PriceUpdateResult>`

Update a single variant price.

```typescript
const result = await connector.pricing.updatePrice({
  externalId: 'variant-id',
  price: 2999, // Price in cents
  currency: 'USD',
  compareAtPrice: 3999, // Optional compare-at price
});
```

#### `pricing.batchUpdatePrices(batchUpdate: BatchPriceUpdate): Promise<BatchUpdateResult>`

Update multiple prices in batch.

```typescript
const result = await connector.pricing.batchUpdatePrices({
  updates: [
    { externalId: 'variant-1', price: 2999, currency: 'USD' },
    { externalId: 'variant-2', price: 3999, currency: 'USD' },
  ],
  stopOnError: false,
});
```

#### `pricing.validatePriceUpdate(update: PriceUpdate): Promise<{valid: boolean, errors?: string[]}>`

Validate a price update before applying.

```typescript
const validation = await connector.pricing.validatePriceUpdate({
  externalId: 'variant-id',
  price: 2999,
  currency: 'USD',
});

if (!validation.valid) {
  console.log('Validation errors:', validation.errors);
}
```

## Configuration

### Environment Variables

```bash
SHOPIFY_API_KEY=your_api_key
SHOPIFY_API_SECRET=your_api_secret
SHOPIFY_SCOPES=read_products,write_products,read_inventory
SHOPIFY_WEBHOOK_SECRET=your_webhook_secret
```

### Required Scopes

- `read_products` - Read product and variant data
- `write_products` - Update product prices
- `read_inventory` - Read inventory levels

### Optional Scopes

- `read_orders` - Read order data
- `write_orders` - Update order status
- `read_customers` - Read customer data

## Error Handling

The connector uses the `PlatformError` class for standardized error handling:

```typescript
import { PlatformError } from '@calibr/platform-connector';

try {
  await connector.products.get('invalid-id');
} catch (error) {
  if (error instanceof PlatformError) {
    console.log('Error type:', error.type);
    console.log('Platform:', error.platform);
    console.log('Retryable:', error.retryable);
  }
}
```

### Error Types

- `authentication` - Auth/credential errors
- `authorization` - Permission/scope errors
- `rate_limit` - API rate limit exceeded
- `network` - Network/connectivity errors
- `validation` - Input validation errors
- `not_found` - Resource not found
- `server` - Platform server errors

## Rate Limiting

Shopify has strict rate limits (2 requests per second). The connector handles this automatically:

- Automatic retry with exponential backoff
- Rate limit detection from response headers
- Built-in throttling for batch operations

## Webhooks

The connector supports Shopify webhooks for real-time updates:

### Supported Webhook Topics

- `products/create` - New product created
- `products/update` - Product updated
- `products/delete` - Product deleted
- `inventory_levels/update` - Inventory updated
- `orders/create` - New order created
- `orders/updated` - Order updated

### Webhook Verification

```typescript
import { ShopifyWebhooks } from '@calibr/shopify-connector';

const webhooks = new ShopifyWebhooks(client, webhookSecret);
const verification = webhooks.verifyWebhookSignature(payload, signature);

if (verification.isValid) {
  console.log('Webhook payload:', verification.payload);
}
```

## Testing

Run the test suite:

```bash
pnpm test
```

Run with coverage:

```bash
pnpm test:coverage
```

## TypeScript Support

The connector is written in TypeScript and provides full type safety:

```typescript
import type { 
  ShopifyConnector, 
  ShopifyCredentials, 
  ShopifyConfig,
  NormalizedProduct,
  NormalizedPrice,
  PriceUpdate,
  ProductFilter 
} from '@calibr/shopify-connector';
```

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests for new functionality
5. Ensure all tests pass
6. Submit a pull request

## License

MIT License - see LICENSE file for details.

## Support

For issues and questions:

- Create an issue in the repository
- Check the documentation
- Review the test files for usage examples
