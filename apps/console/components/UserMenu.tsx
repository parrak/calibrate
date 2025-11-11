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
        <div className="text-sm font-medium" style={{ color: 'var(--text-strong)' }}>
          {session.user.name || session.user.email}
        </div>
        <div className="text-xs" style={{ color: 'var(--mute)' }}>{session.user.role}</div>
      </div>
      <div className="text-right sm:hidden">
        <div className="text-xs font-medium truncate max-w-[80px]" style={{ color: 'var(--text-strong)' }}>
          {session.user.name?.split(' ')[0] || session.user.email?.split('@')[0]}
        </div>
      </div>

      <SignOutButton />
    </div>
  )
}
