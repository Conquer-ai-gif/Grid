import type { Config } from 'tailwindcss';

const config = {
  darkMode: ['class'],
  content: [
    './pages/**/*.{ts,tsx}',
    './components/**/*.{ts,tsx}',
    './app/**/*.{ts,tsx}',
    './src/**/*.{ts,tsx}',
  ],
  prefix: '',
  theme: {
    container: {
      center: true,
      padding: '2rem',
      screens: { '2xl': '1400px' },
    },
    extend: {
      colors: {
        // ── Terminal Amber on True Black ──────────────────────
        black: { true: '#000000' },
        surface: {
          1: '#050505',  // navbar / sidebar
          2: '#0A0A0A',  // cards
          3: '#111111',  // card alt
          4: '#1C1500',  // amber-tinted surface
        },
        amber: {
          1: '#F59E0B',  // primary accent
          2: '#FDE68A',  // headings / bright text
          3: '#D4B483',  // body text
          4: '#B45309',  // darker amber / danger
          5: '#1C1500',  // amber dim bg
          6: '#2E2800',  // amber very dim text
        },
        border: {
          1: '#1F1A00',  // default amber-tinted border
          2: '#2E2800',  // stronger border
          3: '#1A1A1A',  // neutral dark border
        },
        text: {
          1: '#FDE68A',  // primary (headings)
          2: '#D4B483',  // secondary (body)
          3: '#2E2800',  // muted / hints
        },
        // kept for legacy component compat
        dark: {
          1: '#050505',
          2: '#000000',
          3: '#0A0A0A',
          4: '#111111',
        },
        blue: { 1: '#F59E0B' },   // mapped to amber
        sky: {
          1: '#D4B483',
          2: '#FDE68A',
          3: '#F59E0B',
        },
        orange:  { 1: '#F59E0B' },
        purple:  { 1: '#B45309' },
        yellow:  { 1: '#F59E0B' },
      },
      keyframes: {
        'accordion-down': {
          from: { height: '0' },
          to: { height: 'var(--radix-accordion-content-height)' },
        },
        'accordion-up': {
          from: { height: 'var(--radix-accordion-content-height)' },
          to: { height: '0' },
        },
        'pulse-amber': {
          '0%,100%': { opacity: '1' },
          '50%': { opacity: '0.4' },
        },
      },
      animation: {
        'accordion-down': 'accordion-down 0.2s ease-out',
        'accordion-up': 'accordion-up 0.2s ease-out',
        'pulse-amber': 'pulse-amber 2s ease-in-out infinite',
      },
      backgroundImage: {
        hero: "url('/images/hero-background.png')",
      },
    },
  },
  plugins: [require('tailwindcss-animate')],
} satisfies Config;

export default config;
