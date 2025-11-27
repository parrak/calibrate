/**
 * @calibr/monitor - Cron Job Heartbeat Monitoring
 * Monitor cron job execution and alert on missed executions
 */
export interface CronJobConfig {
    id: string;
    name: string;
    description: string;
    schedule: string;
    expectedIntervalMs: number;
    gracePeriodMs?: number;
    alertOnMiss?: boolean;
}
export interface CronHeartbeat {
    jobId: string;
    timestamp: number;
    status: 'success' | 'failure' | 'warning';
    duration?: number;
    message?: string;
    error?: string;
    metadata?: Record<string, any>;
}
export interface CronJobStatus {
    jobId: string;
    config: CronJobConfig;
    lastHeartbeat?: CronHeartbeat;
    lastSuccessfulRun?: number;
    lastFailedRun?: number;
    consecutiveFailures: number;
    totalRuns: number;
    successfulRuns: number;
    failedRuns: number;
    avgDuration: number;
    isMissing: boolean;
    nextExpectedRun: number;
    reliability: number;
}
/**
 * Register a cron job for monitoring
 */
export declare function registerCronJob(config: CronJobConfig): void;
/**
 * Unregister a cron job
 */
export declare function unregisterCronJob(jobId: string): void;
/**
 * Record a cron job heartbeat
 */
export declare function recordCronHeartbeat(heartbeat: CronHeartbeat): void;
/**
 * Get cron job status
 */
export declare function getCronJobStatus(jobId: string): CronJobStatus | undefined;
/**
 * Get all cron job statuses
 */
export declare function getAllCronJobStatuses(): Map<string, CronJobStatus>;
/**
 * Get missing cron jobs
 */
export declare function getMissingCronJobs(): CronJobStatus[];
/**
 * Get failed cron jobs (with consecutive failures)
 */
export declare function getFailedCronJobs(minConsecutiveFailures?: number): CronJobStatus[];
/**
 * Get unreliable cron jobs
 */
export declare function getUnreliableCronJobs(minReliability?: number): CronJobStatus[];
/**
 * Clear cron job heartbeats
 */
export declare function clearCronHeartbeats(jobId?: string): void;
/**
 * Get all registered cron jobs
 */
export declare function getAllRegisteredCronJobs(): CronJobConfig[];
/**
 * Helper to create a heartbeat recorder for a cron job
 */
export declare function createHeartbeatRecorder(jobId: string): {
    /**
     * Record a successful execution
     */
    success(duration?: number, message?: string, metadata?: Record<string, any>): void;
    /**
     * Record a failed execution
     */
    failure(error: string | Error, duration?: number, metadata?: Record<string, any>): void;
    /**
     * Record a warning (partial success)
     */
    warning(message: string, duration?: number, metadata?: Record<string, any>): void;
    /**
     * Wrap a function to automatically record heartbeats
     */
    wrap<T>(fn: () => Promise<T>): () => Promise<T>;
};
/**
 * Check for missing cron jobs and return alerts
 */
export declare function checkCronJobHealth(): {
    missing: CronJobStatus[];
    failed: CronJobStatus[];
    unreliable: CronJobStatus[];
    healthy: CronJobStatus[];
};
//# sourceMappingURL=cron-heartbeat.d.ts.map