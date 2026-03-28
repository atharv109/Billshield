/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: {
        'bs-bg': '#0a0d14',
        'bs-card': '#1a2540',
        'bs-border': '#2a3a5c',
        'bs-blue': '#4a9eff',
        'bs-red': '#ff4444',
        'bs-amber': '#ffaa00',
        'bs-green': '#00cc88',
        'bs-cyan': '#00d4ff',
        'bs-muted': '#6b7a99',
      },
      fontFamily: {
        mono: ['JetBrains Mono', 'Fira Code', 'ui-monospace', 'monospace'],
        sans: ['Inter', 'ui-sans-serif', 'system-ui', 'sans-serif'],
      },
    },
  },
  plugins: [],
}

