import type { Metadata } from 'next'
import Link from 'next/link'
import './globals.css'
import { Sidebar } from '../components/Sidebar'

export const metadata: Metadata = {
  title: 'Calibrate Documentation',
  description: 'API documentation and guides for Calibrate pricing platform',
  icons: {
    icon: [
      { url: '/favicon.svg', type: 'image/svg+xml' },
      { url: '/favicon-32.png', sizes: '32x32', type: 'image/png' },
    ],
    apple: '/apple-touch-icon.png',
  },
  openGraph: {
    title: 'Calibrate Documentation',
    description: 'API documentation and guides for Calibrate pricing platform',
    images: '/og-image.png',
  },
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en">
      <body className="min-h-screen bg-white">
        <div className="flex flex-col min-h-screen">
          {/* Navigation Header */}
          <header className="sticky top-0 z-50 w-full border-b border-gray-200 bg-white/80 backdrop-blur-xl supports-[backdrop-filter]:bg-white/60">
            <nav className="mx-auto flex h-16 max-w-7xl items-center justify-between px-6">
              <div className="flex items-center gap-8">
                <Link href="/" className="flex items-center gap-2 font-semibold text-gray-900 hover:text-blue-600 transition-colors">
                  <svg className="h-6 w-6" viewBox="0 0 24 24" fill="none">
                    <rect x="3" y="3" width="8" height="8" rx="2" fill="currentColor" className="text-blue-600" />
                    <rect x="13" y="3" width="8" height="8" rx="2" fill="currentColor" className="text-blue-600 opacity-60" />
                    <rect x="3" y="13" width="8" height="8" rx="2" fill="currentColor" className="text-blue-600 opacity-60" />
                    <rect x="13" y="13" width="8" height="8" rx="2" fill="currentColor" className="text-blue-600" />
                  </svg>
                  <span className="text-lg">Calibrate</span>
                </Link>
                <div className="hidden md:flex items-center gap-6">
                  <Link href="/" className="text-sm text-gray-600 hover:text-gray-900 transition-colors">
                    Docs
                  </Link>
                  <Link href="/console" className="text-sm text-gray-600 hover:text-gray-900 transition-colors">
                    Console Guide
                  </Link>
                  <Link href="/api-spec" target="_blank" className="text-sm text-gray-600 hover:text-gray-900 transition-colors">
                    API Reference
                  </Link>
                </div>
              </div>
              <div className="flex items-center gap-4">
                <a
                  href="https://calibr.lat"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-sm text-gray-600 hover:text-gray-900 transition-colors"
                >
                  calibr.lat
                </a>
              </div>
            </nav>
          </header>

          {/* Main Content with Sidebar */}
          <div className="flex flex-1 overflow-hidden">
            <Sidebar />
            <main className="flex-1 overflow-y-auto min-h-[calc(100vh-4rem)]">
              {children}
            </main>
          </div>

          {/* Footer */}
          <footer className="border-t border-gray-200 bg-gray-50">
            <div className="mx-auto max-w-7xl px-6 py-12">
              <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
                <div className="md:col-span-2">
                  <div className="flex items-center gap-2 mb-4">
                    <svg className="h-6 w-6" viewBox="0 0 24 24" fill="none">
                      <rect x="3" y="3" width="8" height="8" rx="2" fill="currentColor" className="text-blue-600" />
                      <rect x="13" y="3" width="8" height="8" rx="2" fill="currentColor" className="text-blue-600 opacity-60" />
                      <rect x="3" y="13" width="8" height="8" rx="2" fill="currentColor" className="text-blue-600 opacity-60" />
                      <rect x="13" y="13" width="8" height="8" rx="2" fill="currentColor" className="text-blue-600" />
                    </svg>
                    <span className="font-semibold text-gray-900">Calibrate</span>
                  </div>
                  <p className="text-sm text-gray-600 max-w-md">
                    Complete guide to using the Calibrate pricing management platform. Learn how to manage your product catalog, automate pricing, and integrate with your systems.
                  </p>
                </div>
                <div>
                  <h3 className="text-sm font-semibold text-gray-900 mb-3">Documentation</h3>
                  <ul className="space-y-2 text-sm">
                    <li>
                      <Link href="/console/getting-started" className="text-gray-600 hover:text-blue-600 transition-colors">
                        Getting Started
                      </Link>
                    </li>
                    <li>
                      <Link href="/console/catalog" className="text-gray-600 hover:text-blue-600 transition-colors">
                        Catalog
                      </Link>
                    </li>
                    <li>
                      <Link href="/console/price-changes" className="text-gray-600 hover:text-blue-600 transition-colors">
                        Price Changes
                      </Link>
                    </li>
                    <li>
                      <Link href="/console/integrations" className="text-gray-600 hover:text-blue-600 transition-colors">
                        Integrations
                      </Link>
                    </li>
                  </ul>
                </div>
                <div>
                  <h3 className="text-sm font-semibold text-gray-900 mb-3">Resources</h3>
                  <ul className="space-y-2 text-sm">
                    <li>
                      <Link href="/api-spec" target="_blank" className="text-gray-600 hover:text-blue-600 transition-colors">
                        API Reference
                      </Link>
                    </li>
                    <li>
                      <Link href="/console/best-practices" className="text-gray-600 hover:text-blue-600 transition-colors">
                        Best Practices
                      </Link>
                    </li>
                    <li>
                      <Link href="/console/troubleshooting" className="text-gray-600 hover:text-blue-600 transition-colors">
                        Troubleshooting
                      </Link>
                    </li>
                    <li>
                      <a href="https://calibr.lat" className="text-gray-600 hover:text-blue-600 transition-colors">
                        Main Site
                      </a>
                    </li>
                  </ul>
                </div>
              </div>
              <div className="mt-8 pt-8 border-t border-gray-200">
                <p className="text-xs text-gray-500 text-center">
                  © {new Date().getFullYear()} Calibrate. All rights reserved.
                </p>
              </div>
            </div>
          </footer>
        </div>
      </body>
    </html>
  )
}
