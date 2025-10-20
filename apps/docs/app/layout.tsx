import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Calibrate Documentation',
  description: 'API documentation and guides for Calibrate pricing platform',
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
