import { PrismaClient } from '@prisma/client'
const prisma = new PrismaClient()

async function main() {
  const tenant = await prisma.tenant.create({ data: { name: 'DemoCo' } })
  const project = await prisma.project.create({
    data: {
      tenantId: tenant.id,
      name: 'Demo Project',
      slug: 'demo',
      updatedAt: new Date()
    }
  })
  const product = await prisma.product.create({
    data: {
      tenantId: tenant.id,
      projectId: project.id,
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
      projectId: project.id,
      autoApply: false,
      rules: {
        maxPctDelta: 0.15,
        dailyChangeBudgetPct: 0.25,
        floors: { 'PRO-M': 3900 }
      },
      updatedAt: new Date()
    }
  })

  // Hashes match the published demo credentials (bcryptjs, cost=10).
  // demo@calibr.lat  → Demo1234!
  // admin@calibr.lat → Admin1234!
  const demoHash  = '$2a$10$KVQxCC.lEDEOOv2WG2Byt.VR9GMrVZSMHLvIQSpGfiOVBP2EguHNO'
  const adminHash = '$2a$10$m2/c1rZ9dHKLiob1Jp8ktOi098MyKzHxLFivltAa7I5nt/JyUfzTu'

  const demoUser = await prisma.user.upsert({
    where: { email: 'demo@calibr.lat' },
    update: { passwordHash: demoHash, tenantId: tenant.id },
    create: {
      email: 'demo@calibr.lat',
      name: 'Demo User',
      role: 'MEMBER',
      tenantId: tenant.id,
      passwordHash: demoHash
    }
  })

  const adminUser = await prisma.user.upsert({
    where: { email: 'admin@calibr.lat' },
    update: { passwordHash: adminHash, tenantId: tenant.id },
    create: {
      email: 'admin@calibr.lat',
      name: 'Admin User',
      role: 'ADMIN',
      tenantId: tenant.id,
      passwordHash: adminHash
    }
  })

  // Tie both users to the demo project so project-scoped APIs pass membership checks.
  await prisma.membership.upsert({
    where: { userId_projectId: { userId: demoUser.id, projectId: project.id } },
    update: { role: 'VIEWER' },
    create: { userId: demoUser.id, projectId: project.id, role: 'VIEWER' }
  })

  await prisma.membership.upsert({
    where: { userId_projectId: { userId: adminUser.id, projectId: project.id } },
    update: { role: 'ADMIN' },
    create: { userId: adminUser.id, projectId: project.id, role: 'ADMIN' }
  })

  console.log('Seeded DemoCo, Demo Users, and project Memberships.')
  console.log('  demo@calibr.lat  / Demo1234!')
  console.log('  admin@calibr.lat / Admin1234!')
}

main().finally(() => prisma.$disconnect())
