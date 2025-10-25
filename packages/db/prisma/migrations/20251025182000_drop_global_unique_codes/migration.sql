-- Drop single-column unique constraints conflicting with composite keys
DO $$ BEGIN
  IF EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'Product_code_key'
  ) THEN
    ALTER TABLE "Product" DROP CONSTRAINT "Product_code_key";
  END IF;
END $$;

DO $$ BEGIN
  IF EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'Sku_code_key'
  ) THEN
    ALTER TABLE "Sku" DROP CONSTRAINT "Sku_code_key";
  END IF;
END $$;

-- Ensure composite unique constraints used by the app exist
DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'tenantId_projectId_code'
  ) THEN
    ALTER TABLE "Product" ADD CONSTRAINT "tenantId_projectId_code" UNIQUE ("tenantId", "projectId", "code");
  END IF;
END $$;

DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'productId_code'
  ) THEN
    ALTER TABLE "Sku" ADD CONSTRAINT "productId_code" UNIQUE ("productId", "code");
  END IF;
END $$;

DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'skuId_currency'
  ) THEN
    ALTER TABLE "Price" ADD CONSTRAINT "skuId_currency" UNIQUE ("skuId", "currency");
  END IF;
END $$;

