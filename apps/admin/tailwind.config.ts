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
      // "Scholar" type system for admin (mirrors apps/web). Cyrillic-less Google
      // faces fall back to Inter, which carries Cyrillic.
      fontFamily: {
        sans: ['var(--font-jakarta)', 'var(--font-inter)', 'system-ui', 'sans-serif'],
        display: ['var(--font-newsreader)', 'var(--font-inter)', 'Georgia', 'serif'],
        label: ['var(--font-grotesk)', 'var(--font-inter)', 'system-ui', 'sans-serif'],
      },
    },
  },
};

export default config;
