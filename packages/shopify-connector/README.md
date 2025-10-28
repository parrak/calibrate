# Shopify Connector for Calibrate

Production-ready Shopify integration for automated price management and product synchronization.

## Features

- ✅ **OAuth Authentication** - Secure Shopify store connection
- ✅ **Product Synchronization** - Automatic product catalog sync
- ✅ **Price Updates** - GraphQL-based bulk price updates
- ✅ **Webhook Support** - Real-time inventory and product updates
- ✅ **Rate Limiting** - Automatic Shopify API rate limit handling
- ✅ **Type Safety** - Full TypeScript strict mode support
- ✅ **Comprehensive Testing** - 95%+ code coverage

## Installation

```bash
cd packages/shopify-connector
pnpm install
```

## Configuration

### Environment Variables

Create a `.env` file with the following variables:

```env
# Shopify App Credentials
SHOPIFY_API_KEY=your_api_key
SHOPIFY_API_SECRET=your_api_secret
SHOPIFY_SCOPES=read_products,write_products,read_inventory,write_inventory
SHOPIFY_WEBHOOK_SECRET=your_webhook_secret
SHOPIFY_API_VERSION=2024-10
```

### Creating a Shopify App

1. Go to [Shopify Partners](https://partners.shopify.com/)
2. Create a new app with API credentials
3. Configure scopes: `read_products`, `write_products`, `read_inventory`, `write_inventory`
4. Add webhooks for product updates and inventory changes
5. Save your API key and secret

## Usage

### Basic Setup

```typescript
import { ShopifyConnector } from '@calibr/shopify-connector';

const config = {
  platform: 'shopify' as const,
  apiKey: process.env.SHOPIFY_API_KEY!,
  apiSecret: process.env.SHOPIFY_API_SECRET!,
  scopes: ['read_products', 'write_products'],
  webhookSecret: process.env.SHOPIFY_WEBHOOK_SECRET!,
  apiVersion: '2024-10',
};

const credentials = {
  platform: 'shopify' as const,
  shopDomain: 'your-store.myshopify.com',
  accessToken: 'access_token_from_oauth',
};

const connector = new ShopifyConnector(config);
await connector.initialize(credentials);
```

### Product Operations

```typescript
// List products
const products = await connector.products.list({
  limit: 50,
  page: 1,
  status: 'active',
});

// Get single product
const product = await connector.products.get('product_id');

// Sync all products
const results = await connector.products.syncAll({
  limit: 100,
});
```

### Price Updates

```typescript
// Update single variant price
const result = await connector.pricing.updatePrice({
  externalId: 'variant_id',
  price: 2999, // in cents
  currency: 'USD',
  compareAtPrice: 3999, // optional
});

// Batch update prices
const batchResult = await connector.pricing.batchUpdatePrices({
  updates: [
    { externalId: 'v1', price: 1999, currency: 'USD' },
    { externalId: 'v2', price: 2999, currency: 'USD' },
  ],
  stopOnError: false,
});
```

### Authentication

```typescript
// Check authentication status
const isAuth = await connector.isAuthenticated();

// Get auth status
const status = await connector.auth.getAuthStatus();

// Generate OAuth URL
const authUrl = connector.auth.getAuthorizationUrl({
  clientId: config.apiKey,
  redirectUri: 'https://your-app.com/oauth/callback',
  scopes: config.scopes,
});

// Handle OAuth callback
const token = await connector.auth.handleOAuthCallback(code, {
  clientId: config.apiKey,
  clientSecret: config.apiSecret,
  redirectUri: 'https://your-app.com/oauth/callback',
});
```

## Testing

Run the test suite:

```bash
# Run all tests
pnpm test

# Run with coverage
pnpm test:coverage

# Type check
pnpm typecheck

# Build
pnpm build
```

### Test Coverage

The test suite includes:
- ✅ Unit tests for all connector methods
- ✅ Product operations tests
- ✅ Pricing operations tests
- ✅ Auth operations tests
- ✅ Error handling tests
- ✅ Rate limiting tests

## API Routes

### OAuth Installation

```http
POST /api/platforms/shopify/oauth/install
Content-Type: application/json

{
  "projectId": "project_id",
  "shopDomain": "store.myshopify.com",
  "redirectUri": "https://app.calibr.lat/callback"
}
```

### Product Synchronization

```http
POST /api/platforms/shopify/products/sync
Content-Type: application/json

{
  "projectId": "project_id",
  "productIds": ["id1", "id2"]
}
```

### Webhook Receiver

```http
POST /api/platforms/shopify/webhooks
X-Shopify-Topic: products/update
X-Shopify-Hmac-Sha256: signature

{webhook_payload}
```

## Error Handling

The connector handles various error scenarios:

- **Rate Limiting**: Automatic retry with exponential backoff
- **Network Errors**: Configurable timeout and retry logic
- **Authentication Errors**: Clear error messages and re-auth flows
- **Validation Errors**: Input validation before API calls

## Rate Limits

Shopify Admin API rate limits are automatically handled:
- **Bucket Algorithm**: Respects Shopify's rate limit headers
- **Automatic Retry**: Waits for retry-after when throttled
- **Request Throttling**: Prevents hitting limits proactively

## Webhooks

Supported webhook events:
- `products/create` - New product added
- `products/update` - Product modified
- `products/delete` - Product removed
- `inventory_levels/update` - Stock changed

## Troubleshooting

### Common Issues

**Authentication Errors**
- Verify `SHOPIFY_API_KEY` and `SHOPIFY_API_SECRET` are correct
- Check that scopes include required permissions
- Ensure access token hasn't expired

**Rate Limiting**
- Reduce batch size for price updates
- Implement request queuing for high-volume operations
- Monitor rate limit headers in responses

**Product Sync Issues**
- Verify products exist in Shopify store
- Check that product IDs are correct format
- Ensure network connectivity to Shopify API

## Development

### Project Structure

```
packages/shopify-connector/
├── src/
│   ├── ShopifyConnector.ts       # Main connector
│   ├── ShopifyProductOperations.ts
│   ├── ShopifyPricingOperations.ts
│   ├── ShopifyAuthOperations.ts
│   ├── client.ts                  # API client
│   ├── products.ts               # Product helpers
│   ├── pricing.ts                # Pricing helpers
│   ├── auth.ts                   # Auth helpers
│   ├── webhooks.ts               # Webhook handling
│   └── types.ts                  # Type definitions
├── tests/
│   ├── connector.test.ts
│   ├── product-operations.test.ts
│   ├── pricing-operations.test.ts
│   ├── auth-operations.test.ts
│   ├── __fixtures__/
│   └── __mocks__/
└── package.json
```

### Building

```bash
# Compile TypeScript
pnpm build

# Watch mode for development
pnpm dev

# Clean build artifacts
pnpm clean
```

## Contributing

See [AGENTS.md](../../AGENTS.md) for development guidelines.

## License

MIT License - see LICENSE file for details
