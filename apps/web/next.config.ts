import type { NextConfig } from 'next';
import createNextIntlPlugin from 'next-intl/plugin';

const withNextIntl = createNextIntlPlugin('./i18n/request.ts');

const nextConfig: NextConfig = {
  transpilePackages: ['@talim/ui', '@talim/types'],
  // Overridable so a production build can be made side-by-side with a running
  // `next dev` (which owns `.next`) — e.g. QA measuring CLS on a real build.
  distDir: process.env.NEXT_DIST_DIR || '.next',
  output: 'standalone',
  devIndicators: false,
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'img.youtube.com',
        pathname: '/vi/**',
      },
    ],
  },
};

export default withNextIntl(nextConfig);
