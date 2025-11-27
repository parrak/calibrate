/**
 * Event Replay — Replay historical events for recovery or connector sync
 * Supports filtering by tenant, event type, date range, and correlation ID
 */
import { PrismaClient } from '@prisma/client';
import type { ReplayOptions, EventSubscriber } from './types';
export declare class EventReplay {
    private prisma;
    private subscribers;
    constructor(prisma: PrismaClient);
    /**
     * Register an event subscriber
     */
    subscribe(subscriber: EventSubscriber): void;
    /**
     * Replay events based on filters
     * Useful for:
     * - Connector initial sync
     * - Recovery after system failures
     * - Reconstructing historical state
     */
    replay(options: ReplayOptions): Promise<number>;
    /**
     * Get event statistics for a tenant
     */
    getEventStats(tenantId: string, eventType?: string): Promise<{
        total: number;
        firstEventAt: Date | undefined;
        lastEventAt: Date | undefined;
        eventTypeCounts: {
            eventType: string;
            count: number;
        }[];
    }>;
    /**
     * Verify replay integrity
     * Ensures all events can be successfully fetched and are in order
     */
    verifyIntegrity(tenantId: string): Promise<{
        valid: boolean;
        totalEvents: number;
        issues: string[];
    }>;
    /**
     * Get events by correlation ID
     * Useful for tracing a complete operation across multiple events
     */
    getEventsByCorrelation(correlationId: string): Promise<{
        projectId: string | null;
        id: string;
        eventKey: string;
        tenantId: string;
        eventType: string;
        payload: import("@prisma/client/runtime/library").JsonValue;
        metadata: import("@prisma/client/runtime/library").JsonValue | null;
        correlationId: string | null;
        createdAt: Date;
        version: number;
    }[]>;
}
//# sourceMappingURL=event-replay.d.ts.map