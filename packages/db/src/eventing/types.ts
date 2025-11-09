/**
 * Event Bus Types
 * Type definitions for the event bus implementation
 */

export interface EventPayload {
  eventKey: string
  tenantId: string
  projectId?: string
  eventType: string
  payload: Record<string, unknown>
  metadata?: Record<string, unknown>
  correlationId?: string
}

export interface OutboxEntry {
  id: string
  eventLogId: string
  tenantId: string
  eventType: string
  payload: Record<string, unknown>
  status: OutboxStatus
  retryCount: number
  maxRetries: number
  nextRetryAt: Date | null
  lastError: string | null
  processedAt: Date | null
  createdAt: Date
  updatedAt: Date
}

export type OutboxStatus = 'PENDING' | 'PROCESSING' | 'COMPLETED' | 'FAILED'

export interface RetryConfig {
  maxRetries?: number
  initialDelayMs?: number
  maxDelayMs?: number
  backoffMultiplier?: number
}

export interface EventSubscriber {
  eventTypes: string[]
  handler: (event: EventPayload) => Promise<void>
}

export interface ReplayOptions {
  tenantId: string
  eventTypes?: string[]
  fromDate?: Date
  toDate?: Date
  correlationId?: string
}

export interface EventBusMetrics {
  totalEvents: number
  pendingEvents: number
  failedEvents: number
  averageLatencyMs: number
  errorRate: number
}
