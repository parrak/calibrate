import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, waitFor, fireEvent } from '@testing-library/react'
import { CompetitorAnalytics } from './CompetitorAnalytics'

// Mock next-auth
vi.mock('next-auth/react', () => ({
    useSession: vi.fn(),
    signOut: vi.fn(),
}))

// Mock API client
vi.mock('@/lib/api-client', () => ({
    competitorsApi: {
        getAnalytics: vi.fn(),
    },
    ApiError: class ApiError extends Error {
        constructor(message: string, public status: number) {
            super(message)
            this.name = 'ApiError'
        }
    },
}))

const mockSession = {
    user: { email: 'test@example.com', name: 'Test User', role: 'ADMIN' },
    expires: '2099-12-31',
    apiToken: 'mock-token',
}

const mockAnalyticsData = {
    insights: {
        minPrice: 2500,
        maxPrice: 3500,
        avgPrice: 3000,
        ourPosition: 'middle',
        priceSpread: 1000,
        competitorCount: 3,
    },
    comparisons: [
        {
            skuId: 'sku-1',
            skuName: 'Test Product 1',
            ourPrice: 3000,
            competitorPrices: [
                {
                    competitorId: 'comp-1',
                    competitorName: 'Competitor A',
                    price: 2500,
                    currency: 'USD',
                    isOnSale: false,
                },
                {
                    competitorId: 'comp-2',
                    competitorName: 'Competitor B',
                    price: 3500,
                    currency: 'USD',
                    isOnSale: true,
                },
            ],
        },
    ],
}

describe('CompetitorAnalytics', () => {
    beforeEach(async () => {
        vi.clearAllMocks()
        const { useSession } = await import('next-auth/react')
            ; (useSession as ReturnType<typeof vi.fn>).mockReturnValue({ data: mockSession })
    })

    it('should render loading state initially', async () => {
        const { competitorsApi } = await import('@/lib/api-client')
        const mockFn = competitorsApi.getAnalytics as ReturnType<typeof vi.fn>
        mockFn.mockClear()
        mockFn.mockImplementation(() => new Promise(() => { }))

        render(<CompetitorAnalytics tenantId="tenant-1" projectId="proj-1" />)
        expect(screen.getByText('Loading analytics...')).toBeInTheDocument()
    })

    it('should render analytics data after loading', async () => {
        const { competitorsApi } = await import('@/lib/api-client')
        const mockFn = competitorsApi.getAnalytics as ReturnType<typeof vi.fn>
        mockFn.mockClear()
        mockFn.mockResolvedValue(mockAnalyticsData)

        render(<CompetitorAnalytics tenantId="tenant-1" projectId="proj-1" />)

        await waitFor(() => {
            expect(screen.getByText('Competitive Analytics')).toBeInTheDocument()
        })

        // Check insights
        expect(screen.getByText('Market Position')).toBeInTheDocument()
        expect(screen.getByText('middle')).toBeInTheDocument()
        expect(screen.getAllByText('$30.00')[0]).toBeInTheDocument() // Avg Price and Our Price are same in mock
        expect(screen.getAllByText('$25.00')[0]).toBeInTheDocument() // Min Price
        expect(screen.getAllByText('$35.00')[0]).toBeInTheDocument() // Max Price

        // Check comparisons
        expect(screen.getByText('Test Product 1')).toBeInTheDocument()
        expect(screen.getByText('Competitor A')).toBeInTheDocument()
        expect(screen.getByText('Competitor B')).toBeInTheDocument()
        expect(screen.getByText('Sale')).toBeInTheDocument()
    })

    it('should render empty state when no comparisons exist', async () => {
        const { competitorsApi } = await import('@/lib/api-client')
        const mockFn = competitorsApi.getAnalytics as ReturnType<typeof vi.fn>
        mockFn.mockClear()
        mockFn.mockResolvedValue({ insights: null, comparisons: [] })

        render(<CompetitorAnalytics tenantId="tenant-1" projectId="proj-1" />)

        await waitFor(() => {
            expect(screen.getByText('No Analytics Data Available')).toBeInTheDocument()
        })
    })

    it('should handle authentication error', async () => {
        const { competitorsApi, ApiError } = await import('@/lib/api-client')
        const { signOut } = await import('next-auth/react')
        const mockFn = competitorsApi.getAnalytics as ReturnType<typeof vi.fn>
        mockFn.mockClear()
        mockFn.mockRejectedValue(new ApiError('Authentication required', 401))

        render(<CompetitorAnalytics tenantId="tenant-1" projectId="proj-1" />)

        await waitFor(() => {
            expect(screen.getByText(/Authentication failed/i)).toBeInTheDocument()
        })

        expect(screen.getByRole('button', { name: /Sign Out/i })).toBeInTheDocument()

        fireEvent.click(screen.getByRole('button', { name: /Sign Out/i }))
        expect(signOut).toHaveBeenCalledWith({ callbackUrl: '/login' })
    })

    it('should handle generic error', async () => {
        const { competitorsApi, ApiError } = await import('@/lib/api-client')
        const mockFn = competitorsApi.getAnalytics as ReturnType<typeof vi.fn>
        mockFn.mockClear()
        mockFn.mockRejectedValue(new ApiError('Server error', 500))

        render(<CompetitorAnalytics tenantId="tenant-1" projectId="proj-1" />)

        await waitFor(() => {
            expect(screen.getByText('Failed to load analytics data')).toBeInTheDocument()
        })

        expect(screen.getByRole('button', { name: /Retry/i })).toBeInTheDocument()
    })

    it('should correctly display lowest price badge', async () => {
        const { competitorsApi } = await import('@/lib/api-client')
        const mockFn = competitorsApi.getAnalytics as ReturnType<typeof vi.fn>

        const lowestPriceData = {
            ...mockAnalyticsData,
            comparisons: [{
                ...mockAnalyticsData.comparisons[0],
                ourPrice: 2000, // Lower than 2500
            }]
        }

        mockFn.mockResolvedValue(lowestPriceData)

        render(<CompetitorAnalytics tenantId="tenant-1" projectId="proj-1" />)

        await waitFor(() => {
            expect(screen.getByText('Lowest')).toBeInTheDocument()
        })
    })

    it('should correctly display higher price badge', async () => {
        const { competitorsApi } = await import('@/lib/api-client')
        const mockFn = competitorsApi.getAnalytics as ReturnType<typeof vi.fn>

        const higherPriceData = {
            ...mockAnalyticsData,
            comparisons: [{
                ...mockAnalyticsData.comparisons[0],
                ourPrice: 3000, // Higher than 2500
            }]
        }

        mockFn.mockResolvedValue(higherPriceData)

        render(<CompetitorAnalytics tenantId="tenant-1" projectId="proj-1" />)

        await waitFor(() => {
            expect(screen.getByText('$5.00 higher')).toBeInTheDocument()
        })
    })
})
