/**
 * ProgressBar Component Tests
 * M1.7: Snapshot and unit tests for progress indicators
 */

import { render, screen } from '@testing-library/react'
import { describe, it, expect } from 'vitest'
import { ProgressBar, ProgressRing } from './ProgressBar'

describe('ProgressBar', () => {
  it('renders with default props', () => {
    const { container } = render(<ProgressBar value={50} />)
    expect(container.firstChild).toMatchSnapshot()
  })

  it('renders with label', () => {
    const { container } = render(<ProgressBar value={75} showLabel />)
    expect(container.firstChild).toMatchSnapshot()
    expect(screen.getByText('75%')).toBeInTheDocument()
  })

  it('renders with custom max value', () => {
    render(<ProgressBar value={25} max={50} showLabel />)
    expect(screen.getByText('50%')).toBeInTheDocument() // 25/50 = 50%
  })

  it('renders with small size', () => {
    const { container } = render(<ProgressBar value={30} size="sm" />)
    expect(container.querySelector('.h-1')).toBeInTheDocument()
  })

  it('renders with medium size (default)', () => {
    const { container } = render(<ProgressBar value={30} size="md" />)
    expect(container.querySelector('.h-2')).toBeInTheDocument()
  })

  it('renders with large size', () => {
    const { container } = render(<ProgressBar value={30} size="lg" />)
    expect(container.querySelector('.h-3')).toBeInTheDocument()
  })

  it('renders with success variant', () => {
    const { container } = render(<ProgressBar value={30} variant="success" />)
    expect(container.querySelector('.bg-emerald-600')).toBeInTheDocument()
  })

  it('renders with warning variant', () => {
    const { container } = render(<ProgressBar value={30} variant="warning" />)
    expect(container.querySelector('.bg-yellow-600')).toBeInTheDocument()
  })

  it('renders with error variant', () => {
    const { container } = render(<ProgressBar value={30} variant="error" />)
    expect(container.querySelector('.bg-red-600')).toBeInTheDocument()
  })

  it('auto-switches to success when complete', () => {
    const { container } = render(<ProgressBar value={100} variant="default" />)
    expect(container.querySelector('.bg-emerald-600')).toBeInTheDocument()
  })

  it('clamps value to 0-100 range', () => {
    const { rerender } = render(<ProgressBar value={-10} max={100} showLabel />)
    expect(screen.getByText('0%')).toBeInTheDocument()

    rerender(<ProgressBar value={150} max={100} showLabel />)
    expect(screen.getByText('100%')).toBeInTheDocument()
  })

  it('has proper ARIA attributes', () => {
    render(<ProgressBar value={60} max={100} />)
    const progressbar = screen.getByRole('progressbar')
    expect(progressbar).toHaveAttribute('aria-valuenow', '60')
    expect(progressbar).toHaveAttribute('aria-valuemin', '0')
    expect(progressbar).toHaveAttribute('aria-valuemax', '100')
  })
})

describe('ProgressRing', () => {
  it('renders with default props', () => {
    const { container } = render(<ProgressRing value={50} />)
    expect(container.firstChild).toMatchSnapshot()
  })

  it('renders with label', () => {
    const { container } = render(<ProgressRing value={75} showLabel />)
    expect(container.firstChild).toMatchSnapshot()
    expect(screen.getByText('75%')).toBeInTheDocument()
  })

  it('renders with custom size', () => {
    const { container } = render(<ProgressRing value={50} size={60} />)
    const svg = container.querySelector('svg')
    expect(svg).toHaveAttribute('width', '60')
    expect(svg).toHaveAttribute('height', '60')
  })

  it('renders with custom stroke width', () => {
    const { container } = render(<ProgressRing value={50} strokeWidth={6} />)
    const circles = container.querySelectorAll('circle')
    circles.forEach((circle) => {
      expect(circle).toHaveAttribute('stroke-width', '6')
    })
  })

  it('renders with success variant', () => {
    const { container } = render(<ProgressRing value={30} variant="success" />)
    const progressCircle = container.querySelectorAll('circle')[1]
    expect(progressCircle).toHaveAttribute('stroke', '#10b981')
  })

  it('renders with warning variant', () => {
    const { container } = render(<ProgressRing value={30} variant="warning" />)
    const progressCircle = container.querySelectorAll('circle')[1]
    expect(progressCircle).toHaveAttribute('stroke', '#f59e0b')
  })

  it('renders with error variant', () => {
    const { container } = render(<ProgressRing value={30} variant="error" />)
    const progressCircle = container.querySelectorAll('circle')[1]
    expect(progressCircle).toHaveAttribute('stroke', '#ef4444')
  })

  it('auto-switches to success color when complete', () => {
    const { container } = render(<ProgressRing value={100} variant="default" />)
    const progressCircle = container.querySelectorAll('circle')[1]
    expect(progressCircle).toHaveAttribute('stroke', '#10b981') // success color
  })

  it('has proper ARIA attributes', () => {
    render(<ProgressRing value={60} max={100} />)
    const progressbar = screen.getByRole('progressbar')
    expect(progressbar).toHaveAttribute('aria-valuenow', '60')
    expect(progressbar).toHaveAttribute('aria-valuemin', '0')
    expect(progressbar).toHaveAttribute('aria-valuemax', '100')
  })

  it('calculates circumference correctly', () => {
    const { container } = render(<ProgressRing value={50} size={40} strokeWidth={4} />)
    const progressCircle = container.querySelectorAll('circle')[1]
    const strokeDasharray = progressCircle.getAttribute('stroke-dasharray')

    // radius = (40 - 4) / 2 = 18
    // circumference = 18 * 2 * PI ≈ 113.1
    expect(parseFloat(strokeDasharray || '')).toBeCloseTo(113.1, 1)
  })
})
