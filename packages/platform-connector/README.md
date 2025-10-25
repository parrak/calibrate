# @calibr/platform-connector

Platform abstraction layer for e-commerce integrations in the Calibrate pricing platform.

## Overview

This package provides a unified interface for connecting to various e-commerce platforms (Shopify, Amazon, etc.). It defines standard interfaces, types, and utilities that all platform-specific connectors must implement.

## Features

- ✅ **Unified Interfaces**: Standard interfaces for all platform connectors
- ✅ **Type Safety**: Full TypeScript support with comprehensive type definitions
- ✅ **Connector Registry**: Central registry for managing platform connectors
- ✅ **Validation**: Built-in validation for prices, products, and metadata
- ✅ **Normalization**: Utilities for normalizing data across platforms
- ✅ **Error Handling**: Standardized error types and handling
- ✅ **Well Tested**: 95%+ test coverage

## Installation

```bash
pnpm add @calibr/platform-connector
```

## Quick Start

### For Platform Connector Developers

If you're building a new platform connector (e.g., Shopify, Amazon):

```typescript
import {
  PlatformConnector,
  ProductOperations,
  PricingOperations,
  AuthOperations,
  PlatformConfig,
  PlatformCredentials,
  ConnectorRegistry
} from '@calibr/platform-connector';

// 1. Implement the PlatformConnector interface
export class MyPlatformConnector implements PlatformConnector {
  readonly platform = 'my_platform';
  readonly name = 'My Platform';
  readonly version = '1.0.0';
  readonly capabilities = {
    supportsOAuth: true,
    supportsWebhooks: true,
    supportsBatchUpdates: true,
    // ... other capabilities
  };

  constructor(
    public config: PlatformConfig,
    private credentials?: PlatformCredentials
  ) {}

  // Implement auth operations
  readonly auth: AuthOperations = {
    // ... implement auth methods
  };

  // Implement product operations
  readonly products: ProductOperations = {
    // ... implement product methods
  };

  // Implement pricing operations
  readonly pricing: PricingOperations = {
    // ... implement pricing methods
  };

  // ... implement other required methods
}

// 2. Register your connector
ConnectorRegistry.register('my_platform', async (config, credentials) => {
  const connector = new MyPlatformConnector(config, credentials);
  if (credentials) {
    await connector.initialize(credentials);
  }
  return connector;
});
```

### For Application Developers

If you're using platform connectors in your application:

```typescript
import { ConnectorRegistry } from '@calibr/platform-connector';

// Get a connector instance
const connector = await ConnectorRegistry.getConnector(
  'shopify',
  {
    platform: 'shopify',
    name: 'My Shopify Store',
    isActive: true,
  },
  {
    platform: 'shopify',
    shopDomain: 'mystore.myshopify.com',
    accessToken: 'shpat_xxxxx',
  }
);

// Use the connector
const products = await connector.products.list({ status: 'active' });

await connector.pricing.updatePrice({
  externalId: 'shopify-variant-123',
  price: 2999, // $29.99 in cents
  currency: 'USD',
});
```

## Core Interfaces

### PlatformConnector

Main interface that all platform connectors must implement.

```typescript
interface PlatformConnector {
  readonly platform: PlatformType;
  readonly name: string;
  readonly version: string;
  readonly capabilities: PlatformCapabilities;
  readonly config: PlatformConfig;

  readonly auth: AuthOperations;
  readonly products: ProductOperations;
  readonly pricing: PricingOperations;

  isAuthenticated(): Promise<boolean>;
  initialize(credentials: PlatformCredentials): Promise<void>;
  disconnect(): Promise<void>;
  healthCheck(): Promise<PlatformHealth>;
  testConnection(): Promise<boolean>;
}
```

### ProductOperations

Interface for product-related operations.

```typescript
interface ProductOperations {
  list(filter?: ProductFilter): Promise<PaginatedResponse<NormalizedProduct>>;
  get(externalId: string): Promise<NormalizedProduct>;
  getBySku(sku: string): Promise<NormalizedProduct | null>;
  sync(productId: string, externalId: string): Promise<ProductSyncResult>;
  syncAll(filter?: ProductFilter): Promise<ProductSyncResult[]>;
  count(filter?: ProductFilter): Promise<number>;
}
```

### PricingOperations

Interface for price update operations.

```typescript
interface PricingOperations {
  getPrice(externalId: string): Promise<NormalizedPrice>;
  getPrices(externalIds: string[]): Promise<NormalizedPrice[]>;
  updatePrice(update: PriceUpdate): Promise<PriceUpdateResult>;
  batchUpdatePrices(batchUpdate: BatchPriceUpdate): Promise<BatchUpdateResult>;
  validatePriceUpdate(update: PriceUpdate): Promise<{ valid: boolean; errors?: string[] }>;
  getPriceHistory?(externalId: string, limit?: number): Promise<PriceHistoryEntry[]>;
  revertPriceUpdate?(externalId: string): Promise<PriceUpdateResult>;
}
```

### AuthOperations

Interface for authentication operations.

```typescript
interface AuthOperations {
  isAuthenticated(): Promise<boolean>;
  getAuthStatus(): Promise<AuthStatus>;
  authenticate(credentials: PlatformCredentials): Promise<void>;
  refreshToken?(): Promise<OAuthTokenResponse>;
  revoke(): Promise<void>;
  getAuthorizationUrl?(config: OAuthConfig): string;
  handleOAuthCallback?(code: string, config: OAuthConfig): Promise<OAuthTokenResponse>;
  validateCredentials?(credentials: PlatformCredentials): Promise<boolean>;
}
```

## Type System

### Normalized Types

All platform connectors return normalized types to ensure consistency:

- `NormalizedProduct` - Platform-agnostic product representation
- `NormalizedVariant` - Platform-agnostic variant representation
- `NormalizedPrice` - Platform-agnostic price representation

### Platform-Specific Data

Platform-specific data is preserved in the `metadata` field:

```typescript
{
  externalId: 'shopify-123',
  platform: 'shopify',
  price: 2999,
  currency: 'USD',
  metadata: {
    shopifyInventoryItemId: '456',
    shopifyLocationId: '789',
    // ... other Shopify-specific data
  }
}
```

## Utilities

### Validation

```typescript
import { validatePriceUpdate, isValidCurrency, isValidPrice } from '@calibr/platform-connector';

// Validate a price update
const result = validatePriceUpdate({
  externalId: 'prod-123',
  price: 2999,
  currency: 'USD',
});

if (!result.success) {
  console.error(result.error);
}

// Validate individual fields
if (!isValidCurrency('USD')) {
  throw new Error('Invalid currency');
}

if (!isValidPrice(2999)) {
  throw new Error('Invalid price');
}
```

### Normalization

```typescript
import {
  dollarsToCents,
  centsToDollars,
  formatPrice,
  normalizeProductStatus,
  normalizeCurrency,
} from '@calibr/platform-connector';

// Convert prices
const cents = dollarsToCents(29.99); // 2999
const dollars = centsToDollars(2999); // 29.99
const formatted = formatPrice(2999, 'USD'); // "$29.99"

// Normalize statuses
const status = normalizeProductStatus('published'); // 'active'

// Normalize currency
const currency = normalizeCurrency('usd'); // 'USD'
```

### Error Handling

```typescript
import { PlatformError, createPlatformError, isPlatformError } from '@calibr/platform-connector';

try {
  await connector.pricing.updatePrice(update);
} catch (error) {
  if (isPlatformError(error)) {
    console.error(`Platform error: ${error.type} - ${error.message}`);

    if (error.retryable) {
      // Retry the operation
    }
  }
}

// Create a custom platform error
throw createPlatformError(
  'rate_limit',
  'API rate limit exceeded',
  'shopify',
  originalError,
  true // retryable
);
```

## Connector Registry

### Registering a Connector

```typescript
import { ConnectorRegistry } from '@calibr/platform-connector';

ConnectorRegistry.register('my_platform', async (config, credentials) => {
  return new MyPlatformConnector(config, credentials);
});
```

### Getting a Connector

```typescript
// Get or create a connector (with caching)
const connector = await ConnectorRegistry.getConnector(
  'shopify',
  config,
  credentials,
  'cache-key-project-123' // Optional cache key
);

// Always create a new instance
const connector = await ConnectorRegistry.createConnector(
  'shopify',
  config,
  credentials
);

// Check if platform is registered
if (ConnectorRegistry.isRegistered('shopify')) {
  // Platform is available
}

// Get all registered platforms
const platforms = ConnectorRegistry.getRegisteredPlatforms();
// ['shopify', 'amazon', 'google_shopping']
```

### Cache Management

```typescript
// Clear specific cache
ConnectorRegistry.clearCache('cache-key-project-123');

// Clear all cache
ConnectorRegistry.clearCache();

// Get cached instance
const cached = ConnectorRegistry.getCached('cache-key-project-123');
```

## Testing

```bash
# Run tests
pnpm test

# Run tests in watch mode
pnpm test:watch

# Run tests with coverage
pnpm test:run
```

## Architecture

```
packages/platform-connector/
├── src/
│   ├── types/              # Type definitions
│   │   ├── base.ts         # Base types (PlatformType, errors, etc.)
│   │   ├── product.ts      # Product and variant types
│   │   ├── pricing.ts      # Pricing types
│   │   └── integration.ts  # Integration metadata types
│   ├── interfaces/         # Core interfaces
│   │   ├── PlatformConnector.ts    # Main connector interface
│   │   ├── ProductOperations.ts    # Product operations
│   │   ├── PricingOperations.ts    # Pricing operations
│   │   └── AuthOperations.ts       # Auth operations
│   ├── registry/           # Connector registry
│   │   └── ConnectorRegistry.ts
│   ├── utils/              # Utility functions
│   │   ├── errors.ts       # Error handling utilities
│   │   ├── validation.ts   # Input validation
│   │   └── normalization.ts # Data normalization
│   └── index.ts            # Public exports
├── tests/                  # Test files
└── README.md              # This file
```

## Platform Connector Implementations

This package provides the foundation. Actual platform implementations are in separate packages:

- `@calibr/shopify-connector` - Shopify integration
- `@calibr/amazon-connector` - Amazon SP-API integration
- More coming soon...

## Contributing

See [PHASE3_ROADMAP.md](../../PHASE3_ROADMAP.md) for development guidelines.

## License

MIT
