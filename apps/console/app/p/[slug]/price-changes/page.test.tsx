import { render, screen, fireEvent, within, act } from '@testing-library/react'
import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest'
import PriceChangesPage from './page'

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

describe('PriceChangesPage UI', () => {
  let fetchMock: ReturnType<typeof vi.fn>

  beforeEach(() => {
    fetchMock = vi.fn()

    const initialItems = [
      {
        id: 'pc-1',
        status: 'PENDING',
        currency: 'USD',
        fromAmount: 4990,
        toAmount: 5290,
        createdAt: '2025-01-01T00:00:00Z',
        source: 'AI',
        context: { skuCode: 'SKU-1' },
        policyResult: { ok: true, checks: [{ name: 'maxPctDelta', ok: true }] },
        connectorStatus: { target: 'shopify', state: 'SYNCED', errorMessage: null },
      },
      {
        id: 'pc-2',
        status: 'APPROVED',
        currency: 'USD',
        fromAmount: 4990,
        toAmount: 5490,
        createdAt: '2025-01-02T00:00:00Z',
        source: 'Manual',
        context: { skuCode: 'SKU-2' },
        policyResult: { ok: true, checks: [{ name: 'maxPctDelta', ok: true }] },
        connectorStatus: { target: 'shopify', state: 'SYNCED', errorMessage: null },
      },
    ]

    const appliedItem = {
      ...initialItems[1],
      status: 'APPLIED' as const,
      connectorStatus: { target: 'shopify', state: 'SYNCED', errorMessage: null },
      appliedAt: '2025-02-01T00:00:00Z',
    }

    const moreItems = [
      {
        id: 'pc-3',
        status: 'PENDING' as const,
        currency: 'USD',
        fromAmount: 3000,
        toAmount: 3200,
        createdAt: '2025-01-03T00:00:00Z',
        source: 'AI',
        context: { skuCode: 'SKU-NEXT' },
        policyResult: { ok: true, checks: [] },
        connectorStatus: { target: 'shopify', state: 'SYNCED', errorMessage: null },
      },
    ]

    const approvedItems = [
      {
        ...initialItems[1],
        status: 'APPROVED' as const,
      },
    ]

    fetchMock
      .mockResolvedValueOnce(
        jsonResponse({
          items: initialItems,
          nextCursor: 'pc-2',
          role: 'ADMIN',
        })
      )
      .mockResolvedValueOnce(
        jsonResponse({
          ok: true,
          item: appliedItem,
        })
      )
      .mockResolvedValueOnce(
        jsonResponse({
          items: moreItems,
          nextCursor: null,
          role: 'ADMIN',
        })
      )
      .mockResolvedValueOnce(
        jsonResponse({
          items: approvedItems,
          nextCursor: null,
          role: 'ADMIN',
        })
      )
      .mockResolvedValueOnce(
        jsonResponse({
          items: approvedItems,
          nextCursor: null,
          role: 'ADMIN',
        })
      )

    // @ts-expect-error - Mocking global fetch for testing
    global.fetch = fetchMock
  })

  afterEach(() => {
    vi.clearAllMocks()
  })

  it('renders table, handles actions, filters, and drawer interactions', async () => {
    render(<PriceChangesPage params={{ slug: 'demo' }} />)

    expect(fetchMock).toHaveBeenCalledTimes(1)
    expect(fetchMock.mock.calls[0][0]).toContain('status=PENDING')

    const row = await screen.findByText('SKU-1')
    expect(row).toBeInTheDocument()

    const detailsButtons = await screen.findAllByRole('button', { name: 'Details' })
    fireEvent.click(detailsButtons[1])
    expect(await screen.findByText('Price Change')).toBeInTheDocument()
    const drawerNode = document.querySelector('aside')
    expect(drawerNode).toBeTruthy()
    expect(within(drawerNode as HTMLElement).getByText('Manual')).toBeInTheDocument()
    expect(within(drawerNode as HTMLElement).getByText(/shopify/i)).toBeInTheDocument()

    const applyButton = within(drawerNode as HTMLElement).getByRole('button', { name: 'Apply' })
    await act(async () => {
      fireEvent.click(applyButton)
    })

    expect(fetchMock).toHaveBeenCalledTimes(2)
    expect(fetchMock.mock.calls[1][0]).toContain('/apply')
    expect(await screen.findByText('Price applied')).toBeInTheDocument()

    const loadMore = await screen.findByRole('button', { name: /Load more/i })
    fireEvent.click(loadMore)
    expect(fetchMock).toHaveBeenCalledTimes(3)
    expect(fetchMock.mock.calls[2][0]).toContain('cursor=pc-2')
    expect(await screen.findByText('SKU-NEXT')).toBeInTheDocument()

    const approvedTab = screen.getByRole('button', { name: 'Approved' })
    fireEvent.click(approvedTab)
    expect(fetchMock).toHaveBeenCalledTimes(4)
    expect(fetchMock.mock.calls[3][0]).toContain('status=APPROVED')

    const searchInput = screen.getByPlaceholderText(/Search by SKU or source/i)
    fireEvent.change(searchInput, { target: { value: 'SKU-2' } })
    await act(async () => {
      await new Promise((resolve) => setTimeout(resolve, 400))
    })
    expect(fetchMock).toHaveBeenCalledTimes(5)
    expect(fetchMock.mock.calls[4][0]).toContain('q=SKU-2')
  })
})
