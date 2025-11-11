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
    create: vi.fn(),
    addProduct: vi.fn(),
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

  it('should show "Add Competitor" buttons in header and empty state', async () => {
    const { competitorsApi } = await import('@/lib/api-client')
    const mockFn = competitorsApi.list as ReturnType<typeof vi.fn>
    mockFn.mockClear()
    mockFn.mockResolvedValue([])

    render(<CompetitorMonitor projectSlug="demo" />)

    await waitFor(() => {
      expect(screen.getByRole('button', { name: /Add Competitor/i })).toBeInTheDocument()
      expect(screen.getByRole('button', { name: /Add Your First Competitor/i })).toBeInTheDocument()
    })
  })

  it('should open add competitor modal when button clicked', async () => {
    const { competitorsApi } = await import('@/lib/api-client')
    const mockFn = competitorsApi.list as ReturnType<typeof vi.fn>
    mockFn.mockClear()
    mockFn.mockResolvedValue([])

    render(<CompetitorMonitor projectSlug="demo" />)

    await waitFor(() => {
      expect(screen.getByRole('button', { name: /Add Competitor/i })).toBeInTheDocument()
    })

    const addButton = screen.getByRole('button', { name: /Add Competitor/i })
    fireEvent.click(addButton)

    await waitFor(() => {
      expect(screen.getByLabelText(/Competitor Name/i)).toBeInTheDocument()
      expect(screen.getByLabelText(/Website Domain/i)).toBeInTheDocument()
    })
  })

  it('should create competitor and refresh list', async () => {
    const { competitorsApi } = await import('@/lib/api-client')
    const listFn = competitorsApi.list as ReturnType<typeof vi.fn>
    const createFn = competitorsApi.create as ReturnType<typeof vi.fn>

    listFn.mockResolvedValue([])
    createFn.mockResolvedValue({ id: 'new-comp', name: 'New Competitor' })

    render(<CompetitorMonitor projectSlug="demo" />)

    await waitFor(() => {
      const buttons = screen.queryAllByRole('button', { name: /Add Competitor/i })
      expect(buttons.length).toBeGreaterThan(0)
    })

    // Open modal - click the header button (not the empty state button)
    const buttons = screen.getAllByRole('button', { name: /Add Competitor/i })
    const headerButton = buttons[0]
    fireEvent.click(headerButton)

    await waitFor(() => {
      expect(screen.getByLabelText(/Competitor Name/i)).toBeInTheDocument()
    })

    // Fill form
    const nameInput = screen.getByLabelText(/Competitor Name/i)
    const domainInput = screen.getByLabelText(/Website Domain/i)

    fireEvent.change(nameInput, { target: { value: 'New Competitor' } })
    fireEvent.change(domainInput, { target: { value: 'newcompetitor.com' } })

    // Submit form - get the submit button within the modal (type="submit")
    const form = screen.getByLabelText(/Competitor Name/i).closest('form')
    if (form) {
      fireEvent.submit(form)
    }

    await waitFor(() => {
      expect(createFn).toHaveBeenCalledWith(
        'demo',
        expect.objectContaining({
          name: 'New Competitor',
          domain: 'newcompetitor.com',
          channel: 'online',
          isActive: true,
        }),
        'mock-token'
      )
    })

    // Should refresh list
    await waitFor(() => {
      expect(listFn).toHaveBeenCalledTimes(2) // Initial + after create
    })
  })

  it('should show validation errors for invalid competitor form', async () => {
    const { competitorsApi } = await import('@/lib/api-client')
    const mockFn = competitorsApi.list as ReturnType<typeof vi.fn>
    const createFn = competitorsApi.create as ReturnType<typeof vi.fn>
    mockFn.mockClear()
    mockFn.mockResolvedValue([])
    // Mock create to not be called (validation should prevent submission)
    createFn.mockClear()

    render(<CompetitorMonitor projectSlug="demo" />)

    await waitFor(() => {
      expect(screen.getByRole('button', { name: /Add Competitor/i })).toBeInTheDocument()
    })

    // Open modal - get the first button which is in the header
    const buttons = screen.getAllByRole('button', { name: /Add Competitor/i })
    fireEvent.click(buttons[0])

    await waitFor(() => {
      expect(screen.getByLabelText(/Competitor Name/i)).toBeInTheDocument()
    })

    // Submit form directly without filling required fields
    const form = screen.getByLabelText(/Competitor Name/i).closest('form')
    if (form) {
      fireEvent.submit(form)
    }

    // Wait a bit for validation to process
    await new Promise(resolve => setTimeout(resolve, 100))

    // Check validation errors appear
    await waitFor(() => {
      const errors = screen.queryAllByText(/required/i)
      expect(errors.length).toBeGreaterThan(0)
    })

    // Verify API was not called due to validation failure
    expect(createFn).not.toHaveBeenCalled()
  })

  it('should show "Add Product" button for each competitor', async () => {
    const { competitorsApi } = await import('@/lib/api-client')
    const mockFn = competitorsApi.list as ReturnType<typeof vi.fn>
    mockFn.mockClear()
    mockFn.mockResolvedValue(mockCompetitors)

    render(<CompetitorMonitor projectSlug="demo" />)

    await waitFor(() => {
      expect(screen.getByText('Competitor A')).toBeInTheDocument()
    })

    const addProductButtons = screen.getAllByTitle('Add product to track')
    expect(addProductButtons).toHaveLength(1)
  })

  it('should open add product modal when product button clicked', async () => {
    const { competitorsApi } = await import('@/lib/api-client')
    const mockFn = competitorsApi.list as ReturnType<typeof vi.fn>
    mockFn.mockClear()
    mockFn.mockResolvedValue(mockCompetitors)

    render(<CompetitorMonitor projectSlug="demo" />)

    await waitFor(() => {
      expect(screen.getByText('Competitor A')).toBeInTheDocument()
    })

    const addProductButton = screen.getByTitle('Add product to track')
    fireEvent.click(addProductButton)

    await waitFor(() => {
      expect(screen.getByText(/Add Product to Track/i)).toBeInTheDocument()
      expect(screen.getByLabelText(/Product Name/i)).toBeInTheDocument()
    })
  })

  it('should add product to competitor and refresh list', async () => {
    const { competitorsApi } = await import('@/lib/api-client')
    const listFn = competitorsApi.list as ReturnType<typeof vi.fn>
    const addProductFn = competitorsApi.addProduct as ReturnType<typeof vi.fn>

    listFn.mockResolvedValue(mockCompetitors)
    addProductFn.mockResolvedValue({ id: 'new-prod', name: 'New Product' })

    render(<CompetitorMonitor projectSlug="demo" />)

    await waitFor(() => {
      expect(screen.getByText('Competitor A')).toBeInTheDocument()
    })

    // Open add product modal
    const addProductButton = screen.getByTitle('Add product to track')
    fireEvent.click(addProductButton)

    await waitFor(() => {
      expect(screen.getByLabelText(/Product Name/i)).toBeInTheDocument()
    })

    // Fill form
    const nameInput = screen.getByLabelText(/Product Name/i)
    const urlInput = screen.getByLabelText(/Product URL/i)

    fireEvent.change(nameInput, { target: { value: 'New Product' } })
    fireEvent.change(urlInput, { target: { value: 'https://competitor-a.com/new-product' } })

    // Submit form
    const submitButton = screen.getByRole('button', { name: /Add Product/i })
    fireEvent.click(submitButton)

    await waitFor(() => {
      expect(addProductFn).toHaveBeenCalledWith(
        'comp-1',
        expect.objectContaining({
          name: 'New Product',
          url: 'https://competitor-a.com/new-product',
        }),
        'mock-token'
      )
    })

    // Should refresh list
    await waitFor(() => {
      expect(listFn).toHaveBeenCalledTimes(2) // Initial + after add product
    })
  })

  it('should show validation errors for invalid product form', async () => {
    const { competitorsApi } = await import('@/lib/api-client')
    const mockFn = competitorsApi.list as ReturnType<typeof vi.fn>
    mockFn.mockClear()
    mockFn.mockResolvedValue(mockCompetitors)

    render(<CompetitorMonitor projectSlug="demo" />)

    await waitFor(() => {
      expect(screen.getByText('Competitor A')).toBeInTheDocument()
    })

    // Open add product modal
    const addProductButton = screen.getByTitle('Add product to track')
    fireEvent.click(addProductButton)

    await waitFor(() => {
      expect(screen.getByLabelText(/Product Name/i)).toBeInTheDocument()
    })

    // Submit without filling required fields
    const submitButton = screen.getByRole('button', { name: /Add Product/i })
    fireEvent.click(submitButton)

    await waitFor(() => {
      expect(screen.getByText(/Product name is required/i)).toBeInTheDocument()
      expect(screen.getByText(/Product URL is required/i)).toBeInTheDocument()
    })
  })

  it('should disable monitoring button when no competitors exist', async () => {
    const { competitorsApi } = await import('@/lib/api-client')
    const mockFn = competitorsApi.list as ReturnType<typeof vi.fn>
    mockFn.mockClear()
    mockFn.mockResolvedValue([])

    render(<CompetitorMonitor projectSlug="demo" />)

    await waitFor(() => {
      const monitorButton = screen.getByRole('button', { name: /Start Monitoring/i })
      expect(monitorButton).toBeDisabled()
    })
  })

  it('should enable monitoring button when competitors exist', async () => {
    const { competitorsApi } = await import('@/lib/api-client')
    const mockFn = competitorsApi.list as ReturnType<typeof vi.fn>
    mockFn.mockClear()
    mockFn.mockResolvedValue(mockCompetitors)

    render(<CompetitorMonitor projectSlug="demo" />)

    await waitFor(() => {
      const monitorButton = screen.getByRole('button', { name: /Start Monitoring/i })
      expect(monitorButton).not.toBeDisabled()
    })
  })
})

