# Competitor Monitoring Features

This document describes the competitor monitoring features adapted from Prisync for Shopify and integrated into the Calibrate platform.

## Overview

The competitor monitoring system allows you to:
- Track competitor prices across multiple channels (Shopify, Amazon, Google Shopping)
- Set up automated pricing rules based on competitor data
- Monitor price changes and market positioning
- Generate insights and analytics on competitive pricing

## Features Implemented

### 1. Competitor Management
- **Add Competitors**: Track competitors by name, domain, and channel
- **Product Mapping**: Map competitor products to your SKUs
- **Channel Support**: Support for Shopify, Amazon, and Google Shopping
- **Status Management**: Enable/disable competitor monitoring
- **UI**: Dedicated competitors page with Monitor, Analytics, and Rules tabs

### 2. Price Monitoring
- **Automated Scraping**: Monitor competitor prices automatically with channel-specific scrapers
  - **Shopify**: Uses JSON product API for reliable extraction
  - **Amazon**: Stub implementation (requires Product Advertising API setup)
  - **Google Shopping**: Stub implementation (requires Content API or SerpAPI)
- **Auto-detection**: Automatically detect channel from product URLs
- **Historical Tracking**: Store price history for trend analysis
- **Real-time Updates**: Get notified of price changes via monitoring dashboard
- **Multi-currency Support**: Handle different currencies
- **Sale Detection**: Track when competitor products are on sale

### 3. Pricing Rules Engine
- **Beat by Percentage**: Automatically price below competitors by a percentage
- **Beat by Amount**: Price below competitors by a fixed amount
- **Match Pricing**: Match the lowest competitor price
- **Avoid Race to Bottom**: Prevent pricing too low relative to market average
- **Margin Protection**: Ensure minimum profit margins
- **Price Constraints**: Set minimum and maximum price limits

### 4. Analytics & Insights
- **Price Comparisons**: Compare your prices with competitors side-by-side
- **Market Position**: See where you stand in the market (lowest/highest/middle)
- **Price Spread Analysis**: Understand price ranges and market dynamics
- **Market Insights Dashboard**: Visual analytics with:
  - Average market price tracking
  - Min/max competitor prices
  - Your position relative to competitors
  - Per-SKU price comparisons with competitor breakdown
- **Trend Analysis**: Track price changes over time (via historical data)

## Database Schema

### New Models Added

#### Competitor
```sql
model Competitor {
  id          String   @id @default(cuid())
  tenantId    String
  projectId   String
  name        String
  domain      String
  channel     String   // 'shopify', 'amazon', 'google_shopping', etc.
  isActive    Boolean  @default(true)
  lastChecked DateTime?
  createdAt   DateTime @default(now())
  updatedAt   DateTime @updatedAt
  products    CompetitorProduct[]
}
```

#### CompetitorProduct
```sql
model CompetitorProduct {
  id           String   @id @default(cuid())
  competitorId String
  skuId        String?  // Link to your SKU
  name         String
  skuCode      String?  // Competitor's SKU code
  url          String
  imageUrl     String?
  isActive     Boolean  @default(true)
  createdAt    DateTime @default(now())
  updatedAt    DateTime @updatedAt
  prices       CompetitorPrice[]
}
```

#### CompetitorPrice
```sql
model CompetitorPrice {
  id           String   @id @default(cuid())
  productId    String
  amount       Int      // Price in minor units (cents)
  currency     String
  channel      String?  // Specific channel within competitor
  isOnSale     Boolean  @default(false)
  saleEndsAt   DateTime?
  stockStatus  String?  // 'in_stock', 'out_of_stock', 'limited'
  createdAt    DateTime @default(now())
}
```

#### CompetitorRule
```sql
model CompetitorRule {
  id           String   @id @default(cuid())
  tenantId     String
  projectId    String
  name         String
  description  String?
  isActive     Boolean  @default(true)
  rules        Json     // Pricing rules configuration
  createdAt    DateTime @default(now())
  updatedAt    DateTime @updatedAt
}
```

## API Endpoints

### Competitors
- `GET /api/v1/competitors` - List competitors
- `POST /api/v1/competitors` - Create competitor
- `GET /api/v1/competitors/[id]` - Get competitor details
- `PUT /api/v1/competitors/[id]` - Update competitor
- `DELETE /api/v1/competitors/[id]` - Delete competitor

### Competitor Products
- `GET /api/v1/competitors/[id]/products` - List competitor products
- `POST /api/v1/competitors/[id]/products` - Add competitor product

### Monitoring
- `POST /api/v1/competitors/monitor` - Start monitoring

### Rules
- `GET /api/v1/competitors/rules` - List pricing rules
- `POST /api/v1/competitors/rules` - Create pricing rule

## Usage Examples

### 1. Adding a Competitor

```typescript
const competitor = await fetch('/api/v1/competitors', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    tenantId: 'tenant_1',
    projectId: 'project_1',
    name: 'Competitor Store',
    domain: 'competitor.com',
    channel: 'shopify'
  })
})
```

### 2. Creating a Pricing Rule

```typescript
const rule = await fetch('/api/v1/competitors/rules', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    tenantId: 'tenant_1',
    projectId: 'project_1',
    name: 'Beat Competitors by 5%',
    description: 'Always price 5% below the lowest competitor',
    rules: {
      type: 'beat_by_percent',
      value: 5,
      minMargin: 10,
      minPrice: 500
    }
  })
})
```

### 3. Starting Monitoring

```typescript
const results = await fetch('/api/v1/competitors/monitor', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    tenantId: 'tenant_1',
    projectId: 'project_1'
  })
})
```

## UI Components

### CompetitorMonitor
- Displays competitor list with status
- Shows monitoring results
- Lists recent price updates
- Provides monitoring controls

### CompetitorRules
- Rule creation and management
- Rule configuration forms
- Rule status and performance

### CompetitorAnalytics (NEW)
- Market position dashboard with visual indicators
- Average market price tracking
- Price spread analysis (min/max competitor prices)
- Per-product price comparisons with competitor breakdown
- Sale indicators and alerts

## Implementation Details

### Web Scraping Architecture

The scraping system is built with a modular, channel-specific approach:

**File Structure:**
```
packages/competitor-monitoring/
├── scrapers/
│   ├── shopify.ts          # Shopify JSON API scraper
│   ├── amazon.ts           # Amazon stub (API integration guide)
│   ├── google-shopping.ts  # Google Shopping stub (API integration guide)
│   ├── index.ts            # Auto-detection and routing
│   ├── *.test.ts           # Comprehensive unit tests
├── monitor.ts              # CompetitorMonitor class
└── types.ts                # TypeScript interfaces
```

**Shopify Scraper (Fully Implemented):**
- Uses Shopify's `.json` product endpoint for reliable data
- Extracts price, compare_at_price, availability, inventory
- Detects sale status and stock levels
- Returns data in standardized `CompetitorPriceData` format

**Amazon & Google Shopping (Stubs):**
- Provide clear guidance for API integration
- Return mock data in development mode
- Include helper functions for URL parsing (ASIN extraction, etc.)
- Ready for production API integration

**Auto-detection:**
```typescript
import { scrapePrice, detectChannel } from '@calibrate/competitor-monitoring/scrapers'

// Automatically detect channel and scrape
const result = await scrapePrice(productUrl, productId)

// Or specify channel explicitly
const result = await scrapePrice(productUrl, productId, 'shopify')
```

### Testing

All scrapers include comprehensive unit tests:
- URL parsing and validation
- Channel detection logic
- ASIN/handle extraction
- Error handling

Run tests:
```bash
pnpm --filter @calibrate/competitor-monitoring test:run
```

**Current Test Coverage:** 31 passing tests across 5 test files

## Configuration

### Environment Variables
No additional environment variables are required. The system uses the existing database connection.

### Database Migration
Run the migration to add the new tables:
```bash
pnpm migrate
```

## Testing

Run the tests for the new features:
```bash
# Test competitor monitoring
pnpm --filter @calibrate/competitor-monitoring test

# Test pricing rules
pnpm --filter @calibr/pricing-engine test
```

## Production Setup for Amazon & Google Shopping

### Amazon Product Advertising API
To enable live Amazon price scraping:

1. **Sign up** for Amazon Associates program
2. **Apply** for Product Advertising API access
3. **Set environment variables:**
   ```bash
   AWS_ACCESS_KEY_ID=your_key
   AWS_SECRET_ACCESS_KEY=your_secret
   AMAZON_ASSOCIATE_TAG=your_tag
   AMAZON_REGION=us-east-1
   ```
4. **Implement** `scrapeAmazonWithAPI()` in `packages/competitor-monitoring/scrapers/amazon.ts`
5. Reference: https://webservices.amazon.com/paapi5/documentation/

### Google Shopping
Choose one of two approaches:

**Option 1: Content API for Shopping (Free)**
1. Create Google Merchant Center account
2. Set up OAuth 2.0 credentials in Google Cloud Console
3. Enable Content API for Shopping
4. Implement `scrapeWithContentAPI()` in `packages/competitor-monitoring/scrapers/google-shopping.ts`

**Option 2: SerpAPI (Paid service)**
1. Sign up at https://serpapi.com
2. Set environment variable:
   ```bash
   SERPAPI_API_KEY=your_key
   ```
3. `scrapeWithSerpAPI()` is already implemented and ready to use

## Future Enhancements

1. **Amazon & Google Shopping APIs**: Complete production integration for these channels
2. **Machine Learning**: Add ML-based price prediction and optimization
3. **Alerts**: Email/SMS notifications for significant price changes
4. **Advanced Analytics**: Historical trend charts, price elasticity analysis
5. **Bulk Operations**: Bulk competitor and product management
6. **Custom Channels**: Support for custom competitor data sources (CSV import, custom APIs)
7. **Scheduled Monitoring**: Cron jobs for automated price checks
8. **Price Change Alerts**: Real-time notifications when competitors change prices

## Security Considerations

- All competitor data is tenant-isolated
- API endpoints require proper authentication
- Price scraping should respect robots.txt and rate limits
- Sensitive competitor data should be encrypted at rest

## Performance Considerations

- Price monitoring runs asynchronously
- Historical data is indexed for fast queries
- Consider data retention policies for old price data
- Monitor database performance with large datasets
