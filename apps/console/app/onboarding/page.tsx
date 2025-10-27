import Link from 'next/link'
import { auth } from '@/lib/auth'
import { redirect } from 'next/navigation'

export default async function OnboardingWelcome() {
  const session = await auth()

  if (!session?.user) {
    redirect('/login')
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 px-4">
      <div className="max-w-2xl w-full">
        <div className="bg-white rounded-lg shadow-lg p-8 md:p-12">
          <h1 className="text-3xl font-bold text-gray-900 mb-4">
            Welcome to Calibrate, {session.user.name || session.user.email}!
          </h1>

          <p className="text-lg text-gray-600 mb-8">
            Let's set up your first project. You'll be able to:
          </p>

          <ul className="space-y-3 mb-10 text-gray-700">
            <li className="flex items-start">
              <span className="text-blue-600 mr-3">✓</span>
              <span>Connect your Shopify or Amazon stores</span>
            </li>
            <li className="flex items-start">
              <span className="text-blue-600 mr-3">✓</span>
              <span>Monitor competitor prices automatically</span>
            </li>
            <li className="flex items-start">
              <span className="text-blue-600 mr-3">✓</span>
              <span>Manage pricing changes in one place</span>
            </li>
            <li className="flex items-start">
              <span className="text-blue-600 mr-3">✓</span>
              <span>Track revenue impact of price updates</span>
            </li>
          </ul>

          <div className="flex flex-col sm:flex-row gap-4">
            <Link
              href="/onboarding/project"
              className="flex-1 bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700 transition-colors font-medium text-center"
            >
              Get Started
            </Link>
            <Link
              href="/p/demo"
              className="flex-1 border border-gray-300 text-gray-700 px-6 py-3 rounded-lg hover:bg-gray-50 transition-colors font-medium text-center"
            >
              Or start with demo project →
            </Link>
          </div>
        </div>
      </div>
    </div>
  )
}
