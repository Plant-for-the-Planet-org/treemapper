import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  transpilePackages: ['shared-core'],
  typescript: {
    ignoreBuildErrors: true,
  },
  eslint: {
    ignoreDuringBuilds: true,
  },
  // Build optimizations
  compiler: {
    removeConsole: process.env.NODE_ENV === 'production',
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