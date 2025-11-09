#!/usr/bin/env tsx
/**
 * Outbox Worker Service
 * Standalone service for processing outbox events
 * Run as: tsx apps/worker/outbox-worker.ts
 * Or as Docker container / Railway service
 */

import { PrismaClient } from '@prisma/client'
import { OutboxWorker } from '@calibr/db/eventing'
import { logger, recordEventMetric } from '@calibr/monitor'

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
  handler: async (event) => {
    const startTime = Date.now()
    logger.info('Processing Shopify sync event', {
      eventType: event.eventType,
      tenantId: event.tenantId,
      correlationId: event.correlationId
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
        eventType: event.eventType,
        tenantId: event.tenantId
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
  handler: async (event) => {
    const startTime = Date.now()
    logger.info('Processing price change event', {
      eventType: event.eventType,
      tenantId: event.tenantId,
      correlationId: event.correlationId
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
        eventType: event.eventType,
        tenantId: event.tenantId
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
  handler: async (event) => {
    logger.info('Processing audit event', {
      eventType: event.eventType,
      tenantId: event.tenantId,
      correlationId: event.correlationId
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
      logger.error('Health check failed: DLQ count too high', null, {
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
