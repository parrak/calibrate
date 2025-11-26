/**
 * @calibr/monitor - Alert Delivery
 * Deliver alerts to various channels (Slack, Email, PagerDuty)
 */

import type { Alert, AlertChannel, AlertPolicy } from './alerts'

export interface AlertDeliveryConfig {
  slack?: {
    webhookUrl: string
    channel?: string
    username?: string
  }
  email?: {
    provider: 'sendgrid' | 'aws-ses' | 'smtp'
    from: string
    to: string[]
    apiKey?: string // For SendGrid
    smtpConfig?: {
      host: string
      port: number
      user: string
      password: string
    }
  }
  pagerduty?: {
    integrationKey: string
    apiUrl?: string
  }
  webhook?: {
    url: string
    headers?: Record<string, string>
  }
}

export interface AlertDeliveryResult {
  channel: AlertChannel
  success: boolean
  error?: string
  deliveredAt: number
}

/**
 * Deliver alert to Slack
 */
export async function deliverToSlack(
  alert: Alert,
  policy: AlertPolicy,
  config: AlertDeliveryConfig['slack']
): Promise<AlertDeliveryResult> {
  if (!config?.webhookUrl) {
    return {
      channel: 'slack',
      success: false,
      error: 'Slack webhook URL not configured',
      deliveredAt: Date.now()
    }
  }

  try {
    const severityEmoji = {
      critical: '🚨',
      warning: '⚠️',
      info: 'ℹ️'
    }

    const severityColor = {
      critical: '#FF0000',
      warning: '#FFA500',
      info: '#0000FF'
    }

    const payload = {
      username: config.username || 'Calibr Monitoring',
      channel: config.channel,
      attachments: [
        {
          color: severityColor[alert.severity],
          title: `${severityEmoji[alert.severity]} ${policy.name}`,
          text: alert.message,
          fields: [
            {
              title: 'Severity',
              value: alert.severity.toUpperCase(),
              short: true
            },
            {
              title: 'Policy ID',
              value: policy.id,
              short: true
            },
            {
              title: 'Timestamp',
              value: new Date(alert.timestamp).toISOString(),
              short: false
            }
          ],
          footer: 'Calibr Platform Monitoring',
          ts: Math.floor(alert.timestamp / 1000)
        }
      ]
    }

    const response = await fetch(config.webhookUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(payload)
    })

    if (!response.ok) {
      throw new Error(`Slack API returned ${response.status}: ${await response.text()}`)
    }

    return {
      channel: 'slack',
      success: true,
      deliveredAt: Date.now()
    }
  } catch (error) {
    return {
      channel: 'slack',
      success: false,
      error: error instanceof Error ? error.message : String(error),
      deliveredAt: Date.now()
    }
  }
}

/**
 * Deliver alert to Email
 */
export async function deliverToEmail(
  alert: Alert,
  policy: AlertPolicy,
  config: AlertDeliveryConfig['email']
): Promise<AlertDeliveryResult> {
  if (!config) {
    return {
      channel: 'email',
      success: false,
      error: 'Email configuration not provided',
      deliveredAt: Date.now()
    }
  }

  try {
    // For now, we'll support SendGrid as the primary provider
    if (config.provider === 'sendgrid') {
      if (!config.apiKey) {
        throw new Error('SendGrid API key not configured')
      }

      const html = generateEmailHtml(alert, policy)
      const subject = `[${alert.severity.toUpperCase()}] ${policy.name}`

      const response = await fetch('https://api.sendgrid.com/v3/mail/send', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${config.apiKey}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          personalizations: [
            {
              to: config.to.map(email => ({ email })),
              subject
            }
          ],
          from: {
            email: config.from,
            name: 'Calibr Monitoring'
          },
          content: [
            {
              type: 'text/html',
              value: html
            }
          ]
        })
      })

      if (!response.ok) {
        throw new Error(`SendGrid API returned ${response.status}: ${await response.text()}`)
      }

      return {
        channel: 'email',
        success: true,
        deliveredAt: Date.now()
      }
    }

    // Fallback for other providers - log a warning
    console.warn(`Email provider ${config.provider} not yet implemented`)
    return {
      channel: 'email',
      success: false,
      error: `Email provider ${config.provider} not implemented`,
      deliveredAt: Date.now()
    }
  } catch (error) {
    return {
      channel: 'email',
      success: false,
      error: error instanceof Error ? error.message : String(error),
      deliveredAt: Date.now()
    }
  }
}

/**
 * Deliver alert to PagerDuty
 */
export async function deliverToPagerDuty(
  alert: Alert,
  policy: AlertPolicy,
  config: AlertDeliveryConfig['pagerduty']
): Promise<AlertDeliveryResult> {
  if (!config?.integrationKey) {
    return {
      channel: 'pagerduty',
      success: false,
      error: 'PagerDuty integration key not configured',
      deliveredAt: Date.now()
    }
  }

  try {
    const severityMap = {
      critical: 'critical',
      warning: 'warning',
      info: 'info'
    }

    const apiUrl = config.apiUrl || 'https://events.pagerduty.com/v2/enqueue'

    const payload = {
      routing_key: config.integrationKey,
      event_action: 'trigger',
      dedup_key: `calibr-${policy.id}-${alert.timestamp}`,
      payload: {
        summary: `${policy.name}: ${alert.message}`,
        severity: severityMap[alert.severity],
        source: 'calibr-platform',
        timestamp: new Date(alert.timestamp).toISOString(),
        custom_details: {
          policy_id: policy.id,
          policy_name: policy.name,
          description: policy.description,
          metrics: alert.metrics
        }
      }
    }

    const response = await fetch(apiUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/vnd.pagerduty+json;version=2'
      },
      body: JSON.stringify(payload)
    })

    if (!response.ok) {
      throw new Error(`PagerDuty API returned ${response.status}: ${await response.text()}`)
    }

    return {
      channel: 'pagerduty',
      success: true,
      deliveredAt: Date.now()
    }
  } catch (error) {
    return {
      channel: 'pagerduty',
      success: false,
      error: error instanceof Error ? error.message : String(error),
      deliveredAt: Date.now()
    }
  }
}

/**
 * Deliver alert to webhook
 */
export async function deliverToWebhook(
  alert: Alert,
  policy: AlertPolicy,
  config: AlertDeliveryConfig['webhook']
): Promise<AlertDeliveryResult> {
  if (!config?.url) {
    return {
      channel: 'webhook',
      success: false,
      error: 'Webhook URL not configured',
      deliveredAt: Date.now()
    }
  }

  try {
    const payload = {
      alert,
      policy: {
        id: policy.id,
        name: policy.name,
        description: policy.description,
        severity: policy.severity
      },
      timestamp: alert.timestamp
    }

    const response = await fetch(config.url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...config.headers
      },
      body: JSON.stringify(payload)
    })

    if (!response.ok) {
      throw new Error(`Webhook returned ${response.status}: ${await response.text()}`)
    }

    return {
      channel: 'webhook',
      success: true,
      deliveredAt: Date.now()
    }
  } catch (error) {
    return {
      channel: 'webhook',
      success: false,
      error: error instanceof Error ? error.message : String(error),
      deliveredAt: Date.now()
    }
  }
}

/**
 * Deliver alert to all configured channels
 */
export async function deliverAlert(
  alert: Alert,
  policy: AlertPolicy,
  config: AlertDeliveryConfig
): Promise<AlertDeliveryResult[]> {
  const results: AlertDeliveryResult[] = []

  for (const channel of policy.channels) {
    let result: AlertDeliveryResult

    switch (channel) {
      case 'slack':
        result = await deliverToSlack(alert, policy, config.slack)
        break
      case 'email':
        result = await deliverToEmail(alert, policy, config.email)
        break
      case 'pagerduty':
        result = await deliverToPagerDuty(alert, policy, config.pagerduty)
        break
      case 'webhook':
        result = await deliverToWebhook(alert, policy, config.webhook)
        break
      default:
        result = {
          channel,
          success: false,
          error: `Unknown channel: ${channel}`,
          deliveredAt: Date.now()
        }
    }

    results.push(result)

    // Log delivery result
    if (result.success) {
      console.log(`✓ Alert delivered to ${channel}:`, policy.name)
    } else {
      console.error(`✗ Failed to deliver alert to ${channel}:`, result.error)
    }
  }

  return results
}

/**
 * Generate HTML email for alert
 */
function generateEmailHtml(alert: Alert, policy: AlertPolicy): string {
  const severityColor = {
    critical: '#D32F2F',
    warning: '#F57C00',
    info: '#1976D2'
  }

  return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${policy.name}</title>
</head>
<body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
  <div style="background-color: ${severityColor[alert.severity]}; color: white; padding: 20px; border-radius: 8px 8px 0 0;">
    <h1 style="margin: 0; font-size: 24px;">${policy.name}</h1>
    <p style="margin: 10px 0 0 0; opacity: 0.9;">${alert.severity.toUpperCase()} Alert</p>
  </div>

  <div style="background-color: #f5f5f5; padding: 20px; border-radius: 0 0 8px 8px;">
    <h2 style="margin-top: 0; font-size: 18px; color: #333;">Alert Details</h2>

    <div style="background-color: white; padding: 15px; border-radius: 4px; margin-bottom: 15px;">
      <p style="margin: 0 0 10px 0;"><strong>Message:</strong></p>
      <p style="margin: 0; color: #666;">${alert.message}</p>
    </div>

    <div style="background-color: white; padding: 15px; border-radius: 4px;">
      <table style="width: 100%; border-collapse: collapse;">
        <tr>
          <td style="padding: 8px 0; border-bottom: 1px solid #eee;"><strong>Policy ID:</strong></td>
          <td style="padding: 8px 0; border-bottom: 1px solid #eee; color: #666;">${policy.id}</td>
        </tr>
        <tr>
          <td style="padding: 8px 0; border-bottom: 1px solid #eee;"><strong>Severity:</strong></td>
          <td style="padding: 8px 0; border-bottom: 1px solid #eee; color: ${severityColor[alert.severity]}; font-weight: bold;">${alert.severity.toUpperCase()}</td>
        </tr>
        <tr>
          <td style="padding: 8px 0; border-bottom: 1px solid #eee;"><strong>Triggered At:</strong></td>
          <td style="padding: 8px 0; border-bottom: 1px solid #eee; color: #666;">${new Date(alert.timestamp).toLocaleString()}</td>
        </tr>
        <tr>
          <td style="padding: 8px 0;"><strong>Description:</strong></td>
          <td style="padding: 8px 0; color: #666;">${policy.description}</td>
        </tr>
      </table>
    </div>

    <p style="margin-top: 20px; font-size: 12px; color: #999; text-align: center;">
      This is an automated alert from Calibr Platform Monitoring.<br>
      Timestamp: ${new Date(alert.timestamp).toISOString()}
    </p>
  </div>
</body>
</html>
  `.trim()
}

/**
 * Load alert delivery configuration from environment variables
 */
export function loadAlertDeliveryConfig(): AlertDeliveryConfig {
  return {
    slack: process.env.SLACK_WEBHOOK_URL
      ? {
          webhookUrl: process.env.SLACK_WEBHOOK_URL,
          channel: process.env.SLACK_CHANNEL,
          username: process.env.SLACK_USERNAME
        }
      : undefined,
    email: process.env.EMAIL_PROVIDER
      ? {
          provider: process.env.EMAIL_PROVIDER as 'sendgrid' | 'aws-ses' | 'smtp',
          from: process.env.EMAIL_FROM || 'alerts@calibr.lat',
          to: process.env.EMAIL_TO?.split(',') || [],
          apiKey: process.env.SENDGRID_API_KEY,
          smtpConfig: process.env.SMTP_HOST
            ? {
                host: process.env.SMTP_HOST,
                port: parseInt(process.env.SMTP_PORT || '587', 10),
                user: process.env.SMTP_USER || '',
                password: process.env.SMTP_PASSWORD || ''
              }
            : undefined
        }
      : undefined,
    pagerduty: process.env.PAGERDUTY_INTEGRATION_KEY
      ? {
          integrationKey: process.env.PAGERDUTY_INTEGRATION_KEY,
          apiUrl: process.env.PAGERDUTY_API_URL
        }
      : undefined,
    webhook: process.env.ALERT_WEBHOOK_URL
      ? {
          url: process.env.ALERT_WEBHOOK_URL,
          headers: process.env.ALERT_WEBHOOK_HEADERS
            ? JSON.parse(process.env.ALERT_WEBHOOK_HEADERS)
            : undefined
        }
      : undefined
  }
}
