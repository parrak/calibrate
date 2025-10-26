/**
 * User Menu Component
 *
 * Displays user info and sign out button
 */

import { auth, signOut } from '@/lib/auth'

export async function UserMenu() {
  const session = await auth()

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

      <form
        action={async () => {
          'use server'
          await signOut({ redirectTo: '/login' })
        }}
      >
        <button
          type="submit"
          className="text-sm text-gray-600 hover:text-gray-900 px-3 py-1 rounded hover:bg-gray-100 transition"
        >
          Sign Out
        </button>
      </form>
    </div>
  )
}
