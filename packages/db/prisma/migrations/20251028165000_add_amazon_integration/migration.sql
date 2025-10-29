-- AlterTable
ALTER TABLE "Project" ADD COLUMN IF NOT EXISTS "amazonIntegrations" TEXT[];

-- CreateTable
CREATE TABLE IF NOT EXISTS "AmazonIntegration" (
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

-- CreateIndex
CREATE INDEX IF NOT EXISTS "AmazonIntegration_projectId_idx" ON "AmazonIntegration"("projectId");

-- CreateIndex
CREATE INDEX IF NOT EXISTS "AmazonIntegration_sellerId_idx" ON "AmazonIntegration"("sellerId");

-- CreateIndex
CREATE UNIQUE INDEX IF NOT EXISTS "AmazonIntegration_projectId_sellerId_key" ON "AmazonIntegration"("projectId", "sellerId");

-- AddForeignKey
ALTER TABLE "AmazonIntegration" ADD CONSTRAINT "AmazonIntegration_projectId_fkey" FOREIGN KEY ("projectId") REFERENCES "Project"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
