const { withExpo } = require('@expo/next-adapter')

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
    config.resolve.alias = {
      ...config.resolve.alias,
      'react-native-svg': 'react-native-svg-web',
    };
    return config;
  },
  images: {
    domains: ['images.unsplash.com'],
    // Alternatively, you can use remotePatterns for more granular control
    // remotePatterns: [
    //   {
    //     protocol: 'https',
    //     hostname: 'images.unsplash.com',
    //     pathname: '**',
    //   },
    // ],
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
}

const plugins = []

module.exports = withExpo(plugins.reduce((acc, next) => next(acc), nextConfig))