import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen } from '@testing-library/react'
import { usePathname } from 'next/navigation'
import { Sidebar } from './Sidebar'

// Mock next/navigation
vi.mock('next/navigation', () => ({
  usePathname: vi.fn(),
}))

describe('Sidebar', () => {
  beforeEach(() => {
    vi.mocked(usePathname).mockReturnValue('/console/getting-started')
  })

  it('renders navigation links', () => {
    render(<Sidebar />)

    expect(screen.getByAltText('Calibrate')).toBeInTheDocument()
    expect(screen.getByText('Overview')).toBeInTheDocument()
    expect(screen.getByText('Getting Started')).toBeInTheDocument()
    expect(screen.getByText('Product Catalog')).toBeInTheDocument()
  })

  it('renders section headers', () => {
    render(<Sidebar />)

    expect(screen.getByText('Core Features')).toBeInTheDocument()
    expect(screen.getByText('Intelligence & Insights')).toBeInTheDocument()
    expect(screen.getByText('Reference & Help')).toBeInTheDocument()
  })

  it('has mobile menu button', () => {
    render(<Sidebar />)

    const menuButton = screen.getByLabelText('Toggle menu')
    expect(menuButton).toBeInTheDocument()
  })
})

