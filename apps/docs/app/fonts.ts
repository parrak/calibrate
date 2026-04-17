import localFont from 'next/font/local'

export const inter = localFont({
  src: '../public/fonts/Inter-var.woff2',
  variable: '--font-sans',
  display: 'swap',
})

export const plexMono = localFont({
  src: [
    {
      path: '../public/fonts/IBMPlexMono-400.woff2',
      weight: '400',
      style: 'normal',
    },
    {
      path: '../public/fonts/IBMPlexMono-500.woff2',
      weight: '500',
      style: 'normal',
    },
  ],
  variable: '--font-mono',
  display: 'swap',
})
