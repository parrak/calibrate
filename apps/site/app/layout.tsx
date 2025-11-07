import './globals.css'
import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Calibrate — Dynamic Pricing with Guardrails',
  description: 'Stop editing spreadsheets. Calibrate automates safe price changes with AI guardrails, human oversight, and instant rollback. From strategy to execution in minutes.',
  metadataBase: new URL('https://calibr.lat'),
  keywords: ['dynamic pricing', 'price automation', 'AI pricing', 'pricing guardrails', 'e-commerce pricing', 'Shopify pricing'],
  authors: [{ name: 'Porter Labs' }],
  icons: {
    icon: [
      { url: '/favicon.svg', type: 'image/svg+xml' },
    ],
  },
  openGraph: {
    type: 'website',
    locale: 'en_US',
    title: 'Calibrate — Dynamic Pricing with Guardrails',
    description: 'Automate safe price changes with AI guardrails, human oversight, and instant rollback.',
    url: 'https://calibr.lat',
    siteName: 'Calibrate',
    images: [
      {
        url: '/og-image.png',
        width: 1200,
        height: 630,
        alt: 'Calibrate - Dynamic Pricing Platform',
      },
    ],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Calibrate — Dynamic Pricing with Guardrails',
    description: 'Automate safe price changes with AI guardrails, human oversight, and instant rollback.',
    images: ['/og-image.png'],
    creator: '@porterlabs',
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      'max-video-preview': -1,
      'max-image-preview': 'large',
      'max-snippet': -1,
    },
  },
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <head>
        <link rel="preload" as="video" href="/demo.mp4" type="video/mp4" />
        <link rel="preconnect" href="https://console.calibr.lat" />
        <link rel="preconnect" href="https://docs.calibr.lat" />
      </head>
      <body className="bg-[color:var(--bg)] text-[color:var(--fg)]">
        <header className="border-b border-[color:var(--border)] bg-white">
          <div className="mx-auto max-w-6xl px-6 h-16 flex items-center justify-between">
            <a href="/" className="font-semibold tracking-tight">Calibr<span className="text-[color:var(--brand)]">.lat</span></a>
            <nav className="hidden md:flex items-center gap-6 text-sm text-[color:var(--mute)]">
              <a href="#features" className="hover:text-[color:var(--fg)] transition-colors">Features</a>
              <a href="#how" className="hover:text-[color:var(--fg)] transition-colors">How it works</a>
              <a href="https://docs.calibr.lat" className="hover:text-[color:var(--fg)] transition-colors">Docs</a>
              <a href="https://console.calibr.lat/login" className="px-3 py-1.5 rounded-md bg-[color:var(--brand)]/90 hover:bg-[color:var(--brand)] text-white font-medium transition-colors">Sign in</a>
            </nav>
            <a href="https://console.calibr.lat/login" className="md:hidden px-3 py-1.5 rounded-md bg-[color:var(--brand)]/90 hover:bg-[color:var(--brand)] text-white font-medium transition-colors">Sign in</a>
          </div>
        </header>
        <main>{children}</main>
        <footer className="border-t border-[color:var(--border)] bg-white">
          <div className="mx-auto max-w-6xl px-6 py-8 text-sm text-[color:var(--mute)] flex flex-col md:flex-row gap-2 md:gap-6 items-center md:items-start justify-between">
            <div>© {new Date().getFullYear()} Porter Labs</div>
            <div className="flex gap-4">
              <a href="https://docs.calibr.lat" className="hover:text-[color:var(--fg)] transition-colors">Docs</a>
              <a href="/privacy" className="hover:text-[color:var(--fg)] transition-colors">Privacy</a>
              <a href="/terms" className="hover:text-[color:var(--fg)] transition-colors">Terms</a>
              <a href="/.well-known/security.txt" className="hover:text-[color:var(--fg)] transition-colors">Security</a>
              <a href="mailto:contact@calibr.lat" className="hover:text-[color:var(--fg)] transition-colors">Contact</a>
            </div>
          </div>
        </footer>
      </body>
    </html>
  )
}
