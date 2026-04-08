/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,jsx}'],
  theme: {
    extend: {
      colors: {
        brand: { DEFAULT: '#e11d48', dark: '#be123c', light: '#ffe4e6' },
        surface: { DEFAULT: '#1a1a1a', light: '#262626', dark: '#0f0f0f' },
        primary: { DEFAULT: '#e11d48', dark: '#be123c', light: '#ffe4e6' },
        secondary: { DEFAULT: '#6366f1', dark: '#4f46e5', light: '#e0e7ff' },
        muted: { DEFAULT: '#a1a1aa', dark: '#71717a', light: '#f4f4f5' },
      },
      fontFamily: {
        sans: ['DM Sans', 'system-ui', 'sans-serif'],
        display: ['Space Grotesk', 'system-ui', 'sans-serif'],
        mono: ['JetBrains Mono', 'Fira Code', 'monospace'],
      },
      animation: {
        'float': 'float 6s ease-in-out infinite',
        'glow': 'glow 2s ease-in-out infinite alternate',
      },
      keyframes: {
        float: {
          '0%, 100%': { transform: 'translateY(0)' },
          '50%': { transform: 'translateY(-10px)' },
        },
        glow: {
          '0%': { boxShadow: '0 0 20px rgba(225, 29, 72, 0.3)' },
          '100%': { boxShadow: '0 0 40px rgba(225, 29, 72, 0.6)' },
        },
      },
    },
  },
  plugins: [],
};