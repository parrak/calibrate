import localFont from 'next/font/local';

export const inter = localFont({
  src: '../public/fonts/Inter-var.woff2',
  variable: '--font-sans',
  weight: '100 900',
  display: 'swap',
  preload: true,
  // Metrics-matched fallback — no reflow on swap.
  adjustFontFallback: 'Arial',
  fallback: [
    'ui-sans-serif', 'system-ui', '-apple-system', 'Segoe UI',
    'Roboto', 'Helvetica Neue', 'Arial', 'Noto Sans'
  ],
});

export const plexMono = localFont({
  src: [
    { path: '../public/fonts/IBMPlexMono-400.woff2', weight: '400', style: 'normal' },
    { path: '../public/fonts/IBMPlexMono-500.woff2', weight: '500', style: 'normal' },
  ],
  variable: '--font-mono',
  display: 'swap',
  preload: true,
  adjustFontFallback: false, // keep as-is; used for monospace only
});
