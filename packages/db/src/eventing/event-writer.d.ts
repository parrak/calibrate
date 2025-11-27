/**
 * Event Writer — Append-only event writer with idempotent dedupe
 * Implements the transactional outbox pattern
 */
import { PrismaClient, Prisma } from '@prisma/client';
import type { EventPayload, RetryConfig } from './types';
type TransactionClient = Omit<PrismaClient, '$connect' | '$disconnect' | '$on' | '$transaction' | '$use' | '$extends'>;
export declare class EventWriter {
    private prisma;
    private retryConfig;
    constructor(prisma: PrismaClient, retryConfig?: RetryConfig);
    /**
     * Write an event to the event log with idempotent dedupe
     * Returns the event log ID or existing ID if duplicate
     */
    writeEvent(event: EventPayload): Promise<string>;
    /**
     * Write event and add to outbox in a transaction
     * This ensures atomicity between domain changes and event publishing
     */
    writeEventWithOutbox(event: EventPayload, options?: {
        tx?: TransactionClient;
    }): Promise<{
        eventLogId: string;
        outboxId: string;
    }>;
    /**
     * Write multiple events in a batch
     * Useful for bulk operations
     */
    writeEventBatch(events: EventPayload[]): Promise<string[]>;
    /**
     * Get events for replay
     */
    getEventsForReplay(options: {
        tenantId: string;
        eventTypes?: string[];
        fromDate?: Date;
        toDate?: Date;
        correlationId?: string;
        limit?: number;
    }): Promise<{
        projectId: string | null;
        id: string;
        eventKey: string;
        tenantId: string;
        eventType: string;
        payload: Prisma.JsonValue;
        metadata: Prisma.JsonValue | null;
        correlationId: string | null;
        createdAt: Date;
        version: number;
    }[]>;
    /**
     * Calculate next retry time with exponential backoff
     */
    calculateNextRetry(retryCount: number): Date;
}
export {};
//# sourceMappingURL=event-writer.d.ts.map