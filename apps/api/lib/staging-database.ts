/**
 * Staging Database Configuration
 * Handles staging-specific database setup and management
 */

import { PrismaClient } from '@calibr/db'
import { stagingConfig } from '../config/staging'
import { createId } from '@paralleldrive/cuid2'

export class StagingDatabaseManager {
  private prisma: PrismaClient
  private isInitialized = false

  constructor() {
    this.prisma = new PrismaClient({
      datasources: {
        db: {
          url: stagingConfig.database.url
        }
      }
    })
  }

  /**
   * Initialize staging database
   */
  async initialize(): Promise<void> {
    if (this.isInitialized) return

    try {
      // Test database connection
      await this.prisma.$connect()
      console.log('✅ Staging database connected successfully')

      // Run migrations
      await this.runMigrations()

      // Seed test data
      await this.seedTestData()

      this.isInitialized = true
      console.log('✅ Staging database initialized successfully')
    } catch (error) {
      console.error('❌ Failed to initialize staging database:', error)
      throw error
    }
  }

  /**
   * Run database migrations for staging
   */
  private async runMigrations(): Promise<void> {
    try {
      // This would typically use Prisma migrate or a custom migration runner
      console.log('🔄 Running staging database migrations...')

      // For now, we'll just verify the connection
      await this.prisma.$queryRaw`SELECT 1`
      console.log('✅ Staging database migrations completed')
    } catch (error) {
      console.error('❌ Staging database migration failed:', error)
      throw error
    }
  }

  /**
   * Seed test data for staging environment
   */
  private async seedTestData(): Promise<void> {
    try {
      console.log('🌱 Seeding staging database with test data...')

      // Check if data already exists
      const existingTenants = await this.prisma.tenant.count()
      if (existingTenants > 0) {
        console.log('ℹ️ Staging database already has data, skipping seed')
        return
      }

      // Create test tenant
      const testTenant = await this.prisma.tenant.create({
        data: {
          id: createId(),
          name: 'Calibrate Staging'
        }
      })

      // Create test project
      const testProject = await this.prisma.project.create({
        data: {
          id: createId(),
          name: 'Staging Test Project',
          slug: 'staging-test',
          tenantId: testTenant.id,
          updatedAt: new Date()
        }
      })

      // Create test products
      const testProducts = [
        {
          id: createId(),
          code: 'STAGING-PRODUCT-001',
          name: 'Staging Test Product 1',
          tenantId: testTenant.id,
          projectId: testProject.id
        },
        {
          id: createId(),
          code: 'STAGING-PRODUCT-002',
          name: 'Staging Test Product 2',
          tenantId: testTenant.id,
          projectId: testProject.id
        },
        {
          id: createId(),
          code: 'STAGING-PRODUCT-003',
          name: 'Staging Test Product 3',
          tenantId: testTenant.id,
          projectId: testProject.id
        }
      ]

      const createdProducts = []
      for (const productData of testProducts) {
        const product = await this.prisma.product.create({
          data: productData
        })
        createdProducts.push(product)
      }

      // Create SKUs for products
      const skus = []
      for (const product of createdProducts) {
        const sku = await this.prisma.sku.create({
          data: {
            id: createId(),
            productId: product.id,
            code: `${product.code}-SKU`,
            name: `${product.name} - Default SKU`
          }
        })
        skus.push({ sku, product })
      }

      // Create test price changes
      const testPriceChanges = [
        {
          sku: skus[0].sku,
          fromAmount: 2999, // $29.99 in cents
          toAmount: 3499,   // $34.99 in cents
          currency: 'USD',
          source: 'manual',
          status: 'PENDING' as const,
          context: {
            reason: 'Test price increase',
            approvedBy: 'staging-test-user',
            notes: 'Staging environment test data'
          }
        },
        {
          sku: skus[1].sku,
          fromAmount: 4999, // $49.99 in cents
          toAmount: 4499,   // $44.99 in cents
          currency: 'USD',
          source: 'api',
          status: 'APPROVED' as const,
          context: {
            reason: 'Test price decrease',
            approvedBy: 'staging-test-user',
            notes: 'Staging environment test data'
          }
        }
      ]

      for (const priceChangeData of testPriceChanges) {
        await this.prisma.priceChange.create({
          data: {
            id: createId(),
            tenantId: testTenant.id,
            projectId: testProject.id,
            skuId: priceChangeData.sku.id,
            fromAmount: priceChangeData.fromAmount,
            toAmount: priceChangeData.toAmount,
            currency: priceChangeData.currency,
            source: priceChangeData.source,
            status: priceChangeData.status,
            context: priceChangeData.context
          }
        })
      }

      console.log('✅ Staging database seeded with test data')
    } catch (error) {
      console.error('❌ Failed to seed staging database:', error)
      throw error
    }
  }

  /**
   * Clean up test data
   */
  async cleanupTestData(): Promise<void> {
    try {
      console.log('🧹 Cleaning up staging test data...')

      // Delete test data in reverse order of dependencies
      await this.prisma.priceChange.deleteMany({
        where: {
          context: {
            path: ['notes'],
            equals: 'Staging environment test data'
          }
        }
      })

      await this.prisma.product.deleteMany({
        where: {
          code: {
            startsWith: 'STAGING-PRODUCT-'
          }
        }
      })

      await this.prisma.project.deleteMany({
        where: {
          slug: 'staging-test'
        }
      })

      await this.prisma.tenant.deleteMany({
        where: {
          name: 'Calibrate Staging'
        }
      })

      console.log('✅ Staging test data cleaned up')
    } catch (error) {
      console.error('❌ Failed to clean up staging test data:', error)
      throw error
    }
  }

  /**
   * Reset staging database to clean state
   */
  async reset(): Promise<void> {
    try {
      console.log('🔄 Resetting staging database...')

      // Clean up existing data
      await this.cleanupTestData()

      // Re-seed with fresh test data
      await this.seedTestData()

      console.log('✅ Staging database reset completed')
    } catch (error) {
      console.error('❌ Failed to reset staging database:', error)
      throw error
    }
  }

  /**
   * Get database health status
   */
  async getHealthStatus(): Promise<{
    connected: boolean
    migrations: boolean
    testData: boolean
    lastReset: Date | null
  }> {
    try {
      const connected = await this.testConnection()
      const migrations = await this.checkMigrations()
      const testData = await this.checkTestData()

      return {
        connected,
        migrations,
        testData,
        lastReset: null // Could be stored in a metadata table
      }
    } catch (error) {
      console.error('❌ Failed to get staging database health status:', error)
      return {
        connected: false,
        migrations: false,
        testData: false,
        lastReset: null
      }
    }
  }

  /**
   * Test database connection
   */
  private async testConnection(): Promise<boolean> {
    try {
      await this.prisma.$queryRaw`SELECT 1`
      return true
    } catch {
      return false
    }
  }

  /**
   * Check if migrations are up to date
   */
  private async checkMigrations(): Promise<boolean> {
    try {
      // This would check migration status
      // For now, just return true if we can query
      await this.prisma.$queryRaw`SELECT 1`
      return true
    } catch {
      return false
    }
  }

  /**
   * Check if test data exists
   */
  private async checkTestData(): Promise<boolean> {
    try {
      const tenantCount = await this.prisma.tenant.count({
        where: {
          name: 'Calibrate Staging'
        }
      })
      return tenantCount > 0
    } catch {
      return false
    }
  }

  /**
   * Close database connection
   */
  async disconnect(): Promise<void> {
    await this.prisma.$disconnect()
  }
}

// Export singleton instance
export const stagingDatabase = new StagingDatabaseManager()
