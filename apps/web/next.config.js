const { withExpo } = require('@expo/next-adapter')
const path = require('path');

/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: false,
  // Disable TypeScript checking during build
  typescript: {
    // Dangerously allow production builds to successfully complete even if
    // your project has type errors
    ignoreBuildErrors: true,
  },
  // Disable ESLint during build
  eslint: {
    // Allow production builds to successfully complete even if
    // your project has ESLint errors
    ignoreDuringBuilds: true,
  },
  webpack(config) {
    // Keep existing aliases
    config.resolve.alias = {
      ...config.resolve.alias,
      'react-native-svg': 'react-native-svg-web',
    };

    // Add the rule for shared package images
    config.module.rules.push({
      test: /\.(png|jpg|jpeg|gif|svg|webp)$/i,
      include: [
        // This is the path to your shared public folder
        path.resolve(__dirname, '../../packages/public'),
        // You can add other folders if needed
      ],
      type: 'asset/resource',
      generator: {
        // This controls where the files will be output and how they'll be referenced
        // The [name] will be the original filename, [hash] adds cache busting
        // The 'shared' prefix puts them in a specific folder to keep things organized
        filename: 'static/media/shared/[name].[hash][ext]',
      },
    });

    // Optional: For SVG files, you might want to use them as React components
    // This allows importing SVGs directly as components
    config.module.rules.push({
      test: /\.svg$/,
      include: [path.resolve(__dirname, '../../packages/public')],
      use: ['@svgr/webpack'],
      // This rule will be used when you import SVGs with ?react suffix
      // e.g., import MyIcon from '../../packages/public/images/myicon.svg?react'
      resourceQuery: /react/,
    });

    return config;
  },
  images: {
    domains: ['images.unsplash.com', 'pftp.eu.auth0.com'],
    // Add remotePatterns for more security and flexibility
    remotePatterns: [
      {
        protocol: 'https',
        hostname: '**',
      },
    ],
  },
  // Add publicRuntimeConfig to help with resolving shared assets
  publicRuntimeConfig: {
    // This makes paths available to your app at runtime
    sharedAssetsPath: '/shared', // This will be the URL path prefix for shared assets
  },
  transpilePackages: [
    'react-native',
    'react-native-web',
    'solito',
    'moti',
    'app',
    'react-native-reanimated',
    '@expo/html-elements',
    'react-native-gesture-handler',
    'dashboard'
  ],
};

const plugins = [];

module.exports = withExpo(plugins.reduce((acc, next) => next(acc), nextConfig));