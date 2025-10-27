# Agent C: Platform & Console - Detailed Plan

**Timeline:** 2-3 weeks
**Focus:** Integration UI, platform management, production deployment
**Status:** Building on completed foundation

---

## 🎯 Mission

Create a unified, production-ready console experience for managing multi-platform integrations, with robust security, monitoring, and deployment infrastructure to support the complete Calibrate platform.

---

## 📊 Current State

### ✅ Already Complete
- Platform connector abstraction layer
- Database schema (PlatformIntegration, PlatformSyncLog)
- Generic API routes (`/api/platforms/*`)
- Console deployed to Vercel (https://app.calibr.lat)
- NextAuth v5 login flow
- API session token flow

### 🚧 To Build
- Unified integrations dashboard
- Platform management UI
- Security hardening (credential encryption)
- Monitoring & observability
- Production deployment optimization
- Analytics dashboard

---

## 📅 Week 1: Integration Management UI

### Day 1-2: Unified Integrations Dashboard

**Goal:** Central hub for all platform integrations

**Tasks:**
1. **Main Dashboard Page**
   ```typescript
   // apps/console/app/p/[slug]/integrations/page.tsx

   export default async function IntegrationsPage({ params }) {
     const integrations = await getIntegrations(params.slug);
     const availablePlatforms = await getAvailablePlatforms();

     return (
       <div className="space-y-6">
         <PageHeader
           title="Integrations"
           description="Connect and manage your e-commerce platforms"
         />

         <IntegrationStats integrations={integrations} />

         <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
           {availablePlatforms.map(platform => (
             <PlatformCard
               key={platform.id}
               platform={platform}
               integration={integrations.find(i => i.platform === platform.id)}
             />
           ))}
         </div>

         <RecentSyncActivity integrations={integrations} />
       </div>
     );
   }
   ```

2. **Platform Card Component**
   ```typescript
   // apps/console/components/platforms/PlatformCard.tsx

   interface PlatformCardProps {
     platform: {
       id: string;
       name: string;
       description: string;
       logoUrl: string;
       available: boolean;
     };
     integration?: PlatformIntegration;
   }

   export function PlatformCard({ platform, integration }: PlatformCardProps) {
     return (
       <Card>
         <CardHeader>
           <div className="flex items-center gap-3">
             <img src={platform.logoUrl} className="w-10 h-10" />
             <div>
               <CardTitle>{platform.name}</CardTitle>
               <CardDescription>{platform.description}</CardDescription>
             </div>
           </div>
         </CardHeader>

         <CardContent>
           {integration ? (
             <ConnectionStatus integration={integration} />
           ) : (
             <ConnectButton platform={platform.id} />
           )}
         </CardContent>

         <CardFooter>
           {integration && (
             <div className="flex gap-2">
               <Button variant="outline" size="sm">
                 Settings
               </Button>
               <Button variant="outline" size="sm">
                 Sync Now
               </Button>
             </div>
           )}
         </CardFooter>
       </Card>
     );
   }
   ```

3. **Integration Statistics**
   ```typescript
   // apps/console/components/platforms/IntegrationStats.tsx

   export function IntegrationStats({ integrations }) {
     const stats = {
       total: integrations.length,
       connected: integrations.filter(i => i.status === 'CONNECTED').length,
       syncing: integrations.filter(i => i.syncStatus === 'SYNCING').length,
       errors: integrations.filter(i => i.status === 'ERROR').length
     };

     return (
       <div className="grid grid-cols-4 gap-4">
         <StatCard label="Total" value={stats.total} />
         <StatCard label="Connected" value={stats.connected} variant="success" />
         <StatCard label="Syncing" value={stats.syncing} variant="info" />
         <StatCard label="Errors" value={stats.errors} variant="error" />
       </div>
     );
   }
   ```

**Files to Create:**
```
apps/console/app/p/[slug]/integrations/
└── page.tsx                      # Main dashboard

apps/console/components/platforms/
├── PlatformCard.tsx              # Platform connection card
├── IntegrationStats.tsx          # Stats overview
├── ConnectionStatus.tsx          # Status indicator
├── ConnectButton.tsx             # Connect CTA
└── RecentSyncActivity.tsx        # Recent syncs
```

**Acceptance Criteria:**
- ✅ Shows all available platforms
- ✅ Displays connection status clearly
- ✅ One-click connect for platforms
- ✅ Stats accurate and real-time
- ✅ Mobile responsive

---

### Day 3-4: Platform Settings & Configuration

**Goal:** Manage platform credentials and sync settings

**Tasks:**
1. **Settings Modal/Page**
   ```typescript
   // apps/console/components/platforms/PlatformSettings.tsx

   export function PlatformSettings({ platform, integration }) {
     const [settings, setSettings] = useState(integration.metadata);

     return (
       <Dialog>
         <DialogContent className="max-w-2xl">
           <DialogHeader>
             <DialogTitle>{platform.name} Settings</DialogTitle>
           </DialogHeader>

           <Tabs defaultValue="credentials">
             <TabsList>
               <TabsTrigger value="credentials">Credentials</TabsTrigger>
               <TabsTrigger value="sync">Sync Settings</TabsTrigger>
               <TabsTrigger value="webhooks">Webhooks</TabsTrigger>
               <TabsTrigger value="advanced">Advanced</TabsTrigger>
             </TabsList>

             <TabsContent value="credentials">
               <CredentialsForm
                 platform={platform}
                 integration={integration}
               />
             </TabsContent>

             <TabsContent value="sync">
               <SyncSettingsForm integration={integration} />
             </TabsContent>

             <TabsContent value="webhooks">
               <WebhookSettings integration={integration} />
             </TabsContent>

             <TabsContent value="advanced">
               <AdvancedSettings integration={integration} />
             </TabsContent>
           </Tabs>
         </DialogContent>
       </Dialog>
     );
   }
   ```

2. **Sync Schedule Configuration**
   ```typescript
   // apps/console/components/platforms/SyncSettingsForm.tsx

   export function SyncSettingsForm({ integration }) {
     return (
       <Form>
         <FormField label="Sync Frequency">
           <Select defaultValue={integration.syncFrequency}>
             <option value="manual">Manual only</option>
             <option value="hourly">Every hour</option>
             <option value="6hours">Every 6 hours</option>
             <option value="daily">Daily</option>
           </Select>
         </FormField>

         <FormField label="Auto-sync products">
           <Switch defaultChecked={integration.autoSyncProducts} />
         </FormField>

         <FormField label="Auto-sync pricing">
           <Switch defaultChecked={integration.autoSyncPricing} />
         </FormField>

         <FormField label="Sync conflicts resolution">
           <Select defaultValue={integration.conflictResolution}>
             <option value="platform">Platform wins</option>
             <option value="calibrate">Calibrate wins</option>
             <option value="manual">Manual review</option>
           </Select>
         </FormField>
       </Form>
     );
   }
   ```

3. **Credential Management**
   ```typescript
   // apps/console/components/platforms/CredentialsForm.tsx

   export function CredentialsForm({ platform, integration }) {
     const form = useForm({
       defaultValues: integration.credentials
     });

     const handleSubmit = async (data) => {
       // Encrypt credentials before saving
       await updateIntegrationCredentials(integration.id, data);
       toast.success('Credentials updated');
     };

     return (
       <Form onSubmit={form.handleSubmit(handleSubmit)}>
         {/* Platform-specific credential fields */}
         {platform.id === 'shopify' && (
           <>
             <FormField label="Shop Domain" name="shopDomain" />
             <FormField label="Access Token" name="accessToken" type="password" />
           </>
         )}

         {platform.id === 'amazon' && (
           <>
             <FormField label="Seller ID" name="sellerId" />
             <FormField label="Marketplace ID" name="marketplaceId" />
             <FormField label="Client ID" name="clientId" />
             <FormField label="Client Secret" name="clientSecret" type="password" />
             <FormField label="Refresh Token" name="refreshToken" type="password" />
           </>
         )}

         <Button type="submit">Save Credentials</Button>
       </Form>
     );
   }
   ```

**Files to Create:**
```
apps/console/components/platforms/
├── PlatformSettings.tsx          # Settings modal
├── CredentialsForm.tsx           # Credential management
├── SyncSettingsForm.tsx          # Sync configuration
├── WebhookSettings.tsx           # Webhook management
└── AdvancedSettings.tsx          # Advanced options
```

**API Endpoints:**
```
apps/api/app/api/platforms/[platform]/settings/
├── route.ts                      # GET, PATCH settings
└── credentials/
    └── route.ts                  # POST update credentials
```

**Acceptance Criteria:**
- ✅ Settings organized in tabs
- ✅ Credentials masked/encrypted
- ✅ Sync schedule configurable
- ✅ Changes saved successfully
- ✅ Validation prevents errors

---

### Day 5: Sync History & Monitoring

**Goal:** Visibility into sync operations and errors

**Tasks:**
1. **Sync History Viewer**
   ```typescript
   // apps/console/app/p/[slug]/integrations/[platform]/history/page.tsx

   export default function SyncHistoryPage({ params }) {
     const logs = await getPlatformSyncLogs(params.platform);

     return (
       <div>
         <PageHeader title="Sync History" />

         <SyncLogTable logs={logs} />

         <SyncMetrics logs={logs} />
       </div>
     );
   }
   ```

2. **Sync Log Table**
   ```typescript
   // apps/console/components/platforms/SyncLogTable.tsx

   export function SyncLogTable({ logs }) {
     return (
       <Table>
         <TableHeader>
           <TableRow>
             <TableHead>Date</TableHead>
             <TableHead>Type</TableHead>
             <TableHead>Status</TableHead>
             <TableHead>Items Synced</TableHead>
             <TableHead>Duration</TableHead>
             <TableHead>Errors</TableHead>
             <TableHead>Actions</TableHead>
           </TableRow>
         </TableHeader>
         <TableBody>
           {logs.map(log => (
             <TableRow key={log.id}>
               <TableCell>{formatDate(log.startedAt)}</TableCell>
               <TableCell>
                 <Badge>{log.syncType}</Badge>
               </TableCell>
               <TableCell>
                 <SyncStatusBadge status={log.status} />
               </TableCell>
               <TableCell>{log.itemsSynced}</TableCell>
               <TableCell>
                 {calculateDuration(log.startedAt, log.completedAt)}
               </TableCell>
               <TableCell>
                 {log.itemsFailed > 0 && (
                   <Badge variant="destructive">{log.itemsFailed}</Badge>
                 )}
               </TableCell>
               <TableCell>
                 <Button variant="ghost" size="sm">
                   View Details
                 </Button>
               </TableCell>
             </TableRow>
           ))}
         </TableBody>
       </Table>
     );
   }
   ```

3. **Error Details Modal**
   ```typescript
   // apps/console/components/platforms/SyncErrorDetails.tsx

   export function SyncErrorDetails({ log }) {
     const errors = JSON.parse(log.errors || '[]');

     return (
       <Dialog>
         <DialogContent>
           <DialogHeader>
             <DialogTitle>Sync Errors</DialogTitle>
           </DialogHeader>

           <div className="space-y-4">
             {errors.map((error, i) => (
               <Alert key={i} variant="destructive">
                 <AlertTitle>{error.code}</AlertTitle>
                 <AlertDescription>{error.message}</AlertDescription>
                 {error.productId && (
                   <p className="text-sm mt-2">
                     Product: {error.productId}
                   </p>
                 )}
               </Alert>
             ))}
           </div>

           <DialogFooter>
             <Button onClick={() => retrySyncLog(log.id)}>
               Retry Failed Items
             </Button>
           </DialogFooter>
         </DialogContent>
       </Dialog>
     );
   }
   ```

**Files to Create:**
```
apps/console/app/p/[slug]/integrations/[platform]/history/
└── page.tsx                      # Sync history page

apps/console/components/platforms/
├── SyncLogTable.tsx              # Sync logs table
├── SyncMetrics.tsx               # Sync performance metrics
├── SyncErrorDetails.tsx          # Error detail modal
└── SyncStatusBadge.tsx           # Status indicator
```

**Acceptance Criteria:**
- ✅ All sync logs displayed
- ✅ Errors shown clearly
- ✅ Can retry failed syncs
- ✅ Performance metrics accurate
- ✅ Pagination for large logs

---

## 📅 Week 2: Security & Production Hardening

### Day 6-7: Credential Encryption

**Goal:** Encrypt platform credentials at rest

**Tasks:**
1. **Encryption Service**
   ```typescript
   // packages/security/src/encryption.ts

   import crypto from 'crypto';

   const ALGORITHM = 'aes-256-gcm';
   const KEY = process.env.ENCRYPTION_KEY; // 32-byte key

   export function encrypt(text: string): string {
     const iv = crypto.randomBytes(16);
     const cipher = crypto.createCipheriv(ALGORITHM, KEY, iv);

     let encrypted = cipher.update(text, 'utf8', 'hex');
     encrypted += cipher.final('hex');

     const authTag = cipher.getAuthTag();

     // Return iv:authTag:encrypted
     return `${iv.toString('hex')}:${authTag.toString('hex')}:${encrypted}`;
   }

   export function decrypt(encryptedData: string): string {
     const [ivHex, authTagHex, encrypted] = encryptedData.split(':');

     const iv = Buffer.from(ivHex, 'hex');
     const authTag = Buffer.from(authTagHex, 'hex');

     const decipher = crypto.createDecipheriv(ALGORITHM, KEY, iv);
     decipher.setAuthTag(authTag);

     let decrypted = decipher.update(encrypted, 'hex', 'utf8');
     decrypted += decipher.final('utf8');

     return decrypted;
   }
   ```

2. **Database Integration**
   ```typescript
   // packages/db/src/encryption.ts

   import { encrypt, decrypt } from '@calibr/security';

   export async function storePlatformCredentials(
     integrationId: string,
     credentials: Record<string, any>
   ) {
     const encryptedMetadata = encrypt(JSON.stringify(credentials));

     await db.platformIntegration.update({
       where: { id: integrationId },
       data: { metadata: encryptedMetadata }
     });
   }

   export async function getPlatformCredentials(
     integrationId: string
   ): Promise<Record<string, any>> {
     const integration = await db.platformIntegration.findUnique({
       where: { id: integrationId }
     });

     if (!integration?.metadata) {
       return {};
     }

     const decrypted = decrypt(integration.metadata as string);
     return JSON.parse(decrypted);
   }
   ```

3. **Key Rotation**
   ```typescript
   // packages/security/src/key-rotation.ts

   export async function rotateEncryptionKey(
     oldKey: string,
     newKey: string
   ) {
     const integrations = await db.platformIntegration.findMany({
       where: { metadata: { not: null } }
     });

     for (const integration of integrations) {
       // Decrypt with old key
       const decrypted = decrypt(integration.metadata as string, oldKey);

       // Re-encrypt with new key
       const encrypted = encrypt(decrypted, newKey);

       // Update
       await db.platformIntegration.update({
         where: { id: integration.id },
         data: { metadata: encrypted }
       });
     }
   }
   ```

**Files to Create:**
```
packages/security/
├── package.json
├── src/
│   ├── encryption.ts             # Encryption utilities
│   ├── key-rotation.ts           # Key rotation
│   └── index.ts
└── tests/
    └── encryption.test.ts

packages/db/src/
└── encryption.ts                 # DB encryption helpers
```

**Acceptance Criteria:**
- ✅ Credentials encrypted at rest
- ✅ Decryption works correctly
- ✅ Key rotation supported
- ✅ No plaintext credentials in DB
- ✅ Tests for encryption/decryption

---

### Day 8-9: Audit Logging & Security

**Goal:** Complete audit trail and security measures

**Tasks:**
1. **Audit Log Schema**
   ```prisma
   // packages/db/schema.prisma

   model AuditLog {
     id              String   @id @default(cuid())
     userId          String
     projectId       String
     action          String   // 'platform.connect', 'platform.disconnect', etc.
     resourceType    String   // 'platform_integration', 'product', etc.
     resourceId      String?
     changes         Json?    // Before/after values
     metadata        Json?    // Additional context
     ipAddress       String?
     userAgent       String?
     timestamp       DateTime @default(now())

     user            User     @relation(fields: [userId], references: [id])
     project         Project  @relation(fields: [projectId], references: [id])

     @@index([userId])
     @@index([projectId])
     @@index([action])
     @@index([timestamp])
   }
   ```

2. **Audit Logger**
   ```typescript
   // packages/security/src/audit-logger.ts

   export async function logAction(params: {
     userId: string;
     projectId: string;
     action: string;
     resourceType: string;
     resourceId?: string;
     changes?: any;
     metadata?: any;
     request?: Request;
   }) {
     const ipAddress = params.request?.headers.get('x-forwarded-for');
     const userAgent = params.request?.headers.get('user-agent');

     await db.auditLog.create({
       data: {
         ...params,
         ipAddress,
         userAgent
       }
     });
   }
   ```

3. **API Middleware**
   ```typescript
   // apps/api/lib/middleware/audit.ts

   export function withAudit(
     handler: (req: Request) => Promise<Response>,
     action: string,
     resourceType: string
   ) {
     return async (req: Request) => {
       const session = await getSession(req);

       try {
         const response = await handler(req);

         await logAction({
           userId: session.user.id,
           projectId: session.projectId,
           action,
           resourceType,
           metadata: { status: response.status },
           request: req
         });

         return response;
       } catch (error) {
         await logAction({
           userId: session.user.id,
           projectId: session.projectId,
           action,
           resourceType,
           metadata: { error: error.message },
           request: req
         });

         throw error;
       }
     };
   }
   ```

4. **Rate Limiting**
   ```typescript
   // apps/api/lib/middleware/rate-limit.ts

   import { Ratelimit } from '@upstash/ratelimit';
   import { Redis } from '@upstash/redis';

   const redis = new Redis({
     url: process.env.UPSTASH_REDIS_URL,
     token: process.env.UPSTASH_REDIS_TOKEN
   });

   const ratelimit = new Ratelimit({
     redis,
     limiter: Ratelimit.slidingWindow(100, '1 m'),
     analytics: true
   });

   export async function withRateLimit(
     handler: (req: Request) => Promise<Response>,
     identifier: string
   ) {
     const { success, limit, remaining } = await ratelimit.limit(identifier);

     if (!success) {
       return new Response('Rate limit exceeded', {
         status: 429,
         headers: {
           'X-RateLimit-Limit': limit.toString(),
           'X-RateLimit-Remaining': remaining.toString()
         }
       });
     }

     return handler(req);
   }
   ```

**Files to Create:**
```
packages/security/src/
├── audit-logger.ts               # Audit logging
└── audit-viewer.ts               # Query audit logs

apps/api/lib/middleware/
├── audit.ts                      # Audit middleware
├── rate-limit.ts                 # Rate limiting
└── security-headers.ts           # Security headers
```

**Acceptance Criteria:**
- ✅ All actions logged
- ✅ Audit logs queryable
- ✅ Rate limiting works
- ✅ Security headers set
- ✅ IP and user agent tracked

---

### Day 10: Monitoring & Observability

**Goal:** Production monitoring and alerting

**Tasks:**
1. **Health Check Endpoints**
   ```typescript
   // apps/api/app/api/health/route.ts

   export async function GET() {
     const checks = {
       database: await checkDatabase(),
       redis: await checkRedis(),
       platforms: await checkPlatforms()
     };

     const healthy = Object.values(checks).every(c => c.status === 'ok');

     return Response.json(
       {
         status: healthy ? 'healthy' : 'degraded',
         checks,
         timestamp: new Date().toISOString()
       },
       { status: healthy ? 200 : 503 }
     );
   }

   async function checkDatabase() {
     try {
       await db.$queryRaw`SELECT 1`;
       return { status: 'ok' };
     } catch (error) {
       return { status: 'error', message: error.message };
     }
   }
   ```

2. **Platform Health Monitor**
   ```typescript
   // apps/api/app/api/platforms/health/route.ts

   export async function GET() {
     const integrations = await db.platformIntegration.findMany({
       where: { isActive: true }
     });

     const results = await Promise.all(
       integrations.map(async (integration) => {
         const connector = await getConnector(integration.platform);
         const health = await connector.healthCheck();

         return {
           platform: integration.platform,
           integrationId: integration.id,
           ...health
         };
       })
     );

     return Response.json({ platforms: results });
   }
   ```

3. **Metrics Dashboard**
   ```typescript
   // apps/console/app/p/[slug]/monitoring/page.tsx

   export default function MonitoringPage() {
     return (
       <div className="space-y-6">
         <PageHeader title="Monitoring" />

         <div className="grid grid-cols-2 gap-4">
           <MetricCard
             title="Platform Health"
             value="3/3"
             description="All platforms operational"
           />
           <MetricCard
             title="Sync Success Rate"
             value="98.5%"
             description="Last 24 hours"
           />
           <MetricCard
             title="API Response Time"
             value="245ms"
             description="p95"
           />
           <MetricCard
             title="Error Rate"
             value="0.2%"
             description="Last 24 hours"
           />
         </div>

         <PlatformHealthChart />
         <SyncPerformanceChart />
         <ErrorRateChart />
       </div>
     );
   }
   ```

**Files to Create:**
```
apps/api/app/api/health/
├── route.ts                      # Overall health
└── platforms/
    └── route.ts                  # Platform health

apps/console/app/p/[slug]/monitoring/
└── page.tsx                      # Monitoring dashboard

apps/console/components/monitoring/
├── MetricCard.tsx
├── PlatformHealthChart.tsx
├── SyncPerformanceChart.tsx
└── ErrorRateChart.tsx
```

**Acceptance Criteria:**
- ✅ Health checks work
- ✅ Platform status tracked
- ✅ Metrics collected
- ✅ Dashboard displays metrics
- ✅ Alerts configurable

---

## 📅 Week 3: Analytics & Final Polish

### Day 11-12: Analytics Dashboard

**Goal:** Revenue impact and performance analytics

**Tasks:**
1. **Analytics Schema**
   ```prisma
   // packages/db/schema.prisma

   model PriceChangeAnalytics {
     id              String   @id @default(cuid())
     productId       String
     priceChangedAt  DateTime
     oldPrice        Decimal  @db.Decimal(10,2)
     newPrice        Decimal  @db.Decimal(10,2)
     changePercent   Decimal  @db.Decimal(5,2)
     reason          String

     // Performance metrics (collected over time)
     unitsSoldBefore Int?     // 7 days before
     unitsSoldAfter  Int?     // 7 days after
     revenueBefore   Decimal? @db.Decimal(10,2)
     revenueAfter    Decimal? @db.Decimal(10,2)
     revenueImpact   Decimal? @db.Decimal(10,2)

     product         Product  @relation(fields: [productId], references: [id])

     @@index([productId])
     @@index([priceChangedAt])
   }
   ```

2. **Analytics API**
   ```typescript
   // apps/api/app/api/analytics/price-performance/route.ts

   export async function GET(req: Request) {
     const { searchParams } = new URL(req.url);
     const from = searchParams.get('from');
     const to = searchParams.get('to');

     const analytics = await db.priceChangeAnalytics.findMany({
       where: {
         priceChangedAt: {
           gte: new Date(from),
           lte: new Date(to)
         }
       },
       include: { product: true }
     });

     const summary = {
       totalPriceChanges: analytics.length,
       averageImpact: calculateAverageImpact(analytics),
       totalRevenueImpact: sumRevenueImpact(analytics),
       topPerformers: getTopPerformers(analytics),
       bottomPerformers: getBottomPerformers(analytics)
     };

     return Response.json({ summary, details: analytics });
   }
   ```

3. **Analytics Dashboard**
   ```typescript
   // apps/console/app/p/[slug]/analytics/page.tsx

   export default function AnalyticsPage() {
     return (
       <div className="space-y-6">
         <PageHeader title="Analytics" />

         <DateRangePicker />

         <div className="grid grid-cols-3 gap-4">
           <StatCard
             title="Revenue Impact"
             value="+$12,458"
             trend="+15%"
             variant="success"
           />
           <StatCard
             title="Price Changes"
             value="47"
             trend="-3%"
           />
           <StatCard
             title="Avg Impact"
             value="+$265"
             trend="+8%"
             variant="success"
           />
         </div>

         <RevenueImpactChart />
         <PricePerformanceTable />
         <CompetitivePositionChart />
       </div>
     );
   }
   ```

**Files to Create:**
```
apps/api/app/api/analytics/
├── price-performance/route.ts
├── revenue-impact/route.ts
└── competitive-position/route.ts

apps/console/app/p/[slug]/analytics/
└── page.tsx

apps/console/components/analytics/
├── RevenueImpactChart.tsx
├── PricePerformanceTable.tsx
├── CompetitivePositionChart.tsx
└── DateRangePicker.tsx
```

**Acceptance Criteria:**
- ✅ Analytics data collected
- ✅ Revenue impact calculated
- ✅ Charts display correctly
- ✅ Export to CSV works
- ✅ Date range filtering works

---

### Day 13-14: Production Deployment

**Goal:** Production-ready deployment

**Tasks:**
1. **Environment Documentation**
   ```markdown
   # Environment Variables

   ## Console (Vercel)
   ```env
   NEXT_PUBLIC_API_BASE=https://api.calibr.lat
   AUTH_URL=https://app.calibr.lat
   AUTH_SECRET=<generated-32-char-secret>
   CONSOLE_INTERNAL_TOKEN=<secure-random-token>
   ```

   ## API (Railway)
   ```env
   DATABASE_URL=postgresql://...
   REDIS_URL=redis://...
   ENCRYPTION_KEY=<32-byte-hex-key>
   WEBHOOK_SECRET=<secure-random-token>
   CONSOLE_INTERNAL_TOKEN=<same-as-console>

   # Shopify
   SHOPIFY_API_KEY=...
   SHOPIFY_API_SECRET=...

   # Amazon
   AMAZON_CLIENT_ID=...
   AMAZON_CLIENT_SECRET=...
   ```
   ```

2. **Deployment Scripts**
   ```bash
   # scripts/deploy-console.sh

   #!/bin/bash
   set -e

   echo "🚀 Deploying Console to Vercel..."

   # Build
   cd apps/console
   pnpm build

   # Deploy
   vercel --prod

   echo "✅ Console deployed"
   ```

   ```bash
   # scripts/deploy-api.sh

   #!/bin/bash
   set -e

   echo "🚀 Deploying API to Railway..."

   # Run migrations
   pnpm migrate

   # Deploy
   railway up --service api

   echo "✅ API deployed"
   ```

3. **Deployment Checklist**
   ```markdown
   # Deployment Checklist

   ## Pre-Deployment
   - [ ] All tests passing
   - [ ] TypeScript checks pass
   - [ ] Environment variables documented
   - [ ] Database migrations ready
   - [ ] Monitoring configured

   ## Deployment
   - [ ] Run database migrations
   - [ ] Deploy API first
   - [ ] Verify API health check
   - [ ] Deploy Console
   - [ ] Verify Console loads

   ## Post-Deployment
   - [ ] Test login flow
   - [ ] Test platform connections
   - [ ] Verify webhooks working
   - [ ] Check monitoring dashboards
   - [ ] Verify error tracking
   ```

**Files to Create:**
```
docs/
├── DEPLOYMENT.md                 # Deployment guide
├── ENVIRONMENT.md                # Environment variables
└── RUNBOOK.md                    # Operations runbook

scripts/
├── deploy-console.sh
├── deploy-api.sh
└── verify-deployment.sh
```

**Acceptance Criteria:**
- ✅ Deployment scripts work
- ✅ Environment documented
- ✅ Rollback procedure documented
- ✅ Monitoring alerts configured
- ✅ Backup/recovery tested

---

### Day 15: Final Polish & Documentation

**Goal:** Production-ready polish

**Tasks:**
1. **Performance Optimization**
   - Image optimization
   - Bundle size reduction
   - Database query optimization
   - API response caching

2. **Error Handling**
   - User-friendly error messages
   - Error boundary components
   - Retry logic for transient failures
   - Graceful degradation

3. **Documentation**
   - User guide
   - Admin guide
   - API documentation
   - Video tutorials

**Acceptance Criteria:**
- ✅ Performance optimized
- ✅ Error handling robust
- ✅ Documentation complete
- ✅ Ready for production

---

## 🎯 Success Criteria (Overall)

### Technical
- ✅ Credentials encrypted at rest
- ✅ Audit logging complete
- ✅ Rate limiting implemented
- ✅ Monitoring operational
- ✅ Production deployment tested

### Functional
- ✅ Integrations dashboard works
- ✅ Platform settings configurable
- ✅ Sync history visible
- ✅ Analytics accurate
- ✅ Health checks operational

### User Experience
- ✅ Intuitive UI
- ✅ Clear error messages
- ✅ Fast load times
- ✅ Mobile responsive
- ✅ Accessible

---

## 📦 Deliverables Checklist

- [ ] Integrations dashboard
- [ ] Platform settings UI
- [ ] Sync history viewer
- [ ] Credential encryption
- [ ] Audit logging
- [ ] Monitoring dashboard
- [ ] Analytics dashboard
- [ ] Production deployment
- [ ] Complete documentation

---

**Status:** Ready to Start
**Start Date:** October 28, 2025
**Target Completion:** November 15, 2025

Generated with Claude Code
Co-Authored-By: Claude <noreply@anthropic.com>
