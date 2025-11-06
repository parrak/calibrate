import type { Metadata } from 'next'
import './globals.css'
import { UserMenu } from '@/components/UserMenu'
import Providers from './providers'

export const metadata: Metadata = {
  title: 'Calibrate Console',
  description: 'Admin console for price management',
  icons: {
    icon: [
      { url: '/favicon.svg', type: 'image/svg+xml' },
      { url: '/favicon-32.png', sizes: '32x32', type: 'image/png' },
    ],
    apple: '/apple-touch-icon.png',
  },
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
        <a href="#main" className="sr-only focus:not-sr-only focus:fixed focus:top-2 focus:left-2 bg-white border border-[color:var(--border)] rounded px-3 py-2 shadow">
          Skip to content
        </a>
        <header className="border-b border-[color:var(--border)] bg-white">
          <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 h-14 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <span className="text-lg font-semibold">Calibrate Console</span>
              <span className="text-xs text-[color:var(--mute)]">Enterprise pricing ops</span>
            </div>
            <UserMenu />
          </div>
        </header>
        <main id="main" className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-6">
          <Providers>{children}</Providers>
        </main>
      </body>
    </html>
  )
}
