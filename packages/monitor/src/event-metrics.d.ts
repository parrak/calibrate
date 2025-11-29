/**
 * @calibr/monitor - Event Bus Metrics
 * Tracks event latency, throughput, and health for the event bus system
 */
export interface EventMetric {
    timestamp: number;
    eventId: string;
    eventType: string;
    tenantId: string;
    projectId?: string;
    correlationId?: string;
    latencyMs: number;
    retryCount: number;
    status: 'success' | 'failed' | 'retrying';
}
export interface EventBusStats {
    totalEvents: number;
    averageLatency: number;
    p50Latency: number;
    p95Latency: number;
    p99Latency: number;
    maxLatency: number;
    throughput: number;
    successRate: number;
    retryRate: number;
    failureRate: number;
    eventTypeBreakdown: Array<{
        eventType: string;
        count: number;
        averageLatency: number;
        successRate: number;
    }>;
}
/**
 * Record an event metric
 */
export declare function recordEventMetric(metric: EventMetric): void;
/**
 * Get event bus statistics for a time range
 */
export declare function getEventBusStats(timeRangeMs?: number, // 1 hour default
eventType?: string): EventBusStats;
/**
 * Get slow events (above threshold)
 */
export declare function getSlowEvents(thresholdMs?: number, timeRangeMs?: number): EventMetric[];
/**
 * Get failed events
 */
export declare function getFailedEvents(timeRangeMs?: number): EventMetric[];
/**
 * Get events by correlation ID
 */
export declare function getEventsByCorrelation(correlationId: string): EventMetric[];
/**
 * Get all event metrics (for testing/debugging)
 */
export declare function getAllEventMetrics(): Map<string, EventMetric[]>;
/**
 * Clear all event metrics (useful for testing)
 */
export declare function clearEventMetrics(): void;
//# sourceMappingURL=event-metrics.d.ts.map