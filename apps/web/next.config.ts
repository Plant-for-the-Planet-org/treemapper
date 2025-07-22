import type { NextConfig } from "next";

const nextConfig: NextConfig = {
   transpilePackages: ['shared-core'],
   typescript: {
      ignoreBuildErrors: true,
   },
   eslint: {
      ignoreDuringBuilds: true, // Also ignore ESLint if needed
   },
   async rewrites() {
    return [
      {
        source: '/api/server/:path*',
        destination: `http://localhost:${process.env.SERVER_PORT || 3001}/:path*`
      }
    ]
  }
};

export default nextConfig;
