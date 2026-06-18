/** @type {import('tailwindcss').Config} */

export default {
  darkMode: "class",
  content: ["./index.html", "./src/**/*.{js,ts,jsx,tsx}"],
  theme: {
    container: {
      center: true,
    },
    extend: {
      colors: {
        'deep-blue': {
          50: '#e8ecf4',
          100: '#c5cfe3',
          200: '#9dafc9',
          300: '#6f89ab',
          400: '#4a6591',
          500: '#2d4873',
          600: '#1a2744',
          700: '#131d35',
          800: '#0d1426',
          900: '#070a16',
        },
        'alert-red': {
          400: '#ef5a67',
          500: '#e63946',
          600: '#c42e3b',
          700: '#a02530',
        },
        'pro-gold': {
          300: '#e0bd99',
          400: '#d4a373',
          500: '#c4905c',
          600: '#a87847',
        },
        'calm-teal': {
          400: '#3ab5a6',
          500: '#2a9d8f',
          600: '#218578',
        },
        'terminal-green': '#00ff9d',
        'terminal-amber': '#ffb000',
        'terminal-cyan': '#00d4ff',
      },
      fontFamily: {
        'serif-cn': ['"Noto Serif SC"', 'Georgia', 'serif'],
        'mono': ['"JetBrains Mono"', '"Fira Code"', 'Consolas', 'monospace'],
      },
      animation: {
        'pulse-fast': 'pulse 1s cubic-bezier(0.4, 0, 0.6, 1) infinite',
        'blink': 'blink 1s step-end infinite',
        'scanline': 'scanline 6s linear infinite',
        'typing': 'typing 0.8s steps(30) forwards',
      },
      keyframes: {
        blink: {
          '0%, 100%': { opacity: '1' },
          '50%': { opacity: '0' },
        },
        scanline: {
          '0%': { transform: 'translateY(-100%)' },
          '100%': { transform: 'translateY(100%)' },
        },
        typing: {
          'from': { width: '0' },
          'to': { width: '100%' },
        },
      },
      boxShadow: {
        'terminal': 'inset 0 0 60px rgba(0,255,157,0.03), 0 0 20px rgba(0,0,0,0.5)',
        'glow-gold': '0 0 15px rgba(212,163,115,0.4)',
        'glow-red': '0 0 15px rgba(230,57,70,0.5)',
        'glow-teal': '0 0 15px rgba(42,157,143,0.4)',
        'inset-deep': 'inset 0 2px 8px rgba(0,0,0,0.6)',
      },
    },
  },
  plugins: [],
};
