/**
 * User Menu Component
 *
 * Displays user info and sign out button
 */

import { getServerSession, authOptions } from '@/lib/auth'
import { signOut } from 'next-auth/react'
import SignOutButton from './SignOutButton'

export async function UserMenu() {
  const session = await getServerSession(authOptions)

  if (!session?.user) {
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
