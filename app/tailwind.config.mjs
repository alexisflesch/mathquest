import { Config } from 'tailwindcss'
import fontFamily from 'tailwindcss/defaultTheme'

export default {
  darkMode: 'class',
  content: [
    './src/**/*.{js,ts,jsx,tsx}',
    './src/app/**/*.{js,ts,jsx,tsx}',
    './src/components/**/*.{js,ts,jsx,tsx}',
    './src/lib/**/*.{js,ts,jsx,tsx}',
    './public/**/*.html',
  ],
  safelist: [
    'bg-primary', 'text-primary', 'border-primary',
    'bg-accent', 'text-accent', 'border-accent',
    'bg-error', 'text-error', 'border-error',
    'bg-success', 'text-success', 'border-success',
    'bg-warning', 'text-warning', 'border-warning',
    'bg-info', 'text-info', 'border-info',
    'bg-neutral', 'text-neutral', 'border-neutral',
    // Ajoute ici toutes les variantes DaisyUI que tu veux utiliser dans ton CSS global
    'ring-primary',
  ],
  theme: {
    extend: {
      fontFamily: {
        sans: ['Inter', ...fontFamily.sans],
      },
      colors: {
        primary: '#2563EB',
        accent: '#10B981',
        background: '#F9FAFB',
        surface: '#FFFFFF',
        'text-primary': '#111827',
        'text-secondary': '#6B7280',
        border: '#E5E7EB',
        error: '#DC2626',
      },
      boxShadow: {
        card: '0 2px 8px rgba(0, 0, 0, 0.05)',
      },
      borderRadius: {
        xl: '1rem',
      },
    },
  },
  plugins: [require('daisyui')],
  daisyui: {
    themes: [
      {
        mathquest: {
          primary: '#2563EB',
          'primary-content': '#fff',
          accent: '#10B981',
          'accent-content': '#fff',
          neutral: '#111827',
          'neutral-content': '#fff',
          'base-100': '#FFFFFF',
          'base-200': '#F9FAFB',
          'base-300': '#E5E7EB',
          info: '#2563EB',
          success: '#10B981',
          warning: '#F59E42',
          error: '#DC2626',
        },
      },
    ],
  },
}
