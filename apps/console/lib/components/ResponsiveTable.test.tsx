import { describe, it, expect, vi } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import { ResponsiveTable } from './ResponsiveTable'

// Mock window.matchMedia
Object.defineProperty(window, 'matchMedia', {
  writable: true,
  value: vi.fn().mockImplementation((query) => ({
    matches: query === '(min-width: 768px)',
    media: query,
    onchange: null,
    addListener: vi.fn(),
    removeListener: vi.fn(),
    addEventListener: vi.fn(),
    removeEventListener: vi.fn(),
    dispatchEvent: vi.fn(),
  })),
})

describe('ResponsiveTable', () => {
  type TestItem = { id: string; name: string; price: number }
  const columns = [
    { key: 'name', header: 'Name', accessor: (item: TestItem) => item.name },
    { key: 'price', header: 'Price', accessor: (item: TestItem) => `$${item.price}` },
  ]

  const data = [
    { id: '1', name: 'Product A', price: 100 },
    { id: '2', name: 'Product B', price: 200 },
  ]

  it('renders empty message when no data', () => {
    render(
      <ResponsiveTable
        columns={columns}
        data={[]}
        keyExtractor={(item) => item.id}
        emptyMessage="No products found"
      />
    )
    expect(screen.getByText('No products found')).toBeInTheDocument()
  })

  it('renders table headers', () => {
    render(
      <ResponsiveTable
        columns={columns}
        data={data}
        keyExtractor={(item) => item.id}
      />
    )
    // Both desktop and mobile views render, so use getAllByText
    expect(screen.getAllByText('Name').length).toBeGreaterThan(0)
    expect(screen.getAllByText('Price').length).toBeGreaterThan(0)
  })

  it('renders data in table format', () => {
    render(
      <ResponsiveTable
        columns={columns}
        data={data}
        keyExtractor={(item) => item.id}
      />
    )
    // Both desktop and mobile views render, so use getAllByText
    expect(screen.getAllByText('Product A').length).toBeGreaterThan(0)
    expect(screen.getAllByText('$100').length).toBeGreaterThan(0)
  })

  it('has proper ARIA attributes', () => {
    render(
      <ResponsiveTable
        columns={columns}
        data={data}
        keyExtractor={(item) => item.id}
        aria-label="Product table"
      />
    )
    const table = screen.getByRole('table')
    expect(table).toHaveAttribute('aria-label', 'Product table')
  })

  it('calls onRowClick when row is clicked', () => {
    const handleClick = vi.fn()
    render(
      <ResponsiveTable
        columns={columns}
        data={data}
        keyExtractor={(item) => item.id}
        onRowClick={handleClick}
      />
    )

    // Find the table row (desktop view) - use getAllByText since both desktop/mobile might render
    const productTexts = screen.getAllByText('Product A')
    const tableRow = productTexts[0]?.closest('tr')
    if (tableRow) {
      fireEvent.click(tableRow)
      expect(handleClick).toHaveBeenCalledWith(data[0])
    }
  })

  it('handles keyboard navigation on rows', () => {
    const handleClick = vi.fn()
    render(
      <ResponsiveTable
        columns={columns}
        data={data}
        keyExtractor={(item) => item.id}
        onRowClick={handleClick}
      />
    )

    // Find the table row (desktop view) - use getAllByText since both desktop/mobile might render
    const productTexts = screen.getAllByText('Product A')
    const tableRow = productTexts[0]?.closest('tr')
    if (tableRow) {
      fireEvent.keyDown(tableRow, { key: 'Enter' })
      expect(handleClick).toHaveBeenCalledWith(data[0])
    }
  })
})

