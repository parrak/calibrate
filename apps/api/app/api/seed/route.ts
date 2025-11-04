import { NextResponse } from 'next/server'
import { prisma } from '@calibr/db'
import { createId } from '@paralleldrive/cuid2'
import { createRequire } from 'module'
const require = createRequire(import.meta.url)
const bcryptjs = require('bcryptjs')

export async function POST() {
  try {
    console.log('Starting database seed...')

    const adminSeedPassword = process.env.ADMIN_SEED_PASSWORD || 'Admin1234!'
    const demoSeedPassword = process.env.DEMO_SEED_PASSWORD || 'Demo1234!'
    const adminPasswordHash = bcryptjs.hashSync(adminSeedPassword, 10)
    const demoPasswordHash = bcryptjs.hashSync(demoSeedPassword, 10)

    // Create demo tenant
    const tenant = await prisma().tenant.upsert({
      where: { id: 'demo-tenant' },
      update: {},
      create: {
        id: 'demo-tenant',
        name: 'Demo Company',
      },
    })
    console.log('✓ Tenant created:', tenant.name)

    // Create demo project
    const project = await prisma().project.upsert({
      where: { slug: 'demo' },
      update: {},
      create: {
        id: createId(),
        slug: 'demo',
        name: 'Demo Project',
        tenantId: tenant.id,
        updatedAt: new Date(),
      },
    })
    console.log('✓ Project created:', project.name)

    // Create admin user with password
    const adminUser = await prisma().user.upsert({
      where: { email: 'admin@calibr.lat' },
      update: {
        name: 'Admin User',
        role: 'OWNER',
        tenantId: tenant.id,
        passwordHash: adminPasswordHash,
      },
      create: {
        id: createId(),
        email: 'admin@calibr.lat',
        name: 'Admin User',
        role: 'OWNER',
        tenantId: tenant.id,
        passwordHash: adminPasswordHash,
      },
    })
    console.log('✓ Admin user created:', adminUser.email)

    // Create demo user with password
    const demoUser = await prisma().user.upsert({
      where: { email: 'demo@calibr.lat' },
      update: {
        name: 'Demo User',
        role: 'ADMIN',
        tenantId: tenant.id,
        passwordHash: demoPasswordHash,
      },
      create: {
        id: createId(),
        email: 'demo@calibr.lat',
        name: 'Demo User',
        role: 'ADMIN',
        tenantId: tenant.id,
        passwordHash: demoPasswordHash,
      },
    })
    console.log('✓ Demo user created:', demoUser.email)

    // Create memberships
    await prisma().membership.upsert({
      where: {
        userId_projectId: {
          userId: adminUser.id,
          projectId: project.id,
        },
      },
      update: { role: 'OWNER' },
      create: {
        id: createId(),
        userId: adminUser.id,
        projectId: project.id,
        role: 'OWNER',
      },
    })

    await prisma().membership.upsert({
      where: {
        userId_projectId: {
          userId: demoUser.id,
          projectId: project.id,
        },
      },
      update: { role: 'ADMIN' },
      create: {
        id: createId(),
        userId: demoUser.id,
        projectId: project.id,
        role: 'ADMIN',
      },
    })

    // Create demo products
    const products = [
      {
        code: 'PRO',
        name: 'Professional Plan',
        tenantId: tenant.id,
        projectId: project.id,
        skus: [
          {
            code: 'PRO-MONTHLY',
            prices: [
              { currency: 'USD', amount: 4900 },
              { currency: 'EUR', amount: 4500 },
              { currency: 'GBP', amount: 3900 },
            ],
          },
          {
            code: 'PRO-ANNUAL',
            prices: [
              { currency: 'USD', amount: 49000 },
              { currency: 'EUR', amount: 45000 },
              { currency: 'GBP', amount: 39000 },
            ],
          },
        ],
      },
      {
        code: 'ENT',
        name: 'Enterprise Plan',
        tenantId: tenant.id,
        projectId: project.id,
        skus: [
          {
            code: 'ENT-MONTHLY',
            prices: [
              { currency: 'USD', amount: 9900 },
              { currency: 'EUR', amount: 9500 },
              { currency: 'GBP', amount: 7900 },
            ],
          },
          {
            code: 'ENT-ANNUAL',
            prices: [
              { currency: 'USD', amount: 99000 },
              { currency: 'EUR', amount: 95000 },
              { currency: 'GBP', amount: 79000 },
            ],
          },
        ],
      },
    ]

    const createdProducts = []
    for (const productData of products) {
      const { skus, ...productInfo } = productData
      const product = await prisma().product.upsert({
        where: {
          tenantId_projectId_code: {
            tenantId: tenant.id,
            projectId: project.id,
            code: productInfo.code,
          },
        },
        update: {},
        create: {
          ...productInfo,
          id: createId(),
        },
      })
      console.log('✓ Product created:', product.name)

      for (const skuData of skus) {
        const { prices, ...skuInfo } = skuData
        const sku = await prisma().sku.upsert({
          where: {
            productId_code: {
              productId: product.id,
              code: skuInfo.code,
            },
          },
          update: {},
          create: {
            id: createId(),
            // Ensure required fields for Sku
            name: (skuInfo as { name?: string }).name ?? skuInfo.code,
            code: skuInfo.code,
            productId: product.id,
          },
        })
        console.log('  ✓ SKU created:', sku.code)

        for (const priceData of prices) {
          await prisma().price.upsert({
            where: {
              skuId_currency: {
                skuId: sku.id,
                currency: priceData.currency,
              },
            },
            update: { amount: priceData.amount },
            create: {
              id: createId(),
              ...priceData,
              skuId: sku.id,
            },
          })
        }
        console.log('    ✓ Prices created for', prices.length, 'currencies')
      }

      createdProducts.push(product.name)
    }

    // Create a demo policy
    await prisma().policy.upsert({
      where: {
        projectId: project.id,
      },
      update: {},
      create: {
        id: createId(),
        projectId: project.id,
        tenantId: tenant.id,
        autoApply: false,
        rules: {
          maxPctDelta: 0.15,
          dailyChangeBudgetPct: 0.25,
        },
        updatedAt: new Date(),
      },
    })
    console.log('✓ Policy created')

    // Create some demo price changes
    const proMonthlyUsdSku = await prisma().sku.findFirst({
      where: { code: 'PRO-MONTHLY' },
      include: { Price: true },
    })

    if (proMonthlyUsdSku) {
      const usdPrice = proMonthlyUsdSku.Price.find(p => p.currency === 'USD')
      if (usdPrice) {
        await prisma().priceChange.create({
          data: {
            id: createId(),
            tenantId: tenant.id,
            projectId: project.id,
            skuId: proMonthlyUsdSku.id,
            source: 'MANUAL',
            fromAmount: usdPrice.amount,
            toAmount: 5200,
            currency: 'USD',
            status: 'PENDING',
            context: { skuCode: 'PRO-MONTHLY' },
            policyResult: { ok: true, checks: [] },
            connectorStatus: {
              target: 'shopify',
              state: 'SYNCED',
              errorMessage: null,
            },
        },
      })
        console.log('✓ Demo price change created')
      }
    }

    console.log('✅ Database seeded successfully!')

    return NextResponse.json({
      success: true,
      message: 'Database seeded successfully',
      tenant: tenant.name,
      project: project.name,
      products: createdProducts,
    })
  } catch (error: unknown) {
    console.error('Error seeding database:', error)
    return NextResponse.json(
      { success: false, error: error instanceof Error ? error.message : String(error) },
      { status: 500 }
    )
  }
}
