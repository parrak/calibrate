/**
 * Outbox Worker — Retry/backoff worker for processing outbox events
 * Handles failed events and moves them to DLQ after max retries
 */
import { PrismaClient } from '@prisma/client';
import type { EventSubscriber, RetryConfig } from './types';
export declare class OutboxWorker {
    private prisma;
    private retryConfig;
    private subscribers;
    private isRunning;
    private pollIntervalMs;
    private processInterval?;
    constructor(prisma: PrismaClient, options?: {
        retryConfig?: RetryConfig;
        pollIntervalMs?: number;
    });
    /**
     * Register an event subscriber
     */
    subscribe(subscriber: EventSubscriber): void;
    /**
     * Start the outbox worker
     */
    start(): void;
    /**
     * Stop the outbox worker
     */
    stop(): void;
    /**
     * Process pending events from outbox
     */
    processPendingEvents(): Promise<void>;
    /**
     * Process a single event
     */
    private processEvent;
    /**
     * Move failed event to dead letter queue
     */
    private moveToDeadLetterQueue;
    /**
     * Calculate next retry time with exponential backoff
     */
    private calculateNextRetry;
    /**
     * Retry a failed event from DLQ
     * This allows manual intervention to retry failed events
     */
    retryFromDlq(dlqId: string): Promise<string>;
    /**
     * Get metrics about the outbox
     */
    getMetrics(): Promise<{
        total: number;
        pending: number;
        processing: number;
        completed: number;
        failed: number;
        dlqCount: number;
    }>;
}
//# sourceMappingURL=outbox-worker.d.ts.map