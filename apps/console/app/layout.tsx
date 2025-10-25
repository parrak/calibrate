import type { Metadata } from 'next'
import './globals.css'

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
      <body className="bg-bg text-fg min-h-screen">
        <div className="container mx-auto px-4 py-8">
          <header className="mb-8">
            <h1 className="text-3xl font-bold">Calibrate Console</h1>
            <p className="text-mute">Price management and approval system</p>
          </header>
          {children}
        </div>
      </body>
    </html>
  )
}
