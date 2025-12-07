/**
 * @calibr/monitor - Synthetic Probes
 * Configuration for synthetic monitoring probes
 */

export interface ProbeConfig {
    id: string
    name: string
    url: string
    intervalSeconds: number
    timeoutSeconds: number
    expectedStatus: number
    method: 'GET' | 'POST'
    headers?: Record<string, string>
    body?: any
    enabled: boolean
}

export const PROBE_CONFIGS: ProbeConfig[] = [
    {
        id: 'api_health_basic',
        name: 'API Health (Basic)',
        url: '/api/health',
        intervalSeconds: 60, // 1 minute
        timeoutSeconds: 5,
        expectedStatus: 200,
        method: 'GET',
        enabled: true
    },
    {
        id: 'api_health_detailed',
        name: 'API Health (Detailed)',
        url: '/api/health/detailed',
        intervalSeconds: 300, // 5 minutes
        timeoutSeconds: 10,
        expectedStatus: 200,
        method: 'GET',
        enabled: true
    },
    {
        id: 'api_price_changes',
        name: 'API Price Changes List',
        url: '/api/v1/price-changes',
        intervalSeconds: 300, // 5 minutes
        timeoutSeconds: 10,
        expectedStatus: 200, // Assuming 401 if unauthenticated, but probe service should handle auth
        method: 'GET',
        enabled: true
    },
    {
        id: 'api_analytics_overview',
        name: 'API Analytics Overview',
        url: '/api/v1/analytics/overview',
        intervalSeconds: 600, // 10 minutes
        timeoutSeconds: 15,
        expectedStatus: 200,
        method: 'GET',
        enabled: true
    }
]

/**
 * Get active probes
 */
export function getActiveProbes(): ProbeConfig[] {
    return PROBE_CONFIGS.filter(p => p.enabled)
}
