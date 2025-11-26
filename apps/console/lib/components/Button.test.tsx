import { describe, it, expect, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import { Button } from './Button'

describe('Button', () => {
  it('renders with text', () => {
    render(<Button>Click me</Button>)
    expect(screen.getByText('Click me')).toBeInTheDocument()
  })

  it('applies primary variant by default', () => {
    render(<Button>Test</Button>)
    const button = screen.getByText('Test')
    expect(button).toHaveClass('bg-brand')
  })

  it('applies danger variant', () => {
    render(<Button variant="danger">Delete</Button>)
    const button = screen.getByText('Delete')
    expect(button).toHaveClass('bg-danger')
  })

  it('applies ghost variant', () => {
    render(<Button variant="ghost">Cancel</Button>)
    const button = screen.getByText('Cancel')
    expect(button).toHaveClass('bg-surface')
  })

  it('applies outline variant', () => {
    render(<Button variant="outline">Outline</Button>)
    const button = screen.getByText('Outline')
    expect(button).toHaveClass('border-2')
  })

  it('applies size classes', () => {
    const { rerender } = render(<Button size="sm">Small</Button>)
    expect(screen.getByText('Small')).toHaveClass('text-xs')

    rerender(<Button size="md">Medium</Button>)
    expect(screen.getByText('Medium')).toHaveClass('text-sm')

    rerender(<Button size="lg">Large</Button>)
    expect(screen.getByText('Large')).toHaveClass('text-base')
  })

  it('has focus ring for accessibility', () => {
    render(<Button>Test</Button>)
    const button = screen.getByText('Test')
    expect(button).toHaveClass('focus:ring-2')
    expect(button).toHaveClass('focus:ring-offset-2')
  })

  it('handles disabled state', () => {
    render(<Button disabled>Disabled</Button>)
    const button = screen.getByText('Disabled')
    expect(button).toBeDisabled()
    expect(button).toHaveClass('disabled:opacity-50')
  })

  it('accepts custom aria-label', () => {
    render(<Button aria-label="Custom label">Icon</Button>)
    expect(screen.getByLabelText('Custom label')).toBeInTheDocument()
  })

  it('forwards other props', () => {
    const onClick = vi.fn()
    render(<Button onClick={onClick}>Click</Button>)
    screen.getByText('Click').click()
    expect(onClick).toHaveBeenCalled()
  })
})
