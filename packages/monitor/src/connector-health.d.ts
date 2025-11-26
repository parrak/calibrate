/**
 * @calibr/monitor - Connector Health Tracking
 * Monitors health, latency, and success rates for platform connectors
 */
export type ConnectorStatus = 'healthy' | 'degraded' | 'down' | 'unknown';
export interface ConnectorHealthMetric {
    timestamp: number;
    connectorType: string;
    connectorId: string;
    tenantId: string;
    projectId?: string;
    operation: string;
    success: boolean;
    latencyMs: number;
    errorMessage?: string;
    metadata?: Record<string, unknown>;
}
export interface ConnectorHealthStats {
    connectorType: string;
    status: ConnectorStatus;
    totalOperations: number;
    successRate: number;
    averageLatency: number;
    p95Latency: number;
    errorCount: number;
    lastSuccessAt?: number;
    lastFailureAt?: number;
    lastHealthCheck?: number;
    operationBreakdown: Array<{
        operation: string;
        count: number;
        successRate: number;
        averageLatency: number;
    }>;
    recentErrors: Array<{
        timestamp: number;
        operation: string;
        errorMessage: string;
    }>;
}
export interface ConnectorHealthCheck {
    connectorType: string;
    connectorId: string;
    tenantId: string;
    projectId?: string;
    timestamp: number;
    status: ConnectorStatus;
    latencyMs: number;
    checks: Array<{
        name: string;
        passed: boolean;
        message?: string;
    }>;
}
/**
 * Record a connector operation metric
 */
export declare function recordConnectorMetric(metric: ConnectorHealthMetric): void;
/**
 * Record a connector health check
 */
export declare function recordConnectorHealthCheck(healthCheck: ConnectorHealthCheck): void;
/**
 * Get health stats for a connector
 */
export declare function getConnectorHealthStats(connectorType: string, connectorId?: string, timeRangeMs?: number): ConnectorHealthStats;
/**
 * Get all connector health stats
 */
export declare function getAllConnectorHealthStats(timeRangeMs?: number): ConnectorHealthStats[];
/**
 * Get connector health check status
 */
export declare function getConnectorHealthCheck(connectorType: string, connectorId: string): ConnectorHealthCheck | null;
/**
 * Clear all connector metrics (useful for testing)
 */
export declare function clearConnectorMetrics(): void;
/**
 * Get all connector metrics (for testing/debugging)
 */
export declare function getAllConnectorMetrics(): Map<string, ConnectorHealthMetric[]>;
//# sourceMappingURL=connector-health.d.ts.map