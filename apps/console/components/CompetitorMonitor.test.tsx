import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, waitFor, fireEvent } from '@testing-library/react'
import { CompetitorMonitor } from './CompetitorMonitor'

// Mock next-auth
vi.mock('next-auth/react', () => ({
  useSession: vi.fn(),
  signOut: vi.fn(),
}))

// Mock API client
vi.mock('@/lib/api-client', () => ({
  competitorsApi: {
    list: vi.fn(),
    monitor: vi.fn(),
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

const mockCompetitors = [
  {
    id: 'comp-1',
    name: 'Competitor A',
    domain: 'competitor-a.com',
    channel: 'shopify',
    isActive: true,
    lastChecked: '2025-01-02T10:00:00Z',
    products: [
      {
        id: 'prod-1',
        name: 'Product 1',
        skuCode: 'SKU-001',
        url: 'https://competitor-a.com/product-1',
        prices: [
          {
            amount: 2999,
            currency: 'USD',
            isOnSale: false,
            createdAt: '2025-01-02T10:00:00Z',
          },
        ],
      },
    ],
  },
]

describe('CompetitorMonitor', () => {
  beforeEach(async () => {
    vi.clearAllMocks()
    const { useSession } = await import('next-auth/react')
    ;(useSession as ReturnType<typeof vi.fn>).mockReturnValue({ data: mockSession })
  })

  it('should render loading state initially', async () => {
    const { competitorsApi } = await import('@/lib/api-client')
    const mockFn = competitorsApi.list as ReturnType<typeof vi.fn>
    mockFn.mockClear()
    mockFn.mockImplementation(() => new Promise(() => {}))

    render(<CompetitorMonitor projectSlug="demo" />)
    expect(screen.getByText('Loading competitors...')).toBeInTheDocument()
  })

  it('should render competitors after loading', async () => {
    const { competitorsApi } = await import('@/lib/api-client')
    const mockFn = competitorsApi.list as ReturnType<typeof vi.fn>
    mockFn.mockClear()
    mockFn.mockResolvedValue(mockCompetitors)

    render(<CompetitorMonitor projectSlug="demo" />)

    await waitFor(() => {
      expect(screen.getByText('Competitor Monitoring')).toBeInTheDocument()
    })

    expect(screen.getByText('Competitor A')).toBeInTheDocument()
    expect(screen.getByText('competitor-a.com')).toBeInTheDocument()
    expect(mockFn).toHaveBeenCalledWith('demo', 'mock-token')
  })

  it('should pass authentication token to API', async () => {
    const { competitorsApi } = await import('@/lib/api-client')
    const mockFn = competitorsApi.list as ReturnType<typeof vi.fn>
    mockFn.mockClear()
    mockFn.mockResolvedValue([])

    render(<CompetitorMonitor projectSlug="demo" />)

    await waitFor(() => {
      expect(mockFn).toHaveBeenCalledWith('demo', 'mock-token')
    })
  })

  it('should show authentication error with sign out button on 401', async () => {
    const { competitorsApi, ApiError } = await import('@/lib/api-client')
    const { signOut } = await import('next-auth/react')
    const mockFn = competitorsApi.list as ReturnType<typeof vi.fn>
    mockFn.mockClear()
    mockFn.mockRejectedValue(new ApiError('Authentication required', 401))

    render(<CompetitorMonitor projectSlug="demo" />)

    await waitFor(() => {
      expect(screen.getByText(/Authentication failed/i)).toBeInTheDocument()
    })

    expect(screen.getByText(/This usually means your authentication token has expired/i)).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /Sign Out/i })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /Retry/i })).toBeInTheDocument()

    // Test sign out button
    const signOutButton = screen.getByRole('button', { name: /Sign Out/i })
    fireEvent.click(signOutButton)
    expect(signOut).toHaveBeenCalledWith({ callbackUrl: '/login' })
  })

  it('should show generic error message for non-auth errors', async () => {
    const { competitorsApi, ApiError } = await import('@/lib/api-client')
    const mockFn = competitorsApi.list as ReturnType<typeof vi.fn>
    mockFn.mockClear()
    mockFn.mockRejectedValue(new ApiError('Server error', 500))

    render(<CompetitorMonitor projectSlug="demo" />)

    await waitFor(() => {
      expect(screen.getByText('Failed to load competitors')).toBeInTheDocument()
    })

    expect(screen.queryByText(/Authentication failed/i)).not.toBeInTheDocument()
    expect(screen.queryByRole('button', { name: /Sign Out/i })).not.toBeInTheDocument()
    expect(screen.getByRole('button', { name: /Retry/i })).toBeInTheDocument()
  })

  it('should handle monitoring action with authentication', async () => {
    const { competitorsApi } = await import('@/lib/api-client')
    const listFn = competitorsApi.list as ReturnType<typeof vi.fn>
    const monitorFn = competitorsApi.monitor as ReturnType<typeof vi.fn>

    listFn.mockResolvedValue(mockCompetitors)
    monitorFn.mockResolvedValue({ results: [] })

    render(<CompetitorMonitor projectSlug="demo" />)

    await waitFor(() => {
      expect(screen.getByRole('button', { name: /Start Monitoring/i })).toBeInTheDocument()
    })

    const monitorButton = screen.getByRole('button', { name: /Start Monitoring/i })
    fireEvent.click(monitorButton)

    await waitFor(() => {
      expect(monitorFn).toHaveBeenCalledWith('', 'demo', 'mock-token')
    })
  })

  it('should handle monitoring authentication error', async () => {
    const { competitorsApi, ApiError } = await import('@/lib/api-client')
    const listFn = competitorsApi.list as ReturnType<typeof vi.fn>
    const monitorFn = competitorsApi.monitor as ReturnType<typeof vi.fn>

    listFn.mockResolvedValue(mockCompetitors)
    monitorFn.mockRejectedValue(new ApiError('Authentication required', 401))

    render(<CompetitorMonitor projectSlug="demo" />)

    await waitFor(() => {
      expect(screen.getByRole('button', { name: /Start Monitoring/i })).toBeInTheDocument()
    })

    const monitorButton = screen.getByRole('button', { name: /Start Monitoring/i })
    fireEvent.click(monitorButton)

    await waitFor(() => {
      expect(screen.getByText(/Authentication failed/i)).toBeInTheDocument()
    })

    expect(screen.getByRole('button', { name: /Sign Out/i })).toBeInTheDocument()
  })

  it('should work without authentication token', async () => {
    const { useSession } = await import('next-auth/react')
    ;(useSession as ReturnType<typeof vi.fn>).mockReturnValue({ data: null })

    const { competitorsApi } = await import('@/lib/api-client')
    const mockFn = competitorsApi.list as ReturnType<typeof vi.fn>
    mockFn.mockClear()
    mockFn.mockResolvedValue([])

    render(<CompetitorMonitor projectSlug="demo" />)

    await waitFor(() => {
      expect(mockFn).toHaveBeenCalledWith('demo', undefined)
    })
  })
})

