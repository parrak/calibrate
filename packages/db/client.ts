import { PrismaClient } from '@prisma/client'
// TODO: Re-enable encryption middleware after implementing encryptCredentials/decryptCredentials in @calibr/security
// import { encryptionMiddleware } from './src/middleware/encryption'

const globalForPrisma = globalThis as unknown as {
  prisma?: PrismaClient
  middlewareApplied?: boolean
}

export function prisma(): PrismaClient {
  if (!globalForPrisma.prisma) {
    globalForPrisma.prisma = new PrismaClient()

    // TODO: Re-enable encryption middleware
    // Apply encryption middleware once
    // if (!globalForPrisma.middlewareApplied) {
    //   globalForPrisma.prisma.$use(encryptionMiddleware())
    //   globalForPrisma.middlewareApplied = true
    // }
  }
  return globalForPrisma.prisma
}
