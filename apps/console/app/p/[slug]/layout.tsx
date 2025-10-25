import { notFound } from 'next/navigation'
import Link from 'next/link'

// For now, we'll hardcode the demo project
// In a real app, this would fetch from the database
const DEMO_PROJECT = {
  id: 'demo',
  name: 'Demo Project',
  slug: 'demo'
}

export default function ProjectLayout({
  children,
  params,
}: {
  children: React.ReactNode
  params: { slug: string }
}) {
  // For now, only allow the demo project
  if (params.slug !== 'demo') {
    notFound()
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="bg-white shadow">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-16">
            <div className="flex">
              <div className="flex-shrink-0 flex items-center">
                <Link href="/" className="text-xl font-bold text-gray-900">
                  Calibr
                </Link>
              </div>
              <nav className="hidden sm:ml-6 sm:flex sm:space-x-8">
                <Link
                  href={`/p/${params.slug}`}
                  className="border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300 whitespace-nowrap py-2 px-1 border-b-2 font-medium text-sm"
                >
                  Dashboard
                </Link>
                <Link
                  href={`/p/${params.slug}/price-changes`}
                  className="border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300 whitespace-nowrap py-2 px-1 border-b-2 font-medium text-sm"
                >
                  Price Changes
                </Link>
                <Link
                  href={`/p/${params.slug}/catalog`}
                  className="border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300 whitespace-nowrap py-2 px-1 border-b-2 font-medium text-sm"
                >
                  Catalog
                </Link>
                <Link
                  href={`/p/${params.slug}/competitors`}
                  className="border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300 whitespace-nowrap py-2 px-1 border-b-2 font-medium text-sm"
                >
                  Competitors
                </Link>
              </nav>
            </div>
            <div className="flex items-center">
              <span className="text-sm text-gray-500">
                {DEMO_PROJECT.name}
              </span>
            </div>
          </div>
        </div>
      </div>
      <main>{children}</main>
    </div>
  )
}
