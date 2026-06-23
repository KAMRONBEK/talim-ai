import { Inter } from 'next/font/google';

// Body / UI workhorse. Loaded with Cyrillic + Latin-ext so the ru locale and
// Uzbek special characters (oʻ, gʻ) render in the real typeface, not a fallback.
export const inter = Inter({
  subsets: ['latin', 'latin-ext', 'cyrillic'],
  display: 'swap',
  variable: '--font-inter',
  fallback: [
    'system-ui',
    '-apple-system',
    'BlinkMacSystemFont',
    'Segoe UI',
    'Roboto',
    'sans-serif',
  ],
});
