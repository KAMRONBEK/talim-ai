import { Newsreader } from 'next/font/google';

// Display / editorial face for the "Scholar" system — a literary serif with an
// optical-size axis. Latin + Latin-ext only (no Cyrillic on Google Fonts), so the
// ru locale falls back to Rubik (--font-display) which carries Cyrillic.
export const newsreader = Newsreader({
  subsets: ['latin', 'latin-ext'],
  weight: ['400', '500', '600', '700'],
  style: ['normal', 'italic'],
  display: 'swap',
  variable: '--font-newsreader',
  fallback: ['Rubik', 'Georgia', 'Cambria', 'Times New Roman', 'serif'],
});
