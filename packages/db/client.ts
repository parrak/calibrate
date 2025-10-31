import { PrismaClient } from '@prisma/client'
import { encryptionMiddleware } from './src/middleware/encryption'

const globalForPrisma = globalThis as unknown as {
  prisma?: PrismaClient
  middlewareApplied?: boolean
}

export function prisma(): PrismaClient {
  if (!globalForPrisma.prisma) {
    try {
      console.log('[Prisma] Initializing PrismaClient...')
      globalForPrisma.prisma = new PrismaClient({
        log: process.env.NODE_ENV === 'development' ? ['query', 'error', 'warn'] : ['error'],
      })
      console.log('[Prisma] PrismaClient initialized successfully')

      // Apply encryption middleware once
      if (!globalForPrisma.middlewareApplied) {
        globalForPrisma.prisma.$use(encryptionMiddleware())
        globalForPrisma.middlewareApplied = true
        console.log('[Prisma] Encryption middleware enabled')
      }
    } catch (error) {
      console.error('[Prisma] Failed to initialize PrismaClient:', error)
      throw error
    }
  }
  return globalForPrisma.prisma
}
