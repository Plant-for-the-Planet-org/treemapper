import type { NextConfig } from "next";

const nextConfig: NextConfig = {
   transpilePackages: ['shared-core'],
   typescript: {
      ignoreBuildErrors: true,
   },
   eslint: {
      ignoreDuringBuilds: true, // Also ignore ESLint if needed
   },
};

export default nextConfig;
