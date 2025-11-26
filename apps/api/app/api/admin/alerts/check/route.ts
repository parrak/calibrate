/**
 * Alert Checking and Delivery API
 * Endpoint for triggering alert checks and managing alert delivery
 */

import { NextRequest, NextResponse } from 'next/server'
import {
  checkAndDeliverAlerts,
  testAlertDelivery,
  loadAlertDeliveryConfig,
  getActiveAlerts
} from '@calibr/monitor'

/**
 * POST /api/admin/alerts/check
 * Trigger an alert check and deliver any triggered alerts
 */
export async function POST(req: NextRequest) {
  try {
    const body = await req.json().catch(() => ({}))
    const { action } = body

    // Handle test delivery
    if (action === 'test') {
      const config = loadAlertDeliveryConfig()
      const results = await testAlertDelivery(config)

      return NextResponse.json({
        success: true,
        message: 'Test alert sent',
        deliveryResults: results.map(r => ({
          channel: r.channel,
          success: r.success,
          error: r.error,
          deliveredAt: new Date(r.deliveredAt).toISOString()
        }))
      })
    }

    // Handle manual alert check
    const config = loadAlertDeliveryConfig()
    const result = await checkAndDeliverAlerts(config)

    return NextResponse.json({
      success: true,
      timestamp: new Date(result.timestamp).toISOString(),
      triggeredAlerts: result.triggeredAlerts.length,
      activeAlerts: getActiveAlerts().length,
      alerts: result.triggeredAlerts.map(alert => ({
        policyId: alert.policyId,
        severity: alert.severity,
        message: alert.message,
        timestamp: new Date(alert.timestamp).toISOString()
      })),
      deliveryResults: Array.from(result.deliveryResults.entries()).map(([policyId, results]) => ({
        policyId,
        deliveries: results.map(r => ({
          channel: r.channel,
          success: r.success,
          error: r.error,
          deliveredAt: new Date(r.deliveredAt).toISOString()
        }))
      })),
      errors: result.errors
    })
  } catch (error) {
    console.error('Alert check failed:', error)
    return NextResponse.json({
      success: false,
      error: 'Alert check failed',
      message: error instanceof Error ? error.message : String(error)
    }, { status: 500 })
  }
}

/**
 * GET /api/admin/alerts/check
 * Get the status of alert delivery configuration
 */
export async function GET() {
  try {
    const config = loadAlertDeliveryConfig()

    return NextResponse.json({
      success: true,
      configuration: {
        slack: !!config.slack,
        email: !!config.email,
        pagerduty: !!config.pagerduty,
        webhook: !!config.webhook
      },
      activeAlerts: getActiveAlerts().length
    })
  } catch (error) {
    console.error('Failed to get alert configuration:', error)
    return NextResponse.json({
      success: false,
      error: 'Failed to get alert configuration',
      message: error instanceof Error ? error.message : String(error)
    }, { status: 500 })
  }
}
