import type { Config } from 'tailwindcss'

const config: Config = {
  content: [
    './pages/**/*.{js,ts,jsx,tsx,mdx}',
    './components/**/*.{js,ts,jsx,tsx,mdx}',
    './app/**/*.{js,ts,jsx,tsx,mdx}',
    './lib/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        bg: 'var(--bg)',
        surface: 'var(--surface)',
        border: 'var(--border)',
        fg: 'var(--fg)',
        mute: 'var(--mute)',
        muted: 'var(--mute)', // Alias for compatibility
        brand: 'var(--brand)',
        accent: 'var(--accent)',
        danger: 'var(--danger)',
        warning: 'var(--warning)',
        success: 'var(--success)',
        'muted-foreground': 'var(--mute)', // For text-muted-foreground
        background: 'var(--bg)',
        foreground: 'var(--fg)',
        input: 'var(--border)',
        ring: 'var(--brand)',
        card: 'var(--card)',
        'card-foreground': 'var(--card-foreground)',
        // Calibrate brand colors (Teal)
        'cb-teal-100': '#80D9D9',  // Light Teal (L1)
        'cb-teal-500': '#00A3A3',  // Mid Teal (L2) - Primary
        'cb-teal-800': '#008080',  // Deep Teal (L3)
        'cb-navy': '#001845',      // Navy text
        'cb-bg': '#F8FAFF',        // Off-white background
      },
      borderColor: {
        DEFAULT: 'var(--border)',
      },
      borderRadius: {
        md: '12px',
        xl: 'var(--radius-xl)',
        '2xl': 'var(--radius-2xl)',
      },
      fontFamily: {
        sans: ['var(--font-sans)', 'ui-sans-serif', 'system-ui', '-apple-system', '"Segoe UI"', 'Roboto', '"Helvetica Neue"', 'Arial', '"Noto Sans"', 'sans-serif'],
        mono: ['var(--font-mono)', 'ui-monospace', 'SFMono-Regular', 'Menlo', 'Monaco', 'Consolas', '"Liberation Mono"', '"Courier New"', 'monospace']
      },
      fontVariantNumeric: {
        tabular: 'tabular-nums slashed-zero',
      },
      gradientColorStops: {
        'cb-start': '#80D9D9',  // Light Teal (L1)
        'cb-mid': '#00A3A3',   // Mid Teal (L2)
        'cb-end': '#008080',   // Deep Teal (L3)
      }
    },
  },
  plugins: [],
}
export default config
