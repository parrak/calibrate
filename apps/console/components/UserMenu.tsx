/**
 * User Menu Component
 *
 * Displays user info and sign out button
 */

import { getServerSession, authOptions } from '@/lib/auth'
import SignOutButton from './SignOutButton'

export async function UserMenu() {
  const session = await getServerSession(authOptions)

  // Only return null if definitely not authenticated
  if (!session?.user) {
    return null
  }

  return (
    <div className="flex items-center gap-2 sm:gap-4">
      <div className="text-right hidden sm:block">
        <div className="text-sm font-medium text-gray-900">
          {session.user.name || session.user.email}
        </div>
        <div className="text-xs text-gray-500">{session.user.role}</div>
      </div>
      <div className="text-right sm:hidden">
        <div className="text-xs font-medium text-gray-900 truncate max-w-[80px]">
          {session.user.name?.split(' ')[0] || session.user.email?.split('@')[0]}
        </div>
      </div>

      <SignOutButton />
    </div>
  )
}
