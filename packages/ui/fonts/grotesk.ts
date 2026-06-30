import { Space_Grotesk } from 'next/font/google';

// Micro-label / eyebrow face for the "Scholar" system — used uppercase with wide
// tracking for section kickers and metadata. Latin + Latin-ext only; ru falls back
// to Inter (--font-inter) for Cyrillic coverage.
export const grotesk = Space_Grotesk({
  subsets: ['latin', 'latin-ext'],
  weight: ['400', '500', '600', '700'],
  display: 'swap',
  variable: '--font-grotesk',
  fallback: ['Inter', 'system-ui', 'Segoe UI', 'sans-serif'],
});
