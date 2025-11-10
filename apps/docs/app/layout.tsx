import type { Metadata } from 'next'
import Link from 'next/link'
import './globals.css'

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
      <body className="min-h-screen bg-[color:var(--bg)] text-[color:var(--fg)]">
        {/* Navigation Header */}
        <header className="sticky top-0 z-50 w-full border-b border-border/40 bg-surface/80 backdrop-blur-xl supports-[backdrop-filter]:bg-surface/60">
          <nav className="mx-auto flex h-16 max-w-7xl items-center justify-between px-6">
            <div className="flex items-center gap-8">
              <Link href="/" className="flex items-center gap-2 font-semibold text-fg hover:text-brand transition-colors">
                <svg className="h-6 w-6" viewBox="0 0 24 24" fill="none">
                  <rect x="3" y="3" width="8" height="8" rx="2" fill="currentColor" className="text-brand" />
                  <rect x="13" y="3" width="8" height="8" rx="2" fill="currentColor" className="text-brand opacity-60" />
                  <rect x="3" y="13" width="8" height="8" rx="2" fill="currentColor" className="text-brand opacity-60" />
                  <rect x="13" y="13" width="8" height="8" rx="2" fill="currentColor" className="text-accent" />
                </svg>
                <span className="text-lg">Calibrate</span>
              </Link>
              <div className="hidden md:flex items-center gap-6">
                <Link href="/" className="text-sm text-fg-muted hover:text-fg transition-colors">
                  Docs
                </Link>
                <Link href="/console" className="text-sm text-fg-muted hover:text-fg transition-colors">
                  Console Guide
                </Link>
                <Link href="/api-spec" target="_blank" className="text-sm text-fg-muted hover:text-fg transition-colors">
                  API Reference
                </Link>
              </div>
            </div>
            <div className="flex items-center gap-4">
              <a
                href="https://calibr.lat"
                target="_blank"
                rel="noopener noreferrer"
                className="text-sm text-fg-muted hover:text-fg transition-colors"
              >
                calibr.lat
              </a>
            </div>
          </nav>
        </header>

        {/* Main Content */}
        <main className="min-h-[calc(100vh-4rem)]">
          {children}
        </main>

        {/* Footer */}
        <footer className="border-t border-border/40 bg-surface/50">
          <div className="mx-auto max-w-7xl px-6 py-12">
            <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
              <div className="md:col-span-2">
                <div className="flex items-center gap-2 mb-4">
                  <svg className="h-6 w-6" viewBox="0 0 24 24" fill="none">
                    <rect x="3" y="3" width="8" height="8" rx="2" fill="currentColor" className="text-brand" />
                    <rect x="13" y="3" width="8" height="8" rx="2" fill="currentColor" className="text-brand opacity-60" />
                    <rect x="3" y="13" width="8" height="8" rx="2" fill="currentColor" className="text-brand opacity-60" />
                    <rect x="13" y="13" width="8" height="8" rx="2" fill="currentColor" className="text-accent" />
                  </svg>
                  <span className="font-semibold text-fg">Calibrate</span>
                </div>
                <p className="text-sm text-fg-muted max-w-md">
                  Complete guide to using the Calibrate pricing management platform. Learn how to manage your product catalog, automate pricing, and integrate with your systems.
                </p>
              </div>
              <div>
                <h3 className="text-sm font-semibold text-fg mb-3">Documentation</h3>
                <ul className="space-y-2 text-sm">
                  <li>
                    <Link href="/console/getting-started" className="text-fg-muted hover:text-brand transition-colors">
                      Getting Started
                    </Link>
                  </li>
                  <li>
                    <Link href="/console/catalog" className="text-fg-muted hover:text-brand transition-colors">
                      Catalog
                    </Link>
                  </li>
                  <li>
                    <Link href="/console/price-changes" className="text-fg-muted hover:text-brand transition-colors">
                      Price Changes
                    </Link>
                  </li>
                  <li>
                    <Link href="/console/integrations" className="text-fg-muted hover:text-brand transition-colors">
                      Integrations
                    </Link>
                  </li>
                </ul>
              </div>
              <div>
                <h3 className="text-sm font-semibold text-fg mb-3">Resources</h3>
                <ul className="space-y-2 text-sm">
                  <li>
                    <Link href="/api-spec" target="_blank" className="text-fg-muted hover:text-brand transition-colors">
                      API Reference
                    </Link>
                  </li>
                  <li>
                    <Link href="/console/best-practices" className="text-fg-muted hover:text-brand transition-colors">
                      Best Practices
                    </Link>
                  </li>
                  <li>
                    <Link href="/console/troubleshooting" className="text-fg-muted hover:text-brand transition-colors">
                      Troubleshooting
                    </Link>
                  </li>
                  <li>
                    <a href="https://calibr.lat" className="text-fg-muted hover:text-brand transition-colors">
                      Main Site
                    </a>
                  </li>
                </ul>
              </div>
            </div>
            <div className="mt-8 pt-8 border-t border-border/40">
              <p className="text-xs text-fg-subtle text-center">
                © {new Date().getFullYear()} Calibrate. All rights reserved.
              </p>
            </div>
          </div>
        </footer>
      </body>
    </html>
  )
}
