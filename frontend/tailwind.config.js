/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      colors: {
        void:   { 950: '#02030a', 900: '#04060e', 800: '#070a15', 700: '#0b1020', 600: '#101628', 500: '#161e35' },
        gold:   { DEFAULT: '#c8931a', light: '#e0aa30', dim: '#7a5510', muted: '#3a2808', glow: '#c8931a' },
        purple: { cyber: '#6d28d9', dark: '#2d1b69', dim: '#1a0f3d' },
        amber:  { bat: '#f59e0b', dark: '#92400e' },
        slate:  { bat: '#1e2a3a', dim: '#0d1520' },
      },
      fontFamily: {
        mono: ['"JetBrains Mono"', '"Fira Code"', 'Consolas', 'monospace'],
        sans: ['Inter', 'system-ui', 'sans-serif'],
      },
      boxShadow: {
        'glow-gold':   '0 0 16px rgba(200,147,26,0.4), 0 0 40px rgba(200,147,26,0.12)',
        'glow-red':    '0 0 14px rgba(220,38,38,0.45)',
        'glow-purple': '0 0 14px rgba(109,40,217,0.4)',
        'glow-amber':  '0 0 14px rgba(245,158,11,0.35)',
        'card':        '0 4px 32px rgba(0,0,0,0.7), inset 0 1px 0 rgba(200,147,26,0.06)',
      },
      keyframes: {
        pulse_gold:  { '0%,100%': { opacity: '1' }, '50%': { opacity: '0.5' } },
        blink:       { '0%,100%': { opacity: '1' }, '50%': { opacity: '0' } },
        shimmer:     { '0%': { backgroundPosition: '-200% 0' }, '100%': { backgroundPosition: '200% 0' } },
        flicker:     { '0%,100%': { opacity:'1' }, '92%': { opacity:'1' }, '93%': { opacity:'0.6' }, '94%': { opacity:'1' } },
      },
      animation: {
        pulse_gold: 'pulse_gold 2.5s ease-in-out infinite',
        blink:      'blink 1.2s step-end infinite',
        shimmer:    'shimmer 3s linear infinite',
        flicker:    'flicker 8s ease-in-out infinite',
      },
    },
  },
  plugins: [],
};
