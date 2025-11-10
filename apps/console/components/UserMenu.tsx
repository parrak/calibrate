/**
 * User Menu Component
 *
 * Displays user info and sign out button
 */

'use client'

import { useSession } from 'next-auth/react'
import SignOutButton from './SignOutButton'

export function UserMenu() {
  const { data: session, status } = useSession()

  // Don't show anything while loading or if not authenticated
  if (status === 'loading' || !session?.user) {
    return null
  }

  return (
    <div className="flex items-center gap-4">
      <div className="text-right">
        <div className="text-sm font-medium text-gray-900">
          {session.user.name || session.user.email}
        </div>
        <div className="text-xs text-gray-500">{session.user.role}</div>
      </div>

      <SignOutButton />
    </div>
  )
}
