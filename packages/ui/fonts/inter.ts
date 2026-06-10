import localFont from 'next/font/local';

export const inter = localFont({
  src: './inter-latin.woff2',
  display: 'swap',
  variable: '--font-inter',
  weight: '100 900',
  fallback: [
    'system-ui',
    '-apple-system',
    'BlinkMacSystemFont',
    'Segoe UI',
    'Roboto',
    'sans-serif',
  ],
});
