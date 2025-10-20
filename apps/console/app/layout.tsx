import type { Metadata } from 'next'
import './globals.css'

export const metadata: Metadata = {
  title: 'Calibrate Console',
  description: 'Admin console for price management',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en">
      <body className="bg-gray-50 min-h-screen">
        <div className="container mx-auto px-4 py-8">
          <header className="mb-8">
            <h1 className="text-3xl font-bold text-gray-900">Calibrate Console</h1>
            <p className="text-gray-600">Price management and approval system</p>
          </header>
          {children}
        </div>
      </body>
    </html>
  )
}
