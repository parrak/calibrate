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

-- CreateIndex
CREATE INDEX "Competitor_tenantId_projectId_idx" ON "Competitor"("tenantId", "projectId");

-- CreateIndex
CREATE INDEX "CompetitorProduct_competitorId_skuCode_idx" ON "CompetitorProduct"("competitorId", "skuCode");

-- CreateIndex
CREATE INDEX "CompetitorPrice_productId_createdAt_idx" ON "CompetitorPrice"("productId", "createdAt");

-- CreateIndex
CREATE INDEX "CompetitorPrice_createdAt_idx" ON "CompetitorPrice"("createdAt");

-- CreateIndex
CREATE INDEX "CompetitorRule_tenantId_projectId_idx" ON "CompetitorRule"("tenantId", "projectId");

-- AddForeignKey
ALTER TABLE "Competitor" ADD CONSTRAINT "Competitor_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "Tenant"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Competitor" ADD CONSTRAINT "Competitor_projectId_fkey" FOREIGN KEY ("projectId") REFERENCES "Project"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CompetitorProduct" ADD CONSTRAINT "CompetitorProduct_competitorId_fkey" FOREIGN KEY ("competitorId") REFERENCES "Competitor"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CompetitorProduct" ADD CONSTRAINT "CompetitorProduct_skuId_fkey" FOREIGN KEY ("skuId") REFERENCES "Sku"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CompetitorPrice" ADD CONSTRAINT "CompetitorPrice_productId_fkey" FOREIGN KEY ("productId") REFERENCES "CompetitorProduct"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CompetitorRule" ADD CONSTRAINT "CompetitorRule_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "Tenant"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CompetitorRule" ADD CONSTRAINT "CompetitorRule_projectId_fkey" FOREIGN KEY ("projectId") REFERENCES "Project"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
