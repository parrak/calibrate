/**
 * @calibr/monitor - Alert Policies
 * Define and check alert policies for SLA monitoring
 */
export type AlertSeverity = 'critical' | 'warning' | 'info';
export type AlertChannel = 'slack' | 'email' | 'pagerduty' | 'webhook';
export interface AlertPolicy {
    id: string;
    name: string;
    description: string;
    severity: AlertSeverity;
    channels: AlertChannel[];
    condition: (metrics: any) => boolean;
    message: (metrics: any) => string;
    cooldownMs?: number;
    enabled: boolean;
}
export interface Alert {
    policyId: string;
    severity: AlertSeverity;
    message: string;
    timestamp: number;
    metrics: any;
}
/**
 * Default alert policies for Calibr platform
 */
export declare const DEFAULT_ALERT_POLICIES: AlertPolicy[];
/**
 * Check alert policies against current metrics
 */
export declare function checkAlertPolicies(metrics: any, policies?: AlertPolicy[]): Alert[];
/**
 * Get active alerts
 */
export declare function getActiveAlerts(): Alert[];
/**
 * Clear alert cooldown (for testing)
 */
export declare function clearAlertCooldown(policyId?: string): void;
/**
 * Clear all alerts (for testing)
 */
export declare function clearAllAlerts(): void;
//# sourceMappingURL=alerts.d.ts.map