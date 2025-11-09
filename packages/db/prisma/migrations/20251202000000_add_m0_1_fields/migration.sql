-- Add M0.1 fields to PriceChange table
ALTER TABLE "PriceChange" ADD COLUMN IF NOT EXISTS "selectorJson" JSONB;
ALTER TABLE "PriceChange" ADD COLUMN IF NOT EXISTS "transformJson" JSONB;
ALTER TABLE "PriceChange" ADD COLUMN IF NOT EXISTS "scheduleAt" TIMESTAMP(3);
ALTER TABLE "PriceChange" ADD COLUMN IF NOT EXISTS "state" "PriceChangeStatus";
ALTER TABLE "PriceChange" ADD COLUMN IF NOT EXISTS "createdBy" TEXT;

-- Add M0.1 fields to Product table
ALTER TABLE "Product" ADD COLUMN IF NOT EXISTS "sku" TEXT;
ALTER TABLE "Product" ADD COLUMN IF NOT EXISTS "title" TEXT;
ALTER TABLE "Product" ADD COLUMN IF NOT EXISTS "tags" TEXT[] DEFAULT ARRAY[]::TEXT[];
ALTER TABLE "Product" ADD COLUMN IF NOT EXISTS "channelRefs" JSONB;
ALTER TABLE "Product" ADD COLUMN IF NOT EXISTS "active" BOOLEAN;

-- Create unique constraint for Product.sku (allows NULL values)
-- This matches the schema definition: @@unique([tenantId, projectId, sku], map: "tenantId_projectId_sku")
CREATE UNIQUE INDEX IF NOT EXISTS "tenantId_projectId_sku" ON "Product"("tenantId", "projectId", "sku") WHERE "sku" IS NOT NULL;

-- Create index on Product.tags (GIN index for array searches)
CREATE INDEX IF NOT EXISTS "Product_tags_idx" ON "Product" USING GIN("tags");

-- Create index on Product.active (partial index for active products)
CREATE INDEX IF NOT EXISTS "Product_tenantId_active_idx" ON "Product"("tenantId", "active") WHERE "active" IS NOT NULL;

