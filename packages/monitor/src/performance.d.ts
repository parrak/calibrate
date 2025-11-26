/**
 * @calibr/monitor - Performance Monitoring
 * Tracks response times, throughput, errors, and resource usage
 */
export interface PerformanceMetric {
    timestamp: number;
    endpoint: string;
    method: string;
    responseTime: number;
    statusCode: number;
    projectId?: string;
    userId?: string;
    userAgent?: string;
    ip?: string;
}
export interface ErrorMetric {
    timestamp: number;
    endpoint: string;
    method: string;
    errorType: string;
    errorMessage: string;
    stackTrace?: string;
    projectId?: string;
    userId?: string;
    statusCode: number;
}
export interface ResourceMetric {
    timestamp: number;
    memory: {
        used: number;
        total: number;
        external: number;
        rss: number;
    };
    cpu: {
        loadAverage: [number, number, number];
        usage?: number;
    };
    uptime: number;
}
export interface PerformanceStats {
    totalRequests: number;
    averageResponseTime: number;
    p50ResponseTime: number;
    p95ResponseTime: number;
    p99ResponseTime: number;
    errorRate: number;
    throughput: number;
    slowestEndpoints: Array<{
        endpoint: string;
        averageTime: number;
        requestCount: number;
    }>;
    errorBreakdown: Array<{
        errorType: string;
        count: number;
        percentage: number;
    }>;
}
/**
 * Record a performance metric
 */
export declare function recordPerformanceMetric(metric: PerformanceMetric): void;
/**
 * Record an error metric
 */
export declare function recordErrorMetric(metric: ErrorMetric): void;
/**
 * Record resource usage metrics
 */
export declare function recordResourceMetric(): void;
/**
 * Get performance statistics for a time range
 */
export declare function getPerformanceStats(timeRangeMs?: number, // 1 hour default
endpoint?: string): PerformanceStats;
/**
 * Get resource usage statistics
 */
export declare function getResourceStats(timeRangeMs?: number): ResourceMetric[];
/**
 * Get all performance metrics (for testing/debugging)
 */
export declare function getAllPerformanceMetrics(): Map<string, PerformanceMetric[]>;
/**
 * Get all error metrics (for testing/debugging)
 */
export declare function getAllErrorMetrics(): Map<string, ErrorMetric[]>;
/**
 * Get all resource metrics (for testing/debugging)
 */
export declare function getAllResourceMetrics(): Map<string, ResourceMetric[]>;
/**
 * Start periodic resource monitoring
 */
export declare function startResourceMonitoring(intervalMs?: number): void;
/**
 * Stop resource monitoring
 */
export declare function stopResourceMonitoring(): void;
/**
 * Clear all metrics (useful for testing)
 */
export declare function clearAllMetrics(): void;
//# sourceMappingURL=performance.d.ts.map