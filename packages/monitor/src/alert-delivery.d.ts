/**
 * @calibr/monitor - Alert Delivery
 * Deliver alerts to various channels (Slack, Email, PagerDuty)
 */
import type { Alert, AlertChannel, AlertPolicy } from './alerts';
export interface AlertDeliveryConfig {
    slack?: {
        webhookUrl: string;
        channel?: string;
        username?: string;
    };
    email?: {
        provider: 'sendgrid' | 'aws-ses' | 'smtp';
        from: string;
        to: string[];
        apiKey?: string;
        smtpConfig?: {
            host: string;
            port: number;
            user: string;
            password: string;
        };
    };
    pagerduty?: {
        integrationKey: string;
        apiUrl?: string;
    };
    webhook?: {
        url: string;
        headers?: Record<string, string>;
    };
}
export interface AlertDeliveryResult {
    channel: AlertChannel;
    success: boolean;
    error?: string;
    deliveredAt: number;
}
/**
 * Deliver alert to Slack
 */
export declare function deliverToSlack(alert: Alert, policy: AlertPolicy, config: AlertDeliveryConfig['slack']): Promise<AlertDeliveryResult>;
/**
 * Deliver alert to Email
 */
export declare function deliverToEmail(alert: Alert, policy: AlertPolicy, config: AlertDeliveryConfig['email']): Promise<AlertDeliveryResult>;
/**
 * Deliver alert to PagerDuty
 */
export declare function deliverToPagerDuty(alert: Alert, policy: AlertPolicy, config: AlertDeliveryConfig['pagerduty']): Promise<AlertDeliveryResult>;
/**
 * Deliver alert to webhook
 */
export declare function deliverToWebhook(alert: Alert, policy: AlertPolicy, config: AlertDeliveryConfig['webhook']): Promise<AlertDeliveryResult>;
/**
 * Deliver alert to all configured channels
 */
export declare function deliverAlert(alert: Alert, policy: AlertPolicy, config: AlertDeliveryConfig): Promise<AlertDeliveryResult[]>;
/**
 * Load alert delivery configuration from environment variables
 */
export declare function loadAlertDeliveryConfig(): AlertDeliveryConfig;
//# sourceMappingURL=alert-delivery.d.ts.map