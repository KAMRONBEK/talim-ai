import { Rubik } from 'next/font/google';

// Display / headings face. Rubik is a friendly, slightly-rounded geometric sans
// with full Latin, Latin-ext and Cyrillic coverage — characterful for an EdTech
// brand while staying multilingual (uz / ru / en).
export const display = Rubik({
  subsets: ['latin', 'latin-ext', 'cyrillic'],
  display: 'swap',
  variable: '--font-display',
  fallback: ['system-ui', '-apple-system', 'BlinkMacSystemFont', 'Segoe UI', 'sans-serif'],
});
