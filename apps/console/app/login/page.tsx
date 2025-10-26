/**
 * Login Page
 *
 * Simple email-based login for Calibrate Console
 */

import { signIn } from '@/lib/auth'
import { redirect } from 'next/navigation'

export default function LoginPage() {
  async function handleLogin(formData: FormData) {
    'use server'

    const email = formData.get('email')

    if (!email || typeof email !== 'string') {
      return
    }

    await signIn('credentials', {
      email,
      redirectTo: '/',
    })
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

        <form action={handleLogin} className="space-y-6">
          <div>
            <label
              htmlFor="email"
              className="block text-sm font-medium text-gray-700 mb-2"
            >
              Email Address
            </label>
            <input
              type="email"
              id="email"
              name="email"
              required
              placeholder="you@company.com"
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition"
            />
          </div>

          <button
            type="submit"
            className="w-full bg-blue-600 text-white py-3 px-4 rounded-lg font-semibold hover:bg-blue-700 focus:ring-4 focus:ring-blue-300 transition"
          >
            Sign In
          </button>
        </form>

        <div className="mt-6 text-center">
          <p className="text-sm text-gray-600">
            Demo mode: Enter any email to sign in
          </p>
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
