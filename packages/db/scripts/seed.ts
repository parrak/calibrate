import { PrismaClient } from '@prisma/client'
const prisma = new PrismaClient()

async function main() {
  const tenant = await prisma.tenant.create({ data: { name: 'DemoCo' } })
  const product = await prisma.product.create({ 
    data: { 
      tenantId: tenant.id, 
      name: 'Pro Plan', 
      code: 'PRO', 
      status: 'ACTIVE' 
    } 
  })
  const sku = await prisma.sku.create({ 
    data: { 
      productId: product.id, 
      name: 'Pro Monthly', 
      code: 'PRO-M', 
      status: 'ACTIVE', 
      attributes: { term: 'monthly' } 
    } 
  })
  await prisma.price.create({ 
    data: { 
      skuId: sku.id, 
      currency: 'USD', 
      billingCycle: 'monthly', 
      unit: 'seat', 
      amount: 4900, 
      status: 'ACTIVE' 
    } 
  })
  await prisma.policy.create({ 
    data: { 
      tenantId: tenant.id, 
      autoApply: false, 
      rules: { 
        maxPctDelta: 0.15, 
        dailyChangeBudgetPct: 0.25, 
        floors: { 'PRO-M': 3900 } 
      } 
    } 
  })
  console.log('Seeded DemoCo.')
}

main().finally(() => prisma.$disconnect())
