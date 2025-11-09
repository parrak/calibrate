import { describe, it, expect } from 'vitest'
import { render, screen } from '@testing-library/react'
import { AuditTrail, type AuditEvent } from './AuditTrail'

describe('AuditTrail', () => {
  const mockEvents: AuditEvent[] = [
    {
      id: '1',
      timestamp: new Date(Date.now() - 1000 * 60 * 5).toISOString(), // 5 min ago
      action: 'Price change approved',
      actor: 'admin@example.com',
      status: 'success',
    },
    {
      id: '2',
      timestamp: new Date(Date.now() - 1000 * 60 * 60).toISOString(), // 1 hour ago
      action: 'Price change applied',
      actor: 'system',
      status: 'success',
      details: { sku: 'SKU-001', amount: 2999 },
    },
    {
      id: '3',
      timestamp: new Date(Date.now() - 1000 * 60 * 60 * 24).toISOString(), // 1 day ago
      action: 'Price change rejected',
      actor: 'admin@example.com',
      status: 'error',
    },
  ]

  it('should render empty state when no events', () => {
    render(<AuditTrail events={[]} />)
    expect(screen.getByText('No audit events recorded')).toBeInTheDocument()
  })

  it('should render all events', () => {
    render(<AuditTrail events={mockEvents} />)

    expect(screen.getByText('Price change approved')).toBeInTheDocument()
    expect(screen.getByText('Price change applied')).toBeInTheDocument()
    expect(screen.getByText('Price change rejected')).toBeInTheDocument()
  })

  it('should display actor names', () => {
    render(<AuditTrail events={mockEvents} />)

    const adminActors = screen.getAllByText(/by admin@example.com/)
    expect(adminActors.length).toBeGreaterThan(0)
    expect(screen.getByText('by system')).toBeInTheDocument()
  })

  it('should show status badges', () => {
    render(<AuditTrail events={mockEvents} />)

    const successBadges = screen.getAllByText('success')
    expect(successBadges).toHaveLength(2)

    const errorBadge = screen.getByText('error')
    expect(errorBadge).toBeInTheDocument()
  })

  it('should show relative timestamps', () => {
    render(<AuditTrail events={mockEvents} />)

    expect(screen.getByText('5m ago')).toBeInTheDocument()
    expect(screen.getByText('1h ago')).toBeInTheDocument()
    expect(screen.getByText('1d ago')).toBeInTheDocument()
  })

  it('should hide details by default', () => {
    render(<AuditTrail events={mockEvents} />)

    expect(screen.queryByText('"sku"')).not.toBeInTheDocument()
    expect(screen.queryByText('"SKU-001"')).not.toBeInTheDocument()
  })

  it('should show details when showDetails is true', () => {
    render(<AuditTrail events={mockEvents} showDetails={true} />)

    expect(screen.getByText(/"sku"/)).toBeInTheDocument()
    expect(screen.getByText(/"SKU-001"/)).toBeInTheDocument()
  })

  it('should render without actor', () => {
    const eventsWithoutActor: AuditEvent[] = [
      {
        id: '1',
        timestamp: new Date().toISOString(),
        action: 'Automated price update',
        status: 'pending',
      },
    ]

    render(<AuditTrail events={eventsWithoutActor} />)

    expect(screen.getByText('Automated price update')).toBeInTheDocument()
    expect(screen.queryByText(/by /)).not.toBeInTheDocument()
  })

  it('should render without status', () => {
    const eventsWithoutStatus: AuditEvent[] = [
      {
        id: '1',
        timestamp: new Date().toISOString(),
        action: 'Price change created',
      },
    ]

    render(<AuditTrail events={eventsWithoutStatus} />)

    expect(screen.getByText('Price change created')).toBeInTheDocument()
  })

  it('should handle different time ranges', () => {
    const timeEvents: AuditEvent[] = [
      {
        id: '1',
        timestamp: new Date(Date.now() - 1000 * 30).toISOString(), // 30 sec
        action: 'Recent event',
      },
      {
        id: '2',
        timestamp: new Date(Date.now() - 1000 * 60 * 60 * 25).toISOString(), // 25 hours
        action: 'Day old event',
      },
      {
        id: '3',
        timestamp: new Date(Date.now() - 1000 * 60 * 60 * 24 * 35).toISOString(), // 35 days
        action: 'Month old event',
      },
    ]

    render(<AuditTrail events={timeEvents} />)

    expect(screen.getByText('just now')).toBeInTheDocument()
    expect(screen.getByText('1d ago')).toBeInTheDocument()
    expect(screen.getByText('1mo ago')).toBeInTheDocument()
  })
})
