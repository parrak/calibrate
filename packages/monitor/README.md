# @calibr/monitor

Monitoring and logging package for Calibrate applications. Provides structured logging, performance monitoring, and error tracking.

## Features

- **Structured Logging**: JSON-formatted logs with request context
- **Performance Monitoring**: Track response times, throughput, and resource usage
- **Error Tracking**: Automatic error capture with stack traces
- **Request Context**: Automatic extraction of request IDs, project IDs, and user context
- **Resource Monitoring**: CPU, memory, and system metrics

## Installation

```bash
pnpm add @calibr/monitor
```

## Usage

### Logger

```typescript
import { logger, createLogger, LogLevel } from '@calibr/monitor'

// Use default logger
logger.info('Application started')
logger.error('Operation failed', error)

// Create custom logger
const apiLogger = createLogger({ 
  service: 'api',
  logLevel: LogLevel.DEBUG 
})

apiLogger.info('API request processed', { userId: '123' })
```

### Request Logger (Next.js)

```typescript
import { createRequestLogger, logger } from '@calibr/monitor'
import { NextRequest } from 'next/server'

export async function GET(req: NextRequest) {
  const log = createRequestLogger(logger, req)
  
  log.info('Processing request')
  // Automatically includes requestId, projectId, userId, method, URL, etc.
  
  return Response.json({ success: true })
}
```

### Performance Monitoring

```typescript
import { 
  recordPerformanceMetric,
  getPerformanceStats,
  startResourceMonitoring 
} from '@calibr/monitor'

// Record a performance metric
recordPerformanceMetric({
  timestamp: Date.now(),
  endpoint: '/api/users',
  method: 'GET',
  responseTime: 150,
  statusCode: 200,
  projectId: 'proj-123'
})

// Get performance statistics
const stats = getPerformanceStats(60 * 60 * 1000) // Last hour
console.log(stats.averageResponseTime)
console.log(stats.errorRate)
console.log(stats.slowestEndpoints)

// Start resource monitoring (every 30 seconds)
startResourceMonitoring(30000)
```

## Configuration

### Environment Variables

- `LOG_LEVEL`: Set log level (error, warn, info, debug)
- `SERVICE_NAME`: Service identifier (default: 'calibr-service')
- `NODE_ENV`: Environment (development, production)

### Log Levels

- `ERROR`: System failures, exceptions
- `WARN`: Degraded performance, approaching limits
- `INFO`: Normal operations, user actions
- `DEBUG`: Detailed diagnostic info (development only)

## API Reference

See [src/index.ts](./src/index.ts) for full API exports.

## License

MIT

