import { PrismaClient } from '@prisma/client'
import { hash } from 'bcryptjs'

const prisma = new PrismaClient()

async function main() {
  const h = await hash('password', 10)
  await prisma.user.updateMany({ data: { passwordHash: h } })
  console.log('Fixed!')
}

main().finally(() => prisma.$disconnect())
