import { PrismaClient } from '@prisma/client'
import { createRequire } from 'module'
const require = createRequire(import.meta.url)
const bcryptjs = require('bcryptjs')

const prisma = new PrismaClient()

async function main() {
  const adminSeedPassword = process.env.ADMIN_SEED_PASSWORD || 'Admin1234!'
  const adminPasswordHash = bcryptjs.hashSync(adminSeedPassword, 10)

  // Get or create demo tenant
  const tenant = await prisma.tenant.upsert({
    where: { id: 'demo-tenant' },
    update: {},
    create: {
      id: 'demo-tenant',
      name: 'Demo Company',
    },
  })

  // Update or create admin user with password
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

  console.log('✅ Admin user updated/created:', adminUser.email)
  console.log('   Password:', adminSeedPassword)
  console.log('   (Set ADMIN_SEED_PASSWORD env var to change)')
}

main()
  .catch((e) => {
    console.error('Error:', e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })

