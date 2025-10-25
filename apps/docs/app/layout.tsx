import type { Metadata } from 'next'
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
      <body className="min-h-screen bg-bg text-fg">
        {children}
      </body>
    </html>
  )
}
