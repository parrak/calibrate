'use client'

import { useSearchParams, useRouter } from 'next/navigation'
import Link from 'next/link'

export default function SelectPlatform() {
  const searchParams = useSearchParams()
  const router = useRouter()
  const projectSlug = searchParams.get('project')

  if (!projectSlug) {
    router.push('/onboarding')
    return null
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 px-4">
      <div className="max-w-3xl w-full">
        <div className="bg-white rounded-lg shadow-lg p-8 md:p-12">
          <div className="mb-8">
            <div className="text-sm text-gray-500 mb-2">Step 2 of 2</div>
            <h1 className="text-2xl font-bold text-gray-900">Connect a platform</h1>
            <p className="text-gray-600 mt-2">
              Which platform do you want to connect first?
            </p>
          </div>

          <div className="grid md:grid-cols-2 gap-6 mb-8">
            {/* Shopify Card */}
            <Link
              href={`/p/${projectSlug}/integrations/shopify/install`}
              className="block border-2 border-gray-200 rounded-lg p-6 hover:border-blue-500 hover:shadow-md transition-all group"
            >
              <div className="text-4xl mb-4">🛍️</div>
              <h3 className="text-xl font-semibold text-gray-900 mb-2 group-hover:text-blue-600">
                Shopify
              </h3>
              <p className="text-gray-600 mb-4">
                Connect your Shopify store to sync products and manage pricing
              </p>
              <div className="text-sm text-gray-500">
                <div>✓ OAuth connection (2 min)</div>
                <div>✓ Automatic product sync</div>
                <div>✓ Real-time price updates</div>
              </div>
            </Link>

            {/* Amazon Card */}
            <Link
              href={`/p/${projectSlug}/integrations/amazon/pricing`}
              className="block border-2 border-gray-200 rounded-lg p-6 hover:border-blue-500 hover:shadow-md transition-all group"
            >
              <div className="text-4xl mb-4">📦</div>
              <h3 className="text-xl font-semibold text-gray-900 mb-2 group-hover:text-blue-600">
                Amazon
              </h3>
              <p className="text-gray-600 mb-4">
                Connect your Amazon Seller account via SP-API credentials
              </p>
              <div className="text-sm text-gray-500">
                <div>✓ SP-API setup (3 min)</div>
                <div>✓ Catalog import</div>
                <div>✓ Price feed updates</div>
              </div>
            </Link>
          </div>

          <div className="text-center pt-6 border-t border-gray-200">
            <p className="text-gray-600 mb-4">You can add more platforms later</p>
            <Link
              href={`/p/${projectSlug}`}
              className="text-blue-600 hover:text-blue-700 font-medium"
            >
              Skip for now →
            </Link>
          </div>
        </div>
      </div>
    </div>
  )
}
