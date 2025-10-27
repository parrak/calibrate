/**
 * Login Page
 *
 * Simple email-based login for Calibrate Console
 */

import { redirect } from 'next/navigation'
import { getServerSession, authOptions } from '@/lib/auth'
import LoginForm from '@/components/LoginForm'

export default async function LoginPage({ searchParams }: { searchParams?: { callbackUrl?: string; error?: string } }) {
  // If already logged in, redirect to home
  const session = await getServerSession(authOptions)
  if (session) {
    redirect('/')
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-100">
      <div className="bg-white p-8 rounded-lg shadow-xl w-full max-w-md">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            Calibrate Console
          </h1>
          <p className="text-gray-600">
            Smart pricing platform for enterprise
          </p>
        </div>

        <LoginForm callbackUrl={searchParams?.callbackUrl} />

        <div className="mt-6 text-center">
          <p className="text-sm text-gray-600">
            Demo mode: Enter any email to sign in
          </p>
          {searchParams?.error && (
            <p className="text-sm text-red-600 mt-2">{decodeURIComponent(searchParams.error)}</p>
          )}
        </div>

        <div className="mt-8 pt-6 border-t border-gray-200">
          <div className="text-xs text-gray-500 space-y-1">
            <p className="font-semibold text-gray-700 mb-2">
              Quick access:
            </p>
            <p>• admin@calibr.lat - Admin user</p>
            <p>• demo@calibr.lat - Demo user</p>
          </div>
        </div>
      </div>
    </div>
  )
}
