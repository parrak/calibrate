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
          <div className="flex justify-between items-center h-16">
            <nav className="flex-1 flex justify-center space-x-1">
              <Link
                href={`/p/${params.slug}`}
                className="px-4 py-2 rounded-md text-sm font-medium text-gray-700 hover:bg-gray-100 hover:text-gray-900 transition-colors"
              >
                Dashboard
              </Link>
              <Link
                href={`/p/${params.slug}/price-changes`}
                className="px-4 py-2 rounded-md text-sm font-medium text-gray-700 hover:bg-gray-100 hover:text-gray-900 transition-colors"
              >
                Price Changes
              </Link>
              <Link
                href={`/p/${params.slug}/catalog`}
                className="px-4 py-2 rounded-md text-sm font-medium text-gray-700 hover:bg-gray-100 hover:text-gray-900 transition-colors"
              >
                Catalog
              </Link>
              <Link
                href={`/p/${params.slug}/competitors`}
                className="px-4 py-2 rounded-md text-sm font-medium text-gray-700 hover:bg-gray-100 hover:text-gray-900 transition-colors"
              >
                Competitors
              </Link>
            </nav>
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
