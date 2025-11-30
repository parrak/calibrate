import {
    PlatformConnector,
    PlatformConfig,
    PlatformCredentials,
    PlatformHealth,
    AuthOperations,
    ProductOperations,
    PricingOperations,
    PlatformCapabilities
} from '@calibr/platform-connector'
import { StripeService } from './StripeService'

export class StripeConnector implements PlatformConnector {
    readonly platform = 'stripe'
    readonly name = 'Stripe'
    readonly version = '1.0.0'

    readonly capabilities: PlatformCapabilities = {
        supportsOAuth: false, // Using API Key now
        supportsWebhooks: true,
        supportsBatchUpdates: false,
        supportsInventoryTracking: false,
        supportsVariants: true, // Products have prices which act like variants
        supportsCompareAtPrice: false
    }

    readonly auth: AuthOperations
    readonly products: ProductOperations
    readonly pricing: PricingOperations

    private stripeService: StripeService

    constructor(public readonly config: PlatformConfig, credentials?: PlatformCredentials) {
        this.stripeService = new StripeService()

        // Stub implementations for now
        this.auth = {
            getAuthUrl: async () => '',
            exchangeCode: async () => ({ accessToken: '', refreshToken: '', expiresAt: new Date() }),
            refreshTokens: async () => ({ accessToken: '', refreshToken: '', expiresAt: new Date() }),
            revoke: async () => { }
        } as any

        this.products = {
            list: async () => ({ data: [], pagination: { hasNext: false, hasPrev: false } }),
            get: async () => null,
            create: async () => { throw new Error('Not implemented') },
            update: async () => { throw new Error('Not implemented') },
            delete: async () => { throw new Error('Not implemented') }
        } as any

        this.pricing = {
            list: async () => ({ data: [], pagination: { hasNext: false, hasPrev: false } }),
            update: async () => { throw new Error('Not implemented') }
        } as any
    }

    async isAuthenticated(): Promise<boolean> {
        return true // Managed via StripeAccount model
    }

    async initialize(credentials: PlatformCredentials): Promise<void> {
        // No-op
    }

    async disconnect(): Promise<void> {
        // No-op
    }

    async healthCheck(): Promise<PlatformHealth> {
        return {
            isHealthy: true,
            status: 'connected',
            lastChecked: new Date()
        }
    }

    async testConnection(): Promise<boolean> {
        return true
    }
}
