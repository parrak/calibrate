import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function main() {
  console.log('🌱 Starting seed...')

  // Clean existing data
  await prisma.event.deleteMany()
  await prisma.priceChange.deleteMany()
  await prisma.quoteItem.deleteMany()
  await prisma.quote.deleteMany()
  await prisma.customer.deleteMany()
  await prisma.policy.deleteMany()
  await prisma.priceVersion.deleteMany()
  await prisma.price.deleteMany()
  await prisma.sku.deleteMany()
  await prisma.product.deleteMany()
  await prisma.membership.deleteMany()
  await prisma.project.deleteMany()
  await prisma.user.deleteMany()
  await prisma.tenant.deleteMany()

  // Create Demo Tenant
  const tenant = await prisma.tenant.create({
    data: {
      name: 'Acme Corporation',
    },
  })
  console.log('✅ Created tenant:', tenant.name)

  // Create Users
  const owner = await prisma.user.create({
    data: {
      email: 'owner@acme.com',
      name: 'Alice Owner',
      role: 'OWNER',
      tenantId: tenant.id,
    },
  })

  const admin = await prisma.user.create({
    data: {
      email: 'admin@acme.com',
      name: 'Bob Admin',
      role: 'ADMIN',
      tenantId: tenant.id,
    },
  })

  const member = await prisma.user.create({
    data: {
      email: 'member@acme.com',
      name: 'Charlie Member',
      role: 'MEMBER',
      tenantId: tenant.id,
    },
  })
  console.log('✅ Created 3 users')

  // Create Demo Project
  const project = await prisma.project.create({
    data: {
      name: 'SaaS Platform',
      slug: 'demo',
      tenantId: tenant.id,
    },
  })
  console.log('✅ Created project:', project.name)

  // Create Memberships
  await prisma.membership.createMany({
    data: [
      { userId: owner.id, projectId: project.id, role: 'OWNER' },
      { userId: admin.id, projectId: project.id, role: 'ADMIN' },
      { userId: member.id, projectId: project.id, role: 'VIEWER' },
    ],
  })
  console.log('✅ Created project memberships')

  // Create Products
  const proProduct = await prisma.product.create({
    data: {
      name: 'Pro Plan',
      code: 'PRO',
      status: 'ACTIVE',
      tenantId: tenant.id,
      projectId: project.id,
    },
  })

  const enterpriseProduct = await prisma.product.create({
    data: {
      name: 'Enterprise Plan',
      code: 'ENTERPRISE',
      status: 'ACTIVE',
      tenantId: tenant.id,
      projectId: project.id,
    },
  })

  const starterProduct = await prisma.product.create({
    data: {
      name: 'Starter Plan',
      code: 'STARTER',
      status: 'ACTIVE',
      tenantId: tenant.id,
      projectId: project.id,
    },
  })
  console.log('✅ Created 3 products')

  // Create SKUs for Pro Plan
  const proMonthly = await prisma.sku.create({
    data: {
      name: 'Pro Plan - Monthly',
      code: 'PRO-MONTHLY',
      status: 'ACTIVE',
      productId: proProduct.id,
      attributes: { term: 'monthly', region: 'US' },
    },
  })

  const proAnnual = await prisma.sku.create({
    data: {
      name: 'Pro Plan - Annual',
      code: 'PRO-ANNUAL',
      status: 'ACTIVE',
      productId: proProduct.id,
      attributes: { term: 'annual', region: 'US' },
    },
  })

  // Create SKUs for Enterprise Plan
  const enterpriseMonthly = await prisma.sku.create({
    data: {
      name: 'Enterprise Plan - Monthly',
      code: 'ENTERPRISE-MONTHLY',
      status: 'ACTIVE',
      productId: enterpriseProduct.id,
      attributes: { term: 'monthly', region: 'US' },
    },
  })

  // Create SKUs for Starter Plan
  const starterMonthly = await prisma.sku.create({
    data: {
      name: 'Starter Plan - Monthly',
      code: 'STARTER-MONTHLY',
      status: 'ACTIVE',
      productId: starterProduct.id,
      attributes: { term: 'monthly', region: 'US' },
    },
  })
  console.log('✅ Created 4 SKUs')

  // Create Prices
  const proMonthlyPrice = await prisma.price.create({
    data: {
      skuId: proMonthly.id,
      currency: 'USD',
      billingCycle: 'monthly',
      unit: 'seat',
      amount: 4900, // $49.00
      status: 'ACTIVE',
    },
  })

  const proAnnualPrice = await prisma.price.create({
    data: {
      skuId: proAnnual.id,
      currency: 'USD',
      billingCycle: 'annual',
      unit: 'seat',
      amount: 49000, // $490.00 (2 months free)
      status: 'ACTIVE',
    },
  })

  const enterpriseMonthlyPrice = await prisma.price.create({
    data: {
      skuId: enterpriseMonthly.id,
      currency: 'USD',
      billingCycle: 'monthly',
      unit: 'seat',
      amount: 19900, // $199.00
      status: 'ACTIVE',
    },
  })

  const starterMonthlyPrice = await prisma.price.create({
    data: {
      skuId: starterMonthly.id,
      currency: 'USD',
      billingCycle: 'monthly',
      unit: 'seat',
      amount: 1900, // $19.00
      status: 'ACTIVE',
    },
  })
  console.log('✅ Created 4 prices')

  // Create initial price versions
  await prisma.priceVersion.createMany({
    data: [
      { priceId: proMonthlyPrice.id, amount: 4900, note: 'Initial price' },
      { priceId: proAnnualPrice.id, amount: 49000, note: 'Initial price' },
      { priceId: enterpriseMonthlyPrice.id, amount: 19900, note: 'Initial price' },
      { priceId: starterMonthlyPrice.id, amount: 1900, note: 'Initial price' },
    ],
  })
  console.log('✅ Created price versions')

  // Create Policy with Guardrails
  const policy = await prisma.policy.create({
    data: {
      tenantId: tenant.id,
      projectId: project.id,
      autoApply: false,
      rules: {
        maxPctDelta: 0.15, // 15% max change
        dailyChangeBudgetPct: 0.25, // 25% daily budget
        floors: {
          'PRO-MONTHLY': 3900, // $39 minimum
          'ENTERPRISE-MONTHLY': 14900, // $149 minimum
        },
        ceilings: {
          'PRO-MONTHLY': 7900, // $79 maximum
          'ENTERPRISE-MONTHLY': 29900, // $299 maximum
        },
      },
    },
  })
  console.log('✅ Created policy with guardrails')

  // Create Demo Customers
  const customer1 = await prisma.customer.create({
    data: {
      email: 'john@startup.com',
      name: 'John Smith',
      org: 'Startup Inc',
      tenantId: tenant.id,
    },
  })

  const customer2 = await prisma.customer.create({
    data: {
      email: 'sarah@enterprise.com',
      name: 'Sarah Johnson',
      org: 'Enterprise Corp',
      tenantId: tenant.id,
    },
  })
  console.log('✅ Created 2 customers')

  // Create Sample Price Changes (for testing the queue)
  const priceChange1 = await prisma.priceChange.create({
    data: {
      tenantId: tenant.id,
      projectId: project.id,
      skuId: proMonthly.id,
      source: 'competitor-monitor',
      fromAmount: 4900,
      toAmount: 5400, // +10% increase
      currency: 'USD',
      status: 'PENDING',
      context: {
        skuCode: 'PRO-MONTHLY',
        projectSlug: 'demo',
        reason: 'Competitor increased pricing',
        competitorPrice: 5500,
      },
      policyResult: {
        ok: true,
        checks: [
          { name: 'maxPctDelta', ok: true, deltaPct: 0.102, limit: 0.15 },
          { name: 'floor', ok: true, floor: 3900, proposedAmount: 5400 },
          { name: 'ceiling', ok: true, ceiling: 7900, proposedAmount: 5400 },
        ],
      },
      connectorStatus: {
        target: 'shopify',
        state: 'SYNCED',
        errorMessage: null,
      },
    },
  })

  const priceChange2 = await prisma.priceChange.create({
    data: {
      tenantId: tenant.id,
      projectId: project.id,
      skuId: enterpriseMonthly.id,
      source: 'ai-optimizer',
      fromAmount: 19900,
      toAmount: 17900, // -10% decrease
      currency: 'USD',
      status: 'PENDING',
      context: {
        skuCode: 'ENTERPRISE-MONTHLY',
        projectSlug: 'demo',
        reason: 'Low demand, optimize for conversion',
        currentConversionRate: 0.02,
      },
      policyResult: {
        ok: true,
        checks: [
          { name: 'maxPctDelta', ok: true, deltaPct: 0.1, limit: 0.15 },
          { name: 'floor', ok: true, floor: 14900, proposedAmount: 17900 },
          { name: 'ceiling', ok: true, ceiling: 29900, proposedAmount: 17900 },
        ],
      },
      connectorStatus: {
        target: 'shopify',
        state: 'QUEUED',
        errorMessage: null,
      },
    },
  })

  const priceChange3 = await prisma.priceChange.create({
    data: {
      tenantId: tenant.id,
      projectId: project.id,
      skuId: starterMonthly.id,
      source: 'manual',
      fromAmount: 1900,
      toAmount: 2900, // +53% increase (will fail guardrails)
      currency: 'USD',
      status: 'PENDING',
      context: {
        skuCode: 'STARTER-MONTHLY',
        projectSlug: 'demo',
        reason: 'Manual price adjustment test',
      },
      policyResult: {
        ok: false,
        checks: [
          { name: 'maxPctDelta', ok: false, deltaPct: 0.526, limit: 0.15 },
        ],
      },
      connectorStatus: {
        target: 'shopify',
        state: 'ERROR',
        errorMessage: 'Policy guardrail failure',
      },
    },
  })

  console.log('✅ Created 3 sample price changes')

  // Create Sample Quote
  const quote = await prisma.quote.create({
    data: {
      tenantId: tenant.id,
      customerId: customer1.id,
      status: 'DRAFT',
      currency: 'USD',
      subtotal: 58800, // 12 seats * $49
      total: 58800,
      meta: {
        note: 'Annual contract with 12 seats',
      },
    },
  })

  await prisma.quoteItem.createMany({
    data: [
      {
        quoteId: quote.id,
        skuId: proMonthly.id,
        name: 'Pro Plan - Monthly',
        qty: 12,
        unitAmount: 4900,
      },
    ],
  })
  console.log('✅ Created sample quote')

  // Create Events
  await prisma.event.createMany({
    data: [
      {
        tenantId: tenant.id,
        projectId: project.id,
        kind: 'PRODUCT_CREATED',
        payload: { productId: proProduct.id, name: proProduct.name },
      },
      {
        tenantId: tenant.id,
        projectId: project.id,
        kind: 'PRICE_CHANGE_SUGGESTED',
        payload: { priceChangeId: priceChange1.id, source: 'competitor-monitor' },
      },
      {
        tenantId: tenant.id,
        projectId: project.id,
        kind: 'POLICY_CREATED',
        payload: { policyId: policy.id },
      },
    ],
  })
  console.log('✅ Created event logs')

  console.log('\n🎉 Seed completed successfully!')
  console.log('\n📊 Summary:')
  console.log(`   - Tenant: ${tenant.name}`)
  console.log(`   - Project: ${project.slug}`)
  console.log(`   - Users: 3 (owner, admin, member)`)
  console.log(`   - Products: 3 (Starter, Pro, Enterprise)`)
  console.log(`   - SKUs: 4`)
  console.log(`   - Prices: 4`)
  console.log(`   - Pending Price Changes: 3`)
  console.log(`   - Customers: 2`)
  console.log(`   - Quotes: 1`)
  console.log('\n🔐 Test Credentials:')
  console.log(`   - Owner: owner@acme.com`)
  console.log(`   - Admin: admin@acme.com`)
  console.log(`   - Member: member@acme.com`)
}

main()
  .catch((e) => {
    console.error('❌ Seed failed:', e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
