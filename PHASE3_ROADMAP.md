# Phase 3: Platform Integrations - Roadmap

**Status:** 🚧 Planning
**Target Start:** October 25, 2025
**Estimated Duration:** 2-3 weeks
**Architecture:** Parallel development across 3 independent workstreams

---

## 🎯 Phase 3 Overview

Phase 3 focuses on **Platform Integrations** - connecting Calibrate to external e-commerce platforms to enable automated price updates and two-way data synchronization. This phase will enable the complete automation loop: monitor competitors → generate suggestions → approve changes → push to platforms.

### Key Objectives

1. **Shopify Integration** - Bi-directional sync with Shopify stores
2. **Amazon Integration** - Connect to Amazon Seller Central via SP-API
3. **Platform Abstraction** - Unified connector interface for future platforms

---

## 🏗️ Architecture: Three Independent Workstreams

Phase 3 is designed for **parallel development** with three agents working simultaneously on three separate packages. Each workstream is **completely independent** with no blocking dependencies.

```
Phase 3 Architecture (Parallel Development)
┌─────────────────────────────────────────────────────────────┐
│                    PHASE 3: INTEGRATIONS                     │
├──────────────────┬──────────────────┬──────────────────────┤
│   Workstream A   │   Workstream B   │    Workstream C      │
│                  │                  │                      │
│  Shopify         │  Amazon          │  Platform            │
│  Connector       │  Connector       │  Abstraction         │
│                  │                  │                      │
│  Agent 1         │  Agent 2         │  Agent 3             │
│  Focus:          │  Focus:          │  Focus:              │
│  - Admin API     │  - SP-API        │  - Base interfaces   │
│  - GraphQL       │  - Price feeds   │  - Registry          │
│  - Webhooks      │  - Inventory     │  - API routes        │
└──────────────────┴──────────────────┴──────────────────────┘
```

### Why This Works

- **No shared code**: Each package is independent during development
- **Clear interfaces**: Each connector implements the same interface (defined upfront)
- **Parallel testing**: Each can be tested independently
- **Merge flexibility**: Can be merged in any order or simultaneously

---

## 📦 Workstream A: Shopify Connector

**Package:** `packages/shopify-connector`
**Agent:** Agent A
**Dependencies:** None (standalone development)
**Estimated Duration:** 1-2 weeks

### Scope

Build a complete Shopify integration that enables:
- Reading product/variant data via Admin API
- Updating prices via GraphQL mutations
- Webhook subscription for inventory/price changes
- OAuth authentication flow

### Deliverables

#### 1. Core Connector (`packages/shopify-connector/src/`)

**Files to create:**
```
packages/shopify-connector/
├── src/
│   ├── client.ts              # Shopify Admin API client
│   ├── auth.ts                # OAuth flow implementation
│   ├── products.ts            # Product read/write operations
│   ├── pricing.ts             # Price update operations
│   ├── webhooks.ts            # Webhook management
│   ├── types.ts               # Shopify-specific types
│   └── index.ts               # Public exports
├── tests/
│   ├── client.test.ts
│   ├── products.test.ts
│   ├── pricing.test.ts
│   └── webhooks.test.ts
├── package.json
├── tsconfig.json
└── README.md
```

#### 2. API Routes (`apps/api/app/api/integrations/shopify/`)

**Files to create:**
```
apps/api/app/api/integrations/shopify/
├── oauth/
│   ├── route.ts               # OAuth callback handler
│   └── install/route.ts       # Installation endpoint
├── webhooks/
│   └── route.ts               # Webhook receiver
├── products/
│   └── route.ts               # Product sync endpoint
└── sync/
    └── route.ts               # Manual sync trigger
```

#### 3. Database Schema Updates

**Add to `packages/db/schema.prisma`:**
```prisma
model ShopifyIntegration {
  id              String   @id @default(cuid())
  projectId       String
  shopDomain      String   @unique
  accessToken     String   @db.Text
  scope           String
  installedAt     DateTime @default(now())
  isActive        Boolean  @default(true)

  project         Project  @relation(fields: [projectId], references: [id])

  @@index([projectId])
}

model ShopifyWebhookSubscription {
  id              String   @id @default(cuid())
  integrationId   String
  topic           String
  address         String
  webhookId       String   @unique
  createdAt       DateTime @default(now())

  integration     ShopifyIntegration @relation(fields: [integrationId], references: [id])

  @@index([integrationId])
}
```

#### 4. Console UI (`apps/console/app/p/[slug]/integrations/shopify/`)

**Files to create:**
```
apps/console/app/p/[slug]/integrations/shopify/
├── page.tsx                   # Main Shopify integration page
├── install/page.tsx           # Installation flow
└── components/
    ├── ShopifyAuthButton.tsx
    ├── ShopifyStatus.tsx
    └── ShopifySyncControls.tsx
```

#### 5. Testing Requirements

- Unit tests for all connector methods
- Integration tests with Shopify dev store
- Webhook signature verification tests
- OAuth flow simulation tests
- Error handling tests (rate limits, API errors)

#### 6. Documentation

- `packages/shopify-connector/README.md` - Setup and usage guide
- API endpoint documentation
- Environment variable requirements
- Shopify app configuration guide

### Technical Requirements

**Environment Variables:**
```bash
SHOPIFY_API_KEY=your_api_key
SHOPIFY_API_SECRET=your_api_secret
SHOPIFY_SCOPES=read_products,write_products,read_inventory
SHOPIFY_WEBHOOK_SECRET=your_webhook_secret
```

**Shopify Admin API Version:** 2024-10
**Authentication:** OAuth 2.0
**Rate Limiting:** Handle 40 req/sec limit

### Success Criteria

- ✅ OAuth flow completes successfully
- ✅ Can read products from Shopify store
- ✅ Can update variant prices via GraphQL
- ✅ Webhooks are received and verified
- ✅ All tests pass (100% coverage goal)
- ✅ UI allows connection management
- ✅ Console shows sync status

### Non-Goals (Out of Scope)

- ❌ Bulk product import (future phase)
- ❌ Inventory management (future phase)
- ❌ Multi-location support (future phase)
- ❌ Shopify Markets integration (future phase)

---

## 📦 Workstream B: Amazon Connector

**Package:** `packages/amazon-connector`
**Agent:** Agent B
**Dependencies:** None (standalone development)
**Estimated Duration:** 1-2 weeks

### Scope

Build Amazon Seller Central integration using SP-API (Selling Partner API) for:
- Reading product catalog and pricing
- Updating product prices
- Retrieving competitive pricing data
- Managing price feeds

### Deliverables

#### 1. Core Connector (`packages/amazon-connector/src/`)

**Files to create:**
```
packages/amazon-connector/
├── src/
│   ├── client.ts              # SP-API client with LWA auth
│   ├── auth.ts                # LWA token management
│   ├── catalog.ts             # Catalog Items API
│   ├── pricing.ts             # Product Pricing API
│   ├── feeds.ts               # Feeds API for price updates
│   ├── competitive.ts         # Competitive pricing data
│   ├── types.ts               # Amazon-specific types
│   └── index.ts               # Public exports
├── tests/
│   ├── client.test.ts
│   ├── catalog.test.ts
│   ├── pricing.test.ts
│   └── feeds.test.ts
├── package.json
├── tsconfig.json
└── README.md
```

#### 2. API Routes (`apps/api/app/api/integrations/amazon/`)

**Files to create:**
```
apps/api/app/api/integrations/amazon/
├── auth/
│   └── route.ts               # SP-API authorization
├── catalog/
│   └── route.ts               # Catalog sync endpoint
├── pricing/
│   └── route.ts               # Price update endpoint
└── competitive/
    └── route.ts               # Competitive pricing data
```

#### 3. Database Schema Updates

**Add to `packages/db/schema.prisma`:**
```prisma
model AmazonIntegration {
  id                  String   @id @default(cuid())
  projectId           String
  sellerId            String
  marketplaceId       String
  region              String   // NA, EU, FE

  // LWA credentials
  clientId            String
  clientSecret        String   @db.Text
  refreshToken        String   @db.Text
  accessToken         String?  @db.Text
  accessTokenExpiry   DateTime?

  isActive            Boolean  @default(true)
  connectedAt         DateTime @default(now())
  lastSyncAt          DateTime?

  project             Project  @relation(fields: [projectId], references: [id])

  @@unique([projectId, sellerId])
  @@index([projectId])
}

model AmazonPriceFeed {
  id              String   @id @default(cuid())
  integrationId   String
  feedId          String   @unique
  feedType        String   // POST_PRODUCT_PRICING_DATA
  status          String   // SUBMITTED, IN_PROGRESS, DONE, CANCELLED
  submittedAt     DateTime @default(now())
  completedAt     DateTime?
  resultDocument  String?  @db.Text

  integration     AmazonIntegration @relation(fields: [integrationId], references: [id])

  @@index([integrationId])
  @@index([feedId])
}
```

#### 4. Console UI (`apps/console/app/p/[slug]/integrations/amazon/`)

**Files to create:**
```
apps/console/app/p/[slug]/integrations/amazon/
├── page.tsx                   # Main Amazon integration page
├── setup/page.tsx             # SP-API credentials setup
└── components/
    ├── AmazonAuthForm.tsx
    ├── AmazonStatus.tsx
    ├── AmazonMarketplaceSelector.tsx
    └── FeedStatusMonitor.tsx
```

#### 5. Testing Requirements

- Unit tests for all SP-API operations
- LWA token refresh flow tests
- Feed submission and status polling tests
- XML feed generation tests
- Error handling (throttling, API errors)
- Multi-marketplace support tests

#### 6. Documentation

- `packages/amazon-connector/README.md` - Setup and usage guide
- SP-API app registration guide
- LWA credential configuration
- Marketplace ID reference
- Feed submission examples

### Technical Requirements

**Environment Variables:**
```bash
AMAZON_CLIENT_ID=your_lwa_client_id
AMAZON_CLIENT_SECRET=your_lwa_client_secret
AMAZON_SELLER_ID=your_seller_id
AMAZON_MARKETPLACE_ID=ATVPDKIKX0DER  # US marketplace
AMAZON_REGION=na  # North America
```

**SP-API Version:** Latest stable
**Authentication:** LWA (Login with Amazon)
**Rate Limiting:** Handle dynamic throttling

### Success Criteria

- ✅ LWA authentication works
- ✅ Can retrieve product catalog
- ✅ Can submit price update feeds
- ✅ Can poll feed processing status
- ✅ Can retrieve competitive pricing
- ✅ All tests pass (100% coverage goal)
- ✅ UI allows credential management
- ✅ Console shows feed status

### Non-Goals (Out of Scope)

- ❌ FBA inventory management (future phase)
- ❌ Order management (future phase)
- ❌ Advertising API integration (future phase)
- ❌ Multi-account support (future phase)

---

## 📦 Workstream C: Platform Abstraction Layer

**Package:** `packages/platform-connector`
**Agent:** Agent C
**Dependencies:** None (defines interfaces for A & B to implement)
**Estimated Duration:** 1-2 weeks

### Scope

Build a unified platform connector abstraction that:
- Defines standard interfaces for all e-commerce platforms
- Provides a registry for managing multiple platform connections
- Creates API routes for generic platform operations
- Builds UI components for platform management

This package provides the **foundation** that Shopify and Amazon connectors will implement.

### Deliverables

#### 1. Core Abstraction (`packages/platform-connector/src/`)

**Files to create:**
```
packages/platform-connector/
├── src/
│   ├── types/
│   │   ├── base.ts            # Base platform types
│   │   ├── product.ts         # Normalized product types
│   │   ├── pricing.ts         # Normalized pricing types
│   │   └── integration.ts     # Integration metadata types
│   ├── interfaces/
│   │   ├── PlatformConnector.ts    # Main connector interface
│   │   ├── ProductOperations.ts    # Product read/write interface
│   │   ├── PricingOperations.ts    # Pricing update interface
│   │   └── AuthOperations.ts       # Authentication interface
│   ├── registry/
│   │   ├── ConnectorRegistry.ts    # Platform connector registry
│   │   └── factory.ts              # Connector factory
│   ├── utils/
│   │   ├── normalization.ts        # Platform data normalization
│   │   ├── validation.ts           # Input validation
│   │   └── errors.ts               # Standard error types
│   └── index.ts
├── tests/
│   ├── registry.test.ts
│   ├── normalization.test.ts
│   └── validation.test.ts
├── package.json
├── tsconfig.json
└── README.md
```

#### 2. Base Interfaces Definition

**`src/interfaces/PlatformConnector.ts`** (Example):
```typescript
export interface PlatformConnector {
  // Metadata
  readonly platform: PlatformType;
  readonly name: string;
  readonly version: string;

  // Authentication
  isAuthenticated(): Promise<boolean>;
  authenticate(credentials: PlatformCredentials): Promise<void>;
  disconnect(): Promise<void>;

  // Product operations
  products: ProductOperations;

  // Pricing operations
  pricing: PricingOperations;

  // Health check
  healthCheck(): Promise<PlatformHealth>;
}

export interface ProductOperations {
  list(filters?: ProductFilter): Promise<NormalizedProduct[]>;
  get(externalId: string): Promise<NormalizedProduct>;
  sync(productId: string): Promise<void>;
}

export interface PricingOperations {
  updatePrice(update: PriceUpdate): Promise<PriceUpdateResult>;
  getPrice(externalId: string): Promise<NormalizedPrice>;
  batchUpdatePrices(updates: PriceUpdate[]): Promise<BatchUpdateResult>;
}
```

#### 3. API Routes (`apps/api/app/api/platforms/`)

**Files to create:**
```
apps/api/app/api/platforms/
├── route.ts                   # List all platforms
├── [platform]/
│   ├── route.ts               # Platform-specific operations
│   ├── connect/route.ts       # Generic connection endpoint
│   ├── disconnect/route.ts    # Generic disconnection
│   ├── status/route.ts        # Connection status
│   └── sync/route.ts          # Trigger sync
└── registry/
    └── route.ts               # Registry management
```

#### 4. Database Schema Updates

**Add to `packages/db/schema.prisma`:**
```prisma
model PlatformIntegration {
  id              String   @id @default(cuid())
  projectId       String
  platform        String   // shopify, amazon, google_shopping, etc.
  platformName    String   // Display name
  externalId      String?  // Platform-specific ID
  isActive        Boolean  @default(true)
  connectedAt     DateTime @default(now())
  lastSyncAt      DateTime?
  syncStatus      String?  // success, error, in_progress
  syncError       String?  @db.Text
  metadata        Json?    // Platform-specific metadata

  project         Project  @relation(fields: [projectId], references: [id])

  @@unique([projectId, platform])
  @@index([projectId])
  @@index([platform])
}

model PlatformSyncLog {
  id              String   @id @default(cuid())
  integrationId   String
  syncType        String   // full, incremental, manual
  status          String   // started, completed, failed
  startedAt       DateTime @default(now())
  completedAt     DateTime?
  itemsSynced     Int      @default(0)
  errors          Json?

  integration     PlatformIntegration @relation(fields: [integrationId], references: [id])

  @@index([integrationId])
  @@index([startedAt])
}
```

#### 5. Console UI Components (`apps/console/components/platforms/`)

**Files to create:**
```
apps/console/components/platforms/
├── PlatformCard.tsx           # Generic platform card
├── PlatformList.tsx           # List of available platforms
├── ConnectionStatus.tsx       # Connection status indicator
├── SyncStatus.tsx             # Sync status display
└── PlatformSettings.tsx       # Platform settings modal
```

**Page:** `apps/console/app/p/[slug]/integrations/page.tsx`
```typescript
// Main integrations dashboard showing all platforms
```

#### 6. Testing Requirements

- Unit tests for registry operations
- Interface compliance tests
- Normalization utility tests
- Mock connector implementation for testing
- API route tests

#### 7. Documentation

- `packages/platform-connector/README.md` - Architecture guide
- Interface documentation for connector developers
- "How to add a new platform" guide
- API endpoint documentation

### Technical Requirements

**Design Principles:**
- **Platform-agnostic**: No platform-specific code in this package
- **Type-safe**: Strong TypeScript interfaces
- **Extensible**: Easy to add new platforms
- **Observable**: Built-in logging and monitoring hooks

**Key Patterns:**
- Factory pattern for connector instantiation
- Strategy pattern for platform-specific behavior
- Repository pattern for data access
- Observer pattern for sync events

### Success Criteria

- ✅ Clean, well-documented interfaces
- ✅ Registry can register/retrieve connectors
- ✅ Normalization utilities work correctly
- ✅ Generic API routes handle all platforms
- ✅ UI components are platform-agnostic
- ✅ All tests pass (100% coverage goal)
- ✅ Documentation is comprehensive

### How Shopify & Amazon Will Use This

**Shopify Connector Implementation:**
```typescript
import { PlatformConnector, ProductOperations } from '@calibr/platform-connector';

export class ShopifyConnector implements PlatformConnector {
  readonly platform = 'shopify';
  readonly name = 'Shopify';
  readonly version = '1.0.0';

  products: ProductOperations = new ShopifyProductOperations(this.client);
  pricing: PricingOperations = new ShopifyPricingOperations(this.client);

  // ... implement all interface methods
}

// Register with the platform
import { ConnectorRegistry } from '@calibr/platform-connector';
ConnectorRegistry.register('shopify', ShopifyConnector);
```

---

## 🔄 Integration & Coordination

### Phase Boundaries

**Week 1:**
- All three agents work independently
- Workstream C defines interfaces (locked down by end of week 1)
- Workstreams A & B implement against agreed interfaces
- Daily sync to ensure interface alignment

**Week 2:**
- Continue independent development
- Integration testing begins
- Cross-connector testing (e.g., same product across platforms)

**Week 3:**
- Final integration
- End-to-end testing
- Documentation completion
- Merge all three workstreams

### Communication Protocol

**Shared Interface Agreement:**
- Workstream C proposes interfaces (Day 1-2)
- Workstreams A & B review and provide feedback (Day 2-3)
- Interfaces locked down (Day 3)
- All workstreams proceed independently

**Async Updates:**
- Daily standup notes in `PHASE3_DAILY_LOG.md`
- No blocking dependencies between workstreams
- Questions posted in shared document, answered async

### Testing Strategy

**Independent Testing:**
- Each workstream has full test coverage
- Mock implementations for dependencies
- No shared test infrastructure needed

**Integration Testing (Week 2-3):**
- Cross-platform product sync tests
- Registry with multiple connectors
- UI with multiple platforms connected
- End-to-end price update flow

---

## 🎯 Phase 3 Success Criteria

### Overall Goals

- ✅ All three connectors implemented and tested
- ✅ Platform abstraction layer complete
- ✅ Can connect to Shopify store and update prices
- ✅ Can connect to Amazon Seller Central and submit price feeds
- ✅ UI shows all platform connections and status
- ✅ API routes handle all platform operations
- ✅ Complete test coverage across all packages
- ✅ Comprehensive documentation for all integrations

### Merge Requirements

Each workstream must meet these criteria before merge:

1. **Code Quality:**
   - All tests passing
   - 95%+ test coverage
   - No TypeScript errors
   - Linting passes

2. **Documentation:**
   - README with setup guide
   - API documentation
   - Code comments for complex logic

3. **Database:**
   - Migration files included
   - Seed data updated
   - No breaking changes to existing schema

4. **UI:**
   - Responsive design
   - Loading states
   - Error handling
   - Consistent with design system

### Post-Merge Validation

After all three workstreams are merged:

1. Run full test suite
2. Test price update flow end-to-end:
   - Competitor monitoring detects price change
   - Policy generates price suggestion
   - Approval in console
   - Price pushed to Shopify + Amazon
3. Verify UI shows all platforms correctly
4. Update CHANGELOG.md
5. Create PHASE3_COMPLETE.md

---

## 📊 Timeline & Milestones

### Week 1: Foundation & Independent Development
**Days 1-2:**
- Workstream C: Define and publish interfaces
- Workstreams A & B: Review interfaces, set up packages

**Days 3-5:**
- All: Independent development begins
- All: Daily async status updates

**Day 5:**
- Milestone: Interfaces locked, basic structure complete

### Week 2: Implementation & Integration
**Days 6-10:**
- All: Continue feature development
- All: Begin integration testing
- All: Cross-workstream testing

**Day 10:**
- Milestone: Core features complete, integration testing underway

### Week 3: Polish & Merge
**Days 11-14:**
- All: Bug fixes and polish
- All: Documentation completion
- All: Prepare for merge

**Days 15-16:**
- Merge all workstreams
- Final integration testing
- Deploy to staging

**Day 17:**
- Milestone: Phase 3 Complete

---

## 🚀 Next Steps (Phase 4+)

After Phase 3 completion:

### Phase 4: Automation & Workflows
- Automated price updates based on competitor rules
- Scheduled sync jobs
- Approval workflows
- Notification system

### Phase 5: Analytics & Insights
- Cross-platform analytics
- Price performance tracking
- Competitive intelligence
- Revenue impact analysis

### Future Platforms
- Google Shopping (already have scraper from Phase 2)
- WooCommerce
- BigCommerce
- Magento
- Custom platforms via API

---

## 📝 Agent Assignment

**Agent A - Shopify Specialist:**
- Focus: Shopify Admin API, GraphQL, OAuth
- Package: `packages/shopify-connector`
- Branch: `feature/phase3-shopify-connector`

**Agent B - Amazon Specialist:**
- Focus: SP-API, LWA, XML Feeds
- Package: `packages/amazon-connector`
- Branch: `feature/phase3-amazon-connector`

**Agent C - Platform Architect:**
- Focus: Abstractions, interfaces, registry
- Package: `packages/platform-connector`
- Branch: `feature/phase3-platform-abstraction`

---

**Status:** 🚧 Ready to Begin
**Coordination:** Async via `PHASE3_DAILY_LOG.md`
**Target Completion:** 2-3 weeks from start

---

Generated with Claude Code
Co-Authored-By: Claude <noreply@anthropic.com>
