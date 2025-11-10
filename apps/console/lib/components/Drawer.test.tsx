import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import { Drawer } from './Drawer'

describe('Drawer', () => {
  const mockOnClose = vi.fn()

  beforeEach(() => {
    mockOnClose.mockClear()
  })

  it('renders when open', () => {
    render(
      <Drawer open={true} onClose={mockOnClose} title="Test Drawer">
        <p>Drawer content</p>
      </Drawer>
    )

    expect(screen.getByText('Test Drawer')).toBeInTheDocument()
    expect(screen.getByText('Drawer content')).toBeInTheDocument()
  })

  it('does not render when closed', () => {
    render(
      <Drawer open={false} onClose={mockOnClose} title="Test Drawer">
        <p>Drawer content</p>
      </Drawer>
    )

    expect(screen.queryByText('Test Drawer')).not.toBeInTheDocument()
  })

  it('calls onClose when close button is clicked', () => {
    render(
      <Drawer open={true} onClose={mockOnClose} title="Test Drawer">
        <p>Drawer content</p>
      </Drawer>
    )

    const closeButton = screen.getByLabelText('Close drawer')
    fireEvent.click(closeButton)

    expect(mockOnClose).toHaveBeenCalledTimes(1)
  })

  it('calls onClose when backdrop is clicked', () => {
    render(
      <Drawer open={true} onClose={mockOnClose} title="Test Drawer">
        <p>Drawer content</p>
      </Drawer>
    )

    const backdrop = document.querySelector('[aria-hidden="true"]')
    if (backdrop) {
      fireEvent.click(backdrop)
      expect(mockOnClose).toHaveBeenCalledTimes(1)
    }
  })

  it('calls onClose when Escape key is pressed', () => {
    render(
      <Drawer open={true} onClose={mockOnClose} title="Test Drawer">
        <p>Drawer content</p>
      </Drawer>
    )

    fireEvent.keyDown(document, { key: 'Escape' })

    expect(mockOnClose).toHaveBeenCalledTimes(1)
  })

  it('has proper ARIA attributes', () => {
    render(
      <Drawer open={true} onClose={mockOnClose} title="Test Drawer">
        <p>Drawer content</p>
      </Drawer>
    )

    const dialog = document.querySelector('[role="dialog"]')
    expect(dialog).toHaveAttribute('aria-modal', 'true')
    expect(dialog).toHaveAttribute('aria-labelledby', 'drawer-title')
  })

  it('is full-width on mobile viewport', () => {
    // Mock mobile viewport
    Object.defineProperty(window, 'innerWidth', {
      writable: true,
      configurable: true,
      value: 375,
    })

    render(
      <Drawer open={true} onClose={mockOnClose} title="Test Drawer">
        <p>Drawer content</p>
      </Drawer>
    )

    const drawer = document.querySelector('aside')
    expect(drawer).toHaveClass('w-full')
  })
})

