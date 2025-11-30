import { describe, it, expect, vi, beforeEach } from 'vitest'
import { StripeService } from '../src/stripe/StripeService'

// Mock Stripe
const mockStripe = {
    oauth: {
        token: vi.fn(),
        deauthorize: vi.fn(),
    },
    accounts: {
        retrieve: vi.fn(),
    },
    products: {
        list: vi.fn(),
    },
    prices: {
        list: vi.fn(),
    },
    balanceTransactions: {
        list: vi.fn(),
    },
    webhooks: {
        constructEvent: vi.fn(),
    }
}

vi.mock('stripe', () => {
    return {
        default: vi.fn().mockImplementation(() => mockStripe)
    }
})

describe('StripeService', () => {
    let service: StripeService

    beforeEach(() => {
        process.env.STRIPE_CLIENT_SECRET = 'sk_test_123'
        process.env.STRIPE_CLIENT_ID = 'ca_123'
        process.env.NEXT_PUBLIC_API_BASE = 'http://localhost:3000'
        service = new StripeService()
        vi.clearAllMocks()
    })

    it('should generate OAuth URL', () => {
        const url = service.getOAuthUrl('test_state')
        expect(url).toContain('https://connect.stripe.com/oauth/authorize')
        expect(url).toContain('client_id=ca_123')
        expect(url).toContain('state=test_state')
    })

    it('should authorize code', async () => {
        mockStripe.oauth.token.mockResolvedValue({ stripe_user_id: 'acct_123' })
        await service.authorize('auth_code')
        expect(mockStripe.oauth.token).toHaveBeenCalledWith({
            grant_type: 'authorization_code',
            code: 'auth_code'
        })
    })

    it('should list products', async () => {
        await service.listProducts('acct_123')
        expect(mockStripe.products.list).toHaveBeenCalledWith(
            expect.objectContaining({ limit: 100 }),
            expect.objectContaining({ stripeAccount: 'acct_123' })
        )
    })
})
