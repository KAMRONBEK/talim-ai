import { Plus_Jakarta_Sans } from 'next/font/google';

// Interface & body workhorse for the "Scholar" system. Latin + Latin-ext only
// (no Cyrillic on Google Fonts); the ru locale falls back to Inter (--font-inter,
// loaded alongside) so Cyrillic still renders in a real typeface, not system-ui.
export const jakarta = Plus_Jakarta_Sans({
  subsets: ['latin', 'latin-ext'],
  weight: ['400', '500', '600', '700', '800'],
  display: 'swap',
  variable: '--font-jakarta',
  fallback: [
    'Inter',
    'system-ui',
    '-apple-system',
    'BlinkMacSystemFont',
    'Segoe UI',
    'Roboto',
    'sans-serif',
  ],
});
