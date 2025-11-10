/**
 * Signup Page
 *
 * Allows users to create a Calibrate account with email and password.
 */

import Link from 'next/link'
import SignupForm from '@/components/SignupForm'

export default function SignupPage() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-100">
      <div className="w-full max-w-xl rounded-2xl bg-white p-10 shadow-xl">
        <div className="mb-8 text-center">
          <h1 className="mb-2 text-3xl font-bold text-gray-900">Create your account</h1>
          <p className="text-gray-600">Get started with Calibrate in a few seconds.</p>
        </div>

        <SignupForm />

        <div className="mt-6 text-center text-sm text-gray-600">
          Already have an account?{' '}
          <Link href="/login" className="font-medium text-blue-600 hover:text-blue-500">
            Sign in
          </Link>
        </div>
      </div>
    </div>
  )
}
