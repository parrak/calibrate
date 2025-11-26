import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, waitFor, fireEvent } from '@testing-library/react'
import { CompetitorRules } from './CompetitorRules'

// Mock next-auth
vi.mock('next-auth/react', () => ({
  useSession: vi.fn(),
  signOut: vi.fn(),
}))

// Mock API client
vi.mock('@/lib/api-client', () => ({
  competitorsApi: {
    getRules: vi.fn(),
    createRule: vi.fn(),
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

const mockRules = [
  {
    id: 'rule-1',
    name: 'Beat Competitors by 5%',
    description: 'Always price 5% below competitors',
    isActive: true,
    rules: {
      type: 'beat_by_percent',
      value: 5,
      minMargin: 10,
    },
  },
]

describe('CompetitorRules', () => {
  beforeEach(async () => {
    vi.clearAllMocks()
    const { useSession } = await import('next-auth/react')
    ;(useSession as ReturnType<typeof vi.fn>).mockReturnValue({ data: mockSession })
  })

  it('should render loading state initially', async () => {
    const { competitorsApi } = await import('@/lib/api-client')
    const mockFn = competitorsApi.getRules as ReturnType<typeof vi.fn>
    mockFn.mockClear()
    mockFn.mockImplementation(() => new Promise(() => {}))

    render(<CompetitorRules projectSlug="demo" />)
    expect(screen.getByText('Loading rules...')).toBeInTheDocument()
  })

  it('should render rules after loading', async () => {
    const { competitorsApi } = await import('@/lib/api-client')
    const mockFn = competitorsApi.getRules as ReturnType<typeof vi.fn>
    mockFn.mockClear()
    mockFn.mockResolvedValue(mockRules)

    render(<CompetitorRules projectSlug="demo" />)

    await waitFor(() => {
      expect(screen.getByText('Competitor Pricing Rules')).toBeInTheDocument()
    })

    expect(screen.getByText('Beat Competitors by 5%')).toBeInTheDocument()
    expect(screen.getByText('Always price 5% below competitors')).toBeInTheDocument()
    expect(mockFn).toHaveBeenCalledWith('demo', 'mock-token')
  })

  it('should pass authentication token to API', async () => {
    const { competitorsApi } = await import('@/lib/api-client')
    const mockFn = competitorsApi.getRules as ReturnType<typeof vi.fn>
    mockFn.mockClear()
    mockFn.mockResolvedValue([])

    render(<CompetitorRules projectSlug="demo" />)

    await waitFor(() => {
      expect(mockFn).toHaveBeenCalledWith('demo', 'mock-token')
    })
  })

  it('should show authentication error with sign out button on 401', async () => {
    const { competitorsApi, ApiError } = await import('@/lib/api-client')
    const { signOut } = await import('next-auth/react')
    const mockFn = competitorsApi.getRules as ReturnType<typeof vi.fn>
    mockFn.mockClear()
    mockFn.mockRejectedValue(new ApiError('Authentication required', 401))

    render(<CompetitorRules projectSlug="demo" />)

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

  it('should show empty state when no rules exist', async () => {
    const { competitorsApi } = await import('@/lib/api-client')
    const mockFn = competitorsApi.getRules as ReturnType<typeof vi.fn>
    mockFn.mockClear()
    mockFn.mockResolvedValue([])

    render(<CompetitorRules projectSlug="demo" />)

    await waitFor(() => {
      expect(screen.getByText(/No pricing rules configured/i)).toBeInTheDocument()
    })
  })

  it('should open create rule form when New Rule button is clicked', async () => {
    const { competitorsApi } = await import('@/lib/api-client')
    const mockFn = competitorsApi.getRules as ReturnType<typeof vi.fn>
    mockFn.mockClear()
    mockFn.mockResolvedValue([])

    render(<CompetitorRules projectSlug="demo" />)

    await waitFor(() => {
      expect(screen.getByRole('button', { name: /New Rule/i })).toBeInTheDocument()
    })

    const newRuleButton = screen.getByRole('button', { name: /New Rule/i })
    fireEvent.click(newRuleButton)

    expect(screen.getByText('Create New Rule')).toBeInTheDocument()
    expect(screen.getByLabelText(/Rule Name/i)).toBeInTheDocument()
  })

  it('should handle rule creation with authentication', async () => {
    const { competitorsApi } = await import('@/lib/api-client')
    const getRulesFn = competitorsApi.getRules as ReturnType<typeof vi.fn>
    const createRuleFn = competitorsApi.createRule as ReturnType<typeof vi.fn>

    getRulesFn.mockResolvedValue([])
    createRuleFn.mockResolvedValue({ id: 'rule-2', name: 'New Rule' })

    render(<CompetitorRules projectSlug="demo" />)

    await waitFor(() => {
      expect(screen.getByRole('button', { name: /New Rule/i })).toBeInTheDocument()
    })

    // Open form
    fireEvent.click(screen.getByRole('button', { name: /New Rule/i }))

    // Fill form
    const nameInput = screen.getByLabelText(/Rule Name/i)
    fireEvent.change(nameInput, { target: { value: 'New Rule' } })

    // Submit
    const createButton = screen.getByRole('button', { name: /Create Rule/i })
    fireEvent.click(createButton)

    await waitFor(() => {
      expect(createRuleFn).toHaveBeenCalledWith(
        'demo',
        expect.objectContaining({
          name: 'New Rule',
        }),
        'mock-token'
      )
    })
  })

  it('should handle rule creation authentication error', async () => {
    const { competitorsApi, ApiError } = await import('@/lib/api-client')
    const getRulesFn = competitorsApi.getRules as ReturnType<typeof vi.fn>
    const createRuleFn = competitorsApi.createRule as ReturnType<typeof vi.fn>

    getRulesFn.mockResolvedValue([])
    createRuleFn.mockRejectedValue(new ApiError('Authentication required', 401))

    render(<CompetitorRules projectSlug="demo" />)

    await waitFor(() => {
      expect(screen.getByRole('button', { name: /New Rule/i })).toBeInTheDocument()
    })

    // Open form and create rule
    fireEvent.click(screen.getByRole('button', { name: /New Rule/i }))
    const nameInput = screen.getByLabelText(/Rule Name/i)
    fireEvent.change(nameInput, { target: { value: 'New Rule' } })
    fireEvent.click(screen.getByRole('button', { name: /Create Rule/i }))

    await waitFor(() => {
      expect(screen.getByText(/Authentication failed/i)).toBeInTheDocument()
    })

    expect(screen.getByRole('button', { name: /Sign Out/i })).toBeInTheDocument()
  })

  it('should work without authentication token', async () => {
    const { useSession } = await import('next-auth/react')
    ;(useSession as ReturnType<typeof vi.fn>).mockReturnValue({ data: null })

    const { competitorsApi } = await import('@/lib/api-client')
    const mockFn = competitorsApi.getRules as ReturnType<typeof vi.fn>
    mockFn.mockClear()
    mockFn.mockResolvedValue([])

    render(<CompetitorRules projectSlug="demo" />)

    await waitFor(() => {
      expect(mockFn).toHaveBeenCalledWith('demo', undefined)
    })
  })
})

