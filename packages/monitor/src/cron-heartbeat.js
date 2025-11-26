/**
 * @calibr/monitor - Cron Job Heartbeat Monitoring
 * Monitor cron job execution and alert on missed executions
 */
import { logger } from './logger';
// In-memory storage for cron heartbeats
const cronJobs = new Map();
const cronHeartbeats = new Map();
const MAX_HEARTBEATS_PER_JOB = 1000;
const HEARTBEAT_RETENTION_MS = 7 * 24 * 60 * 60 * 1000; // 7 days
/**
 * Register a cron job for monitoring
 */
export function registerCronJob(config) {
    cronJobs.set(config.id, {
        ...config,
        gracePeriodMs: config.gracePeriodMs || config.expectedIntervalMs * 0.1,
        alertOnMiss: config.alertOnMiss !== false
    });
    logger.info('Cron job registered for monitoring', {
        metadata: {
            jobId: config.id,
            name: config.name,
            expectedIntervalMs: config.expectedIntervalMs
        }
    });
}
/**
 * Unregister a cron job
 */
export function unregisterCronJob(jobId) {
    cronJobs.delete(jobId);
    cronHeartbeats.delete(jobId);
    logger.info('Cron job unregistered', {
        metadata: { jobId }
    });
}
/**
 * Record a cron job heartbeat
 */
export function recordCronHeartbeat(heartbeat) {
    const config = cronJobs.get(heartbeat.jobId);
    if (!config) {
        logger.warn('Heartbeat received for unregistered cron job', {
            metadata: {
                jobId: heartbeat.jobId
            }
        });
        return;
    }
    const heartbeats = cronHeartbeats.get(heartbeat.jobId) || [];
    heartbeats.push({
        ...heartbeat,
        timestamp: heartbeat.timestamp || Date.now()
    });
    // Clean old heartbeats
    const cutoff = Date.now() - HEARTBEAT_RETENTION_MS;
    const filtered = heartbeats.filter(h => h.timestamp > cutoff);
    // Limit size
    if (filtered.length > MAX_HEARTBEATS_PER_JOB) {
        filtered.splice(0, filtered.length - MAX_HEARTBEATS_PER_JOB);
    }
    cronHeartbeats.set(heartbeat.jobId, filtered);
    logger.info('Cron heartbeat recorded', {
        metadata: {
            jobId: heartbeat.jobId,
            status: heartbeat.status,
            duration: heartbeat.duration
        }
    });
}
/**
 * Get cron job status
 */
export function getCronJobStatus(jobId) {
    const config = cronJobs.get(jobId);
    if (!config) {
        return undefined;
    }
    const heartbeats = cronHeartbeats.get(jobId) || [];
    if (heartbeats.length === 0) {
        return {
            jobId,
            config,
            consecutiveFailures: 0,
            totalRuns: 0,
            successfulRuns: 0,
            failedRuns: 0,
            avgDuration: 0,
            isMissing: true,
            nextExpectedRun: Date.now() + config.expectedIntervalMs,
            reliability: 0
        };
    }
    const lastHeartbeat = heartbeats[heartbeats.length - 1];
    const lastSuccessful = heartbeats.reverse().find(h => h.status === 'success');
    const lastFailed = heartbeats.reverse().find(h => h.status === 'failure');
    const totalRuns = heartbeats.length;
    const successfulRuns = heartbeats.filter(h => h.status === 'success').length;
    const failedRuns = heartbeats.filter(h => h.status === 'failure').length;
    const reliability = (successfulRuns / totalRuns) * 100;
    // Calculate consecutive failures
    let consecutiveFailures = 0;
    for (let i = heartbeats.length - 1; i >= 0; i--) {
        if (heartbeats[i].status === 'failure') {
            consecutiveFailures++;
        }
        else {
            break;
        }
    }
    // Calculate average duration
    const durationsums = heartbeats
        .filter(h => h.duration !== undefined)
        .map(h => h.duration);
    const avgDuration = durationsums.length > 0
        ? durationsums.reduce((a, b) => a + b, 0) / durationsums.length
        : 0;
    // Check if job is missing
    const timeSinceLastRun = Date.now() - lastHeartbeat.timestamp;
    const gracePeriod = config.gracePeriodMs || config.expectedIntervalMs * 0.1;
    const isMissing = timeSinceLastRun > (config.expectedIntervalMs + gracePeriod);
    // Calculate next expected run
    const nextExpectedRun = lastHeartbeat.timestamp + config.expectedIntervalMs;
    return {
        jobId,
        config,
        lastHeartbeat,
        lastSuccessfulRun: lastSuccessful?.timestamp,
        lastFailedRun: lastFailed?.timestamp,
        consecutiveFailures,
        totalRuns,
        successfulRuns,
        failedRuns,
        avgDuration,
        isMissing,
        nextExpectedRun,
        reliability
    };
}
/**
 * Get all cron job statuses
 */
export function getAllCronJobStatuses() {
    const statuses = new Map();
    for (const [jobId] of cronJobs) {
        const status = getCronJobStatus(jobId);
        if (status) {
            statuses.set(jobId, status);
        }
    }
    return statuses;
}
/**
 * Get missing cron jobs
 */
export function getMissingCronJobs() {
    const allStatuses = getAllCronJobStatuses();
    return Array.from(allStatuses.values()).filter(status => status.isMissing);
}
/**
 * Get failed cron jobs (with consecutive failures)
 */
export function getFailedCronJobs(minConsecutiveFailures = 1) {
    const allStatuses = getAllCronJobStatuses();
    return Array.from(allStatuses.values()).filter(status => status.consecutiveFailures >= minConsecutiveFailures);
}
/**
 * Get unreliable cron jobs
 */
export function getUnreliableCronJobs(minReliability = 99) {
    const allStatuses = getAllCronJobStatuses();
    return Array.from(allStatuses.values()).filter(status => status.totalRuns > 0 && status.reliability < minReliability);
}
/**
 * Clear cron job heartbeats
 */
export function clearCronHeartbeats(jobId) {
    if (jobId) {
        cronHeartbeats.delete(jobId);
    }
    else {
        cronHeartbeats.clear();
    }
}
/**
 * Get all registered cron jobs
 */
export function getAllRegisteredCronJobs() {
    return Array.from(cronJobs.values());
}
/**
 * Helper to create a heartbeat recorder for a cron job
 */
export function createHeartbeatRecorder(jobId) {
    return {
        /**
         * Record a successful execution
         */
        success(duration, message, metadata) {
            recordCronHeartbeat({
                jobId,
                timestamp: Date.now(),
                status: 'success',
                duration,
                message,
                metadata
            });
        },
        /**
         * Record a failed execution
         */
        failure(error, duration, metadata) {
            recordCronHeartbeat({
                jobId,
                timestamp: Date.now(),
                status: 'failure',
                duration,
                error: error instanceof Error ? error.message : error,
                metadata
            });
        },
        /**
         * Record a warning (partial success)
         */
        warning(message, duration, metadata) {
            recordCronHeartbeat({
                jobId,
                timestamp: Date.now(),
                status: 'warning',
                duration,
                message,
                metadata
            });
        },
        /**
         * Wrap a function to automatically record heartbeats
         */
        wrap(fn) {
            return async () => {
                const startTime = Date.now();
                try {
                    const result = await fn();
                    this.success(Date.now() - startTime, 'Execution completed');
                    return result;
                }
                catch (error) {
                    this.failure(error instanceof Error ? error : String(error), Date.now() - startTime);
                    throw error;
                }
            };
        }
    };
}
/**
 * Check for missing cron jobs and return alerts
 */
export function checkCronJobHealth() {
    const missing = getMissingCronJobs();
    const failed = getFailedCronJobs(3); // 3+ consecutive failures
    const unreliable = getUnreliableCronJobs(99); // <99% reliability
    const allStatuses = getAllCronJobStatuses();
    const allStatusesArray = Array.from(allStatuses.values());
    const problematicJobIds = new Set([
        ...missing.map(s => s.jobId),
        ...failed.map(s => s.jobId),
        ...unreliable.map(s => s.jobId)
    ]);
    const healthy = allStatusesArray.filter(s => !problematicJobIds.has(s.jobId));
    logger.info('Cron job health check completed', {
        metadata: {
            total: allStatusesArray.length,
            missing: missing.length,
            failed: failed.length,
            unreliable: unreliable.length,
            healthy: healthy.length
        }
    });
    return { missing, failed, unreliable, healthy };
}
//# sourceMappingURL=cron-heartbeat.js.map