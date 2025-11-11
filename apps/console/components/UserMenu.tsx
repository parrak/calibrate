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
    <div className="flex items-center gap-3 sm:gap-4">
      {/* Desktop view - full user info */}
      <div className="hidden md:flex items-center gap-3">
        <div className="text-right">
          <div className="text-sm font-semibold leading-tight" style={{ color: 'var(--text-strong)' }}>
            {session.user.name || session.user.email}
          </div>
          <div className="text-xs capitalize leading-tight" style={{ color: 'var(--mute)' }}>
            {session.user.role}
          </div>
        </div>
      </div>

      {/* Tablet view - shorter name */}
      <div className="hidden sm:flex md:hidden items-center">
        <div className="text-sm font-semibold" style={{ color: 'var(--text-strong)' }}>
          {session.user.name?.split(' ')[0] || session.user.email?.split('@')[0]}
        </div>
      </div>

      {/* Mobile view - initial only */}
      <div className="flex sm:hidden items-center">
        <div className="text-sm font-semibold" style={{ color: 'var(--text-strong)' }}>
          {(session.user.name?.[0] || session.user.email?.[0] || '').toUpperCase()}
        </div>
      </div>

      <SignOutButton />
    </div>
  )
}
