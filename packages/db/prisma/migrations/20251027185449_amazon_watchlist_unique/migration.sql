-- Add unique constraint matching code usage
CREATE UNIQUE INDEX "AmazonWatchlist_asin_marketplace_unique" ON "AmazonWatchlist" ("asin","marketplaceId");