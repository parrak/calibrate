/**
 * @calibr/monitor - Alert Policies
 * Define and check alert policies for SLA monitoring
 */

export type AlertSeverity = 'critical' | 'warning' | 'info'
export type AlertChannel = 'slack' | 'email' | 'pagerduty' | 'webhook'

export interface AlertPolicy {
  id: string
  name: string
  description: string
  severity: AlertSeverity
  channels: AlertChannel[]
  condition: (metrics: any) => boolean
  message: (metrics: any) => string
  cooldownMs?: number // Prevent alert spam
  enabled: boolean
}

export interface Alert {
  policyId: string
  severity: AlertSeverity
  message: string
  timestamp: number
  metrics: any
}

// Alert history for cooldown tracking
const alertHistory = new Map<string, number>()
const activeAlerts = new Map<string, Alert>()

/**
 * Default alert policies for Calibr platform
 */
export const DEFAULT_ALERT_POLICIES: AlertPolicy[] = [
  // API Performance Alerts
  {
    id: 'api_p95_high',
    name: 'API p95 Latency High',
    description: 'API p95 latency exceeds 1.5s threshold',
    severity: 'warning',
    channels: ['slack'],
    condition: (metrics) => metrics.performance?.p95ResponseTime > 1500,
    message: (metrics) =>
      `API p95 latency is ${metrics.performance.p95ResponseTime}ms (threshold: 1500ms)`,
    cooldownMs: 5 * 60 * 1000, // 5 minutes
    enabled: true
  },
  {
    id: 'api_p95_critical',
    name: 'API p95 Latency Critical',
    description: 'API p95 latency exceeds 3s threshold',
    severity: 'critical',
    channels: ['slack', 'pagerduty'],
    condition: (metrics) => metrics.performance?.p95ResponseTime > 3000,
    message: (metrics) =>
      `🚨 CRITICAL: API p95 latency is ${metrics.performance.p95ResponseTime}ms (threshold: 3000ms)`,
    cooldownMs: 2 * 60 * 1000, // 2 minutes
    enabled: true
  },

  // Error Rate Alerts
  {
    id: 'api_error_rate_high',
    name: 'API Error Rate High',
    description: '5xx error rate exceeds 2% daily threshold',
    severity: 'warning',
    channels: ['email'],
    condition: (metrics) => metrics.performance?.errorRate > 2,
    message: (metrics) =>
      `API error rate is ${metrics.performance.errorRate.toFixed(2)}% (threshold: 2%)`,
    cooldownMs: 15 * 60 * 1000, // 15 minutes
    enabled: true
  },
  {
    id: 'api_error_rate_critical',
    name: 'API Error Rate Critical',
    description: '5xx error rate exceeds 5% threshold',
    severity: 'critical',
    channels: ['slack', 'pagerduty'],
    condition: (metrics) => metrics.performance?.errorRate > 5,
    message: (metrics) =>
      `🚨 CRITICAL: API error rate is ${metrics.performance.errorRate.toFixed(2)}% (threshold: 5%)`,
    cooldownMs: 5 * 60 * 1000, // 5 minutes
    enabled: true
  },

  // Event Bus Alerts
  {
    id: 'event_bus_failure_rate_high',
    name: 'Event Bus Failure Rate High',
    description: 'Event bus failure rate exceeds 5%',
    severity: 'warning',
    channels: ['slack'],
    condition: (metrics) => metrics.eventBus?.failureRate > 5,
    message: (metrics) =>
      `Event bus failure rate is ${metrics.eventBus.failureRate.toFixed(2)}% (threshold: 5%)`,
    cooldownMs: 10 * 60 * 1000, // 10 minutes
    enabled: true
  },
  {
    id: 'event_bus_latency_high',
    name: 'Event Bus Latency High',
    description: 'Event processing p95 latency exceeds 2s',
    severity: 'warning',
    channels: ['slack'],
    condition: (metrics) => metrics.eventBus?.p95Latency > 2000,
    message: (metrics) =>
      `Event bus p95 latency is ${metrics.eventBus.p95Latency}ms (threshold: 2000ms)`,
    cooldownMs: 10 * 60 * 1000, // 10 minutes
    enabled: true
  },

  // Outbox / DLQ Alerts
  {
    id: 'outbox_dlq_growing',
    name: 'Dead Letter Queue Growing',
    description: 'DLQ has more than 10 events',
    severity: 'warning',
    channels: ['slack', 'email'],
    condition: (metrics) => metrics.outbox?.dlq > 10,
    message: (metrics) =>
      `Dead letter queue has ${metrics.outbox.dlq} events (threshold: 10). Manual intervention may be required.`,
    cooldownMs: 30 * 60 * 1000, // 30 minutes
    enabled: true
  },
  {
    id: 'outbox_dlq_critical',
    name: 'Dead Letter Queue Critical',
    description: 'DLQ has more than 100 events',
    severity: 'critical',
    channels: ['slack', 'pagerduty'],
    condition: (metrics) => metrics.outbox?.dlq > 100,
    message: (metrics) =>
      `🚨 CRITICAL: Dead letter queue has ${metrics.outbox.dlq} events (threshold: 100). Immediate action required!`,
    cooldownMs: 15 * 60 * 1000, // 15 minutes
    enabled: true
  },
  {
    id: 'outbox_backlog_old',
    name: 'Outbox Backlog Aging',
    description: 'Oldest pending event is more than 5 minutes old',
    severity: 'warning',
    channels: ['slack'],
    condition: (metrics) => metrics.outbox?.backlogAge > 5 * 60 * 1000,
    message: (metrics) =>
      `Outbox has pending events older than ${Math.round(metrics.outbox.backlogAge / 1000 / 60)} minutes`,
    cooldownMs: 10 * 60 * 1000, // 10 minutes
    enabled: true
  },

  // Connector Health Alerts
  {
    id: 'connector_down',
    name: 'Connector Down',
    description: 'A connector is in down state',
    severity: 'critical',
    channels: ['slack', 'pagerduty'],
    condition: (metrics) =>
      metrics.connectors?.some((c: any) => c.status === 'down'),
    message: (metrics) => {
      const downConnectors = metrics.connectors
        .filter((c: any) => c.status === 'down')
        .map((c: any) => c.type)
        .join(', ')
      return `🚨 CRITICAL: Connectors down: ${downConnectors}`
    },
    cooldownMs: 5 * 60 * 1000, // 5 minutes
    enabled: true
  },
  {
    id: 'connector_degraded',
    name: 'Connector Degraded',
    description: 'A connector is in degraded state',
    severity: 'warning',
    channels: ['slack'],
    condition: (metrics) =>
      metrics.connectors?.some((c: any) => c.status === 'degraded'),
    message: (metrics) => {
      const degradedConnectors = metrics.connectors
        .filter((c: any) => c.status === 'degraded')
        .map((c: any) => `${c.type} (${c.successRate.toFixed(1)}% success)`)
        .join(', ')
      return `Connectors degraded: ${degradedConnectors}`
    },
    cooldownMs: 15 * 60 * 1000, // 15 minutes
    enabled: true
  },
  {
    id: 'connector_success_rate_low',
    name: 'Connector Success Rate Low',
    description: 'Connector success rate below 98%',
    severity: 'warning',
    channels: ['slack'],
    condition: (metrics) =>
      metrics.connectors?.some((c: any) => c.totalOperations > 10 && c.successRate < 98),
    message: (metrics) => {
      const lowSuccessConnectors = metrics.connectors
        .filter((c: any) => c.totalOperations > 10 && c.successRate < 98)
        .map((c: any) => `${c.type} (${c.successRate.toFixed(1)}%)`)
        .join(', ')
      return `Connector success rate low: ${lowSuccessConnectors} (threshold: 98%)`
    },
    cooldownMs: 30 * 60 * 1000, // 30 minutes
    enabled: true
  },

  // Resource Alerts
  {
    id: 'memory_usage_high',
    name: 'Memory Usage High',
    description: 'Heap memory usage exceeds 80%',
    severity: 'warning',
    channels: ['slack'],
    condition: (metrics) => {
      const { heapUsedMB, heapTotalMB } = metrics.resources?.memory || {}
      return heapUsedMB && heapTotalMB && (heapUsedMB / heapTotalMB) > 0.8
    },
    message: (metrics) => {
      const { heapUsedMB, heapTotalMB } = metrics.resources.memory
      const percent = ((heapUsedMB / heapTotalMB) * 100).toFixed(1)
      return `Memory usage is ${percent}% (${heapUsedMB}MB / ${heapTotalMB}MB)`
    },
    cooldownMs: 10 * 60 * 1000, // 10 minutes
    enabled: true
  },

  // Cron Job Alerts
  {
    id: 'cron_job_missing',
    name: 'Cron Job Missing',
    description: 'Cron job has not executed within expected interval',
    severity: 'critical',
    channels: ['slack', 'pagerduty'],
    condition: (metrics) =>
      metrics.cronJobs?.missing && metrics.cronJobs.missing.length > 0,
    message: (metrics) => {
      const missing = metrics.cronJobs.missing
      const jobNames = missing.map((j: any) => j.config.name).join(', ')
      return `🚨 CRITICAL: Cron jobs missing execution: ${jobNames}`
    },
    cooldownMs: 5 * 60 * 1000, // 5 minutes
    enabled: true
  },
  {
    id: 'cron_job_failed',
    name: 'Cron Job Consecutive Failures',
    description: 'Cron job has 3+ consecutive failures',
    severity: 'warning',
    channels: ['slack', 'email'],
    condition: (metrics) =>
      metrics.cronJobs?.failed && metrics.cronJobs.failed.length > 0,
    message: (metrics) => {
      const failed = metrics.cronJobs.failed
      const jobInfo = failed
        .map((j: any) => `${j.config.name} (${j.consecutiveFailures} failures)`)
        .join(', ')
      return `Cron jobs with consecutive failures: ${jobInfo}`
    },
    cooldownMs: 15 * 60 * 1000, // 15 minutes
    enabled: true
  },
  {
    id: 'cron_job_unreliable',
    name: 'Cron Job Reliability Low',
    description: 'Cron job reliability below 99%',
    severity: 'warning',
    channels: ['slack'],
    condition: (metrics) =>
      metrics.cronJobs?.unreliable && metrics.cronJobs.unreliable.length > 0,
    message: (metrics) => {
      const unreliable = metrics.cronJobs.unreliable
      const jobInfo = unreliable
        .map((j: any) => `${j.config.name} (${j.reliability.toFixed(1)}% reliability)`)
        .join(', ')
      return `Cron jobs with low reliability: ${jobInfo}`
    },
    cooldownMs: 30 * 60 * 1000, // 30 minutes
    enabled: true
  }
]

/**
 * Check alert policies against current metrics
 */
export function checkAlertPolicies(metrics: any, policies: AlertPolicy[] = DEFAULT_ALERT_POLICIES): Alert[] {
  const now = Date.now()
  const triggeredAlerts: Alert[] = []

  for (const policy of policies) {
    if (!policy.enabled) {
      continue
    }

    try {
      const triggered = policy.condition(metrics)

      if (triggered) {
        // Check cooldown
        const lastAlert = alertHistory.get(policy.id)
        if (lastAlert && policy.cooldownMs && (now - lastAlert) < policy.cooldownMs) {
          continue // Still in cooldown period
        }

        const alert: Alert = {
          policyId: policy.id,
          severity: policy.severity,
          message: policy.message(metrics),
          timestamp: now,
          metrics
        }

        triggeredAlerts.push(alert)
        alertHistory.set(policy.id, now)
        activeAlerts.set(policy.id, alert)
      } else {
        // Clear active alert if condition no longer met
        activeAlerts.delete(policy.id)
      }
    } catch (error) {
      console.error(`Error checking alert policy ${policy.id}:`, error)
    }
  }

  return triggeredAlerts
}

/**
 * Get active alerts
 */
export function getActiveAlerts(): Alert[] {
  return Array.from(activeAlerts.values())
}

/**
 * Clear alert cooldown (for testing)
 */
export function clearAlertCooldown(policyId?: string) {
  if (policyId) {
    alertHistory.delete(policyId)
  } else {
    alertHistory.clear()
  }
}

/**
 * Clear all alerts (for testing)
 */
export function clearAllAlerts() {
  alertHistory.clear()
  activeAlerts.clear()
}
