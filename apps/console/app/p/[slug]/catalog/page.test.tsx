import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, waitFor, fireEvent } from '@testing-library/react'
import ProjectCatalog from './page'

// Create mock functions
const mockUseSession = vi.fn()
const mockListProducts = vi.fn()

// Mock next-auth
vi.mock('next-auth/react', () => ({
  useSession: mockUseSession,
}))

// Mock API client
vi.mock('@/lib/api-client', () => ({
  catalogApi: {
    listProducts: mockListProducts,
  },
  ApiError: class ApiError extends Error {
    constructor(message: string, public status: number) {
      super(message)
    }
  },
}))

// Mock toast
vi.mock('@/components/Toast', () => ({
  useToast: () => vi.fn(),
}))

const mockSession = {
  user: { email: 'test@example.com', name: 'Test User', role: 'ADMIN' },
  expires: '2099-12-31',
  apiToken: 'mock-token',
}

const mockProducts = [
  {
    code: 'PROD-001',
    name: 'Product One',
    skus: [
      {
        code: 'SKU-001',
        prices: [
          { currency: 'USD', amount: 2999 },
          { currency: 'EUR', amount: 2699 },
        ],
      },
      {
        code: 'SKU-002',
        prices: [{ currency: 'USD', amount: 3999 }],
      },
    ],
  },
  {
    code: 'PROD-002',
    name: 'Product Two',
    skus: [
      {
        code: 'SKU-003',
        prices: [{ currency: 'USD', amount: 1999 }],
      },
    ],
  },
]

describe('ProjectCatalog', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mockUseSession.mockReturnValue({ data: mockSession })
  })

  it('should render loading state initially', () => {
    mockListProducts.mockImplementation(() => new Promise(() => {}))

    render(<ProjectCatalog params={{ slug: 'demo' }} />)
    const skeletons = screen.getAllByTestId('skeleton')
    expect(skeletons.length).toBeGreaterThan(0)
  })

  it('should render products after loading', async () => {
    mockListProducts.mockResolvedValue(mockProducts)

    render(<ProjectCatalog params={{ slug: 'demo' }} />)

    await waitFor(() => {
      expect(screen.getByText('Product Catalog')).toBeInTheDocument()
    })

    expect(screen.getByText('Product One')).toBeInTheDocument()
    expect(screen.getByText('Product Two')).toBeInTheDocument()
    expect(screen.getByText('2 of 2 products')).toBeInTheDocument()
  })

  it('should filter products by search query', async () => {
    mockListProducts.mockResolvedValue(mockProducts)

    render(<ProjectCatalog params={{ slug: 'demo' }} />)

    await waitFor(() => {
      expect(screen.getByText('Product One')).toBeInTheDocument()
    })

    const searchInput = screen.getByPlaceholderText(/search by product/i)
    fireEvent.change(searchInput, { target: { value: 'Product One' } })

    await waitFor(() => {
      expect(screen.getByText('Product One')).toBeInTheDocument()
      expect(screen.queryByText('Product Two')).not.toBeInTheDocument()
    })
  })

  it('should filter products by currency', async () => {
    mockListProducts.mockResolvedValue(mockProducts)

    render(<ProjectCatalog params={{ slug: 'demo' }} />)

    await waitFor(() => {
      expect(screen.getByText('Product One')).toBeInTheDocument()
    })

    const currencySelect = screen.getByRole('combobox')
    fireEvent.change(currencySelect, { target: { value: 'EUR' } })

    await waitFor(() => {
      expect(screen.getByText('Product One')).toBeInTheDocument()
      expect(screen.queryByText('Product Two')).not.toBeInTheDocument()
    })
  })

  it('should expand/collapse product details', async () => {
    mockListProducts.mockResolvedValue(mockProducts)

    render(<ProjectCatalog params={{ slug: 'demo' }} />)

    await waitFor(() => {
      expect(screen.getByText('Product One')).toBeInTheDocument()
    })

    // Initially collapsed
    expect(screen.queryByText('SKU-001')).not.toBeInTheDocument()

    // Click to expand - find the button containing the product name
    const buttons = screen.getAllByRole('button')
    const productButton = buttons.find((btn) => btn.textContent?.includes('Product One'))
    if (productButton) {
      fireEvent.click(productButton)

      await waitFor(() => {
        expect(screen.getByText('SKU-001')).toBeInTheDocument()
        expect(screen.getByText('SKU-002')).toBeInTheDocument()
      })

      // Click to collapse
      fireEvent.click(productButton)

      await waitFor(() => {
        expect(screen.queryByText('SKU-001')).not.toBeInTheDocument()
      })
    }
  })

  it('should handle pagination', async () => {
    const manyProducts = Array.from({ length: 25 }, (_, i) => ({
      code: `PROD-${i}`,
      name: `Product ${i}`,
      skus: [
        {
          code: `SKU-${i}`,
          prices: [{ currency: 'USD', amount: 1000 + i * 100 }],
        },
      ],
    }))
    mockListProducts.mockResolvedValue(manyProducts)

    render(<ProjectCatalog params={{ slug: 'demo' }} />)

    await waitFor(() => {
      expect(screen.getByText('Product 0')).toBeInTheDocument()
    })

    // First page shows first 20 items
    expect(screen.getByText('Product 0')).toBeInTheDocument()
    expect(screen.getByText('Product 19')).toBeInTheDocument()
    expect(screen.queryByText('Product 20')).not.toBeInTheDocument()

    // Navigate to next page
    const nextButton = screen.getByRole('button', { name: /next/i })
    fireEvent.click(nextButton)

    await waitFor(() => {
      expect(screen.getByText('Product 20')).toBeInTheDocument()
    })

    expect(screen.queryByText('Product 0')).not.toBeInTheDocument()
  })

  it('should clear filters', async () => {
    mockListProducts.mockResolvedValue(mockProducts)

    render(<ProjectCatalog params={{ slug: 'demo' }} />)

    await waitFor(() => {
      expect(screen.getByText('Product One')).toBeInTheDocument()
    })

    // Apply filters
    const searchInput = screen.getByPlaceholderText(/search by product/i)
    fireEvent.change(searchInput, { target: { value: 'Product One' } })

    await waitFor(() => {
      expect(screen.queryByText('Product Two')).not.toBeInTheDocument()
    })

    // Clear filters
    const clearButton = screen.getByRole('button', { name: /clear filters/i })
    fireEvent.click(clearButton)

    await waitFor(() => {
      expect(screen.getByText('Product Two')).toBeInTheDocument()
    })
  })

  it('should display error state', async () => {
    class ApiError extends Error {
      constructor(message: string, public status: number) {
        super(message)
      }
    }
    mockListProducts.mockRejectedValue(
      new ApiError('Failed to load catalog', 500)
    )

    render(<ProjectCatalog params={{ slug: 'demo' }} />)

    await waitFor(() => {
      expect(screen.getByText(/Error:/i)).toBeInTheDocument()
    })
  })

  it('should display empty state when no products', async () => {
    mockListProducts.mockResolvedValue([])

    render(<ProjectCatalog params={{ slug: 'demo' }} />)

    await waitFor(() => {
      expect(screen.getByText('No products found')).toBeInTheDocument()
    })
  })
})
