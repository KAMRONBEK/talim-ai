import type { NextConfig } from 'next';

const nextConfig: NextConfig = {
  transpilePackages: ['@talim/ui', '@talim/types'],
  output: 'standalone',
};

export default nextConfig;
