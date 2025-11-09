-- M0.1: RLS Test Fixtures
-- Test data for validating Row-Level Security policies

-- Create test tenants
INSERT INTO "Tenant" (id, name, "createdAt") VALUES
  ('tenant_001', 'Test Tenant A', NOW()),
  ('tenant_002', 'Test Tenant B', NOW())
ON CONFLICT (id) DO NOTHING;

-- Create test projects
INSERT INTO "Project" (id, "tenantId", name, slug, "createdAt", "updatedAt") VALUES
  ('proj_a1', 'tenant_001', 'Project A1', 'proj-a1', NOW(), NOW()),
  ('proj_b1', 'tenant_002', 'Project B1', 'proj-b1', NOW(), NOW())
ON CONFLICT (id) DO NOTHING;

-- Test Products (tenant-scoped)
INSERT INTO "Product" (id, "tenantId", "projectId", sku, title, tags, "channelRefs", active, "createdAt") VALUES
  ('prod_001', 'tenant_001', 'proj_a1', 'SKU-A-001', 'Product A1', ARRAY['test', 'tenant-a'], '{"shopify_id": "12345"}', true, NOW()),
  ('prod_002', 'tenant_001', 'proj_a1', 'SKU-A-002', 'Product A2', ARRAY['test'], '{"shopify_id": "12346"}', true, NOW()),
  ('prod_003', 'tenant_002', 'proj_b1', 'SKU-B-001', 'Product B1', ARRAY['test', 'tenant-b'], '{"shopify_id": "67890"}', true, NOW())
ON CONFLICT (id) DO NOTHING;

-- Test PriceVersions
INSERT INTO "PriceVersion" (id, "productId", currency, "unitAmount", "compareAt", "validFrom", "validTo", "createdAt") VALUES
  ('pv_001', 'prod_001', 'USD', 1000, 1200, NOW(), NULL, NOW()),
  ('pv_002', 'prod_002', 'USD', 2000, NULL, NOW(), NULL, NOW()),
  ('pv_003', 'prod_003', 'USD', 1500, 1800, NOW(), NULL, NOW())
ON CONFLICT (id) DO NOTHING;

-- Test DiscountPolicies
INSERT INTO "DiscountPolicy" (id, "tenantId", "projectId", type, "ruleJson", enabled, "createdAt", "updatedAt") VALUES
  ('dp_001', 'tenant_001', 'proj_a1', 'percentage', '{"selector": {"tags": ["sale"]}, "transform": {"percent": -10}}', true, NOW(), NOW()),
  ('dp_002', 'tenant_002', 'proj_b1', 'absolute', '{"selector": {"sku": "SKU-B-001"}, "transform": {"amount": -100}}', true, NOW(), NOW())
ON CONFLICT (id) DO NOTHING;

-- Test PriceChanges
INSERT INTO "PriceChange" (id, "tenantId", "projectId", "selectorJson", "transformJson", "scheduleAt", state, "createdBy", "createdAt") VALUES
  ('pc_001', 'tenant_001', 'proj_a1', '{"tags": ["test"]}', '{"type": "percentage", "value": -15}', NULL, 'PENDING', 'user_a', NOW()),
  ('pc_002', 'tenant_002', 'proj_b1', '{"sku": "SKU-B-001"}', '{"type": "absolute", "value": -200}', NULL, 'APPROVED', 'user_b', NOW())
ON CONFLICT (id) DO NOTHING;

-- Test Events
INSERT INTO "Event" (id, "tenantId", "projectId", type, payload, "createdAt") VALUES
  ('evt_001', 'tenant_001', 'proj_a1', 'shopify.sync.complete', '{"products": 2}', NOW()),
  ('evt_002', 'tenant_002', 'proj_b1', 'pricechange.applied', '{"changeId": "pc_002"}', NOW())
ON CONFLICT (id) DO NOTHING;

-- Test Audit entries
INSERT INTO "Audit" (id, "tenantId", "projectId", entity, "entityId", action, actor, explain, "createdAt") VALUES
  ('aud_001', 'tenant_001', 'proj_a1', 'PriceChange', 'pc_001', 'create', 'user_a', '{"reason": "seasonal sale"}', NOW()),
  ('aud_002', 'tenant_002', 'proj_b1', 'PriceChange', 'pc_002', 'approve', 'user_b', '{"reason": "competitor match"}', NOW())
ON CONFLICT (id) DO NOTHING;
