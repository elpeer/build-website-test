import type { Config } from 'tailwindcss';
import typography from '@tailwindcss/typography';

const config: Config = {
  darkMode: 'class',
  content: [
    './app/**/*.{ts,tsx}',
    './components/**/*.{ts,tsx}',
    './lib/**/*.{ts,tsx}',
  ],
  theme: {
    extend: {
      fontFamily: {
        sans: ['var(--font-sans)', 'system-ui', 'sans-serif'],
        mono: ['var(--font-mono)', 'ui-monospace', 'monospace'],
      },
      colors: {
        // Brand
        brand: {
          DEFAULT: '#0a1828',
          50:  '#f4f5f7',
          100: '#e4e7ec',
          200: '#cbd0d9',
          300: '#a3acbc',
          400: '#727f97',
          500: '#52617c',
          600: '#3f4c63',
          700: '#343f51',
          800: '#2d3645',
          900: '#0a1828',
        },
        accent: {
          DEFAULT: '#d2170a',
          hover:   '#a60f04',
        },
        // Semantic
        background: 'rgb(var(--background) / <alpha-value>)',
        foreground: 'rgb(var(--foreground) / <alpha-value>)',
        muted:      'rgb(var(--muted) / <alpha-value>)',
        'muted-fg': 'rgb(var(--muted-fg) / <alpha-value>)',
        border:     'rgb(var(--border) / <alpha-value>)',
        ring:       'rgb(var(--ring) / <alpha-value>)',
        card:       'rgb(var(--card) / <alpha-value>)',
        'card-fg':  'rgb(var(--card-fg) / <alpha-value>)',
      },
      borderRadius: {
        lg: '0.75rem',
        md: '0.5rem',
        sm: '0.375rem',
      },
      animation: {
        'fade-in': 'fadeIn 0.2s ease-out',
        'slide-up': 'slideUp 0.3s ease-out',
      },
      keyframes: {
        fadeIn: {
          '0%': { opacity: '0' },
          '100%': { opacity: '1' },
        },
        slideUp: {
          '0%': { opacity: '0', transform: 'translateY(0.5rem)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
      },
    },
  },
  plugins: [typography],
};

export default config;
