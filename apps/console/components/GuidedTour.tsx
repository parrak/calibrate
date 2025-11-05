'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'

interface GuidedTourProps {
  projectSlug?: string
}

export function GuidedTour({ projectSlug }: GuidedTourProps) {
  const [show, setShow] = useState(false)

  useEffect(() => {
    if (typeof window === 'undefined') return
    if (!localStorage.getItem('tourSeen')) {
      // Small delay for better UX
      const timer = setTimeout(() => setShow(true), 500)
      return () => clearTimeout(timer)
    }
  }, [])

  const handleDismiss = () => {
    if (typeof window !== 'undefined') {
      localStorage.setItem('tourSeen', '1')
    }
    setShow(false)
  }

  if (!show) return null

  return (
    <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center z-[9999] p-4" onClick={handleDismiss}>
      <div className="w-full max-w-2xl rounded-2xl border border-border bg-surface shadow-2xl relative z-[10000]" onClick={(e) => e.stopPropagation()}>
        <div className="p-8">
          <div className="flex items-start justify-between mb-6">
            <div>
              <h2 className="text-2xl font-bold text-fg">Welcome to Calibrate</h2>
              <p className="text-sm text-mute mt-2">Your intelligent pricing automation platform</p>
            </div>
            <button
              onClick={handleDismiss}
              className="text-mute hover:text-fg transition-colors"
              aria-label="Close tour"
            >
              <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>

          <div className="space-y-6">
            <p className="text-fg">
              Review price changes, approve with confidence, and see impact instantly.
              Here's how to get started:
            </p>

            <div className="grid gap-4">
              <TourStep
                number={1}
                title="Dashboard"
                description="Monitor pending changes, AI suggestions, and system health at a glance."
                href={projectSlug ? `/p/${projectSlug}` : undefined}
              />
              <TourStep
                number={2}
                title="Price Changes"
                description="Review suggested price updates. Approve or reject with guardrails protecting your margins."
                href={projectSlug ? `/p/${projectSlug}/price-changes` : undefined}
              />
              <TourStep
                number={3}
                title="Analytics"
                description="Track price change impact, margin trends, and optimization opportunities."
                href={projectSlug ? `/p/${projectSlug}/analytics` : undefined}
              />
            </div>

            <div className="pt-4 border-t border-border">
              <p className="text-sm text-mute mb-4">
                Need help? Check the{' '}
                <a
                  href="https://docs.calibr.lat"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-brand hover:underline"
                >
                  documentation
                </a>{' '}
                or reach out to support.
              </p>
              <button
                onClick={handleDismiss}
                className="w-full px-6 py-3 rounded-lg bg-brand text-black font-semibold hover:bg-brand/90 transition-all shadow-lg shadow-brand/25"
              >
                Got it, let's start
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

function TourStep({
  number,
  title,
  description,
  href,
}: {
  number: number
  title: string
  description: string
  href?: string
}) {
  return (
    <div className="flex gap-4 p-4 rounded-xl bg-bg border border-border hover:border-brand/30 transition-all group">
      <div className="flex-shrink-0 w-8 h-8 rounded-full bg-brand/20 text-brand flex items-center justify-center font-bold text-sm">
        {number}
      </div>
      <div className="flex-1">
        <div className="flex items-center justify-between mb-1">
          <h3 className="font-semibold text-fg">{title}</h3>
          {href && (
            <Link
              href={href}
              className="text-brand text-sm opacity-0 group-hover:opacity-100 transition-opacity hover:underline"
            >
              Go →
            </Link>
          )}
        </div>
        <p className="text-sm text-mute leading-relaxed">{description}</p>
      </div>
    </div>
  )
}

