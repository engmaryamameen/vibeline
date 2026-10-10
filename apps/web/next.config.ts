import type { NextConfig } from 'next';

const internalApiOrigin = process.env.INTERNAL_API_URL ?? 'http://127.0.0.1:5001';

const securityHeaders = [
  { key: 'X-Content-Type-Options', value: 'nosniff' },
  { key: 'Referrer-Policy', value: 'strict-origin-when-cross-origin' },
  { key: 'X-Frame-Options', value: 'DENY' },
  { key: 'Permissions-Policy', value: 'camera=(self), microphone=(self), display-capture=(), geolocation=()' }
];

const nextConfig: NextConfig = {
  transpilePackages: ['@vibeline/ui', '@vibeline/utils', '@vibeline/contracts'],
  poweredByHeader: false,
  async headers() {
    return [{ source: '/:path*', headers: securityHeaders }];
  },
  async rewrites() {
    return [{ source: '/v1/:path*', destination: `${internalApiOrigin}/v1/:path*` }];
  }
};

export default nextConfig;
