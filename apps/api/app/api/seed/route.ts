import { NextResponse } from 'next/server'
import { prisma } from '@calibr/db'

export async function POST() {
  try {
    console.log('Starting database seed...')

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
        slug: 'demo',
        name: 'Demo Project',
        tenantId: tenant.id,
      },
    })
    console.log('✓ Project created:', project.name)

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
        create: productInfo,
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
            // Ensure required fields for Sku
            name: (skuInfo as any).name ?? skuInfo.code,
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
        projectId: project.id,
        tenantId: tenant.id,
        autoApply: false,
        rules: {
          maxPctDelta: 0.15,
          dailyChangeBudgetPct: 0.25,
        },
      },
    })
    console.log('✓ Policy created')

    // Create some demo price changes
    const proMonthlyUsdSku = await prisma().sku.findFirst({
      where: { code: 'PRO-MONTHLY' },
      include: { prices: true },
    })

    if (proMonthlyUsdSku) {
      const usdPrice = proMonthlyUsdSku.prices.find(p => p.currency === 'USD')
      if (usdPrice) {
        await prisma().priceChange.create({
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
  } catch (error: any) {
    console.error('Error seeding database:', error)
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 }
    )
  }
}
