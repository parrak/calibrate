import { describe, it, expect } from 'vitest'
import { render, screen } from '@testing-library/react'
import { StatusPill } from './StatusPill'

describe('StatusPill', () => {
  it('renders status text', () => {
    render(<StatusPill status="PENDING" />)
    expect(screen.getByText('PENDING')).toBeInTheDocument()
  })

  it('applies correct styles for PENDING', () => {
    render(<StatusPill status="PENDING" />)
    const pill = screen.getByText('PENDING')
    expect(pill).toHaveClass('bg-yellow-500')
    expect(pill).toHaveClass('text-yellow-950')
  })

  it('applies correct styles for APPROVED', () => {
    render(<StatusPill status="APPROVED" />)
    const pill = screen.getByText('APPROVED')
    expect(pill).toHaveClass('bg-blue-600')
    expect(pill).toHaveClass('text-blue-50')
  })

  it('applies correct styles for APPLIED', () => {
    render(<StatusPill status="APPLIED" />)
    const pill = screen.getByText('APPLIED')
    expect(pill).toHaveClass('bg-green-600')
    expect(pill).toHaveClass('text-green-50')
  })

  it('applies correct styles for REJECTED', () => {
    render(<StatusPill status="REJECTED" />)
    const pill = screen.getByText('REJECTED')
    expect(pill).toHaveClass('bg-gray-600')
    expect(pill).toHaveClass('text-gray-50')
  })

  it('applies correct styles for FAILED', () => {
    render(<StatusPill status="FAILED" />)
    const pill = screen.getByText('FAILED')
    expect(pill).toHaveClass('bg-red-600')
    expect(pill).toHaveClass('text-red-50')
  })

  it('applies correct styles for ROLLED_BACK', () => {
    render(<StatusPill status="ROLLED_BACK" />)
    const pill = screen.getByText('ROLLED_BACK')
    expect(pill).toHaveClass('bg-orange-600')
    expect(pill).toHaveClass('text-orange-50')
  })

  it('has proper ARIA attributes', () => {
    render(<StatusPill status="PENDING" />)
    const pill = screen.getByText('PENDING')
    expect(pill).toHaveAttribute('role', 'status')
    expect(pill).toHaveAttribute('aria-label', 'Status: PENDING')
  })

  it('handles unknown status with default styles', () => {
    render(<StatusPill status="UNKNOWN" />)
    const pill = screen.getByText('UNKNOWN')
    expect(pill).toHaveClass('bg-gray-600')
    expect(pill).toHaveClass('text-gray-50')
  })
})
