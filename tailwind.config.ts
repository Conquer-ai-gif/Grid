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
        // ── Vercel-inspired Dark Theme ─────────────────────────
        black: { true: '#0B0F14' },
        surface: {
          1: '#0F141A',  // navbar / sidebar
          2: '#111827',  // cards / elevated panels
          3: '#1F2937',  // card alt
          4: '#172554',  // accent-tinted surface
        },
        // accent tokens — all map to #3B82F6 (blue) family
        amber: {
          1: '#3B82F6',  // primary accent (blue)
          2: '#E5E7EB',  // headings / bright text
          3: '#9CA3AF',  // body text
          4: '#2563EB',  // darker accent / hover
          5: '#1E3A5F',  // accent dim bg (active states)
          6: '#172554',  // accent very dim bg
        },
        border: {
          1: '#1F2937',  // default border
          2: '#374151',  // stronger border
          3: '#1F2937',  // neutral dark border
        },
        text: {
          1: '#E5E7EB',  // primary (headings)
          2: '#9CA3AF',  // secondary (body)
          3: '#6B7280',  // muted / hints
        },
        dark: {
          1: '#0F141A',
          2: '#0B0F14',
          3: '#111827',
          4: '#1F2937',
        },
        blue: { 1: '#3B82F6' },
        sky:  { 1: '#9CA3AF', 2: '#E5E7EB', 3: '#3B82F6' },
        orange:  { 1: '#3B82F6' },
        purple:  { 1: '#2563EB' },
        yellow:  { 1: '#3B82F6' },
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
        'pulse-accent': {
          '0%,100%': { opacity: '1' },
          '50%': { opacity: '0.4' },
        },
      },
      animation: {
        'accordion-down': 'accordion-down 0.2s ease-out',
        'accordion-up': 'accordion-up 0.2s ease-out',
        'pulse-accent': 'pulse-accent 2s ease-in-out infinite',
      },
      backgroundImage: {
        hero: "url('/images/hero-background.png')",
      },
    },
  },
  plugins: [require('tailwindcss-animate')],
} satisfies Config;

export default config;
