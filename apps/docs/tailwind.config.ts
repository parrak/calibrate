import type { Config } from 'tailwindcss'

const config: Config = {
  content: [
    './pages/**/*.{js,ts,jsx,tsx,mdx}',
    './components/**/*.{js,ts,jsx,tsx,mdx}',
    './app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        bg: 'var(--bg)',
        surface: {
          DEFAULT: 'var(--surface)',
          elevated: 'var(--surface-elevated)',
        },
        border: {
          DEFAULT: 'var(--border)',
          subtle: 'var(--border-subtle)',
        },
        fg: {
          DEFAULT: 'var(--fg)',
          muted: 'var(--fg-muted)',
          subtle: 'var(--fg-subtle)',
        },
        brand: {
          DEFAULT: 'var(--brand)',
          hover: 'var(--brand-hover)',
          light: 'var(--brand-light)',
        },
        'brand-hover': 'var(--brand-hover)',
        accent: {
          DEFAULT: 'var(--accent)',
          light: 'var(--accent-light)',
        },
        mute: 'var(--mute)',
        danger: '#EF4444',
        warning: '#F59E0B',
        success: '#10B981',
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
        sm: 'var(--radius-sm)',
        md: 'var(--radius-md)',
        lg: 'var(--radius-lg)',
        xl: 'var(--radius-xl)',
      },
      boxShadow: {
        sm: 'var(--shadow-sm)',
        md: 'var(--shadow-md)',
        lg: 'var(--shadow-lg)',
        xl: 'var(--shadow-xl)',
      },
      fontFamily: {
        sans: "Inter, ui-sans-serif, system-ui, -apple-system, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, 'Noto Sans', 'Apple Color Emoji', 'Segoe UI Emoji'",
        mono: "'IBM Plex Mono', ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, 'Liberation Mono', 'Courier New', monospace",
      },
      gradientColorStops: {
        'cb-start': '#80D9D9',  // Light Teal (L1)
        'cb-mid': '#00A3A3',   // Mid Teal (L2)
        'cb-end': '#008080',   // Deep Teal (L3)
      },
    },
  },
  plugins: [],
}
export default config
