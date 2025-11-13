import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest'
import AutomationRunsPage from './page'

vi.mock('next-auth/react', () => ({
  useSession: () => ({
    data: {
      user: { role: 'ADMIN' },
      apiToken: 'token-admin',
    },
  }),
}))

const jsonResponse = (data: unknown, status = 200) =>
  new Response(JSON.stringify(data), {
    status,
    headers: { 'Content-Type': 'application/json' },
  })

describe('AutomationRunsPage', () => {
  let fetchMock: ReturnType<typeof vi.fn<[RequestInfo | URL, RequestInit?], Promise<Response>>>

  beforeEach(() => {
    fetchMock = vi.fn<[RequestInfo | URL, RequestInit?], Promise<Response>>()
    global.fetch = fetchMock as typeof fetch

    const initialRuns = [
      {
        id: 'run-1',
        status: 'QUEUED',
        ruleId: 'rule-1',
        scheduledFor: null,
        startedAt: null,
        finishedAt: null,
        explainJson: { matchedProducts: 10 },
        errorMessage: null,
        createdAt: '2025-01-01T00:00:00Z',
        updatedAt: '2025-01-01T00:00:00Z',
        PricingRule: {
          id: 'rule-1',
          name: 'Test Rule 1',
        },
        targetCounts: {
          QUEUED: 5,
          APPLIED: 0,
          FAILED: 0,
          PREVIEW: 0,
          ROLLED_BACK: 0,
        },
        totalTargets: 5,
        _count: { RuleTarget: 5 },
      },
      {
        id: 'run-2',
        status: 'APPLIED',
        ruleId: 'rule-2',
        scheduledFor: null,
        startedAt: '2025-01-01T01:00:00Z',
        finishedAt: '2025-01-01T01:05:00Z',
        explainJson: { matchedProducts: 20 },
        errorMessage: null,
        createdAt: '2025-01-01T01:00:00Z',
        updatedAt: '2025-01-01T01:05:00Z',
        PricingRule: {
          id: 'rule-2',
          name: 'Test Rule 2',
        },
        targetCounts: {
          QUEUED: 0,
          APPLIED: 20,
          FAILED: 0,
          PREVIEW: 0,
          ROLLED_BACK: 0,
        },
        totalTargets: 20,
        _count: { RuleTarget: 20 },
      },
      {
        id: 'run-3',
        status: 'FAILED',
        ruleId: 'rule-3',
        scheduledFor: null,
        startedAt: '2025-01-01T02:00:00Z',
        finishedAt: '2025-01-01T02:05:00Z',
        explainJson: { matchedProducts: 15 },
        errorMessage: 'Connection timeout',
        createdAt: '2025-01-01T02:00:00Z',
        updatedAt: '2025-01-01T02:05:00Z',
        PricingRule: {
          id: 'rule-3',
          name: 'Test Rule 3',
        },
        targetCounts: {
          QUEUED: 0,
          APPLIED: 5,
          FAILED: 10,
          PREVIEW: 0,
          ROLLED_BACK: 0,
        },
        totalTargets: 15,
        _count: { RuleTarget: 15 },
      },
    ]

    // Default mock implementation handles both runs and progress endpoints
    fetchMock.mockImplementation((url) => {
      if (typeof url === 'string') {
        if (url.includes('/progress')) {
          // Return 404 for progress polling to stop it immediately
          return Promise.resolve(new Response('Not Found', { status: 404 }))
        }
        if (url.includes('/api/v1/runs?')) {
          // Return initial runs for the main endpoint
          return Promise.resolve(jsonResponse({
            items: initialRuns,
            nextCursor: null,
            count: 3,
          }))
        }
      }
      return Promise.resolve(new Response('Not Found', { status: 404 }))
    })
  })

  afterEach(() => {
    vi.clearAllMocks()
    vi.clearAllTimers()
  })

  it('renders the page title and description', () => {
    render(<AutomationRunsPage params={{ slug: 'test-project' }} />)
    expect(screen.getByText('Automation Runs')).toBeInTheDocument()
    expect(screen.getByText(/View and manage automated pricing rule executions/)).toBeInTheDocument()
  })

  it('renders status filter buttons', () => {
    render(<AutomationRunsPage params={{ slug: 'test-project' }} />)
    expect(screen.getByText('All')).toBeInTheDocument()
    expect(screen.getByText('Queued')).toBeInTheDocument()
    expect(screen.getByText('Applied')).toBeInTheDocument()
    expect(screen.getByText('Failed')).toBeInTheDocument()
  })

  it('fetches and displays runs on mount', async () => {
    render(<AutomationRunsPage params={{ slug: 'test-project' }} />)

    await waitFor(() => {
      expect(screen.getAllByText('Test Rule 1')[0]).toBeInTheDocument()
      expect(screen.getAllByText('Test Rule 2')[0]).toBeInTheDocument()
      expect(screen.getAllByText('Test Rule 3')[0]).toBeInTheDocument()
    })

    expect(fetchMock).toHaveBeenCalledWith(
      expect.stringContaining('/api/v1/runs?project=test-project'),
      expect.any(Object)
    )
  })

  it('filters runs by status when status button is clicked', async () => {
    render(<AutomationRunsPage params={{ slug: 'test-project' }} />)

    await waitFor(() => {
      expect(screen.getAllByText('Test Rule 1')[0]).toBeInTheDocument()
    })

    // Mock the filtered runs response
    fetchMock.mockImplementationOnce((url) => {
      if (typeof url === 'string') {
        if (url.includes('/progress')) {
          return Promise.resolve(new Response('Not Found', { status: 404 }))
        }
        if (url.includes('status=APPLIED')) {
          return Promise.resolve(jsonResponse({
            items: [
              {
                id: 'run-2',
                status: 'APPLIED',
                ruleId: 'rule-2',
                scheduledFor: null,
                startedAt: '2025-01-01T01:00:00Z',
                finishedAt: '2025-01-01T01:05:00Z',
                explainJson: { matchedProducts: 20 },
                errorMessage: null,
                createdAt: '2025-01-01T01:00:00Z',
                updatedAt: '2025-01-01T01:05:00Z',
                PricingRule: {
                  id: 'rule-2',
                  name: 'Test Rule 2',
                },
                targetCounts: {
                  QUEUED: 0,
                  APPLIED: 20,
                  FAILED: 0,
                  PREVIEW: 0,
                  ROLLED_BACK: 0,
                },
                totalTargets: 20,
                _count: { RuleTarget: 20 },
              },
            ],
            nextCursor: null,
            count: 1,
          }))
        }
      }
      return Promise.resolve(new Response('Not Found', { status: 404 }))
    })

    const appliedButton = screen.getByText('Applied')
    fireEvent.click(appliedButton)

    await waitFor(() => {
      expect(fetchMock).toHaveBeenCalledWith(
        expect.stringContaining('status=APPLIED'),
        expect.any(Object)
      )
    })
  })

  it('shows "Retry Failed" button for runs with failed targets', async () => {
    render(<AutomationRunsPage params={{ slug: 'test-project' }} />)

    await waitFor(() => {
      expect(screen.getAllByText('Test Rule 3')[0]).toBeInTheDocument()
    })

    const retryButtons = screen.getAllByText('Retry Failed')
    expect(retryButtons.length).toBeGreaterThan(0)
  })

  it('opens drawer when "View" button is clicked', async () => {
    const runDetail = {
      id: 'run-1',
      status: 'QUEUED',
      ruleId: 'rule-1',
      scheduledFor: null,
      startedAt: null,
      finishedAt: null,
      explainJson: { matchedProducts: 10 },
      errorMessage: null,
      createdAt: '2025-01-01T00:00:00Z',
      updatedAt: '2025-01-01T00:00:00Z',
      PricingRule: {
        id: 'rule-1',
        name: 'Test Rule 1',
        description: 'Test description',
        selectorJson: { tag: 'test' },
        transformJson: { op: 'percent', value: 10 },
      },
      targetCounts: {
        QUEUED: 5,
        APPLIED: 0,
        FAILED: 0,
        PREVIEW: 0,
        ROLLED_BACK: 0,
      },
      totalTargets: 5,
      RuleTarget: [
        {
          id: 'target-1',
          productId: 'prod-1',
          variantId: 'var-1',
          beforeJson: { unit_amount: 1000 },
          afterJson: { unit_amount: 1100 },
          status: 'QUEUED',
          errorMessage: null,
          createdAt: '2025-01-01T00:00:00Z',
        },
      ],
      auditEvents: [
        {
          id: 'audit-1',
          action: 'apply',
          actor: 'user-1',
          explain: { ruleId: 'rule-1' },
          createdAt: '2025-01-01T00:00:00Z',
        },
      ],
    }

    render(<AutomationRunsPage params={{ slug: 'test-project' }} />)

    await waitFor(() => {
      expect(screen.getAllByText('Test Rule 1')[0]).toBeInTheDocument()
    })

    // Mock the run details endpoint
    fetchMock.mockImplementationOnce((url) => {
      if (typeof url === 'string' && url.includes('/api/v1/runs/run-1')) {
        return Promise.resolve(jsonResponse(runDetail))
      }
      return Promise.resolve(new Response('Not Found', { status: 404 }))
    })

    const viewButtons = screen.getAllByText('View')
    fireEvent.click(viewButtons[0])

    await waitFor(() => {
      expect(screen.getByText(/Run: Test Rule 1/)).toBeInTheDocument()
    })
  })

  it('displays Explain tab with transform and explain trace', async () => {
    const runDetail = {
      id: 'run-1',
      status: 'APPLIED',
      ruleId: 'rule-1',
      scheduledFor: null,
      startedAt: '2025-01-01T00:00:00Z',
      finishedAt: '2025-01-01T00:05:00Z',
      explainJson: { matchedProducts: 10, results: { successCount: 5 } },
      errorMessage: null,
      createdAt: '2025-01-01T00:00:00Z',
      updatedAt: '2025-01-01T00:05:00Z',
      PricingRule: {
        id: 'rule-1',
        name: 'Test Rule 1',
        description: 'Test description',
        selectorJson: { tag: 'test' },
        transformJson: { op: 'percent', value: 10 },
      },
      targetCounts: {
        QUEUED: 0,
        APPLIED: 5,
        FAILED: 0,
        PREVIEW: 0,
        ROLLED_BACK: 0,
      },
      totalTargets: 5,
      RuleTarget: [],
      auditEvents: [],
    }

    render(<AutomationRunsPage params={{ slug: 'test-project' }} />)

    await waitFor(() => {
      expect(screen.getAllByText('Test Rule 1')[0]).toBeInTheDocument()
    })

    // Mock the run details endpoint
    fetchMock.mockImplementationOnce((url) => {
      if (typeof url === 'string' && url.includes('/api/v1/runs/run-1')) {
        return Promise.resolve(jsonResponse(runDetail))
      }
      return Promise.resolve(new Response('Not Found', { status: 404 }))
    })

    const viewButtons = screen.getAllByText('View')
    fireEvent.click(viewButtons[0])

    await waitFor(() => {
      expect(screen.getByText(/Run: Test Rule 1/)).toBeInTheDocument()
    })

    const explainTab = screen.getByText('Explain')
    fireEvent.click(explainTab)

    await waitFor(() => {
      expect(screen.getByText('Transform')).toBeInTheDocument()
      expect(screen.getByText('Explain Trace')).toBeInTheDocument()
    })
  })

  it('calls retry-failed API when Retry Failed button is clicked', async () => {
    render(<AutomationRunsPage params={{ slug: 'test-project' }} />)

    await waitFor(() => {
      expect(screen.getAllByText('Test Rule 3')[0]).toBeInTheDocument()
    })

    let retryCallCount = 0
    let refreshCallCount = 0

    // Mock retry-failed endpoint and refresh
    fetchMock.mockImplementation((url, options) => {
      if (typeof url === 'string') {
        if (url.includes('/progress')) {
          return Promise.resolve(new Response('Not Found', { status: 404 }))
        }
        if (url.includes('/retry-failed') && options?.method === 'POST') {
          retryCallCount++
          return Promise.resolve(jsonResponse({
            message: 'Retried 10 failed targets',
            retriedCount: 10,
          }))
        }
        if (url.includes('/api/v1/runs?') && retryCallCount > 0) {
          refreshCallCount++
          return Promise.resolve(jsonResponse({
            items: [
              {
                id: 'run-3',
                status: 'QUEUED',
                ruleId: 'rule-3',
                scheduledFor: null,
                startedAt: null,
                finishedAt: null,
                explainJson: { matchedProducts: 15 },
                errorMessage: null,
                createdAt: '2025-01-01T02:00:00Z',
                updatedAt: '2025-01-01T02:00:00Z',
                PricingRule: {
                  id: 'rule-3',
                  name: 'Test Rule 3',
                },
                targetCounts: {
                  QUEUED: 10,
                  APPLIED: 5,
                  FAILED: 0,
                  PREVIEW: 0,
                  ROLLED_BACK: 0,
                },
                totalTargets: 15,
                _count: { RuleTarget: 15 },
              },
            ],
            nextCursor: null,
            count: 1,
          }))
        }
      }
      return Promise.resolve(new Response('Not Found', { status: 404 }))
    })

    const retryButtons = screen.getAllByText('Retry Failed')
    fireEvent.click(retryButtons[0])

    await waitFor(() => {
      expect(fetchMock).toHaveBeenCalledWith(
        expect.stringContaining('/api/v1/runs/run-3/retry-failed'),
        expect.objectContaining({
          method: 'POST',
        })
      )
    })
  })

  it('polls progress for active runs', async () => {
    render(<AutomationRunsPage params={{ slug: 'test-project' }} />)

    // Wait for initial fetch to complete
    await waitFor(() => {
      expect(screen.getAllByText('Test Rule 1')[0]).toBeInTheDocument()
    }, { timeout: 10000 })

    // Mock progress endpoint
    fetchMock.mockResolvedValue(
      jsonResponse({
        runId: 'run-1',
        status: 'APPLYING',
        progress: 50,
        startedAt: '2025-01-01T00:00:00Z',
        finishedAt: null,
        errorMessage: null,
        targetCounts: {
          QUEUED: 2,
          APPLIED: 3,
          FAILED: 0,
          PREVIEW: 0,
          ROLLED_BACK: 0,
        },
        totalTargets: 5,
        completed: 3,
      })
    )

    // Wait for polling to start (component polls every 2 seconds for QUEUED/APPLYING runs)
    await waitFor(() => {
      const progressCalls = fetchMock.mock.calls.filter((call) =>
        typeof call[0] === 'string' && call[0].includes('/api/v1/runs/run-1/progress')
      )
      expect(progressCalls.length).toBeGreaterThan(0)
    }, { timeout: 5000 })
  })

  it('displays empty state when no runs are found', async () => {
    // Clear the default mock from beforeEach
    fetchMock.mockClear()

    // Mock empty runs response
    fetchMock.mockImplementation((url) => {
      if (typeof url === 'string') {
        if (url.includes('/progress')) {
          return Promise.resolve(new Response('Not Found', { status: 404 }))
        }
        if (url.includes('/api/v1/runs?')) {
          return Promise.resolve(jsonResponse({
            items: [],
            nextCursor: null,
            count: 0,
          }))
        }
      }
      return Promise.resolve(new Response('Not Found', { status: 404 }))
    })

    render(<AutomationRunsPage params={{ slug: 'test-project' }} />)

    // Wait for the fetch to complete and empty state to render
    await waitFor(() => {
      expect(screen.getByText('No runs found')).toBeInTheDocument()
    }, { timeout: 10000 })

    expect(screen.getByText(/Automation runs will appear here/)).toBeInTheDocument()
  })

  it('displays error message when fetch fails', async () => {
    // Clear the default mock from beforeEach
    fetchMock.mockClear()

    // Mock fetch rejection
    fetchMock.mockImplementation(() => {
      return Promise.reject(new Error('Network error'))
    })

    render(<AutomationRunsPage params={{ slug: 'test-project' }} />)

    // Wait for error to be displayed (error message is set in catch block)
    await waitFor(() => {
      // Error is displayed in a div with the error message
      const errorText = screen.queryByText(/Network error|Failed to fetch runs/)
      expect(errorText).toBeInTheDocument()
    }, { timeout: 10000 })
  })
})

