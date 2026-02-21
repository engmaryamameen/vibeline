import type { NextConfig } from 'next';

const internalApiOrigin = process.env.INTERNAL_API_URL ?? 'http://127.0.0.1:5001';

const nextConfig: NextConfig = {
  transpilePackages: ['@vibeline/ui', '@vibeline/utils', '@vibeline/types'],
  async rewrites() {
    return [
      { source: '/v1/:path*', destination: `${internalApiOrigin}/v1/:path*` }
    ];
  }
};

export default nextConfig;
