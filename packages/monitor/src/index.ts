/**
 * @calibr/monitor
 * Monitoring and logging package for Calibrate
 * 
 * Provides:
 * - Structured logging with request context
 * - Performance monitoring and metrics
 * - Error tracking and reporting
 * - Resource usage monitoring
 */

// Logger exports
export {
  Logger,
  LogLevel,
  type LogEntry,
  type LoggerOptions,
  type RequestLogger,
  createLogger,
  logger,
  createRequestLogger
} from './logger'

// Performance monitoring exports
export {
  type PerformanceMetric,
  type ErrorMetric,
  type ResourceMetric,
  type PerformanceStats,
  recordPerformanceMetric,
  recordErrorMetric,
  recordResourceMetric,
  getPerformanceStats,
  getResourceStats,
  getAllPerformanceMetrics,
  getAllErrorMetrics,
  getAllResourceMetrics,
  startResourceMonitoring,
  stopResourceMonitoring,
  clearAllMetrics
} from './performance'

// Event bus metrics exports
export {
  type EventMetric,
  type EventBusStats,
  recordEventMetric,
  getEventBusStats,
  getSlowEvents,
  getFailedEvents,
  getEventsByCorrelation,
  getAllEventMetrics,
  clearEventMetrics
} from './event-metrics'

