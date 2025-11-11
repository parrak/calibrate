// Next.js 13+ example: app/metadata
import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Calibrate — Composable Pricing Data OS',
  description: 'The AI‑native pricing control plane for commerce.',
  themeColor: '#0E3AFF',
  icons: {
    icon: [
      { url: '/branding/assets/favicon.ico' },
      { url: '/branding/assets/icon-512.png', type: 'image/png', sizes: '512x512' },
    ],
    apple: [{ url: '/branding/assets/icon-512.png' }],
  },
  openGraph: {
    title: 'Calibrate — the AI‑native pricing control plane',
    images: ['/branding/assets/og-image.png'],
    type: 'website',
  },
  manifest: '/branding/assets/manifest.webmanifest',
};
