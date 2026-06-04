import type { NextConfig } from 'next';

const nextConfig: NextConfig = {
  transpilePackages: ['@talim/ui', '@talim/types'],
  output: 'standalone',
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

export default nextConfig;
