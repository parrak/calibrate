import type { Metadata } from 'next'
import './globals.css'
import { Header } from '../components/Header'
import { Sidebar } from '../components/Sidebar'

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
      <body className="min-h-screen bg-white">
        <div className="flex flex-col min-h-screen">
          <Header />
          <div className="flex flex-1 overflow-hidden">
            <Sidebar />
            <main className="flex-1 overflow-y-auto">
              {children}
            </main>
          </div>
        </div>
      </body>
    </html>
  )
}
