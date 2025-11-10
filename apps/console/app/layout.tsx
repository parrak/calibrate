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
      <body className="min-h-screen bg-[color:var(--bg)] text-[color:var(--fg)]">
        <a href="#main" className="sr-only focus:not-sr-only focus:fixed focus:top-2 focus:left-2 bg-[color:var(--surface)] border border-[color:var(--border)] rounded px-3 py-2 shadow">
          Skip to content
        </a>
        <header className="border-b border-[color:var(--border)] bg-[color:var(--surface)]">
          <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 h-14 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <span className="text-lg font-semibold">Calibrate Console</span>
              <span className="text-xs text-[color:var(--mute)]">Enterprise pricing ops</span>
            </div>
            <div className="flex items-center gap-4">
              <a
                href="https://docs.calibr.lat"
                target="_blank"
                rel="noopener noreferrer"
                className="text-sm text-[color:var(--mute)] hover:text-[color:var(--brand)] transition-colors flex items-center gap-1"
              >
                <span>Docs</span>
                <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
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
