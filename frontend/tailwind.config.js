/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        'navy': '#070B14',
        'slate-dark': '#0D1321',
        'card': '#131C2E',
        'accent-cyan': '#22D3EE',
        'accent-violet': '#8B5CF6',
        'border-dark': '#243049',
      },
      fontFamily: {
        'mono': ['"JetBrains Mono"', 'Consolas', 'monospace'],
        'sans': ['Inter', 'system-ui', 'sans-serif'],
      },
    },
  },
  plugins: [],
}
