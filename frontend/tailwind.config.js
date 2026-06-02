/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      colors: {
        // Superficies y fondos
        stone:  { 50: '#F6F1E8', 100: '#EFE6D8', 200: '#E5D8C5', 300: '#D8C8B5', 400: '#C4AE95', 500: '#A89C8E' },
        ivory:  { DEFAULT: '#FFFCF6', warm: '#FAF5EC' },
        // Acentos
        bronze: { DEFAULT: '#B08A57', dark: '#8A6B3E', light: '#C9A87A', muted: '#D4B896' },
        cognac: { DEFAULT: '#8A5A3C', light: '#A67055' },
        olive:  { DEFAULT: '#5F6F52', light: '#7A8D6A', dark: '#4A5640' },
        wine:   { DEFAULT: '#9F3A32', light: '#B54D44', dark: '#7A2B24' },
        sand:   { warm: '#C58A2B', light: '#D4A345' },
        // Textos
        ink:    { DEFAULT: '#1F1C18', secondary: '#6F6558', muted: '#A89C8E', faint: '#C4B8AA' },
        // Técnico/oscuro (para sidebar y elementos técnicos)
        vault:  { DEFAULT: '#1F1C18', mid: '#2C2820', light: '#3A3530', faint: '#4A4540' },
      },
      fontFamily: {
        display: ['"Cormorant Garamond"', 'Georgia', 'serif'],
        sans:    ['Inter', 'system-ui', 'sans-serif'],
        mono:    ['"JetBrains Mono"', '"Fira Code"', 'Consolas', 'monospace'],
      },
      boxShadow: {
        'card':      '0 1px 3px rgba(31,28,24,0.05), 0 4px 12px rgba(31,28,24,0.06)',
        'card-md':   '0 2px 8px rgba(31,28,24,0.07), 0 8px 24px rgba(31,28,24,0.08)',
        'card-lg':   '0 4px 16px rgba(31,28,24,0.09), 0 16px 40px rgba(31,28,24,0.1)',
        'btn':       '0 1px 3px rgba(31,28,24,0.12)',
        'btn-hover': '0 2px 8px rgba(31,28,24,0.18)',
        'bronze':    '0 2px 8px rgba(176,138,87,0.2)',
        'focus':     '0 0 0 3px rgba(176,138,87,0.18)',
      },
      borderRadius: {
        'sm': '4px',
        DEFAULT: '6px',
        'md': '8px',
        'lg': '12px',
        'xl': '16px',
      },
    },
  },
  plugins: [],
};
