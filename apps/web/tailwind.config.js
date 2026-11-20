/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        background: '#07090E',
        surface: {
          DEFAULT: '#0B0F17',
          card: '#0F1623',
          cardHover: '#141E2F',
          border: '#1F293D',
          muted: '#182234',
        },
        gold: {
          DEFAULT: '#D4AF37',
          light: '#F3E5AB',
          dark: '#AA820A',
          glow: 'rgba(212, 175, 55, 0.15)',
        },
        violet: {
          accent: '#7C3AED',
          light: '#A78BFA',
          glow: 'rgba(124, 58, 237, 0.15)',
        },
      },
      fontFamily: {
        sans: ['Plus Jakarta Sans', 'Inter', 'system-ui', 'sans-serif'],
        mono: ['JetBrains Mono', 'monospace'],
      },
      boxShadow: {
        glass: '0 8px 32px 0 rgba(0, 0, 0, 0.37)',
        glow: '0 0 25px rgba(212, 175, 55, 0.12)',
        violetGlow: '0 0 25px rgba(124, 58, 237, 0.18)',
      },
    },
  },
  plugins: [],
};
