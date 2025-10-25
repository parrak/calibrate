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
        bg: '#0B0B0C',
        surface: '#141416',
        border: '#1F2023',
        fg: '#E5E7EB',
        mute: '#9CA3AF',
        brand: '#00C2A8',
        'brand-700': '#00A693',
        accent: '#7A6FF0',
        danger: '#EF4444',
        warning: '#F59E0B',
        success: '#10B981'
      },
      borderRadius: {
        md: '12px',
        xl: '20px'
      },
      fontFamily: {
        sans: "Inter, ui-sans-serif, system-ui, -apple-system, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, 'Noto Sans', 'Apple Color Emoji', 'Segoe UI Emoji'",
        mono: "'JetBrains Mono', ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, 'Liberation Mono', 'Courier New', monospace"
      }
    },
  },
  plugins: [],
}

