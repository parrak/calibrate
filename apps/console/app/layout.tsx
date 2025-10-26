import type { Metadata } from 'next'
import './globals.css'
import { UserMenu } from '@/components/UserMenu'

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
      <body className="min-h-screen bg-gray-50 text-gray-900">
        <a href="#main" className="sr-only focus:not-sr-only focus:fixed focus:top-2 focus:left-2 bg-white border rounded px-3 py-2 shadow">
          Skip to content
        </a>
        <header className="border-b bg-white">
          <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 h-14 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <span className="text-lg font-semibold">Calibrate Console</span>
              <span className="text-xs text-gray-500">Enterprise pricing ops</span>
            </div>
            <UserMenu />
          </div>
        </header>
        <main id="main" className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-6">
          {children}
        </main>
      </body>
    </html>
  )
}
