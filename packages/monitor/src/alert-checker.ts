/**
 * @calibr/monitor - Alert Checker Service
 * Periodically check metrics and deliver alerts
 */

import {
  checkAlertPolicies,
  getActiveAlerts,
  DEFAULT_ALERT_POLICIES,
  type AlertPolicy,
  type Alert
} from './alerts'
import {
  deliverAlert,
  loadAlertDeliveryConfig,
  type AlertDeliveryConfig,
  type AlertDeliveryResult
} from './alert-delivery'
import { getPerformanceStats, getResourceStats } from './performance'
import { getEventBusStats } from './event-metrics'
import { getAllConnectorHealthStats } from './connector-health'
import { checkCronJobHealth } from './cron-heartbeat'
import { logger } from './logger'

export interface AlertCheckResult {
  timestamp: number
  triggeredAlerts: Alert[]
  deliveryResults: Map<string, AlertDeliveryResult[]>
  errors: string[]
}

/**
 * Check all metrics and deliver any triggered alerts
 */
export async function checkAndDeliverAlerts(
  config?: AlertDeliveryConfig,
  policies: AlertPolicy[] = DEFAULT_ALERT_POLICIES
): Promise<AlertCheckResult> {
  const timestamp = Date.now()
  const errors: string[] = []
  const deliveryResults = new Map<string, AlertDeliveryResult[]>()

  try {
    // Load config if not provided
    const deliveryConfig = config || loadAlertDeliveryConfig()

    // Gather all metrics
    const metrics = await gatherMetrics()

    // Check alert policies
    const triggeredAlerts = checkAlertPolicies(metrics, policies)

    logger.info('Alert check completed', {
      metadata: {
        triggeredAlertsCount: triggeredAlerts.length,
        activeAlertsCount: getActiveAlerts().length
      }
    })

    // Deliver triggered alerts
    for (const alert of triggeredAlerts) {
      const policy = policies.find(p => p.id === alert.policyId)
      if (!policy) {
        errors.push(`Policy not found for alert: ${alert.policyId}`)
        continue
      }

      try {
        const results = await deliverAlert(alert, policy, deliveryConfig)
        deliveryResults.set(alert.policyId, results)

        // Log any failed deliveries
        const failedDeliveries = results.filter(r => !r.success)
        if (failedDeliveries.length > 0) {
          logger.error('Alert delivery failures', undefined, {
            metadata: {
              policyId: alert.policyId,
              failures: failedDeliveries.map(f => ({
                channel: f.channel,
                error: f.error
              }))
            }
          })
        }
      } catch (error) {
        const errorMsg = `Failed to deliver alert ${alert.policyId}: ${error instanceof Error ? error.message : String(error)}`
        errors.push(errorMsg)
        logger.error(errorMsg, error instanceof Error ? error : undefined)
      }
    }

    return {
      timestamp,
      triggeredAlerts,
      deliveryResults,
      errors
    }
  } catch (error) {
    const errorMsg = `Alert check failed: ${error instanceof Error ? error.message : String(error)}`
    errors.push(errorMsg)
    logger.error(errorMsg, error instanceof Error ? error : undefined)

    return {
      timestamp,
      triggeredAlerts: [],
      deliveryResults,
      errors
    }
  }
}

/**
 * Gather all metrics for alert checking
 */
async function gatherMetrics(): Promise<any> {
  try {
    // Get performance metrics
    const performance = getPerformanceStats()

    // Get event bus metrics
    const eventBus = getEventBusStats()

    // Get connector health stats
    const connectorStats = getAllConnectorHealthStats()
    const connectors = Object.entries(connectorStats).map(([type, stats]) => ({
      type,
      ...stats
    }))

    // Get resource metrics
    const resources = getResourceStats()

    // Get outbox metrics (would need to be implemented or fetched from DB)
    // For now, return a placeholder
    const outbox = {
      pending: 0,
      failed: 0,
      dlq: 0,
      backlogAge: 0
    }

    // Get cron job health
    const cronJobs = checkCronJobHealth()

    return {
      performance,
      eventBus,
      connectors,
      resources,
      outbox,
      cronJobs
    }
  } catch (error) {
    logger.error('Failed to gather metrics for alert checking', error instanceof Error ? error : undefined)
    throw error
  }
}

/**
 * Start periodic alert checking
 * @param intervalMs - Check interval in milliseconds (default: 1 minute)
 * @param config - Alert delivery configuration
 * @param policies - Alert policies to check
 * @returns A function to stop the periodic checking
 */
export function startPeriodicAlertChecking(
  intervalMs: number = 60 * 1000, // 1 minute default
  config?: AlertDeliveryConfig,
  policies?: AlertPolicy[]
): () => void {
  logger.info('Starting periodic alert checking', {
    metadata: { intervalMs }
  })

  const interval = setInterval(async () => {
    try {
      await checkAndDeliverAlerts(config, policies)
    } catch (error) {
      logger.error('Periodic alert check failed', error instanceof Error ? error : undefined)
    }
  }, intervalMs)

  // Return stop function
  return () => {
    logger.info('Stopping periodic alert checking')
    clearInterval(interval)
  }
}

/**
 * Test alert delivery by sending a test alert to all configured channels
 */
export async function testAlertDelivery(
  config?: AlertDeliveryConfig
): Promise<AlertDeliveryResult[]> {
  const deliveryConfig = config || loadAlertDeliveryConfig()

  const testAlert: Alert = {
    policyId: 'test_alert',
    severity: 'info',
    message: 'This is a test alert from Calibr Platform Monitoring. If you received this, alert delivery is working correctly.',
    timestamp: Date.now(),
    metrics: {}
  }

  const testPolicy: AlertPolicy = {
    id: 'test_alert',
    name: 'Test Alert',
    description: 'Test alert for verifying delivery configuration',
    severity: 'info',
    channels: ['slack', 'email', 'pagerduty', 'webhook'].filter(channel => {
      // Only include configured channels
      if (channel === 'slack') return !!deliveryConfig.slack
      if (channel === 'email') return !!deliveryConfig.email
      if (channel === 'pagerduty') return !!deliveryConfig.pagerduty
      if (channel === 'webhook') return !!deliveryConfig.webhook
      return false
    }) as any[],
    condition: () => true,
    message: () => testAlert.message,
    enabled: true
  }

  logger.info('Sending test alert', {
    metadata: { channels: testPolicy.channels }
  })

  const results = await deliverAlert(testAlert, testPolicy, deliveryConfig)

  logger.info('Test alert delivery completed', {
    metadata: {
      results: results.map(r => ({
        channel: r.channel,
        success: r.success,
        error: r.error
      }))
    }
  })

  return results
}
