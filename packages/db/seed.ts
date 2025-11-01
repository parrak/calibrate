import { PrismaClient } from '@prisma/client'
import { hashSync } from 'bcryptjs'

const prisma = new PrismaClient()

async function main() {
  console.log('Starting database seed...')

  const adminSeedPassword = process.env.ADMIN_SEED_PASSWORD || 'Admin1234!'
  const demoSeedPassword = process.env.DEMO_SEED_PASSWORD || 'Demo1234!'
  const adminPasswordHash = hashSync(adminSeedPassword, 10)
  const demoPasswordHash = hashSync(demoSeedPassword, 10)

  // Create demo tenant
  const tenant = await prisma.tenant.upsert({
    where: { id: 'demo-tenant' },
    update: {},
    create: {
      id: 'demo-tenant',
      name: 'Demo Company',
    },
  })
  console.log('âœ“ Tenant created:', tenant.name)

  // Create demo project
  const project = await prisma.project.upsert({
    where: { slug: 'demo' },
    update: {},
    create: {
      slug: 'demo',
      name: 'Demo Project',
      tenantId: tenant.id,
    },
  })
  console.log('âœ“ Project created:', project.name)

  const adminUser = await prisma.user.upsert({
    where: { email: 'admin@calibr.lat' },
    update: {
      name: 'Admin User',
      role: 'OWNER',
      tenantId: tenant.id,
      passwordHash: adminPasswordHash,
    },
    create: {
      email: 'admin@calibr.lat',
      name: 'Admin User',
      role: 'OWNER',
      tenantId: tenant.id,
      passwordHash: adminPasswordHash,
    },
  })
  console.log('[seed] Admin user seeded:', adminUser.email)

  const demoUser = await prisma.user.upsert({
    where: { email: 'demo@calibr.lat' },
    update: {
      name: 'Demo User',
      role: 'ADMIN',
      tenantId: tenant.id,
      passwordHash: demoPasswordHash,
    },
    create: {
      email: 'demo@calibr.lat',
      name: 'Demo User',
      role: 'ADMIN',
      tenantId: tenant.id,
      passwordHash: demoPasswordHash,
    },
  })
  console.log('[seed] Demo user seeded:', demoUser.email)

  await prisma.membership.upsert({
    where: {
      userId_projectId: {
        userId: adminUser.id,
        projectId: project.id,
      },
    },
    update: { role: 'OWNER' },
    create: {
      userId: adminUser.id,
      projectId: project.id,
      role: 'OWNER',
    },
  })

  await prisma.membership.upsert({
    where: {
      userId_projectId: {
        userId: demoUser.id,
        projectId: project.id,
      },
    },
    update: { role: 'ADMIN' },
    create: {
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

  for (const productData of products) {
    const { skus, ...productInfo } = productData
    const product = await prisma.product.upsert({
      where: {
        tenantId_projectId_code: {
          tenantId: tenant.id,
          projectId: project.id,
          code: productInfo.code,
        }
      },
      update: {},
      create: productInfo,
    })
    console.log('âœ“ Product created:', product.name)

    for (const skuData of skus) {
      const { prices, ...skuInfo } = skuData
      const sku = await prisma.sku.upsert({
        where: {
          productId_code: {
            productId: product.id,
            code: skuInfo.code,
          },
        },
        update: {},
        create: {
          ...skuInfo,
          productId: product.id,
        },
      })
      console.log('  âœ“ SKU created:', sku.code)

      for (const priceData of prices) {
        await prisma.price.upsert({
          where: {
            skuId_currency: {
              skuId: sku.id,
              currency: priceData.currency,
            },
          },
          update: { amount: priceData.amount },
          create: {
            ...priceData,
            skuId: sku.id,
          },
        })
      }
      console.log('    âœ“ Prices created for', prices.length, 'currencies')
    }
  }

  // Create a demo policy
  await prisma.policy.upsert({
    where: {
      projectId: project.id,
    },
    update: {},
    create: {
      projectId: project.id,
      tenantId: tenant.id,
      autoApply: false,
      rules: {
        maxPctDelta: 0.15,
        dailyChangeBudgetPct: 0.25,
      },
    },
  })
  console.log('âœ“ Policy created')

  // Create demo competitors
  const competitor1 = await prisma.competitor.upsert({
    where: { id: 'demo-competitor-1' },
    update: {},
    create: {
      id: 'demo-competitor-1',
      tenantId: tenant.id,
      projectId: project.id,
      name: 'Competitor A',
      domain: 'competitora.example.com',
      channel: 'shopify',
      isActive: true,
    },
  })
  console.log('âœ“ Competitor created:', competitor1.name)

  const competitor2 = await prisma.competitor.upsert({
    where: { id: 'demo-competitor-2' },
    update: {},
    create: {
      id: 'demo-competitor-2',
      tenantId: tenant.id,
      projectId: project.id,
      name: 'Competitor B',
      domain: 'competitorb.example.com',
      channel: 'shopify',
      isActive: true,
    },
  })
  console.log('âœ“ Competitor created:', competitor2.name)

  // Get SKUs for linking competitor products
  const proMonthlySku = await prisma.sku.findFirst({
    where: { code: 'PRO-MONTHLY' },
  })

  const entMonthlySku = await prisma.sku.findFirst({
    where: { code: 'ENT-MONTHLY' },
  })

  // Create competitor products and prices
  if (proMonthlySku) {
    const comp1ProProduct = await prisma.competitorProduct.create({
      data: {
        competitorId: competitor1.id,
        skuId: proMonthlySku.id,
        name: 'Pro Monthly Plan',
        skuCode: 'COMP-PRO-M',
        url: 'https://competitora.example.com/products/pro-monthly',
        isActive: true,
      },
    })

    await prisma.competitorPrice.create({
      data: {
        productId: comp1ProProduct.id,
        amount: 5900,
        currency: 'USD',
        isOnSale: false,
      },
    })

    const comp2ProProduct = await prisma.competitorProduct.create({
      data: {
        competitorId: competitor2.id,
        skuId: proMonthlySku.id,
        name: 'Professional Monthly',
        skuCode: 'B-PRO-MONTH',
        url: 'https://competitorb.example.com/products/professional-monthly',
        isActive: true,
      },
    })

    await prisma.competitorPrice.create({
      data: {
        productId: comp2ProProduct.id,
        amount: 4700,
        currency: 'USD',
        isOnSale: true,
      },
    })

    console.log('âœ“ Competitor products and prices created for PRO-MONTHLY')
  }

  if (entMonthlySku) {
    const comp1EntProduct = await prisma.competitorProduct.create({
      data: {
        competitorId: competitor1.id,
        skuId: entMonthlySku.id,
        name: 'Enterprise Monthly Plan',
        skuCode: 'COMP-ENT-M',
        url: 'https://competitora.example.com/products/enterprise-monthly',
        isActive: true,
      },
    })

    await prisma.competitorPrice.create({
      data: {
        productId: comp1EntProduct.id,
        amount: 14900,
        currency: 'USD',
        isOnSale: false,
      },
    })

    const comp2EntProduct = await prisma.competitorProduct.create({
      data: {
        competitorId: competitor2.id,
        skuId: entMonthlySku.id,
        name: 'Enterprise Monthly',
        skuCode: 'B-ENT-MONTH',
        url: 'https://competitorb.example.com/products/enterprise-monthly',
        isActive: true,
      },
    })

    await prisma.competitorPrice.create({
      data: {
        productId: comp2EntProduct.id,
        amount: 11900,
        currency: 'USD',
        isOnSale: false,
      },
    })

    console.log('âœ“ Competitor products and prices created for ENT-MONTHLY')
  }

  // Create demo competitor rule
  await prisma.competitorRule.create({
    data: {
      tenantId: tenant.id,
      projectId: project.id,
      name: 'Beat Competition by 5%',
      description: 'Always price 5% below the lowest competitor',
      isActive: true,
      rules: {
        type: 'beat_by_percent',
        value: 5,
        minPrice: 1000,
        minMargin: 20,
      },
    },
  })
  console.log('âœ“ Competitor rule created')

  // Create some demo price changes
  const proMonthlyUsdSku = await prisma.sku.findFirst({
    where: { code: 'PRO-MONTHLY' },
    include: { prices: true },
  })

  if (proMonthlyUsdSku) {
    const usdPrice = proMonthlyUsdSku.prices.find(p => p.currency === 'USD')
    if (usdPrice) {
      await prisma.priceChange.create({
        data: {
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
        },
      })
      console.log('âœ“ Demo price change created')
    }
  }

  console.log('âœ… Database seeded successfully!')
}

main()
  .catch((e) => {
    console.error('Error seeding database:', e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
