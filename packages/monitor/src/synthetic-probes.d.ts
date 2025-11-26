/**
 * @calibr/monitor - Synthetic Probes
 * Synthetic monitoring for critical API endpoints
 */
export type ProbeStatus = 'healthy' | 'degraded' | 'unhealthy' | 'unknown';
export interface ProbeConfig {
    id: string;
    name: string;
    description: string;
    endpoint: string;
    method?: 'GET' | 'POST' | 'PUT' | 'DELETE';
    headers?: Record<string, string>;
    body?: any;
    timeout?: number;
    expectedStatus?: number[];
    expectedResponseTime?: number;
    healthCheck?: (response: Response, responseTime: number) => boolean;
}
export interface ProbeResult {
    probeId: string;
    timestamp: number;
    status: ProbeStatus;
    responseTime: number;
    statusCode?: number;
    error?: string;
    healthy: boolean;
    message?: string;
}
export interface ProbeStats {
    probeId: string;
    totalChecks: number;
    successfulChecks: number;
    failedChecks: number;
    successRate: number;
    avgResponseTime: number;
    p95ResponseTime: number;
    lastCheck?: ProbeResult;
    recentResults: ProbeResult[];
}
/**
 * Default probe configurations for Calibr platform
 */
export declare const DEFAULT_PROBES: ProbeConfig[];
/**
 * Execute a synthetic probe
 */
export declare function executeProbe(config: ProbeConfig, baseUrl?: string): Promise<ProbeResult>;
/**
 * Execute all probes
 */
export declare function executeAllProbes(baseUrl?: string, probes?: ProbeConfig[]): Promise<ProbeResult[]>;
/**
 * Record a probe result
 */
export declare function recordProbeResult(result: ProbeResult): void;
/**
 * Get probe statistics
 */
export declare function getProbeStats(probeId: string): ProbeStats | undefined;
/**
 * Get all probe statistics
 */
export declare function getAllProbeStats(): Map<string, ProbeStats>;
/**
 * Get all probe results
 */
export declare function getAllProbeResults(): Map<string, ProbeResult[]>;
/**
 * Clear probe results
 */
export declare function clearProbeResults(probeId?: string): void;
/**
 * Start periodic probe execution
 * @param intervalMs - Check interval in milliseconds (default: 5 minutes)
 * @param baseUrl - Base URL for API endpoints
 * @param probes - Probe configurations
 * @returns A function to stop the periodic probing
 */
export declare function startPeriodicProbing(intervalMs?: number, // 5 minutes default
baseUrl?: string, probes?: ProbeConfig[]): () => void;
//# sourceMappingURL=synthetic-probes.d.ts.map