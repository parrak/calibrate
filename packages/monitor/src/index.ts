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
  createRequestLogger,
  generateCorrelationId
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

// Connector health exports
export {
  type ConnectorStatus,
  type ConnectorHealthMetric,
  type ConnectorHealthStats,
  type ConnectorHealthCheck,
  recordConnectorMetric,
  recordConnectorHealthCheck,
  getConnectorHealthStats,
  getAllConnectorHealthStats,
  getConnectorHealthCheck,
  clearConnectorMetrics,
  getAllConnectorMetrics
} from './connector-health'

// Alert policy exports
export {
  type AlertSeverity,
  type AlertChannel,
  type AlertPolicy,
  type Alert,
  DEFAULT_ALERT_POLICIES,
  checkAlertPolicies,
  getActiveAlerts,
  clearAlertCooldown,
  clearAllAlerts
} from './alerts'

// Alert delivery exports
export {
  type AlertDeliveryConfig,
  type AlertDeliveryResult,
  deliverToSlack,
  deliverToEmail,
  deliverToPagerDuty,
  deliverToWebhook,
  deliverAlert,
  loadAlertDeliveryConfig
} from './alert-delivery'

// Alert checker exports
export {
  type AlertCheckResult,
  checkAndDeliverAlerts,
  startPeriodicAlertChecking,
  testAlertDelivery
} from './alert-checker'

// Synthetic probes exports
export {
  type ProbeStatus,
  type ProbeConfig,
  type ProbeResult,
  type ProbeStats,
  DEFAULT_PROBES,
  executeProbe,
  executeAllProbes,
  recordProbeResult,
  getProbeStats,
  getAllProbeStats,
  getAllProbeResults,
  clearProbeResults,
  startPeriodicProbing
} from './synthetic-probes'

// Cron heartbeat exports
export {
  type CronJobConfig,
  type CronHeartbeat,
  type CronJobStatus,
  registerCronJob,
  unregisterCronJob,
  recordCronHeartbeat,
  getCronJobStatus,
  getAllCronJobStatuses,
  getMissingCronJobs,
  getFailedCronJobs,
  getUnreliableCronJobs,
  clearCronHeartbeats,
  getAllRegisteredCronJobs,
  createHeartbeatRecorder,
  checkCronJobHealth
} from './cron-heartbeat'

