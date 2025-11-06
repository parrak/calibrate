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
        success: '#10B981'
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
        mono: "'JetBrains Mono', ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, 'Liberation Mono', 'Courier New', monospace"
      }
    },
  },
  plugins: [],
}

