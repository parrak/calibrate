/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    './pages/**/*.{js,ts,jsx,tsx,mdx}',
    './components/**/*.{js,ts,jsx,tsx,mdx}',
    './app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        bg: 'var(--bg)',
        surface: 'var(--surface)',
        border: 'var(--border)',
        fg: 'var(--fg)',
        mute: 'var(--mute)',
        brand: 'var(--brand)',
        accent: 'var(--accent)',
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
        md: '12px',
        xl: 'var(--radius-xl)',
        '2xl': 'var(--radius-2xl)',
      },
      fontFamily: {
        sans: "Inter, ui-sans-serif, system-ui, -apple-system, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, 'Noto Sans', 'Apple Color Emoji', 'Segoe UI Emoji'",
        mono: "'IBM Plex Mono', ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, 'Liberation Mono', 'Courier New', monospace"
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

