#!/usr/bin/env tsx
/**
 * Outbox Worker Service
 * Standalone service for processing outbox events
 * Run as: tsx apps/worker/outbox-worker.ts
 * Or as Docker container / Railway service
 */

import { PrismaClient, type ShopifyIntegration } from '@prisma/client'
import { OutboxWorker, type EventPayload } from '@calibr/db'
import { logger, recordEventMetric } from '@calibr/monitor'
import {
  getRulesWorker,
  getWorkerConfig,
  type PriceConnector,
  type RulesWorker
} from '@calibr/automation-runner'
import {
  ShopifyConnector,
  type ShopifyConfig,
  type ShopifyCredentials
} from '@calibr/shopify-connector'

// Configuration
const POLL_INTERVAL_MS = parseInt(process.env.OUTBOX_POLL_INTERVAL_MS || '5000', 10)
const MAX_RETRIES = parseInt(process.env.OUTBOX_MAX_RETRIES || '5', 10)
const INITIAL_DELAY_MS = parseInt(process.env.OUTBOX_INITIAL_DELAY_MS || '1000', 10)
const MAX_DELAY_MS = parseInt(process.env.OUTBOX_MAX_DELAY_MS || '60000', 10)
const BACKOFF_MULTIPLIER = parseInt(process.env.OUTBOX_BACKOFF_MULTIPLIER || '2', 10)

// Initialize Prisma
const prisma = new PrismaClient({
  log: process.env.NODE_ENV === 'development' ? ['query', 'error', 'warn'] : ['error']
})

let rulesWorker: RulesWorker | null = null

function requireEnv(name: string): string {
  const value = process.env[name]
  if (!value) {
    throw new Error(`Missing required environment variable: ${name}`)
  }
  return value
}

function buildShopifyConfig(isActive: boolean): ShopifyConfig {
  const apiKey = requireEnv('SHOPIFY_API_KEY')
  const apiSecret = requireEnv('SHOPIFY_API_SECRET')
  const webhookSecret = process.env.SHOPIFY_WEBHOOK_SECRET || ''
  const apiVersion = process.env.SHOPIFY_API_VERSION

  return {
    platform: 'shopify',
    name: 'Shopify Integration',
    isActive,
    apiKey,
    apiSecret,
    scopes: process.env.SHOPIFY_SCOPES?.split(',') || ['read_products', 'write_products'],
    webhookSecret,
    apiVersion,
  }
}

async function buildShopifyPriceConnector(
  integration: ShopifyIntegration
): Promise<PriceConnector> {
  const connector = new ShopifyConnector(buildShopifyConfig(integration.isActive))
  const credentials: ShopifyCredentials = {
    platform: 'shopify',
    shopDomain: integration.shopDomain,
    accessToken: integration.accessToken,
    scope: integration.scope,
  }

  await connector.initialize(credentials)

  return {
    name: 'shopify',
    async applyPrice({ externalId, variantId, price, currency }) {
      const id = variantId || externalId
      if (!id) {
        return { success: false, error: 'Missing Shopify variant id' }
      }

      const result = await connector.pricing.updatePrice({
        externalId: id,
        price,
        currency
      })

      return result.success
        ? { success: true, externalId: result.externalId }
        : { success: false, error: result.error }
    },
    async fetchPrice(externalId: string) {
      const price = await connector.pricing.getPrice(externalId)
      return { price: price.price, currency: price.currency }
    },
    async isHealthy() {
      const health = await connector.healthCheck()
      return health.isHealthy
    }
  }
}

async function registerAutomationConnectors(worker: RulesWorker) {
  const integrations = await prisma.shopifyIntegration.findMany({
    where: { isActive: true }
  })

  const seenProjects = new Set<string>()
  for (const integration of integrations) {
    if (seenProjects.has(integration.projectId)) {
      continue
    }
    seenProjects.add(integration.projectId)

    try {
      const connector = await buildShopifyPriceConnector(integration)
      worker.registerConnector(`shopify:${integration.projectId}`, connector)
      logger.info('[Automation] Registered Shopify connector', {
        metadata: {
          projectId: integration.projectId,
          shopDomain: integration.shopDomain
        }
      })
    } catch (error) {
      logger.error(
        '[Automation] Failed to register Shopify connector',
        error as Error,
        {
          metadata: {
            projectId: integration.projectId,
            shopDomain: integration.shopDomain
          }
        }
      )
    }
  }
}

// Initialize Outbox Worker
const worker = new OutboxWorker(prisma, {
  pollIntervalMs: POLL_INTERVAL_MS,
  retryConfig: {
    maxRetries: MAX_RETRIES,
    initialDelayMs: INITIAL_DELAY_MS,
    maxDelayMs: MAX_DELAY_MS,
    backoffMultiplier: BACKOFF_MULTIPLIER
  }
})

// Example: Register subscribers for different event types
// In production, these would be imported from connector packages

worker.subscribe({
  eventTypes: ['shopify.sync.product', 'shopify.sync.variant'],
  handler: async (event: EventPayload) => {
    const startTime = Date.now()
    logger.info('Processing Shopify sync event', {
      tenantId: event.tenantId,
      correlationId: event.correlationId,
      metadata: {
        eventType: event.eventType
      }
    })

    try {
      // TODO: Implement actual Shopify sync logic
      // For now, just log
      console.log('[Shopify Sync]', event.eventType, event.payload)

      // Record success metric
      recordEventMetric({
        timestamp: Date.now(),
        eventId: event.eventKey,
        eventType: event.eventType,
        tenantId: event.tenantId,
        projectId: event.projectId,
        correlationId: event.correlationId,
        latencyMs: Date.now() - startTime,
        retryCount: 0,
        status: 'success'
      })
    } catch (error) {
      logger.error('Failed to process Shopify sync event', error as Error, {
        tenantId: event.tenantId,
        metadata: {
          eventType: event.eventType
        }
      })

      // Record failure metric
      recordEventMetric({
        timestamp: Date.now(),
        eventId: event.eventKey,
        eventType: event.eventType,
        tenantId: event.tenantId,
        projectId: event.projectId,
        correlationId: event.correlationId,
        latencyMs: Date.now() - startTime,
        retryCount: 0,
        status: 'failed'
      })

      throw error // Re-throw to trigger retry
    }
  }
})

worker.subscribe({
  eventTypes: ['pricechange.applied', 'pricechange.approved'],
  handler: async (event: EventPayload) => {
    const startTime = Date.now()
    logger.info('Processing price change event', {
      tenantId: event.tenantId,
      correlationId: event.correlationId,
      metadata: {
        eventType: event.eventType
      }
    })

    try {
      // TODO: Implement price change handling
      // e.g., trigger connector price updates, send notifications
      console.log('[Price Change]', event.eventType, event.payload)

      recordEventMetric({
        timestamp: Date.now(),
        eventId: event.eventKey,
        eventType: event.eventType,
        tenantId: event.tenantId,
        projectId: event.projectId,
        correlationId: event.correlationId,
        latencyMs: Date.now() - startTime,
        retryCount: 0,
        status: 'success'
      })
    } catch (error) {
      logger.error('Failed to process price change event', error as Error, {
        tenantId: event.tenantId,
        metadata: {
          eventType: event.eventType
        }
      })

      recordEventMetric({
        timestamp: Date.now(),
        eventId: event.eventKey,
        eventType: event.eventType,
        tenantId: event.tenantId,
        projectId: event.projectId,
        correlationId: event.correlationId,
        latencyMs: Date.now() - startTime,
        retryCount: 0,
        status: 'failed'
      })

      throw error
    }
  }
})

worker.subscribe({
  eventTypes: ['audit.event', 'audit.recorded'],
  handler: async (event: EventPayload) => {
    logger.info('Processing audit event', {
      tenantId: event.tenantId,
      correlationId: event.correlationId,
      metadata: {
        eventType: event.eventType
      }
    })

    // Audit events are typically just logged/archived
    console.log('[Audit]', event.eventType, event.payload)
  }
})

// Health check endpoint (for k8s/Railway)
async function healthCheck(): Promise<boolean> {
  try {
    await prisma.$queryRaw`SELECT 1`
    const metrics = await worker.getMetrics()

    // Unhealthy if DLQ is growing too large
    if (metrics.dlqCount > 100) {
      logger.error('Health check failed: DLQ count too high', undefined, {
        metadata: { dlqCount: metrics.dlqCount }
      })
      return false
    }

    return true
  } catch (error) {
    logger.error('Health check failed', error as Error)
    return false
  }
}

// Graceful shutdown
async function shutdown(signal: string) {
  logger.info(`Received ${signal}, shutting down gracefully...`)

  worker.stop()
  if (rulesWorker) {
    await rulesWorker.stop()
  }

  await prisma.$disconnect()

  logger.info('Worker shutdown complete')
  process.exit(0)
}

// Signal handlers
process.on('SIGTERM', () => shutdown('SIGTERM'))
process.on('SIGINT', () => shutdown('SIGINT'))

// Error handlers
process.on('unhandledRejection', (reason, promise) => {
  logger.error('Unhandled Rejection', reason as Error, {
    metadata: { promise: promise.toString() }
  })
})

process.on('uncaughtException', (error) => {
  logger.error('Uncaught Exception', error)
  shutdown('uncaughtException')
})

// Main
async function main() {
  logger.info('Starting Outbox Worker', {
    metadata: {
      pollIntervalMs: POLL_INTERVAL_MS,
      maxRetries: MAX_RETRIES,
      nodeEnv: process.env.NODE_ENV
    }
  })

  // Test database connection
  try {
    await prisma.$connect()
    logger.info('Database connected')
  } catch (error) {
    logger.error('Failed to connect to database', error as Error)
    process.exit(1)
  }

  // Start worker
  worker.start()
  logger.info('Outbox Worker started')

  rulesWorker = getRulesWorker(getWorkerConfig())
  await registerAutomationConnectors(rulesWorker)
  await rulesWorker.start()
  logger.info('Automation Rules Worker started')

  // Periodic health checks and metrics logging
  setInterval(async () => {
    const healthy = await healthCheck()
    const metrics = await worker.getMetrics()

    logger.info('Outbox Worker metrics', {
      metadata: {
        healthy,
        total: metrics.total,
        pending: metrics.pending,
        processing: metrics.processing,
        completed: metrics.completed,
        failed: metrics.failed,
        dlqCount: metrics.dlqCount
      }
    })
  }, 60000) // Every minute
}

// Start the worker
main().catch((error) => {
  logger.error('Worker failed to start', error as Error)
  process.exit(1)
})
