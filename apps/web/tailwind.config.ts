import type { Config } from 'tailwindcss';
import talimPreset from '@talim/tailwind-config/tailwind.config';

const config: Config = {
  presets: [talimPreset],
  content: [
    './app/**/*.{ts,tsx}',
    './components/**/*.{ts,tsx}',
    './lib/**/*.{ts,tsx}',
    '../../packages/ui/components/**/*.{ts,tsx}',
  ],
  theme: {
    extend: {
      // "Scholar" type system — web app only (admin keeps the shared preset fonts).
      // Cyrillic-less Google faces fall back to Inter/Rubik, which carry Cyrillic.
      fontFamily: {
        sans: ['var(--font-jakarta)', 'var(--font-inter)', 'system-ui', 'sans-serif'],
        display: ['var(--font-newsreader)', 'var(--font-display)', 'Georgia', 'serif'],
        label: ['var(--font-grotesk)', 'var(--font-inter)', 'system-ui', 'sans-serif'],
      },
      keyframes: {
        'deck-fade-in': { '0%': { opacity: '0' }, '100%': { opacity: '1' } },
        'deck-fade-in-up': {
          '0%': { opacity: '0', transform: 'translateY(16px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
        'deck-scale-in': {
          '0%': { opacity: '0', transform: 'scale(0.96)' },
          '100%': { opacity: '1', transform: 'scale(1)' },
        },
        'deck-slide-in-right': {
          '0%': { opacity: '0', transform: 'translateX(28px)' },
          '100%': { opacity: '1', transform: 'translateX(0)' },
        },
        'deck-slide-in-left': {
          '0%': { opacity: '0', transform: 'translateX(-28px)' },
          '100%': { opacity: '1', transform: 'translateX(0)' },
        },
      },
      animation: {
        'deck-fade-in': 'deck-fade-in 350ms cubic-bezier(0.16,1,0.3,1) both',
        'deck-fade-in-up': 'deck-fade-in-up 420ms cubic-bezier(0.16,1,0.3,1) both',
        'deck-scale-in': 'deck-scale-in 400ms cubic-bezier(0.34,1.56,0.64,1) both',
        'deck-slide-in-right': 'deck-slide-in-right 320ms cubic-bezier(0.76,0,0.24,1) both',
        'deck-slide-in-left': 'deck-slide-in-left 320ms cubic-bezier(0.76,0,0.24,1) both',
      },
    },
  },
};

export default config;
