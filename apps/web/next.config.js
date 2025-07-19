const path = require('path');

/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: false,
  
  // Add this to transpile TanStack Query packages
  transpilePackages: [
    '@tanstack/react-query',
    '@tanstack/query-core',
    '@tanstack/react-query-devtools',
    // Add your shared packages here too
    '@packages/shared-api',
    '@packages/shared-core',
    '@packages/shared-state',
  ],
  
  // Disable TypeScript checking during build
  typescript: {
    ignoreBuildErrors: true,
  },
  
  // Disable ESLint during build
  eslint: {
    ignoreDuringBuilds: true,
  },
  
  webpack(config) {
    // Your existing webpack config...
    config.module.rules.push({
      test: /\.(png|jpg|jpeg|gif|svg|webp)$/i,
      include: [
        path.resolve(__dirname, '../../packages/public'),
      ],
      type: 'asset/resource',
      generator: {
        filename: 'static/media/shared/[name].[hash][ext]',
      },
    });

    config.module.rules.push({
      test: /\.svg$/,
      include: [path.resolve(__dirname, '../../packages/public')],
      use: ['@svgr/webpack'],
      resourceQuery: /react/,
    });

    return config;
  },
  
  images: {
    domains: ['images.unsplash.com', 'pftp.eu.auth0.com'],
    remotePatterns: [
      {
        protocol: 'https',
        hostname: '**',
      },
    ],
  },
  
  publicRuntimeConfig: {
    sharedAssetsPath: '/shared',
  },
};

module.exports = nextConfig;