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
        bg: '#0b0b0c',
        surface: '#141416',
        border: '#1f2023',
        fg: '#e5e7eb',
        mute: '#9ca3af',
        brand: '#00C2A8'
      }
    },
  },
  plugins: [],
}
