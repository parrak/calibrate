import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Calibrate - Smart Pricing Platform',
  description: 'Automated price optimization and management for modern businesses',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en">
      <body className="min-h-screen bg-white">
        {children}
      </body>
    </html>
  )
}
