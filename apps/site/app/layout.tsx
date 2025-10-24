import './globals.css'
import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Calibr — Real-time Pricing Precision',
  description: 'The intelligent pricing engine with guardrails, human review, and instant rollback.',
  metadataBase: new URL('https://calibr.lat'),
  openGraph: {
    title: 'Calibr — Real-time Pricing Precision',
    description: 'Create a project, connect your catalog, ship guarded price changes.',
    url: 'https://calibr.lat',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Calibr',
    description: 'Real-time pricing precision for modern commerce.',
  },
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body className="bg-bg text-fg">
        <header className="border-b border-border">
          <div className="mx-auto max-w-6xl px-6 h-16 flex items-center justify-between">
            <a href="/" className="font-semibold tracking-tight">Calibr<span className="text-brand">.lat</span></a>
            <nav className="hidden md:flex items-center gap-6 text-sm text-mute">
              <a href="#features" className="hover:text-fg">Features</a>
              <a href="#how" className="hover:text-fg">How it works</a>
              <a href="https://docs.calibr.lat" className="hover:text-fg">Docs</a>
              <a href="https://app.calibr.lat/login" className="px-3 py-1.5 rounded-md bg-brand text-black font-medium">Sign in</a>
            </nav>
            <a href="https://app.calibr.lat/login" className="md:hidden px-3 py-1.5 rounded-md bg-brand text-black font-medium">Sign in</a>
          </div>
        </header>
        <main>{children}</main>
        <footer className="border-t border-border">
          <div className="mx-auto max-w-6xl px-6 py-8 text-sm text-mute flex flex-col md:flex-row gap-2 md:gap-6 items-center md:items-start justify-between">
            <div>© {new Date().getFullYear()} Porter Labs</div>
            <div className="flex gap-4">
              <a href="https://docs.calibr.lat">Docs</a>
              <a href="/privacy">Privacy</a>
              <a href="/terms">Terms</a>
              <a href="/.well-known/security.txt">Security</a>
            </div>
          </div>
        </footer>
      </body>
    </html>
  )
}
