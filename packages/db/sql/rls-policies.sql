-- M0.1: Row-Level Security (RLS) Policies
-- Ensures multi-tenant data isolation at the database level

-- Enable RLS on all M0.1 tenant-scoped tables
ALTER TABLE "Product" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "PriceVersion" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "DiscountPolicy" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "PriceChange" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "Event" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "Audit" ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if they exist
DROP POLICY IF EXISTS tenant_isolation_policy ON "Product";
DROP POLICY IF EXISTS tenant_isolation_policy ON "PriceVersion";
DROP POLICY IF EXISTS tenant_isolation_policy ON "DiscountPolicy";
DROP POLICY IF EXISTS tenant_isolation_policy ON "PriceChange";
DROP POLICY IF EXISTS tenant_isolation_policy ON "Event";
DROP POLICY IF EXISTS tenant_isolation_policy ON "Audit";

-- Create a function to get current tenant from context
-- This assumes tenant_id is set via SET LOCAL app.current_tenant_id = 'tenant_xxx'
CREATE OR REPLACE FUNCTION current_tenant_id() RETURNS TEXT AS $$
  SELECT NULLIF(current_setting('app.current_tenant_id', TRUE), '')::TEXT;
$$ LANGUAGE SQL STABLE;

-- Product RLS Policy
CREATE POLICY tenant_isolation_policy ON "Product"
  USING ("tenantId" = current_tenant_id());

-- PriceVersion RLS Policy (via Product relationship)
CREATE POLICY tenant_isolation_policy ON "PriceVersion"
  USING (
    EXISTS (
      SELECT 1 FROM "Product"
      WHERE "Product"."id" = "PriceVersion"."productId"
      AND "Product"."tenantId" = current_tenant_id()
    )
  );

-- DiscountPolicy RLS Policy
CREATE POLICY tenant_isolation_policy ON "DiscountPolicy"
  USING ("tenantId" = current_tenant_id());

-- PriceChange RLS Policy
CREATE POLICY tenant_isolation_policy ON "PriceChange"
  USING ("tenantId" = current_tenant_id());

-- Event RLS Policy
CREATE POLICY tenant_isolation_policy ON "Event"
  USING ("tenantId" = current_tenant_id());

-- Audit RLS Policy
CREATE POLICY tenant_isolation_policy ON "Audit"
  USING ("tenantId" = current_tenant_id());

-- Grant bypass for service role (for admin/system operations)
-- Note: In production, create a separate 'service_role' with BYPASSRLS
-- For now, this ensures the schema owner can still perform operations
