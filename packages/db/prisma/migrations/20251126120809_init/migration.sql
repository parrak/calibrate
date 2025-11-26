-- CreateEnum
CREATE TYPE "OutboxStatus" AS ENUM ('PENDING', 'PROCESSING', 'COMPLETED', 'FAILED');

-- CreateEnum
CREATE TYPE "PriceChangeStatus" AS ENUM ('PENDING', 'APPROVED', 'REJECTED', 'APPLIED', 'FAILED', 'ROLLED_BACK');

-- CreateEnum
CREATE TYPE "RuleRunStatus" AS ENUM ('PREVIEW', 'QUEUED', 'APPLYING', 'APPLIED', 'PARTIAL', 'FAILED', 'ROLLED_BACK');

-- CreateEnum
CREATE TYPE "RuleTargetStatus" AS ENUM ('PREVIEW', 'QUEUED', 'APPLYING', 'APPLIED', 'FAILED', 'ROLLED_BACK');

-- CreateEnum
CREATE TYPE "ProjectRole" AS ENUM ('OWNER', 'ADMIN', 'EDITOR', 'VIEWER');

-- CreateEnum
CREATE TYPE "QuoteStatus" AS ENUM ('DRAFT', 'ISSUED', 'ACCEPTED', 'EXPIRED');

-- CreateEnum
CREATE TYPE "Role" AS ENUM ('OWNER', 'ADMIN', 'MEMBER');

-- CreateEnum
CREATE TYPE "Status" AS ENUM ('DRAFT', 'ACTIVE', 'ARCHIVED');

-- CreateTable
CREATE TABLE "AmazonCompetitivePrice" (
    "id" TEXT NOT NULL,
    "asin" TEXT NOT NULL,
    "marketplaceId" TEXT NOT NULL,
    "lowestPriceCents" INTEGER,
    "buyBoxPriceCents" INTEGER,
    "offerCount" INTEGER NOT NULL DEFAULT 0,
    "data" JSONB,
    "retrievedAt" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "AmazonCompetitivePrice_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "AmazonIntegration" (
    "id" TEXT NOT NULL,
    "projectId" TEXT NOT NULL,
    "sellerId" TEXT NOT NULL,
    "marketplaceId" TEXT NOT NULL DEFAULT 'ATVPDKIKX0DER',
    "region" TEXT NOT NULL DEFAULT 'us-east-1',
    "refreshToken" TEXT NOT NULL,
    "accessToken" TEXT,
    "tokenExpiresAt" TIMESTAMP(3),
    "installedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "lastSyncAt" TIMESTAMP(3),
    "syncStatus" TEXT,
    "syncError" TEXT,

    CONSTRAINT "AmazonIntegration_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "AmazonWatchlist" (
    "asin" TEXT NOT NULL,
    "marketplaceId" TEXT NOT NULL,
    "active" BOOLEAN NOT NULL DEFAULT true,
    "notes" TEXT,
    "addedAt" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "AmazonWatchlist_pkey" PRIMARY KEY ("asin","marketplaceId")
);

-- CreateTable
CREATE TABLE "Competitor" (
    "id" TEXT NOT NULL,
    "tenantId" TEXT NOT NULL,
    "projectId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "domain" TEXT NOT NULL,
    "channel" TEXT NOT NULL,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "lastChecked" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Competitor_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "CompetitorPrice" (
    "id" TEXT NOT NULL,
    "productId" TEXT NOT NULL,
    "amount" INTEGER NOT NULL,
    "currency" TEXT NOT NULL,
    "channel" TEXT,
    "isOnSale" BOOLEAN NOT NULL DEFAULT false,
    "saleEndsAt" TIMESTAMP(3),
    "stockStatus" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "CompetitorPrice_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "CompetitorProduct" (
    "id" TEXT NOT NULL,
    "competitorId" TEXT NOT NULL,
    "skuId" TEXT,
    "name" TEXT NOT NULL,
    "skuCode" TEXT,
    "url" TEXT NOT NULL,
    "imageUrl" TEXT,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "CompetitorProduct_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "CompetitorRule" (
    "id" TEXT NOT NULL,
    "tenantId" TEXT NOT NULL,
    "projectId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "rules" JSONB NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "CompetitorRule_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Customer" (
    "id" TEXT NOT NULL,
    "tenantId" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "name" TEXT,
    "org" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Customer_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "DiscountPolicy" (
    "id" TEXT NOT NULL,
    "tenantId" TEXT NOT NULL,
    "projectId" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "ruleJson" JSONB NOT NULL,
    "enabled" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "DiscountPolicy_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Audit" (
    "id" TEXT NOT NULL,
    "tenantId" TEXT NOT NULL,
    "projectId" TEXT,
    "entity" TEXT NOT NULL,
    "entityId" TEXT NOT NULL,
    "action" TEXT NOT NULL,
    "actor" TEXT NOT NULL,
    "explain" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Audit_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Event" (
    "id" TEXT NOT NULL,
    "tenantId" TEXT,
    "projectId" TEXT,
    "kind" TEXT NOT NULL,
    "payload" JSONB NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Event_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "EventLog" (
    "id" TEXT NOT NULL,
    "eventKey" TEXT NOT NULL,
    "tenantId" TEXT NOT NULL,
    "projectId" TEXT,
    "eventType" TEXT NOT NULL,
    "payload" JSONB NOT NULL,
    "metadata" JSONB,
    "correlationId" TEXT,
    "createdAt" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "version" INTEGER NOT NULL DEFAULT 1,

    CONSTRAINT "EventLog_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Outbox" (
    "id" TEXT NOT NULL,
    "eventLogId" TEXT NOT NULL,
    "tenantId" TEXT NOT NULL,
    "eventType" TEXT NOT NULL,
    "payload" JSONB NOT NULL,
    "status" "OutboxStatus" NOT NULL DEFAULT 'PENDING',
    "retryCount" INTEGER NOT NULL DEFAULT 0,
    "maxRetries" INTEGER NOT NULL DEFAULT 5,
    "nextRetryAt" TIMESTAMPTZ(6),
    "lastError" TEXT,
    "processedAt" TIMESTAMPTZ(6),
    "createdAt" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMPTZ(6) NOT NULL,

    CONSTRAINT "Outbox_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "DlqEventLog" (
    "id" TEXT NOT NULL,
    "originalId" TEXT NOT NULL,
    "eventKey" TEXT NOT NULL,
    "tenantId" TEXT NOT NULL,
    "projectId" TEXT,
    "eventType" TEXT NOT NULL,
    "payload" JSONB NOT NULL,
    "metadata" JSONB,
    "failureReason" TEXT NOT NULL,
    "retryCount" INTEGER NOT NULL,
    "failedAt" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "DlqEventLog_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Membership" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "projectId" TEXT NOT NULL,
    "role" "ProjectRole" NOT NULL DEFAULT 'VIEWER',

    CONSTRAINT "Membership_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Policy" (
    "id" TEXT NOT NULL,
    "tenantId" TEXT NOT NULL,
    "projectId" TEXT NOT NULL,
    "autoApply" BOOLEAN NOT NULL DEFAULT false,
    "rules" JSONB NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Policy_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "PricingRule" (
    "id" TEXT NOT NULL,
    "tenantId" TEXT NOT NULL,
    "projectId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "selectorJson" JSONB NOT NULL,
    "transformJson" JSONB NOT NULL,
    "scheduleAt" TIMESTAMPTZ(6),
    "enabled" BOOLEAN NOT NULL DEFAULT true,
    "createdBy" TEXT NOT NULL,
    "createdAt" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMPTZ(6) NOT NULL,
    "deletedAt" TIMESTAMPTZ(6),

    CONSTRAINT "PricingRule_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "RuleRun" (
    "id" TEXT NOT NULL,
    "tenantId" TEXT NOT NULL,
    "projectId" TEXT NOT NULL,
    "ruleId" TEXT NOT NULL,
    "status" "RuleRunStatus" NOT NULL DEFAULT 'PREVIEW',
    "scheduledFor" TIMESTAMPTZ(6),
    "queuedAt" TIMESTAMPTZ(6),
    "startedAt" TIMESTAMPTZ(6),
    "finishedAt" TIMESTAMPTZ(6),
    "explainJson" JSONB,
    "errorMessage" TEXT,
    "metadata" JSONB,
    "createdAt" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMPTZ(6) NOT NULL,

    CONSTRAINT "RuleRun_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "RuleTarget" (
    "id" TEXT NOT NULL,
    "tenantId" TEXT NOT NULL,
    "projectId" TEXT NOT NULL,
    "ruleRunId" TEXT NOT NULL,
    "productId" TEXT NOT NULL,
    "variantId" TEXT,
    "skuId" TEXT,
    "beforeJson" JSONB NOT NULL,
    "afterJson" JSONB NOT NULL,
    "status" "RuleTargetStatus" NOT NULL DEFAULT 'PREVIEW',
    "attempts" INTEGER NOT NULL DEFAULT 0,
    "lastAttempt" TIMESTAMPTZ(6),
    "appliedAt" TIMESTAMPTZ(6),
    "errorMessage" TEXT,
    "createdAt" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMPTZ(6) NOT NULL,

    CONSTRAINT "RuleTarget_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Price" (
    "id" TEXT NOT NULL,
    "skuId" TEXT NOT NULL,
    "currency" TEXT NOT NULL,
    "billingCycle" TEXT,
    "unit" TEXT,
    "amount" INTEGER NOT NULL,
    "status" "Status" NOT NULL DEFAULT 'ACTIVE',

    CONSTRAINT "Price_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "PriceChange" (
    "id" TEXT NOT NULL,
    "tenantId" TEXT NOT NULL,
    "projectId" TEXT NOT NULL,
    "skuId" TEXT NOT NULL,
    "source" TEXT NOT NULL,
    "fromAmount" INTEGER NOT NULL,
    "toAmount" INTEGER NOT NULL,
    "currency" TEXT NOT NULL,
    "context" JSONB,
    "status" "PriceChangeStatus" NOT NULL DEFAULT 'PENDING',
    "policyResult" JSONB,
    "approvedBy" TEXT,
    "appliedAt" TIMESTAMP(3),
    "connectorStatus" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "selectorJson" JSONB,
    "transformJson" JSONB,
    "scheduleAt" TIMESTAMP(3),
    "state" "PriceChangeStatus",
    "createdBy" TEXT,
    "productId" TEXT,
    "variantId" TEXT,
    "ruleRunId" TEXT,
    "compareAtOld" INTEGER,
    "compareAtNew" INTEGER,

    CONSTRAINT "PriceChange_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ExplainTrace" (
    "id" TEXT NOT NULL,
    "tenantId" TEXT NOT NULL,
    "projectId" TEXT,
    "priceChangeId" TEXT,
    "entity" TEXT NOT NULL,
    "entityId" TEXT NOT NULL,
    "action" TEXT NOT NULL,
    "actor" TEXT NOT NULL,
    "trace" JSONB NOT NULL,
    "metadata" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ExplainTrace_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "PriceVersion" (
    "id" TEXT NOT NULL,
    "priceId" TEXT NOT NULL,
    "amount" INTEGER NOT NULL,
    "note" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "productId" TEXT,
    "currency" TEXT,
    "unitAmount" INTEGER,
    "compareAt" INTEGER,
    "validFrom" TIMESTAMP(3),
    "validTo" TIMESTAMP(3),

    CONSTRAINT "PriceVersion_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Product" (
    "id" TEXT NOT NULL,
    "tenantId" TEXT NOT NULL,
    "projectId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "code" TEXT NOT NULL,
    "status" "Status" NOT NULL DEFAULT 'DRAFT',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "sku" TEXT,
    "title" TEXT,
    "tags" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "channelRefs" JSONB,
    "active" BOOLEAN DEFAULT true,

    CONSTRAINT "Product_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Project" (
    "id" TEXT NOT NULL,
    "tenantId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "amazonIntegrations" TEXT[],

    CONSTRAINT "Project_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Quote" (
    "id" TEXT NOT NULL,
    "tenantId" TEXT NOT NULL,
    "customerId" TEXT NOT NULL,
    "status" "QuoteStatus" NOT NULL DEFAULT 'DRAFT',
    "currency" TEXT NOT NULL,
    "subtotal" INTEGER NOT NULL DEFAULT 0,
    "total" INTEGER NOT NULL DEFAULT 0,
    "meta" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "checkoutUrl" TEXT,

    CONSTRAINT "Quote_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "QuoteItem" (
    "id" TEXT NOT NULL,
    "quoteId" TEXT NOT NULL,
    "skuId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "qty" INTEGER NOT NULL,
    "unitAmount" INTEGER NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "QuoteItem_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ShopifyIntegration" (
    "id" TEXT NOT NULL,
    "projectId" TEXT NOT NULL,
    "shopDomain" TEXT NOT NULL,
    "accessToken" TEXT NOT NULL,
    "scope" TEXT NOT NULL,
    "installedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "lastSyncAt" TIMESTAMP(3),
    "syncStatus" TEXT,
    "syncError" TEXT,

    CONSTRAINT "ShopifyIntegration_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ShopifyWebhookSubscription" (
    "id" TEXT NOT NULL,
    "integrationId" TEXT NOT NULL,
    "topic" TEXT NOT NULL,
    "address" TEXT NOT NULL,
    "webhookId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "isActive" BOOLEAN NOT NULL DEFAULT true,

    CONSTRAINT "ShopifyWebhookSubscription_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Sku" (
    "id" TEXT NOT NULL,
    "productId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "code" TEXT NOT NULL,
    "attributes" JSONB,
    "status" "Status" NOT NULL DEFAULT 'DRAFT',

    CONSTRAINT "Sku_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Tenant" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Tenant_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "User" (
    "id" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "name" TEXT,
    "role" "Role" NOT NULL DEFAULT 'MEMBER',
    "tenantId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "passwordHash" TEXT,

    CONSTRAINT "User_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "CopilotQueryLog" (
    "id" TEXT NOT NULL,
    "tenantId" TEXT NOT NULL,
    "projectId" TEXT NOT NULL,
    "userId" TEXT,
    "userRole" TEXT,
    "query" TEXT NOT NULL,
    "generatedSQL" TEXT,
    "queryType" TEXT NOT NULL,
    "resultCount" INTEGER,
    "executionTime" INTEGER,
    "schemaVersion" TEXT,
    "method" TEXT,
    "success" BOOLEAN NOT NULL DEFAULT true,
    "error" TEXT,
    "metadata" JSONB,
    "createdAt" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "CopilotQueryLog_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "AnalyticsDigest" (
    "id" TEXT NOT NULL,
    "tenantId" TEXT NOT NULL,
    "projectId" TEXT NOT NULL,
    "digestDate" DATE NOT NULL,
    "totalPriceChanges" INTEGER NOT NULL DEFAULT 0,
    "totalRevenue" INTEGER,
    "avgMargin" DOUBLE PRECISION,
    "anomalies" JSONB,
    "topPerformers" JSONB,
    "metrics" JSONB NOT NULL,
    "createdAt" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "AnalyticsDigest_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "AmazonCompetitivePrice_asin_marketplace_idx" ON "AmazonCompetitivePrice"("asin", "marketplaceId");

-- CreateIndex
CREATE INDEX "AmazonCompetitivePrice_retrievedAt_idx" ON "AmazonCompetitivePrice"("retrievedAt");

-- CreateIndex
CREATE INDEX "AmazonIntegration_projectId_idx" ON "AmazonIntegration"("projectId");

-- CreateIndex
CREATE INDEX "AmazonIntegration_sellerId_idx" ON "AmazonIntegration"("sellerId");

-- CreateIndex
CREATE UNIQUE INDEX "AmazonIntegration_projectId_sellerId_key" ON "AmazonIntegration"("projectId", "sellerId");

-- CreateIndex
CREATE UNIQUE INDEX "AmazonWatchlist_asin_marketplace_unique" ON "AmazonWatchlist"("asin", "marketplaceId");

-- CreateIndex
CREATE INDEX "Competitor_tenantId_projectId_idx" ON "Competitor"("tenantId", "projectId");

-- CreateIndex
CREATE INDEX "CompetitorPrice_createdAt_idx" ON "CompetitorPrice"("createdAt");

-- CreateIndex
CREATE INDEX "CompetitorPrice_productId_createdAt_idx" ON "CompetitorPrice"("productId", "createdAt");

-- CreateIndex
CREATE INDEX "CompetitorProduct_competitorId_skuCode_idx" ON "CompetitorProduct"("competitorId", "skuCode");

-- CreateIndex
CREATE INDEX "CompetitorRule_tenantId_projectId_idx" ON "CompetitorRule"("tenantId", "projectId");

-- CreateIndex
CREATE INDEX "DiscountPolicy_tenantId_projectId_enabled_idx" ON "DiscountPolicy"("tenantId", "projectId", "enabled");

-- CreateIndex
CREATE INDEX "Audit_tenantId_entity_entityId_idx" ON "Audit"("tenantId", "entity", "entityId");

-- CreateIndex
CREATE INDEX "Audit_createdAt_idx" ON "Audit"("createdAt");

-- CreateIndex
CREATE INDEX "Audit_actor_idx" ON "Audit"("actor");

-- CreateIndex
CREATE INDEX "Event_kind_idx" ON "Event"("kind");

-- CreateIndex
CREATE INDEX "Event_createdAt_idx" ON "Event"("createdAt");

-- CreateIndex
CREATE INDEX "EventLog_tenantId_eventType_createdAt_idx" ON "EventLog"("tenantId", "eventType", "createdAt");

-- CreateIndex
CREATE INDEX "EventLog_correlationId_idx" ON "EventLog"("correlationId");

-- CreateIndex
CREATE INDEX "EventLog_createdAt_idx" ON "EventLog"("createdAt");

-- CreateIndex
CREATE UNIQUE INDEX "EventLog_eventKey_tenantId_key" ON "EventLog"("eventKey", "tenantId");

-- CreateIndex
CREATE INDEX "Outbox_status_nextRetryAt_idx" ON "Outbox"("status", "nextRetryAt");

-- CreateIndex
CREATE INDEX "Outbox_tenantId_status_idx" ON "Outbox"("tenantId", "status");

-- CreateIndex
CREATE INDEX "Outbox_createdAt_idx" ON "Outbox"("createdAt");

-- CreateIndex
CREATE INDEX "DlqEventLog_tenantId_eventType_idx" ON "DlqEventLog"("tenantId", "eventType");

-- CreateIndex
CREATE INDEX "DlqEventLog_failedAt_idx" ON "DlqEventLog"("failedAt");

-- CreateIndex
CREATE UNIQUE INDEX "Membership_userId_projectId_key" ON "Membership"("userId", "projectId");

-- CreateIndex
CREATE UNIQUE INDEX "Policy_projectId_key" ON "Policy"("projectId");

-- CreateIndex
CREATE INDEX "PricingRule_tenantId_projectId_enabled_idx" ON "PricingRule"("tenantId", "projectId", "enabled");

-- CreateIndex
CREATE INDEX "PricingRule_scheduleAt_idx" ON "PricingRule"("scheduleAt");

-- CreateIndex
CREATE INDEX "PricingRule_deletedAt_idx" ON "PricingRule"("deletedAt");

-- CreateIndex
CREATE INDEX "RuleRun_tenantId_projectId_status_idx" ON "RuleRun"("tenantId", "projectId", "status");

-- CreateIndex
CREATE INDEX "RuleRun_ruleId_status_idx" ON "RuleRun"("ruleId", "status");

-- CreateIndex
CREATE INDEX "RuleRun_scheduledFor_idx" ON "RuleRun"("scheduledFor");

-- CreateIndex
CREATE INDEX "RuleRun_queuedAt_idx" ON "RuleRun"("queuedAt");

-- CreateIndex
CREATE INDEX "RuleRun_createdAt_idx" ON "RuleRun"("createdAt");

-- CreateIndex
CREATE INDEX "RuleTarget_tenantId_projectId_status_idx" ON "RuleTarget"("tenantId", "projectId", "status");

-- CreateIndex
CREATE INDEX "RuleTarget_ruleRunId_status_idx" ON "RuleTarget"("ruleRunId", "status");

-- CreateIndex
CREATE INDEX "RuleTarget_status_lastAttempt_idx" ON "RuleTarget"("status", "lastAttempt");

-- CreateIndex
CREATE INDEX "RuleTarget_productId_idx" ON "RuleTarget"("productId");

-- CreateIndex
CREATE INDEX "RuleTarget_variantId_idx" ON "RuleTarget"("variantId");

-- CreateIndex
CREATE INDEX "RuleTarget_skuId_idx" ON "RuleTarget"("skuId");

-- CreateIndex
CREATE INDEX "Price_skuId_currency_idx" ON "Price"("skuId", "currency");

-- CreateIndex
CREATE UNIQUE INDEX "skuId_currency" ON "Price"("skuId", "currency");

-- CreateIndex
CREATE INDEX "PriceChange_tenantId_projectId_status_idx" ON "PriceChange"("tenantId", "projectId", "status");

-- CreateIndex
CREATE INDEX "PriceChange_scheduleAt_idx" ON "PriceChange"("scheduleAt");

-- CreateIndex
CREATE INDEX "PriceChange_ruleRunId_idx" ON "PriceChange"("ruleRunId");

-- CreateIndex
CREATE INDEX "PriceChange_productId_idx" ON "PriceChange"("productId");

-- CreateIndex
CREATE INDEX "PriceChange_variantId_idx" ON "PriceChange"("variantId");

-- CreateIndex
CREATE INDEX "ExplainTrace_tenantId_entity_entityId_idx" ON "ExplainTrace"("tenantId", "entity", "entityId");

-- CreateIndex
CREATE INDEX "ExplainTrace_priceChangeId_idx" ON "ExplainTrace"("priceChangeId");

-- CreateIndex
CREATE INDEX "ExplainTrace_createdAt_idx" ON "ExplainTrace"("createdAt");

-- CreateIndex
CREATE INDEX "ExplainTrace_actor_idx" ON "ExplainTrace"("actor");

-- CreateIndex
CREATE INDEX "PriceVersion_priceId_idx" ON "PriceVersion"("priceId");

-- CreateIndex
CREATE INDEX "PriceVersion_productId_validFrom_validTo_idx" ON "PriceVersion"("productId", "validFrom", "validTo");

-- CreateIndex
CREATE INDEX "PriceVersion_currency_idx" ON "PriceVersion"("currency");

-- CreateIndex
CREATE INDEX "Product_tenantId_active_idx" ON "Product"("tenantId", "active");

-- CreateIndex
CREATE INDEX "Product_tags_idx" ON "Product"("tags");

-- CreateIndex
CREATE UNIQUE INDEX "tenantId_projectId_code" ON "Product"("tenantId", "projectId", "code");

-- CreateIndex
CREATE UNIQUE INDEX "tenantId_projectId_sku" ON "Product"("tenantId", "projectId", "sku");

-- CreateIndex
CREATE UNIQUE INDEX "Project_slug_key" ON "Project"("slug");

-- CreateIndex
CREATE UNIQUE INDEX "ShopifyIntegration_shopDomain_key" ON "ShopifyIntegration"("shopDomain");

-- CreateIndex
CREATE INDEX "ShopifyIntegration_projectId_idx" ON "ShopifyIntegration"("projectId");

-- CreateIndex
CREATE INDEX "ShopifyIntegration_shopDomain_idx" ON "ShopifyIntegration"("shopDomain");

-- CreateIndex
CREATE UNIQUE INDEX "ShopifyWebhookSubscription_webhookId_key" ON "ShopifyWebhookSubscription"("webhookId");

-- CreateIndex
CREATE INDEX "ShopifyWebhookSubscription_integrationId_idx" ON "ShopifyWebhookSubscription"("integrationId");

-- CreateIndex
CREATE INDEX "ShopifyWebhookSubscription_webhookId_idx" ON "ShopifyWebhookSubscription"("webhookId");

-- CreateIndex
CREATE UNIQUE INDEX "productId_code" ON "Sku"("productId", "code");

-- CreateIndex
CREATE UNIQUE INDEX "User_email_key" ON "User"("email");

-- CreateIndex
CREATE INDEX "CopilotQueryLog_tenantId_projectId_createdAt_idx" ON "CopilotQueryLog"("tenantId", "projectId", "createdAt");

-- CreateIndex
CREATE INDEX "CopilotQueryLog_userId_createdAt_idx" ON "CopilotQueryLog"("userId", "createdAt");

-- CreateIndex
CREATE INDEX "CopilotQueryLog_success_idx" ON "CopilotQueryLog"("success");

-- CreateIndex
CREATE INDEX "CopilotQueryLog_createdAt_idx" ON "CopilotQueryLog"("createdAt");

-- CreateIndex
CREATE INDEX "AnalyticsDigest_tenantId_projectId_digestDate_idx" ON "AnalyticsDigest"("tenantId", "projectId", "digestDate");

-- CreateIndex
CREATE INDEX "AnalyticsDigest_digestDate_idx" ON "AnalyticsDigest"("digestDate");

-- CreateIndex
CREATE UNIQUE INDEX "AnalyticsDigest_projectId_digestDate_key" ON "AnalyticsDigest"("projectId", "digestDate");

-- AddForeignKey
ALTER TABLE "AmazonIntegration" ADD CONSTRAINT "AmazonIntegration_projectId_fkey" FOREIGN KEY ("projectId") REFERENCES "Project"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Competitor" ADD CONSTRAINT "Competitor_projectId_fkey" FOREIGN KEY ("projectId") REFERENCES "Project"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Competitor" ADD CONSTRAINT "Competitor_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "Tenant"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CompetitorPrice" ADD CONSTRAINT "CompetitorPrice_productId_fkey" FOREIGN KEY ("productId") REFERENCES "CompetitorProduct"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CompetitorProduct" ADD CONSTRAINT "CompetitorProduct_competitorId_fkey" FOREIGN KEY ("competitorId") REFERENCES "Competitor"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CompetitorProduct" ADD CONSTRAINT "CompetitorProduct_skuId_fkey" FOREIGN KEY ("skuId") REFERENCES "Sku"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CompetitorRule" ADD CONSTRAINT "CompetitorRule_projectId_fkey" FOREIGN KEY ("projectId") REFERENCES "Project"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CompetitorRule" ADD CONSTRAINT "CompetitorRule_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "Tenant"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Customer" ADD CONSTRAINT "Customer_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "Tenant"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "DiscountPolicy" ADD CONSTRAINT "DiscountPolicy_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "Tenant"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "DiscountPolicy" ADD CONSTRAINT "DiscountPolicy_projectId_fkey" FOREIGN KEY ("projectId") REFERENCES "Project"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Audit" ADD CONSTRAINT "Audit_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "Tenant"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Audit" ADD CONSTRAINT "Audit_projectId_fkey" FOREIGN KEY ("projectId") REFERENCES "Project"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Event" ADD CONSTRAINT "Event_projectId_fkey" FOREIGN KEY ("projectId") REFERENCES "Project"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Event" ADD CONSTRAINT "Event_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "Tenant"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Membership" ADD CONSTRAINT "Membership_projectId_fkey" FOREIGN KEY ("projectId") REFERENCES "Project"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Membership" ADD CONSTRAINT "Membership_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Policy" ADD CONSTRAINT "Policy_projectId_fkey" FOREIGN KEY ("projectId") REFERENCES "Project"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Policy" ADD CONSTRAINT "Policy_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "Tenant"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PricingRule" ADD CONSTRAINT "PricingRule_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "Tenant"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PricingRule" ADD CONSTRAINT "PricingRule_projectId_fkey" FOREIGN KEY ("projectId") REFERENCES "Project"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "RuleRun" ADD CONSTRAINT "RuleRun_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "Tenant"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "RuleRun" ADD CONSTRAINT "RuleRun_projectId_fkey" FOREIGN KEY ("projectId") REFERENCES "Project"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "RuleRun" ADD CONSTRAINT "RuleRun_ruleId_fkey" FOREIGN KEY ("ruleId") REFERENCES "PricingRule"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "RuleTarget" ADD CONSTRAINT "RuleTarget_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "Tenant"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "RuleTarget" ADD CONSTRAINT "RuleTarget_projectId_fkey" FOREIGN KEY ("projectId") REFERENCES "Project"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "RuleTarget" ADD CONSTRAINT "RuleTarget_ruleRunId_fkey" FOREIGN KEY ("ruleRunId") REFERENCES "RuleRun"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Price" ADD CONSTRAINT "Price_skuId_fkey" FOREIGN KEY ("skuId") REFERENCES "Sku"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PriceChange" ADD CONSTRAINT "PriceChange_projectId_fkey" FOREIGN KEY ("projectId") REFERENCES "Project"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PriceChange" ADD CONSTRAINT "PriceChange_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "Tenant"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ExplainTrace" ADD CONSTRAINT "ExplainTrace_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "Tenant"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ExplainTrace" ADD CONSTRAINT "ExplainTrace_projectId_fkey" FOREIGN KEY ("projectId") REFERENCES "Project"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ExplainTrace" ADD CONSTRAINT "ExplainTrace_priceChangeId_fkey" FOREIGN KEY ("priceChangeId") REFERENCES "PriceChange"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PriceVersion" ADD CONSTRAINT "PriceVersion_priceId_fkey" FOREIGN KEY ("priceId") REFERENCES "Price"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PriceVersion" ADD CONSTRAINT "PriceVersion_productId_fkey" FOREIGN KEY ("productId") REFERENCES "Product"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Product" ADD CONSTRAINT "Product_projectId_fkey" FOREIGN KEY ("projectId") REFERENCES "Project"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Product" ADD CONSTRAINT "Product_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "Tenant"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Project" ADD CONSTRAINT "Project_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "Tenant"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Quote" ADD CONSTRAINT "Quote_customerId_fkey" FOREIGN KEY ("customerId") REFERENCES "Customer"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "QuoteItem" ADD CONSTRAINT "QuoteItem_quoteId_fkey" FOREIGN KEY ("quoteId") REFERENCES "Quote"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ShopifyIntegration" ADD CONSTRAINT "ShopifyIntegration_projectId_fkey" FOREIGN KEY ("projectId") REFERENCES "Project"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ShopifyWebhookSubscription" ADD CONSTRAINT "ShopifyWebhookSubscription_integrationId_fkey" FOREIGN KEY ("integrationId") REFERENCES "ShopifyIntegration"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Sku" ADD CONSTRAINT "Sku_productId_fkey" FOREIGN KEY ("productId") REFERENCES "Product"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "User" ADD CONSTRAINT "User_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "Tenant"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CopilotQueryLog" ADD CONSTRAINT "CopilotQueryLog_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "Tenant"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CopilotQueryLog" ADD CONSTRAINT "CopilotQueryLog_projectId_fkey" FOREIGN KEY ("projectId") REFERENCES "Project"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
