/**
 * @calibr/monitor - Alert Checker Service
 * Periodically check metrics and deliver alerts
 */
import { type AlertPolicy, type Alert } from './alerts';
import { type AlertDeliveryConfig, type AlertDeliveryResult } from './alert-delivery';
export interface AlertCheckResult {
    timestamp: number;
    triggeredAlerts: Alert[];
    deliveryResults: Map<string, AlertDeliveryResult[]>;
    errors: string[];
}
/**
 * Check all metrics and deliver any triggered alerts
 */
export declare function checkAndDeliverAlerts(config?: AlertDeliveryConfig, policies?: AlertPolicy[]): Promise<AlertCheckResult>;
/**
 * Start periodic alert checking
 * @param intervalMs - Check interval in milliseconds (default: 1 minute)
 * @param config - Alert delivery configuration
 * @param policies - Alert policies to check
 * @returns A function to stop the periodic checking
 */
export declare function startPeriodicAlertChecking(intervalMs?: number, // 1 minute default
config?: AlertDeliveryConfig, policies?: AlertPolicy[]): () => void;
/**
 * Test alert delivery by sending a test alert to all configured channels
 */
export declare function testAlertDelivery(config?: AlertDeliveryConfig): Promise<AlertDeliveryResult[]>;
//# sourceMappingURL=alert-checker.d.ts.map