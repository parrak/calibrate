/**
 * @calibr/monitor - Logger
 * Structured logging with request context and error tracking
 */

export enum LogLevel {
  ERROR = 'error',
  WARN = 'warn',
  INFO = 'info',
  DEBUG = 'debug'
}

export interface LogEntry {
  timestamp: string
  level: LogLevel
  message: string
  service: string
  requestId?: string
  userId?: string
  projectId?: string
  tenantId?: string
  error?: {
    name: string
    message: string
    stack?: string
  }
  metadata?: Record<string, unknown>
}

export interface LoggerOptions {
  service?: string
  environment?: string
  logLevel?: LogLevel
}

export class Logger {
  private service: string
  private isDevelopment: boolean
  private logLevel: LogLevel

  constructor(options: LoggerOptions = {}) {
    this.service = options.service || process.env.SERVICE_NAME || 'calibr-service'
    this.isDevelopment = (options.environment || process.env.NODE_ENV) === 'development'
    this.logLevel = options.logLevel || this.getLogLevelFromEnv()
  }

  private getLogLevelFromEnv(): LogLevel {
    const envLevel = process.env.LOG_LEVEL?.toLowerCase()
    switch (envLevel) {
      case 'error':
        return LogLevel.ERROR
      case 'warn':
        return LogLevel.WARN
      case 'info':
        return LogLevel.INFO
      case 'debug':
        return LogLevel.DEBUG
      default:
        return this.isDevelopment ? LogLevel.DEBUG : LogLevel.INFO
    }
  }

  private shouldLog(level: LogLevel): boolean {
    const levels = [LogLevel.ERROR, LogLevel.WARN, LogLevel.INFO, LogLevel.DEBUG]
    const currentIndex = levels.indexOf(this.logLevel)
    const messageIndex = levels.indexOf(level)
    return messageIndex <= currentIndex
  }

  private formatLog(entry: LogEntry): string {
    const base = {
      timestamp: entry.timestamp,
      level: entry.level,
      service: entry.service,
      message: entry.message
    }

    const withContext = {
      ...base,
      ...(entry.requestId && { requestId: entry.requestId }),
      ...(entry.userId && { userId: entry.userId }),
      ...(entry.projectId && { projectId: entry.projectId }),
      ...(entry.tenantId && { tenantId: entry.tenantId }),
      ...(entry.error && { error: entry.error }),
      ...(entry.metadata && { metadata: entry.metadata })
    }

    return JSON.stringify(withContext)
  }

  private log(level: LogLevel, message: string, context?: Partial<LogEntry>) {
    if (!this.shouldLog(level)) {
      return
    }

    const entry: LogEntry = {
      timestamp: new Date().toISOString(),
      level,
      message,
      service: this.service,
      ...context
    }

    const formatted = this.formatLog(entry)

    // In development, use console with colors
    if (this.isDevelopment) {
      const colors = {
        [LogLevel.ERROR]: '\x1b[31m', // Red
        [LogLevel.WARN]: '\x1b[33m',  // Yellow
        [LogLevel.INFO]: '\x1b[36m',  // Cyan
        [LogLevel.DEBUG]: '\x1b[90m'  // Gray
      }
      const reset = '\x1b[0m'
      console.log(`${colors[level]}${formatted}${reset}`)
    } else {
      // In production, use structured logging (can be extended to send to external services)
      console.log(formatted)
    }

    // TODO: In production, send to external logging service (e.g., DataDog, New Relic, etc.)
    // This can be extended with a plugin system
  }

  error(message: string, error?: Error, context?: Partial<LogEntry) {
    this.log(LogLevel.ERROR, message, {
      ...context,
      error: error ? {
        name: error.name,
        message: error.message,
        stack: error.stack
      } : undefined
    })
  }

  warn(message: string, context?: Partial<LogEntry>) {
    this.log(LogLevel.WARN, message, context)
  }

  info(message: string, context?: Partial<LogEntry>) {
    this.log(LogLevel.INFO, message, context)
  }

  debug(message: string, context?: Partial<LogEntry>) {
    this.log(LogLevel.DEBUG, message, context)
  }
}

/**
 * Generate unique request ID
 */
function generateRequestId(): string {
  return Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15)
}

/**
 * Create a logger instance
 */
export function createLogger(options?: LoggerOptions): Logger {
  return new Logger(options)
}

/**
 * Default logger instance
 */
export const logger = createLogger()

/**
 * Next.js request logger helper
 * Extracts request context and provides request-scoped logging
 */
export interface RequestLogger {
  error: (message: string, error?: Error, context?: Partial<LogEntry>) => void
  warn: (message: string, context?: Partial<LogEntry>) => void
  info: (message: string, context?: Partial<LogEntry>) => void
  debug: (message: string, context?: Partial<LogEntry>) => void
}

export function createRequestLogger(
  logger: Logger,
  request: { headers?: Headers; url?: string; method?: string; ip?: string }
): RequestLogger {
  const requestId = request.headers?.get('x-request-id') || generateRequestId()
  const projectId = request.headers?.get('x-calibr-project') || undefined
  const userId = request.headers?.get('x-user-id') || undefined

  return {
    error: (message: string, error?: Error, context?: Partial<LogEntry>) =>
      logger.error(message, error, {
        ...context,
        requestId,
        projectId,
        userId,
        metadata: {
          ...context?.metadata,
          method: request.method,
          url: request.url,
          userAgent: request.headers?.get('user-agent'),
          ip: request.ip || request.headers?.get('x-forwarded-for')
        }
      }),
    warn: (message: string, context?: Partial<LogEntry>) =>
      logger.warn(message, {
        ...context,
        requestId,
        projectId,
        userId,
        metadata: {
          ...context?.metadata,
          method: request.method,
          url: request.url,
          userAgent: request.headers?.get('user-agent'),
          ip: request.ip || request.headers?.get('x-forwarded-for')
        }
      }),
    info: (message: string, context?: Partial<LogEntry>) =>
      logger.info(message, {
        ...context,
        requestId,
        projectId,
        userId,
        metadata: {
          ...context?.metadata,
          method: request.method,
          url: request.url,
          userAgent: request.headers?.get('user-agent'),
          ip: request.ip || request.headers?.get('x-forwarded-for')
        }
      }),
    debug: (message: string, context?: Partial<LogEntry>) =>
      logger.debug(message, {
        ...context,
        requestId,
        projectId,
        userId,
        metadata: {
          ...context?.metadata,
          method: request.method,
          url: request.url,
          userAgent: request.headers?.get('user-agent'),
          ip: request.ip || request.headers?.get('x-forwarded-for')
        }
      })
  }
}

