/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    './app/**/*.{js,ts,jsx,tsx,mdx}',
    './components/**/*.{js,ts,jsx,tsx,mdx}',
    './index.html',
    './**/*.html',
  ],
  theme: {
    extend: {
      colors: {
        bg: '#ffffff',           // Pure white page background
        'bg-subtle': '#f6f9fc',  // Very light gray for code/panels
        panel: '#ffffff',        // Pure white for cards
        surface: '#ffffff',      // Pure white for surfaces
        border: '#e0e6ed',       // Clear, visible borders
        'text-strong': '#0a2540', // Dark blue-gray for headings
        fg: '#425466',           // Medium gray for body text
        text: '#425466',         // Medium gray for body text
        mute: '#6b7a90',         // Lighter gray for secondary text
        brand: '#00A3A3',        // Teal brand color
        'brand-hover': '#008c8c', // Darker teal on hover
        'brand-light': '#e6f7f7', // Very light teal background
        accent: '#0074D9',       // Blue accent
        code: '#f6f9fc',         // Light gray for code blocks
      },
      borderRadius: {
        DEFAULT: '8px',
        md: '8px',
        xl: '12px'
      },
      boxShadow: {
        '100': '0 1px 2px rgba(0,0,0,0.05)',
      },
      maxWidth: {
        'docs': '880px'
      },
      fontFamily: {
        sans: "'Inter', ui-sans-serif, system-ui, -apple-system, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, 'Noto Sans', 'Apple Color Emoji', 'Segoe UI Emoji'",
        mono: "ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, 'Liberation Mono', 'Courier New', monospace"
      }
    },
  },
  plugins: [],
}
