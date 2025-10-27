# Calibrate Platform Architecture Reference

This document provides a detailed technical architecture reference for the Calibrate platform.

## System Overview

Calibrate is a pricing automation platform that integrates with e-commerce platforms (Shopify, Amazon) to provide intelligent pricing strategies based on competitor analysis and business policies.

### Core Components

```
┌─────────────────────────────────────────────────────────────┐
│                      CALIBRATE PLATFORM                      │
├─────────────────────────────────────────────────────────────┤
│                                                              │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐     │
│  │   Console    │  │   API        │  │   Site       │     │
│  │   (Admin UI) │  │   (Backend)  │  │   (Landing)  │     │
│  │   :3001      │  │   :3000      │  │   :3002      │     │
│  └──────┬───────┘  └──────┬───────┘  └──────────────┘     │
│         │                 │                                 │
│         └────────┬─────────┘                                 │
│                  │                                           │
│         ┌────────▼─────────┐                                 │
│         │  Shared Packages  │                                │
│         └────────┬─────────┘                                 │
│                  │                                           │
│     ┌────────────┼────────────┐                             │
│     │            │            │                             │
│  ┌──▼──┐    ┌───▼───┐   ┌───▼───┐                          │
│  │ DB  │    │Connectors│ │ Pricing│                          │
│  └─────┘    └────┬───┘   └───────┘                          │
│                  │                                           │
│         ┌────────▼─────────┐                                 │
│         │   Platforms      │                                │
│         │  Shopify/Amazon  │                                │
│         └──────────────────┘                                 │
└─────────────────────────────────────────────────────────────┘
```

## Package Architecture

### packages/db
**Database layer with Prisma ORM**

- **Location:** `packages/db/`
- **Purpose:** Database schema, migrations, seed data
- **Exports:** `db` client, Prisma models
- **Usage:**
```typescript
import { db } from '@calibr/db';
const users = await db.user.findMany();
```

**Key Models:**
- `User` - Platform users
- `Organization` - Multi-tenant organizations
- `Product` - Product catalog
- `Sku` - Stock keeping units
- `PriceChange` - Price change history
- `Policy` - Pricing policies
- `PlatformIntegration` - Connected platforms
- `PlatformSyncLog` - Sync history
- `CompetitorPrice` - Competitor tracking

### packages/platform-connector
**Platform abstraction layer**

- **Location:** `packages/platform-connector/src/`
- **Purpose:** Unified interface for e-commerce platforms
- **Interfaces:**
  - `PlatformConnector` - Base connector interface
  - `AuthOperations` - OAuth and authentication
  - `ProductOperations` - Product CRUD operations
  - `PricingOperations` - Price management
- **Registration:**
```typescript
ConnectorRegistry.register('shopify', async (config, credentials) => {
  return new ShopifyConnector(config, credentials);
});
```

### packages/shopify-connector
**Shopify integration**

- **Location:** `packages/shopify-connector/src/`
- **Purpose:** Shopify Admin API integration
- **Key Files:**
  - `ShopifyConnector.ts` - Main connector class
  - `ShopifyAuthOperations.ts` - OAuth flow
  - `ShopifyProductOperations.ts` - Product management
  - `ShopifyPricingOperations.ts` - Price updates
  - `client.ts` - Admin API client
- **Status:** ✅ Complete
- **Dependencies:** `@shopify/admin-api-client`

### packages/amazon-connector
**Amazon SP-API integration**

- **Location:** `packages/amazon-connector/src/`
- **Purpose:** Amazon Selling Partner API integration
- **Key Files:**
  - `connector.ts` - Main connector class
  - `spapi-client.ts` - SP-API client
  - `feeds/` - Price feed management
  - `pricing.ts` - Pricing operations
- **Status:** ⚠️ 70% Complete
- **Dependencies:** Custom SP-API client

### packages/pricing-engine
**Policy evaluation engine**

- **Location:** `packages/pricing-engine/`
- **Purpose:** Evaluate pricing policies and apply price changes
- **Key Functions:**
  - `evaluatePolicy()` - Check if price change is allowed
  - `competitorRules()` - Competitor-based pricing rules
  - `applyPriceChange()` - Apply price change to system
- **Usage:**
```typescript
import { evaluatePolicy } from '@calibr/pricing-engine';
const result = await evaluatePolicy(priceChange, policy);
```

### packages/security
**Security utilities**

- **Location:** `packages/security/`
- **Purpose:** HMAC verification and idempotency
- **Exports:**
  - `verifyHmac()` - Webhook verification
  - `isIdempotent()` - Check for duplicate requests
- **Usage:**
```typescript
import { verifyHmac } from '@calibr/security';
const isValid = verifyHmac(payload, signature, secret);
```

### packages/ui
**Shared UI components**

- **Location:** `packages/ui/`
- **Purpose:** Reusable React components
- **Components:** Button, Card, Table, Badge, Drawer, etc.
- **Usage:**
```typescript
import { Button, Card } from '@calibr/ui';
```

### packages/config
**Environment configuration**

- **Location:** `packages/config/src/`
- **Purpose:** Centralized environment configuration
- **Exports:** Environment-specific settings

### packages/connectors
**Legacy connector stubs**

- **Location:** `packages/connectors/`
- **Purpose:** Legacy code (may be deprecated)
- **Files:** `amazon.ts`, `shopify.ts`

### packages/competitor-monitoring
**Competitor price tracking**

- **Location:** `packages/competitor-monitoring/`
- **Purpose:** Scrape competitor prices
- **Scrapers:** Shopify, Amazon, Google Shopping
- **Status:** ✅ Complete

## Application Architecture

### apps/api (Port 3000)
**Next.js API backend**

**Structure:**
```
apps/api/
├── app/
│   ├── api/              # API routes
│   │   ├── v1/           # API v1 endpoints
│   │   ├── platforms/    # Platform-specific routes
│   │   └── admin/       # Admin endpoints
│   └── health/           # Health check
├── lib/                  # Utilities
├── config/               # Configuration
├── zod/                  # Validation schemas
└── tests/                # Integration tests
```

**Key Endpoints:**
- `POST /api/v1/webhooks/price-suggestion` - Price suggestion webhook
- `GET /api/v1/price-changes` - List price changes
- `GET /api/v1/catalog` - Product catalog
- `POST /api/platforms/shopify/auth` - Shopify OAuth
- `POST /api/platforms/amazon/register` - Amazon registration
- `GET /api/health` - Health check

**Database Usage:**
```typescript
import { db } from '@calibr/db';
const products = await db.product.findMany({
  where: { organizationId },
});
```

### apps/console (Port 3001)
**Admin interface**

**Structure:**
```
apps/console/
├── app/
│   ├── (auth)/           # Authentication pages
│   ├── platforms/        # Platform integration pages
│   ├── pricing/          # Pricing management
│   └── dashboard/       # Dashboard
├── components/           # Page components
└── lib/                  # Utilities
```

**Features:**
- User authentication
- Platform integration management
- Price change review and approval
- Dashboard and analytics
- Policy management

### apps/site (Port 3002)
**Marketing landing page**

**Structure:**
```
apps/site/
├── app/
│   └── page.tsx         # Landing page
└── components/          # Landing page components
```

**Features:**
- Marketing content
- Feature showcase
- Call-to-action sections
- SEO optimization

### apps/docs (Port 3003)
**API documentation**

**Structure:**
```
apps/docs/
├── app/
│   └── page.tsx         # Docs page
└── api/
    └── swagger.yaml     # OpenAPI spec
```

**Features:**
- Interactive API documentation
- Swagger UI
- Code examples
- Authentication guide

## Data Flow

### Price Suggestion Workflow

```
External System → Webhook → API → Policy Engine → Database → Approval → Connector → Platform
     │               │         │         │           │           │           │
     │               │         │         │           │           │           └─→ Apply Price Change
     │               │         │         │           │           └─→ User Review
     │               │         │         │           └─→ Store Price Change
     │               │         │         └─→ Evaluate Policy
     │               │         └─→ Validate & Store
     │               └─→ HMAC Verification
     └─→ Send Price Suggestion
```

### Platform Integration Workflow

```
User → Console → API → Connector Registry → Connector → Platform API → Response → Console
 │        │       │          │                  │            │             │          │
 │        │       │          │                  │            │             │          └─→ Display Results
 │        │       │          │                  │            │             └─→ Store Sync Log
 │        │       │          │                  │            └─→ Platform API Call
 │        │       │          │                  └─→ Initialize Connector
 │        │       │          └─→ Create Connector Instance
 │        │       └─→ Receive Request
 │        └─→ User Action
 └─→ User Initiates Integration
```

## Technology Stack

### Core Technologies
- **TypeScript** - Type safety
- **Next.js 14** - Full-stack framework
- **Prisma** - Database ORM
- **PostgreSQL** - Database
- **React 18** - Frontend framework
- **Tailwind CSS** - Styling

### Development Tools
- **pnpm** - Package manager
- **Turborepo** - Monorepo build system
- **Vitest** - Testing framework
- **ESLint** - Linting
- **Prettier** - Code formatting

### Infrastructure
- **Railway** - API hosting and PostgreSQL
- **Vercel** - Frontend hosting
- **Docker** - Containerization

### External APIs
- **Shopify Admin API** - E-commerce platform
- **Amazon SP-API** - Marketplace integration
- **Competitor Scraping** - Price monitoring

## Database Schema

### Core Models

**Product**
```prisma
model Product {
  id             String   @id @default(uuid())
  code           String
  name           String
  organizationId String
  org            Organization @relation(fields: [organizationId], references: [id])
  skus           Sku[]
  priceChanges   PriceChange[]
}
```

**Policy**
```prisma
model Policy {
  id             String   @id @default(uuid())
  name           String
  maxDelta       Float
  dailyBudget    Float
  organizationId String
  rules          Json
}
```

**PlatformIntegration**
```prisma
model PlatformIntegration {
  id          String                 @id @default(uuid())
  platform    String                 // 'shopify' | 'amazon'
  status      PlatformConnectionStatus @default(DISCONNECTED)
  credentials Json?
  organizationId String
  syncLogs    PlatformSyncLog[]
}
```

## API Architecture

### RESTful Design
- Standard HTTP methods (GET, POST, PUT, DELETE)
- JSON request/response format
- Error handling with status codes
- Authentication via HMAC or JWT

### Response Format
```typescript
{
  success: boolean;
  data?: any;
  error?: {
    code: string;
    message: string;
  };
}
```

### Authentication
- **Webhooks:** HMAC verification
- **User Auth:** Session-based (Console)
- **Platform Auth:** OAuth 2.0 (Shopify, Amazon)

## Security

### Webhook Security
- HMAC signature verification
- Secret key validation
- Payload integrity check

### Data Security
- Parameterized queries (Prisma)
- Input validation (Zod)
- SQL injection prevention
- XSS prevention

### Authentication
- Secure session management
- OAuth 2.0 flows
- Credential encryption

## Deployment

### Production URLs
- **API:** https://api.calibr.lat
- **Console:** https://console.calibr.lat
- **Site:** https://calibr.lat
- **Docs:** https://docs.calibr.lat

### Deployment Process
1. Code committed to main branch
2. Railway/Vercel auto-deploys
3. Database migrations run automatically
4. Health checks verify deployment
5. Monitoring alerts on issues

### Environment Variables
- **DATABASE_URL** - PostgreSQL connection
- **WEBHOOK_SECRET** - HMAC secret
- **PLATFORM_API_KEYS** - Platform credentials
- **NODE_ENV** - Environment (production/staging)

## Performance

### Optimization Strategies
- Connection pooling (Prisma)
- Database indexing
- API response caching
- CDN for static assets
- Lazy loading for frontend

### Monitoring
- Railway logs
- Vercel analytics
- Error tracking
- Performance metrics

---

For implementation details, see:
- **ARCHITECTURE_DIAGRAM.md** - Component status
- **PHASE3_ROADMAP.md** - Development roadmap
- **.cursorrules** - Development rules

