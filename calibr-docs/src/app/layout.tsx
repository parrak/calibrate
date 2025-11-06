import './globals.css'
import type { Metadata } from 'next'
import Link from 'next/link'

export const metadata: Metadata = {
  title: 'Calibr Docs',
  description: 'Calibr — Webhook-driven Pricing API documentation',
  metadataBase: new URL('https://docs.calibr.lat'),
  icons: {
    icon: [
      { url: '/favicon.svg', type: 'image/svg+xml' },
      { url: '/favicon-32.png', sizes: '32x32', type: 'image/png' },
    ],
    apple: '/apple-touch-icon.png',
  },
  openGraph: {
    title: 'Calibr Docs',
    description: 'Webhook-driven Pricing API',
    url: 'https://docs.calibr.lat',
    images: '/og-image.png',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Calibr Docs',
    description: 'Webhook-driven Pricing API',
    images: '/og-image.png',
  },
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>
        <div className="min-h-screen">
          <header className="border-b border-border">
            <div className="mx-auto max-w-4xl px-4 py-4 flex items-center justify-between">
              <Link href="/" className="font-semibold tracking-tight">Calibr<span className="text-brand">.lat</span> Docs</Link>
              <nav className="text-sm text-mute space-x-4">
                <Link href="/docs">Docs</Link>
                <a href="https://calibr.lat" target="_blank">Website</a>
                <a href="https://console.calibr.lat" target="_blank">Console</a>
                <a href="https://api.calibr.lat" target="_blank">API</a>
              </nav>
            </div>
          </header>
          <main className="mx-auto max-w-4xl px-4 py-8">{children}</main>
          <footer className="border-t border-border">
            <div className="mx-auto max-w-4xl px-4 py-6 text-xs text-mute">
              © {new Date().getFullYear()} Porter Labs · <a href="/robots.txt">robots</a> · <a href="/sitemap.xml">sitemap</a>
            </div>
          </footer>
        </div>
      </body>
    </html>
  )
}
