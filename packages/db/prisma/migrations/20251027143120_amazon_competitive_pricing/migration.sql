-- CreateTable
CREATE TABLE "AmazonCompetitivePrice" (
  "id" TEXT PRIMARY KEY NOT NULL,
  "asin" TEXT NOT NULL,
  "marketplaceId" TEXT NOT NULL,
  "lowestPriceCents" INTEGER,
  "buyBoxPriceCents" INTEGER,
  "offerCount" INTEGER NOT NULL DEFAULT 0,
  "data" JSONB,
  "retrievedAt" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
);

-- Indexes
CREATE INDEX "AmazonCompetitivePrice_asin_marketplace_idx" ON "AmazonCompetitivePrice" ("asin", "marketplaceId");
CREATE INDEX "AmazonCompetitivePrice_retrievedAt_idx" ON "AmazonCompetitivePrice" ("retrievedAt");
