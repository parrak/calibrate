-- CreateTable
CREATE TABLE "AmazonWatchlist" (
  "asin" TEXT NOT NULL,
  "marketplaceId" TEXT NOT NULL,
  "active" BOOLEAN NOT NULL DEFAULT TRUE,
  "notes" TEXT,
  "addedAt" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
  "updatedAt" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
  CONSTRAINT "AmazonWatchlist_pkey" PRIMARY KEY ("asin", "marketplaceId")
);

