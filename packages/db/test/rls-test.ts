#!/usr/bin/env tsx
/**
 * M0.1: RLS Policy Tests
 * Validates Row-Level Security isolation between tenants
 */

import { PrismaClient } from '@prisma/client';
import { readFileSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const prisma = new PrismaClient();

interface TestResult {
  name: string;
  passed: boolean;
  error?: string;
}

const results: TestResult[] = [];

async function runTest(name: string, testFn: () => Promise<void>) {
  try {
    await testFn();
    results.push({ name, passed: true });
    console.log(`✓ ${name}`);
  } catch (error) {
    results.push({ name, passed: false, error: (error as Error).message });
    console.error(`✗ ${name}: ${(error as Error).message}`);
  }
}

async function setTenantContext(tenantId: string) {
  await prisma.$executeRawUnsafe(`SET LOCAL app.current_tenant_id = '${tenantId}'`);
}

async function main() {
  console.log('🔒 M0.1 RLS Policy Tests');
  console.log('━'.repeat(50));

  // Test 1: Product isolation
  await runTest('Product: Tenant A can only see own products', async () => {
    await setTenantContext('tenant_001');
    const products = await prisma.product.findMany({
      where: { active: true }
    });

    // Should only see tenant_001 products
    const hasTenantAProducts = products.some(p => p.tenantId === 'tenant_001');
    const hasTenantBProducts = products.some(p => p.tenantId === 'tenant_002');

    if (!hasTenantAProducts || hasTenantBProducts) {
      throw new Error('RLS failed: Wrong products visible');
    }
  });

  // Test 2: PriceVersion isolation via Product
  await runTest('PriceVersion: Isolated via Product relationship', async () => {
    await setTenantContext('tenant_001');
    const priceVersions = await prisma.priceVersion.findMany({
      include: { Product: true }
    });

    const hasWrongTenant = priceVersions.some(pv => pv.Product?.tenantId !== 'tenant_001');
    if (hasWrongTenant) {
      throw new Error('RLS failed: PriceVersion leaked to wrong tenant');
    }
  });

  // Test 3: DiscountPolicy isolation
  await runTest('DiscountPolicy: Tenant isolation works', async () => {
    await setTenantContext('tenant_002');
    const policies = await prisma.discountPolicy.findMany();

    const hasWrongTenant = policies.some(p => p.tenantId !== 'tenant_002');
    if (hasWrongTenant) {
      throw new Error('RLS failed: DiscountPolicy not isolated');
    }
  });

  // Test 4: PriceChange isolation
  await runTest('PriceChange: Tenant B cannot see Tenant A changes', async () => {
    await setTenantContext('tenant_002');
    const changes = await prisma.priceChange.findMany();

    const hasTenantAChanges = changes.some(c => c.tenantId === 'tenant_001');
    if (hasTenantAChanges) {
      throw new Error('RLS failed: PriceChange leaked across tenants');
    }
  });

  // Test 5: Event isolation
  await runTest('Event: Events scoped to tenant', async () => {
    await setTenantContext('tenant_001');
    const events = await prisma.event.findMany();

    const allBelongToTenant = events.every(e => e.tenantId === 'tenant_001');
    if (!allBelongToTenant) {
      throw new Error('RLS failed: Events not properly scoped');
    }
  });

  // Test 6: Audit isolation
  await runTest('Audit: Audit logs scoped to tenant', async () => {
    await setTenantContext('tenant_002');
    const audits = await prisma.audit.findMany();

    const allBelongToTenant = audits.every(a => a.tenantId === 'tenant_002');
    if (!allBelongToTenant) {
      throw new Error('RLS failed: Audit logs leaked');
    }
  });

  console.log('━'.repeat(50));

  const passed = results.filter(r => r.passed).length;
  const failed = results.filter(r => !r.passed).length;

  console.log(`\n📊 Results: ${passed} passed, ${failed} failed`);

  if (failed > 0) {
    console.log('\n❌ Failed tests:');
    results.filter(r => !r.passed).forEach(r => {
      console.log(`  - ${r.name}: ${r.error}`);
    });
    process.exit(1);
  }

  console.log('\n✅ All RLS tests passed!');
}

main()
  .catch((error) => {
    console.error('Fatal error:', error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
