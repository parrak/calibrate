/**
 * @calibr/monitor - Logger
 * Structured logging with request context and error tracking
 */
export declare enum LogLevel {
    ERROR = "error",
    WARN = "warn",
    INFO = "info",
    DEBUG = "debug"
}
export interface LogEntry {
    timestamp: string;
    level: LogLevel;
    message: string;
    service: string;
    requestId?: string;
    correlationId?: string;
    userId?: string;
    projectId?: string;
    tenantId?: string;
    traceId?: string;
    spanId?: string;
    error?: {
        name: string;
        message: string;
        stack?: string;
    };
    metadata?: Record<string, unknown>;
}
export interface LoggerOptions {
    service?: string;
    environment?: string;
    logLevel?: LogLevel;
}
export declare class Logger {
    private service;
    private isDevelopment;
    private logLevel;
    constructor(options?: LoggerOptions);
    private getLogLevelFromEnv;
    private shouldLog;
    private formatLog;
    private log;
    error(message: string, error?: Error, context?: Partial<LogEntry>): void;
    warn(message: string, context?: Partial<LogEntry>): void;
    info(message: string, context?: Partial<LogEntry>): void;
    debug(message: string, context?: Partial<LogEntry>): void;
}
/**
 * Generate unique correlation ID for distributed tracing
 */
export declare function generateCorrelationId(): string;
/**
 * Create a logger instance
 */
export declare function createLogger(options?: LoggerOptions): Logger;
/**
 * Default logger instance
 */
export declare const logger: Logger;
/**
 * Next.js request logger helper
 * Extracts request context and provides request-scoped logging
 */
export interface RequestLogger {
    error: (message: string, error?: Error, context?: Partial<LogEntry>) => void;
    warn: (message: string, context?: Partial<LogEntry>) => void;
    info: (message: string, context?: Partial<LogEntry>) => void;
    debug: (message: string, context?: Partial<LogEntry>) => void;
}
export declare function createRequestLogger(logger: Logger, request: {
    headers?: Headers;
    url?: string;
    method?: string;
    ip?: string;
}): RequestLogger;
//# sourceMappingURL=logger.d.ts.map