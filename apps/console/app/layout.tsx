import type { Metadata } from 'next'
import './globals.css'
import { UserMenu } from '@/components/UserMenu'
import Providers from './providers'

export const metadata: Metadata = {
  title: 'Calibrate Console',
  description: 'Admin console for price management',
  openGraph: {
    title: 'Calibrate Console',
    description: 'Admin console for price management',
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
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600&display=swap" rel="stylesheet" />
      </head>
      <body className="min-h-screen bg-[color:var(--bg)] text-[color:var(--fg)]">
        <a href="#main" className="sr-only focus:not-sr-only focus:fixed focus:top-2 focus:left-2 bg-[color:var(--surface)] border border-[color:var(--border)] rounded px-3 py-2 shadow">
          Skip to content
        </a>
        <header className="topnav border-b border-[color:var(--border)] bg-[color:var(--surface)] sticky top-0 z-50">
          <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 h-14 flex items-center justify-between gap-2">
            <div className="flex items-center gap-2 sm:gap-3 min-w-0">
              <span className="text-base sm:text-lg font-semibold whitespace-nowrap" style={{ color: 'var(--text-strong)' }}>Calibrate Console</span>
              <span className="hidden sm:inline text-xs text-[color:var(--mute)] whitespace-nowrap">Enterprise pricing ops</span>
            </div>
            <div className="flex items-center gap-2 sm:gap-4 flex-shrink-0">
              <a
                href="https://docs.calibr.lat"
                target="_blank"
                rel="noopener noreferrer"
                className="hidden sm:flex text-sm text-[color:var(--mute)] hover:text-[color:var(--brand)] transition-colors items-center gap-1"
              >
                <span>Docs</span>
                <svg className="icon-16" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                </svg>
              </a>
              <UserMenu />
            </div>
          </div>
        </header>
        <main id="main" className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-6">
          <Providers>{children}</Providers>
        </main>
      </body>
    </html>
  )
}
