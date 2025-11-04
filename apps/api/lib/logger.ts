import { NextRequest } from 'next/server'

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

class Logger {
  private service: string
  private isDevelopment: boolean

  constructor(service: string = 'calibr-api') {
    this.service = service
    this.isDevelopment = process.env.NODE_ENV === 'development'
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
      // In production, use structured logging
      console.log(formatted)
    }

    // TODO: In production, send to external logging service (e.g., DataDog, New Relic, etc.)
  }

  error(message: string, error?: Error, context?: Partial<LogEntry>) {
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
    if (this.isDevelopment) {
      this.log(LogLevel.DEBUG, message, context)
    }
  }

  // Request-specific logging
  logRequest(req: NextRequest, message: string, level: LogLevel = LogLevel.INFO, context?: Partial<LogEntry>) {
    const requestId = req.headers.get('x-request-id') || generateRequestId()
    const projectId = req.headers.get('x-calibr-project') || undefined

    this.log(level, message, {
      ...context,
      requestId,
      projectId,
      metadata: {
        method: req.method,
        url: req.url,
        userAgent: req.headers.get('user-agent'),
        ip: req.ip || req.headers.get('x-forwarded-for')
      }
    })
  }

  // API endpoint logging
  logApiCall(
    req: NextRequest,
    response: { status: number; responseTime: number },
    context?: Partial<LogEntry>
  ) {
    const level = response.status >= 400 ? LogLevel.ERROR : LogLevel.INFO
    const message = `API ${req.method} ${req.nextUrl.pathname} - ${response.status} (${response.responseTime}ms)`

    this.logRequest(req, message, level, {
      ...context,
      metadata: {
        ...context?.metadata,
        statusCode: response.status,
        responseTime: response.responseTime
      }
    })
  }
}

// Generate unique request ID
function generateRequestId(): string {
  return Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15)
}

// Export singleton instance
export const logger = new Logger()

// Export utility functions
export function createRequestLogger(req: NextRequest) {
  return {
    error: (message: string, error?: Error, context?: Partial<LogEntry>) =>
      logger.logRequest(req, message, LogLevel.ERROR, { ...context, error: error ? { name: error.name, message: error.message, stack: error.stack } : undefined }),
    warn: (message: string, context?: Partial<LogEntry>) =>
      logger.logRequest(req, message, LogLevel.WARN, context),
    info: (message: string, context?: Partial<LogEntry>) =>
      logger.logRequest(req, message, LogLevel.INFO, context),
    debug: (message: string, context?: Partial<LogEntry>) =>
      logger.logRequest(req, message, LogLevel.DEBUG, context)
  }
}
