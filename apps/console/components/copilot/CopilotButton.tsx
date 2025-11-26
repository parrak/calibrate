'use client'

/**
 * Copilot Floating Action Button — M1.4
 *
 * A floating button that triggers the Copilot drawer
 * Can be placed on any page in the console
 */

import { useState } from 'react'
import { CopilotDrawer } from './CopilotDrawer'

interface CopilotButtonProps {
  projectSlug: string
  apiBase?: string
  position?: 'bottom-right' | 'bottom-left' | 'top-right' | 'top-left'
}

export function CopilotButton({
  projectSlug,
  apiBase,
  position = 'bottom-right',
}: CopilotButtonProps) {
  const [isOpen, setIsOpen] = useState(false)

  const positionClasses = {
    'bottom-right': 'bottom-6 right-6',
    'bottom-left': 'bottom-6 left-6',
    'top-right': 'top-6 right-6',
    'top-left': 'top-6 left-6',
  }

  return (
    <>
      {/* Floating Action Button */}
      <button
        onClick={() => setIsOpen(true)}
        className={`fixed ${positionClasses[position]} z-30 group`}
        aria-label="Open Copilot"
      >
        <div className="relative">
          {/* Pulse animation */}
          <span className="absolute inset-0 rounded-full bg-blue-600 opacity-75 animate-ping" />

          {/* Button */}
          <div className="relative flex items-center gap-3 px-5 py-3 rounded-full bg-blue-600 hover:bg-blue-700 text-white shadow-lg hover:shadow-xl transition-all">
            <svg
              className="w-5 h-5"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z"
              />
            </svg>
            <span className="font-medium hidden sm:inline">Ask Copilot</span>
          </div>
        </div>
      </button>

      {/* Drawer */}
      <CopilotDrawer
        isOpen={isOpen}
        onClose={() => setIsOpen(false)}
        projectSlug={projectSlug}
        apiBase={apiBase}
      />
    </>
  )
}
