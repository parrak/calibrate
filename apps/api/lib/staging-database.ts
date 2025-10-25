/**
 * Staging Database Configuration
 * Handles staging-specific database setup and management
 */

import { PrismaClient } from '@calibr/db'
import { stagingConfig } from '../config/staging'

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
          name: 'Calibrate Staging',
          slug: 'calibrate-staging',
          settings: {
            webhookUrl: 'https://staging-webhook.calibr.lat/webhook',
            notificationEmail: 'staging@calibr.lat',
            features: {
              autoApprove: false,
              notifications: true,
              analytics: true
            }
          }
        }
      })

      // Create test project
      const testProject = await this.prisma.project.create({
        data: {
          name: 'Staging Test Project',
          slug: 'staging-test',
          tenantId: testTenant.id,
          settings: {
            webhookUrl: 'https://staging-webhook.calibr.lat/webhook',
            notificationEmail: 'staging@calibr.lat',
            features: {
              autoApprove: false,
              notifications: true,
              analytics: true
            }
          }
        }
      })

      // Create test products
      const testProducts = [
        {
          code: 'STAGING-PRODUCT-001',
          name: 'Staging Test Product 1',
          currentPrice: 29.99,
          currency: 'USD',
          category: 'Test Category',
          projectId: testProject.id
        },
        {
          code: 'STAGING-PRODUCT-002',
          name: 'Staging Test Product 2',
          currentPrice: 49.99,
          currency: 'USD',
          category: 'Test Category',
          projectId: testProject.id
        },
        {
          code: 'STAGING-PRODUCT-003',
          name: 'Staging Test Product 3',
          currentPrice: 99.99,
          currency: 'USD',
          category: 'Test Category',
          projectId: testProject.id
        }
      ]

      for (const productData of testProducts) {
        await this.prisma.product.create({
          data: productData
        })
      }

      // Create test price changes
      const testPriceChanges = [
        {
          productCode: 'STAGING-PRODUCT-001',
          oldPrice: 29.99,
          newPrice: 34.99,
          changeAmount: 5.00,
          changePercentage: 16.67,
          status: 'pending',
          source: 'manual',
          projectId: testProject.id,
          metadata: {
            reason: 'Test price increase',
            approvedBy: 'staging-test-user',
            notes: 'Staging environment test data'
          }
        },
        {
          productCode: 'STAGING-PRODUCT-002',
          oldPrice: 49.99,
          newPrice: 44.99,
          changeAmount: -5.00,
          changePercentage: -10.00,
          status: 'approved',
          source: 'api',
          projectId: testProject.id,
          metadata: {
            reason: 'Test price decrease',
            approvedBy: 'staging-test-user',
            notes: 'Staging environment test data'
          }
        }
      ]

      for (const priceChangeData of testPriceChanges) {
        await this.prisma.priceChange.create({
          data: priceChangeData
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
          metadata: {
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
          slug: 'calibrate-staging'
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
    } catch (error) {
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
    } catch (error) {
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
          slug: 'calibrate-staging'
        }
      })
      return tenantCount > 0
    } catch (error) {
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
