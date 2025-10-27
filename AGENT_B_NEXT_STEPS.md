# Agent B: Amazon & Automation - Detailed Plan

**Timeline:** 2-3 weeks
**Focus:** Amazon connector expansion + automation workflows
**Status:** Building on existing pricing feed foundation

---

## 🎯 Mission

Expand the Amazon connector beyond pricing feeds to include full catalog management and competitive pricing, then build the automation engine that orchestrates price updates across all platforms based on competitor monitoring and pricing policies.

---

## 📊 Current State

### ✅ Already Complete
- Amazon pricing feed submission
- Feed status polling
- Console UI for feed management
- API routes: `/api/platforms/amazon/pricing/*`

### 🚧 To Build
- Catalog retrieval (SP-API Catalog Items)
- Competitive pricing data
- Automation job system
- Scheduled sync workflows
- Approval workflows

---

## 📅 Week 1: Amazon Catalog & Competitive Pricing

### Day 1-2: Catalog Items API Integration

**Goal:** Retrieve product catalog from Amazon Seller Central

**Tasks:**
1. **SP-API Catalog Items Implementation**
   ```typescript
   // packages/amazon-connector/src/catalog.ts

   export class AmazonCatalogOperations implements ProductOperations {
     async list(filters?: ProductFilter): Promise<NormalizedProduct[]> {
       // Call SP-API Catalog Items v2020-12-01
       // /catalog/2020-12-01/items
       // Transform to NormalizedProduct[]
     }

     async get(externalId: string): Promise<NormalizedProduct> {
       // GET /catalog/2020-12-01/items/{asin}
       // Handle marketplace-specific lookups
     }

     async getBySku(sku: string): Promise<NormalizedProduct | null> {
       // Search by seller SKU
       // Transform response
     }

     async count(filters?: ProductFilter): Promise<number> {
       // Get total count with filters
     }

     async syncAll(config?: SyncConfig): Promise<SyncResult> {
       // Batch sync with pagination
       // Store in local database
     }
   }
   ```

2. **Data Normalization**
   - Map Amazon catalog data to `NormalizedProduct`
   - Handle variations/parent-child relationships
   - Extract pricing from catalog
   - Map inventory status

3. **Pagination & Performance**
   - Handle SP-API pagination
   - Implement cursor-based fetching
   - Batch operations for large catalogs
   - Rate limit handling

**Files to Create:**
```
packages/amazon-connector/src/
├── catalog.ts                    # Catalog operations
├── catalog-normalizer.ts         # Data transformation
└── types/catalog.ts              # Amazon-specific types

packages/amazon-connector/tests/
├── catalog.test.ts
└── catalog-normalizer.test.ts
```

**API Endpoints:**
```
apps/api/app/api/platforms/amazon/catalog/
├── route.ts                      # GET /catalog - list products
│                                 # POST /catalog/sync - trigger sync
└── [asin]/
    └── route.ts                  # GET /catalog/:asin - get single
```

**Acceptance Criteria:**
- ✅ Can retrieve products by marketplace
- ✅ Pagination works for large catalogs
- ✅ Data normalized correctly
- ✅ SKU and ASIN lookups work
- ✅ Rate limits handled

---

### Day 3-4: Competitive Pricing API

**Goal:** Retrieve competitive pricing data for products

**Tasks:**
1. **Product Pricing API Integration**
   ```typescript
   // packages/amazon-connector/src/competitive-pricing.ts

   export class AmazonCompetitivePricing {
     async getCompetitivePrice(asin: string): Promise<CompetitivePriceData> {
       // GET /products/pricing/v0/items/{asin}/offers
       // Get competitive offers
       // Get Buy Box status
       // Get offer count
     }

     async getBatchCompetitivePrices(
       asins: string[]
     ): Promise<CompetitivePriceData[]> {
       // Batch request for multiple ASINs
       // Respect rate limits
       // Handle throttling
     }

     async getBuyBoxPrice(asin: string): Promise<number | null> {
       // Extract current Buy Box price
       // Handle Buy Box not available
     }

     async trackPriceHistory(
       asin: string,
       from: Date,
       to: Date
     ): Promise<PriceHistoryPoint[]> {
       // Store historical pricing data
       // Calculate trends
     }
   }
   ```

2. **Competitive Intelligence**
   - Extract competitor prices
   - Track Buy Box winner
   - Calculate position (1st, 2nd, etc.)
   - Monitor price changes
   - Alert on significant changes

3. **Database Schema**
   ```prisma
   // packages/db/schema.prisma

   model AmazonCompetitivePrice {
     id              String   @id @default(cuid())
     asin            String
     marketplaceId   String
     lowestPrice     Decimal  @db.Decimal(10,2)
     buyBoxPrice     Decimal? @db.Decimal(10,2)
     offerCount      Int
     ourPrice        Decimal? @db.Decimal(10,2)
     ourPosition     Int?     // 1 = we have Buy Box
     competitorData  Json     // Full competitive data
     retrievedAt     DateTime @default(now())

     @@index([asin, marketplaceId])
     @@index([retrievedAt])
   }
   ```

**Files to Create:**
```
packages/amazon-connector/src/
├── competitive-pricing.ts        # Competitive pricing operations
└── types/competitive.ts          # Types

packages/amazon-connector/tests/
└── competitive-pricing.test.ts

apps/api/app/api/platforms/amazon/competitive/
└── route.ts                      # GET /competitive/:asin
                                  # POST /competitive/track
```

**Acceptance Criteria:**
- ✅ Can retrieve competitive prices
- ✅ Buy Box status tracked
- ✅ Batch operations work
- ✅ Historical data stored
- ✅ Competitor analysis accurate

---

### Day 5: Feed Management Enhancement

**Goal:** Improve existing pricing feed reliability

**Tasks:**
1. **Feed Status Polling Enhancement**
   - Implement exponential backoff
   - Handle feed processing delays
   - Parse feed result documents
   - Extract and store errors

2. **Error Handling**
   ```typescript
   // packages/amazon-connector/src/feeds.ts

   interface FeedError {
     sku: string;
     errorCode: string;
     errorMessage: string;
     severity: 'ERROR' | 'WARNING';
   }

   async parseFeedResult(feedId: string): Promise<FeedResult> {
     // Download result document
     // Parse XML
     // Extract errors
     // Map to SKUs
     // Store in database
   }
   ```

3. **Retry Logic**
   - Retry failed feed items
   - Exponential backoff for transient failures
   - Max retry count
   - Dead letter queue for permanent failures

**Files to Update:**
```
packages/amazon-connector/src/
├── feeds.ts                      # Enhanced feed operations
└── feed-parser.ts                # Result document parsing

apps/api/app/api/platforms/amazon/pricing/
└── [feedId]/
    └── route.ts                  # GET /pricing/:feedId - detailed status
```

**Acceptance Criteria:**
- ✅ Feed errors parsed and displayed
- ✅ Retry logic works
- ✅ Failed items tracked
- ✅ Status updates real-time

---

## 📅 Week 2: Automation & Workflows

### Day 6-7: Job System Architecture

**Goal:** Build background job system for automation

**Tasks:**
1. **Job Queue Setup**
   ```bash
   pnpm add bullmq ioredis
   ```

   ```typescript
   // packages/automation/src/queue.ts

   import { Queue, Worker } from 'bullmq';

   export const priceUpdateQueue = new Queue('price-updates', {
     connection: redisConnection
   });

   export const syncQueue = new Queue('platform-sync', {
     connection: redisConnection
   });

   export const competitorMonitorQueue = new Queue('competitor-monitoring', {
     connection: redisConnection
   });
   ```

2. **Job Types**
   ```typescript
   // packages/automation/src/jobs/types.ts

   interface PriceUpdateJob {
     type: 'price-update';
     productId: string;
     newPrice: number;
     platforms: string[];  // ['shopify', 'amazon']
     reason: string;
     approvalRequired: boolean;
   }

   interface SyncJob {
     type: 'platform-sync';
     platform: string;
     projectId: string;
     syncType: 'full' | 'incremental';
   }

   interface MonitorJob {
     type: 'competitor-monitor';
     productId: string;
     competitorUrls: string[];
   }
   ```

3. **Workers**
   ```typescript
   // packages/automation/src/workers/price-update.worker.ts

   const worker = new Worker('price-updates', async (job) => {
     const { productId, newPrice, platforms } = job.data;

     // 1. Check if approval required
     if (job.data.approvalRequired) {
       await createApprovalRequest(productId, newPrice);
       return { status: 'pending-approval' };
     }

     // 2. Update platforms
     for (const platform of platforms) {
       await updatePlatformPrice(platform, productId, newPrice);
     }

     // 3. Log success
     await logPriceUpdate(productId, newPrice, platforms);

     return { status: 'completed' };
   });
   ```

**Files to Create:**
```
packages/automation/
├── package.json
├── src/
│   ├── queue.ts                  # Queue setup
│   ├── jobs/
│   │   ├── types.ts              # Job type definitions
│   │   ├── price-update.ts       # Price update job
│   │   ├── sync.ts               # Sync job
│   │   └── monitor.ts            # Monitoring job
│   ├── workers/
│   │   ├── price-update.worker.ts
│   │   ├── sync.worker.ts
│   │   └── monitor.worker.ts
│   └── index.ts
└── tests/
    └── workers/
```

**Acceptance Criteria:**
- ✅ Jobs enqueue successfully
- ✅ Workers process jobs
- ✅ Failed jobs retry
- ✅ Job status tracked

---

### Day 8-9: Approval Workflow System

**Goal:** Build price change approval system

**Tasks:**
1. **Database Schema**
   ```prisma
   // packages/db/schema.prisma

   model PriceChangeApproval {
     id              String   @id @default(cuid())
     projectId       String
     productId       String
     currentPrice    Decimal  @db.Decimal(10,2)
     proposedPrice   Decimal  @db.Decimal(10,2)
     reason          String   @db.Text
     status          ApprovalStatus
     platforms       String[] // platforms to update

     requestedBy     String   // system | user email
     requestedAt     DateTime @default(now())
     reviewedBy      String?
     reviewedAt      DateTime?

     autoApprove     Boolean  @default(false)
     expiresAt       DateTime?

     project         Project  @relation(fields: [projectId], references: [id])
     product         Product  @relation(fields: [productId], references: [id])

     @@index([projectId, status])
     @@index([expiresAt])
   }

   enum ApprovalStatus {
     PENDING
     APPROVED
     REJECTED
     EXPIRED
     AUTO_APPROVED
   }
   ```

2. **Approval API**
   ```typescript
   // apps/api/app/api/approvals/route.ts

   export async function GET(req: Request) {
     // List pending approvals
     const { projectId } = await getSession(req);
     const approvals = await db.priceChangeApproval.findMany({
       where: { projectId, status: 'PENDING' },
       include: { product: true }
     });
     return Response.json(approvals);
   }

   export async function POST(req: Request) {
     // Create approval request
     const { productId, proposedPrice, reason, platforms } = await req.json();
     // Create approval record
     // Notify relevant users
   }

   // apps/api/app/api/approvals/[id]/route.ts
   export async function PATCH(req: Request, { params }) {
     const { action } = await req.json(); // 'approve' | 'reject'
     const approval = await db.priceChangeApproval.update({
       where: { id: params.id },
       data: {
         status: action === 'approve' ? 'APPROVED' : 'REJECTED',
         reviewedAt: new Date(),
         reviewedBy: session.user.email
       }
     });

     if (action === 'approve') {
       // Enqueue price update job
       await priceUpdateQueue.add('update-price', {
         productId: approval.productId,
         newPrice: approval.proposedPrice,
         platforms: approval.platforms
       });
     }

     return Response.json(approval);
   }
   ```

3. **Auto-Approval Rules**
   ```typescript
   // packages/automation/src/auto-approval.ts

   interface AutoApprovalRule {
     name: string;
     condition: (approval: PriceChangeApproval) => boolean;
   }

   const rules: AutoApprovalRule[] = [
     {
       name: 'small-decrease',
       condition: (a) => {
         const change = (a.proposedPrice - a.currentPrice) / a.currentPrice;
         return change < 0 && Math.abs(change) < 0.05; // < 5% decrease
       }
     },
     {
       name: 'price-floor',
       condition: (a) => {
         // Check if above minimum margin
         return checkMinimumMargin(a.productId, a.proposedPrice);
       }
     }
   ];
   ```

**Files to Create:**
```
apps/api/app/api/approvals/
├── route.ts                      # GET, POST approvals
└── [id]/
    └── route.ts                  # PATCH - approve/reject

packages/automation/src/
├── auto-approval.ts              # Auto-approval rules
└── approval-service.ts           # Approval business logic
```

**Acceptance Criteria:**
- ✅ Approval requests created
- ✅ Users can approve/reject
- ✅ Auto-approval rules work
- ✅ Approved changes applied
- ✅ Notifications sent

---

### Day 10: Scheduled Workflows

**Goal:** Automated competitor monitoring and price adjustments

**Tasks:**
1. **Competitor Price Monitoring**
   ```typescript
   // packages/automation/src/scheduled/competitor-monitor.ts

   import { CronJob } from 'cron';

   // Run every hour
   export const competitorMonitorJob = new CronJob('0 * * * *', async () => {
     const products = await db.product.findMany({
       where: { competitorMonitoringEnabled: true }
     });

     for (const product of products) {
       await competitorMonitorQueue.add('monitor', {
         productId: product.id,
         competitorUrls: product.competitorUrls
       });
     }
   });
   ```

2. **Platform Sync Scheduler**
   ```typescript
   // packages/automation/src/scheduled/platform-sync.ts

   // Sync platforms every 6 hours
   export const platformSyncJob = new CronJob('0 */6 * * *', async () => {
     const integrations = await db.platformIntegration.findMany({
       where: { isActive: true }
     });

     for (const integration of integrations) {
       await syncQueue.add('sync-platform', {
         platform: integration.platform,
         projectId: integration.projectId,
         syncType: 'incremental'
       });
     }
   });
   ```

3. **Price Optimization**
   ```typescript
   // packages/automation/src/scheduled/price-optimizer.ts

   // Run daily at 2 AM
   export const priceOptimizerJob = new CronJob('0 2 * * *', async () => {
     const products = await getProductsWithPricing();

     for (const product of products) {
       // Get competitive data
       const competitive = await getCompetitiveData(product.id);

       // Calculate optimal price
       const optimal = await calculateOptimalPrice(product, competitive);

       // Create approval request if different
       if (optimal !== product.currentPrice) {
         await createPriceChangeApproval({
           productId: product.id,
           proposedPrice: optimal,
           reason: 'Automated optimization based on competitive data'
         });
       }
     }
   });
   ```

**Files to Create:**
```
packages/automation/src/scheduled/
├── competitor-monitor.ts         # Hourly competitor checks
├── platform-sync.ts              # Platform sync scheduler
├── price-optimizer.ts            # Daily price optimization
└── index.ts                      # Register all jobs
```

**Acceptance Criteria:**
- ✅ Cron jobs run on schedule
- ✅ Competitor prices monitored
- ✅ Platforms sync automatically
- ✅ Price suggestions generated
- ✅ Jobs resumable after restart

---

## 📅 Week 3: Console UI & Integration

### Day 11-12: Automation Dashboard

**Goal:** UI for managing automation workflows

**Tasks:**
1. **Approval Queue UI**
   ```typescript
   // apps/console/app/p/[slug]/approvals/page.tsx

   export default function ApprovalsPage() {
     return (
       <div>
         <h1>Pending Approvals</h1>
         <ApprovalList status="pending" />
         <ApprovalStats />
       </div>
     );
   }

   // components/approvals/ApprovalCard.tsx
   - Show product details
   - Current vs. proposed price
   - Reason for change
   - Approve/Reject buttons
   - Estimated impact
   ```

2. **Automation Settings**
   ```typescript
   // apps/console/app/p/[slug]/automation/page.tsx

   export default function AutomationSettings() {
     return (
       <div>
         <h1>Automation Settings</h1>
         <CompetitorMonitoringSettings />
         <AutoApprovalRules />
         <SyncSchedule />
         <NotificationPreferences />
       </div>
     );
   }
   ```

3. **Job Status Monitor**
   ```typescript
   // apps/console/app/p/[slug]/jobs/page.tsx

   - Show running jobs
   - Job history
   - Failed jobs
   - Retry controls
   - Performance metrics
   ```

**UI Files:**
```
apps/console/app/p/[slug]/
├── approvals/
│   ├── page.tsx
│   └── [id]/page.tsx             # Approval detail
├── automation/
│   └── page.tsx                  # Automation settings
└── jobs/
    └── page.tsx                  # Job monitor

apps/console/components/
├── approvals/
│   ├── ApprovalCard.tsx
│   ├── ApprovalList.tsx
│   └── ApprovalStats.tsx
├── automation/
│   ├── CompetitorSettings.tsx
│   ├── AutoApprovalRules.tsx
│   └── SyncSchedule.tsx
└── jobs/
    ├── JobList.tsx
    ├── JobStatus.tsx
    └── JobMetrics.tsx
```

**Acceptance Criteria:**
- ✅ Pending approvals displayed
- ✅ One-click approve/reject
- ✅ Automation rules configurable
- ✅ Job status visible
- ✅ Mobile responsive

---

### Day 13-14: E2E Workflow Testing

**Goal:** Complete automation loop working

**Tasks:**
1. **E2E Test Scenario**
   ```typescript
   // tests/e2e/price-automation.test.ts

   test('Complete price automation flow', async () => {
     // 1. Competitor price detected (lower than ours)
     await mockCompetitorPriceChange('product-123', 99.99);

     // 2. Wait for monitoring job to run
     await waitForJob('competitor-monitor');

     // 3. Price suggestion created
     const approval = await db.priceChangeApproval.findFirst({
       where: { productId: 'product-123' }
     });
     expect(approval).toBeDefined();
     expect(approval.proposedPrice).toBe(98.99);

     // 4. Auto-approval (if rules match)
     if (approval.autoApprove) {
       // Wait for auto-approval
       await waitFor(() => approval.status === 'AUTO_APPROVED');
     } else {
       // Manual approval
       await approvePriceChange(approval.id);
     }

     // 5. Price update job runs
     await waitForJob('price-update');

     // 6. Verify platforms updated
     const shopifyPrice = await getShopifyPrice('product-123');
     const amazonPrice = await getAmazonPrice('product-123');
     expect(shopifyPrice).toBe(98.99);
     expect(amazonPrice).toBe(98.99);

     // 7. Verify logs
     const logs = await getPriceChangeLogs('product-123');
     expect(logs).toHaveLength(2); // One per platform
   });
   ```

2. **Performance Testing**
   - Test with 100+ concurrent jobs
   - Measure processing times
   - Check memory usage
   - Verify no job loss

3. **Error Scenario Testing**
   - Platform API failures
   - Invalid price values
   - Rate limit handling
   - Network timeouts

**Acceptance Criteria:**
- ✅ E2E flow completes successfully
- ✅ Performance acceptable (< 30s for price update)
- ✅ Error scenarios handled
- ✅ No data loss

---

### Day 15: Documentation & Handoff

**Goal:** Comprehensive documentation

**Tasks:**
1. **Architecture Documentation**
   - Job system architecture
   - Approval workflow diagrams
   - Scheduler configuration
   - Redis setup

2. **User Documentation**
   - Setting up automation
   - Configuring approval rules
   - Understanding job status
   - Troubleshooting guide

3. **Developer Documentation**
   - Adding new job types
   - Writing workers
   - Testing jobs
   - Monitoring jobs

**Documentation Files:**
```
docs/automation/
├── architecture.md
├── setup-guide.md
├── approval-workflows.md
├── job-system.md
└── troubleshooting.md

packages/automation/
└── README.md
```

**Acceptance Criteria:**
- ✅ Architecture documented
- ✅ Setup guide complete
- ✅ User guide clear
- ✅ Developer guide comprehensive

---

## 🎯 Success Criteria (Overall)

### Technical
- ✅ Amazon catalog retrieval works
- ✅ Competitive pricing tracked
- ✅ Job system operational
- ✅ Workers processing jobs
- ✅ 95%+ test coverage

### Functional
- ✅ Competitor monitoring automated
- ✅ Price suggestions generated
- ✅ Approval workflow works
- ✅ Auto-approval rules function
- ✅ Platforms updated automatically

### User Experience
- ✅ Clear approval interface
- ✅ Automation configurable
- ✅ Job status visible
- ✅ Notifications timely

---

## 📦 Deliverables Checklist

- [ ] `packages/amazon-connector/src/catalog.ts`
- [ ] `packages/amazon-connector/src/competitive-pricing.ts`
- [ ] `packages/automation/` - Complete package
- [ ] `apps/api/app/api/approvals/` - Approval routes
- [ ] `apps/api/app/api/jobs/` - Job management routes
- [ ] `apps/console/app/p/[slug]/approvals/` - Approval UI
- [ ] `apps/console/app/p/[slug]/automation/` - Automation UI
- [ ] Complete documentation
- [ ] E2E tests
- [ ] Deployment guide

---

**Status:** Ready to Start
**Start Date:** October 28, 2025
**Target Completion:** November 15, 2025

Generated with Claude Code
Co-Authored-By: Claude <noreply@anthropic.com>
