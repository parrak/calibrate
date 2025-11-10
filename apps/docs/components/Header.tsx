import Link from 'next/link'

export function Header() {
  return (
    <header className="sticky top-0 z-30 bg-white border-b border-gray-200">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          <div className="flex items-center gap-4">
            <Link
              href="/"
              className="text-gray-900 hover:text-gray-700 transition-colors font-semibold"
            >
              Documentation
            </Link>
          </div>
          <div className="flex items-center gap-4">
            <a
              href="https://console.calibr.lat"
              target="_blank"
              rel="noopener noreferrer"
              className="text-sm text-gray-600 hover:text-gray-900 transition-colors"
            >
              Console →
            </a>
            <a
              href="https://calibr.lat"
              target="_blank"
              rel="noopener noreferrer"
              className="text-sm text-gray-600 hover:text-gray-900 transition-colors"
            >
              Home →
            </a>
          </div>
        </div>
      </div>
    </header>
  )
}

