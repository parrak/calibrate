/**
 * Login Page
 *
 * Simple email-based login for Calibrate Console
 */

import Link from 'next/link'
import LoginForm from '@/components/LoginForm'

export default function LoginPage({ searchParams }: { searchParams?: { callbackUrl?: string; error?: string } }) {
  // Middleware handles redirect if already authenticated

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

        <div className="mt-6 text-center space-y-3">
          <p className="text-sm text-gray-600">
            Need an account?{' '}
            <Link href="/signup" className="font-medium text-blue-600 hover:text-blue-500">
              Create one now
            </Link>
          </p>
          {searchParams?.error && (
            <p className="text-sm text-red-600">{decodeURIComponent(searchParams.error)}</p>
          )}
        </div>

        <div className="mt-8 pt-6 border-t border-gray-200">
          <details className="text-xs text-gray-500">
            <summary className="font-semibold text-gray-700 mb-2 cursor-pointer hover:text-blue-600 transition-colors">
              Demo Credentials (click to show)
            </summary>
            <div className="mt-2 space-y-1 ml-2">
              <p>• <span className="font-mono">admin@calibr.lat</span> / <span className="font-mono">Admin1234!</span> - Admin user</p>
              <p>• <span className="font-mono">demo@calibr.lat</span> / <span className="font-mono">Demo1234!</span> - Demo user</p>
            </div>
          </details>
        </div>
      </div>
    </div>
  )
}
