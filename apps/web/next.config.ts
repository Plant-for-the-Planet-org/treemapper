import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  transpilePackages: ['shared-core'],
  typescript: {
    ignoreBuildErrors: true,
  },
  // Build optimizations
  compiler: {
    removeConsole: process.env.NODE_ENV === 'production',
  },
  async headers() {
    const isProduction = process.env.APP_ENV === 'production';
    return [
      {
        source: '/.well-known/apple-app-site-association',
        headers: [{ key: 'Content-Type', value: 'application/json' }],
      },
      {
        source: '/.well-known/assetlinks.json',
        headers: [{ key: 'Content-Type', value: 'application/json' }],
      },
      ...(!isProduction
        ? [{ source: '/(.*)', headers: [{ key: 'X-Robots-Tag', value: 'noindex, nofollow' }] }]
        : []),
    ];
  },
  async rewrites() {
    return [
      {
        source: '/api/server/:path*',
        destination: `http://127.0.0.1:${process.env.SERVER_PORT || 3001}/api/:path*`
      },
      {
        source: '/docs/:path*',
        destination: `http://127.0.0.1:${process.env.DOCS_PORT || 3002}/docs/:path*`
      }
    ]
  }
};

export default nextConfig;