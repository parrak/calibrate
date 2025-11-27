/**
 * @calibr/monitor - Logger
 * Structured logging with request context and error tracking
 */
export var LogLevel;
(function (LogLevel) {
    LogLevel["ERROR"] = "error";
    LogLevel["WARN"] = "warn";
    LogLevel["INFO"] = "info";
    LogLevel["DEBUG"] = "debug";
})(LogLevel || (LogLevel = {}));
export class Logger {
    service;
    isDevelopment;
    logLevel;
    constructor(options = {}) {
        this.service = options.service || process.env.SERVICE_NAME || 'calibr-service';
        this.isDevelopment = (options.environment || process.env.NODE_ENV) === 'development';
        this.logLevel = options.logLevel || this.getLogLevelFromEnv();
    }
    getLogLevelFromEnv() {
        const envLevel = process.env.LOG_LEVEL?.toLowerCase();
        switch (envLevel) {
            case 'error':
                return LogLevel.ERROR;
            case 'warn':
                return LogLevel.WARN;
            case 'info':
                return LogLevel.INFO;
            case 'debug':
                return LogLevel.DEBUG;
            default:
                return this.isDevelopment ? LogLevel.DEBUG : LogLevel.INFO;
        }
    }
    shouldLog(level) {
        const levels = [LogLevel.ERROR, LogLevel.WARN, LogLevel.INFO, LogLevel.DEBUG];
        const currentIndex = levels.indexOf(this.logLevel);
        const messageIndex = levels.indexOf(level);
        return messageIndex <= currentIndex;
    }
    formatLog(entry) {
        const base = {
            timestamp: entry.timestamp,
            level: entry.level,
            service: entry.service,
            message: entry.message
        };
        const withContext = {
            ...base,
            ...(entry.requestId && { requestId: entry.requestId }),
            ...(entry.correlationId && { correlationId: entry.correlationId }),
            ...(entry.userId && { userId: entry.userId }),
            ...(entry.projectId && { projectId: entry.projectId }),
            ...(entry.tenantId && { tenantId: entry.tenantId }),
            ...(entry.traceId && { traceId: entry.traceId }),
            ...(entry.spanId && { spanId: entry.spanId }),
            ...(entry.error && { error: entry.error }),
            ...(entry.metadata && { metadata: entry.metadata })
        };
        return JSON.stringify(withContext);
    }
    log(level, message, context) {
        if (!this.shouldLog(level)) {
            return;
        }
        const entry = {
            timestamp: new Date().toISOString(),
            level,
            message,
            service: this.service,
            ...context
        };
        const formatted = this.formatLog(entry);
        // In development, use console with colors
        if (this.isDevelopment) {
            const colors = {
                [LogLevel.ERROR]: '\x1b[31m', // Red
                [LogLevel.WARN]: '\x1b[33m', // Yellow
                [LogLevel.INFO]: '\x1b[36m', // Cyan
                [LogLevel.DEBUG]: '\x1b[90m' // Gray
            };
            const reset = '\x1b[0m';
            console.log(`${colors[level]}${formatted}${reset}`);
        }
        else {
            // In production, use structured logging (can be extended to send to external services)
            console.log(formatted);
        }
        // TODO: In production, send to external logging service (e.g., DataDog, New Relic, etc.)
        // This can be extended with a plugin system
    }
    error(message, error, context) {
        this.log(LogLevel.ERROR, message, {
            ...context,
            error: error ? {
                name: error.name,
                message: error.message,
                stack: error.stack
            } : undefined
        });
    }
    warn(message, context) {
        this.log(LogLevel.WARN, message, context);
    }
    info(message, context) {
        this.log(LogLevel.INFO, message, context);
    }
    debug(message, context) {
        this.log(LogLevel.DEBUG, message, context);
    }
}
/**
 * Generate unique request ID
 */
function generateRequestId() {
    return 'req_' + Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15);
}
/**
 * Generate unique correlation ID for distributed tracing
 */
export function generateCorrelationId() {
    return 'corr_' + Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15);
}
/**
 * Create a logger instance
 */
export function createLogger(options) {
    return new Logger(options);
}
/**
 * Default logger instance
 */
export const logger = createLogger();
export function createRequestLogger(logger, request) {
    const requestId = request.headers?.get('x-request-id') || generateRequestId();
    const correlationId = request.headers?.get('x-correlation-id') || generateCorrelationId();
    const projectId = request.headers?.get('x-calibr-project') || undefined;
    const userId = request.headers?.get('x-user-id') || undefined;
    const traceId = request.headers?.get('x-trace-id') || undefined;
    const spanId = request.headers?.get('x-span-id') || undefined;
    const baseContext = {
        requestId,
        correlationId,
        projectId,
        userId,
        traceId,
        spanId
    };
    const baseMetadata = {
        method: request.method,
        url: request.url,
        userAgent: request.headers?.get('user-agent'),
        ip: request.ip || request.headers?.get('x-forwarded-for')
    };
    return {
        error: (message, error, context) => logger.error(message, error, {
            ...baseContext,
            ...context,
            metadata: {
                ...baseMetadata,
                ...context?.metadata
            }
        }),
        warn: (message, context) => logger.warn(message, {
            ...baseContext,
            ...context,
            metadata: {
                ...baseMetadata,
                ...context?.metadata
            }
        }),
        info: (message, context) => logger.info(message, {
            ...baseContext,
            ...context,
            metadata: {
                ...baseMetadata,
                ...context?.metadata
            }
        }),
        debug: (message, context) => logger.debug(message, {
            ...baseContext,
            ...context,
            metadata: {
                ...baseMetadata,
                ...context?.metadata
            }
        })
    };
}
//# sourceMappingURL=logger.js.map