import { PrismaClient } from '@prisma/client'
import { encryptionMiddleware } from './src/middleware/encryption'

const globalForPrisma = globalThis as unknown as {
  prisma?: PrismaClient
  middlewareApplied?: boolean
}

export function prisma(): PrismaClient {
  if (!globalForPrisma.prisma) {
    globalForPrisma.prisma = new PrismaClient()

    // Apply encryption middleware once
    if (!globalForPrisma.middlewareApplied) {
      globalForPrisma.prisma.$use(encryptionMiddleware())
      globalForPrisma.middlewareApplied = true
    }
  }
  return globalForPrisma.prisma
}
