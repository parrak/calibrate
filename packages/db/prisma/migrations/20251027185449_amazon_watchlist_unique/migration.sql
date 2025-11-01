-- Ensure AmazonWatchlist table exists before adding unique index
CREATE TABLE IF NOT EXISTS "AmazonWatchlist" (
  "asin" TEXT NOT NULL,
  "marketplaceId" TEXT NOT NULL,
  "active" BOOLEAN NOT NULL DEFAULT TRUE,
  "notes" TEXT,
  "addedAt" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
  "updatedAt" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
  CONSTRAINT "AmazonWatchlist_pkey" PRIMARY KEY ("asin", "marketplaceId")
);

-- Add unique constraint matching code usage
CREATE UNIQUE INDEX IF NOT EXISTS "AmazonWatchlist_asin_marketplace_unique" ON "AmazonWatchlist" ("asin","marketplaceId");
