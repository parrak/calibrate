'use client'

import { useEffect, useState } from 'react'

export function GuidedTour() {
  const [show, setShow] = useState(false)

  useEffect(() => {
    if (typeof window === 'undefined') return
    if (!localStorage.getItem('tourSeen')) {
      setShow(true)
    }
  }, [])

  if (!show) return null

  return (
    <div className="fixed inset-0 bg-black/40 backdrop-blur-sm flex items-center justify-center z-50">
      <div className="w-[520px] rounded-xl border border-border bg-surface p-6">
        <h2 className="text-xl font-semibold">Welcome to Calibrate</h2>
        <p className="text-sm text-mute mt-2">
          Review price changes, approve with confidence, and see impact instantly.
        </p>
        <ul className="mt-4 list-disc ml-6 text-sm text-mute space-y-1">
          <li>
            Start at <b>Dashboard</b> to see what matters.
          </li>
          <li>
            Open <b>Price Changes</b> to approve/apply with guardrails.
          </li>
          <li>
            Visit <b>Analytics</b> to track margin impact.
          </li>
        </ul>
        <button
          className="mt-6 px-4 py-2 rounded-md bg-brand text-black font-medium hover:bg-brand/90 transition-colors"
          onClick={() => {
            if (typeof window !== 'undefined') {
              localStorage.setItem('tourSeen', '1')
            }
            setShow(false)
          }}
        >
          Got it
        </button>
      </div>
    </div>
  )
}

