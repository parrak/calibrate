'use client'

import { signOut } from 'next-auth/react'

export default function SignOutButton() {
  return (
    <button
      type="button"
      onClick={() => signOut({ callbackUrl: '/login' })}
      className="text-sm px-3 py-1.5 rounded transition font-medium border"
      style={{
        color: 'var(--text-strong)',
        borderColor: 'var(--border)',
        backgroundColor: 'var(--surface)',
      }}
      onMouseEnter={(e) => {
        e.currentTarget.style.backgroundColor = 'var(--bg)'
        e.currentTarget.style.borderColor = 'var(--brand)'
        e.currentTarget.style.color = 'var(--brand)'
      }}
      onMouseLeave={(e) => {
        e.currentTarget.style.backgroundColor = 'var(--surface)'
        e.currentTarget.style.borderColor = 'var(--border)'
        e.currentTarget.style.color = 'var(--text-strong)'
      }}
    >
      Sign Out
    </button>
  )
}
