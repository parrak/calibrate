-- CreateTable
CREATE TABLE IF NOT EXISTS "ShopifyIntegration" (
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
CREATE TABLE IF NOT EXISTS "ShopifyWebhookSubscription" (
    "id" TEXT NOT NULL,
    "integrationId" TEXT NOT NULL,
    "topic" TEXT NOT NULL,
    "address" TEXT NOT NULL,
    "webhookId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "isActive" BOOLEAN NOT NULL DEFAULT true,

    CONSTRAINT "ShopifyWebhookSubscription_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX IF NOT EXISTS "ShopifyIntegration_shopDomain_key" ON "ShopifyIntegration"("shopDomain");

-- CreateIndex
CREATE INDEX IF NOT EXISTS "ShopifyIntegration_projectId_idx" ON "ShopifyIntegration"("projectId");

-- CreateIndex
CREATE INDEX IF NOT EXISTS "ShopifyIntegration_shopDomain_idx" ON "ShopifyIntegration"("shopDomain");

-- CreateIndex
CREATE UNIQUE INDEX IF NOT EXISTS "ShopifyWebhookSubscription_webhookId_key" ON "ShopifyWebhookSubscription"("webhookId");

-- CreateIndex
CREATE INDEX IF NOT EXISTS "ShopifyWebhookSubscription_integrationId_idx" ON "ShopifyWebhookSubscription"("integrationId");

-- CreateIndex
CREATE INDEX IF NOT EXISTS "ShopifyWebhookSubscription_webhookId_idx" ON "ShopifyWebhookSubscription"("webhookId");

-- AddForeignKey
ALTER TABLE "ShopifyIntegration" ADD CONSTRAINT "ShopifyIntegration_projectId_fkey" FOREIGN KEY ("projectId") REFERENCES "Project"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ShopifyWebhookSubscription" ADD CONSTRAINT "ShopifyWebhookSubscription_integrationId_fkey" FOREIGN KEY ("integrationId") REFERENCES "ShopifyIntegration"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
