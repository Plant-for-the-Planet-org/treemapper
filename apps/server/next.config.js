const { withTamagui } = require('@tamagui/next-plugin')
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
  transpilePackages: [
    'react-native',
    'react-native-web',
    'solito',
    'moti',
    'app',
    'react-native-reanimated',
    '@expo/html-elements',
    'react-native-gesture-handler',
    'tamagui',
    '@tamagui/core',
    '@tamagui/theme-base',
    '@tamagui/config',
    // add all packages that use Tamagui
    'dashboard' // <-- add your packages that use Tamagui
  ],
}

const plugins = [
  withTamagui({
    config: '../../packages/ui/tamagui.config.ts',
    components: ['tamagui'],
    importsWhitelist: ['constants.js', 'colors.js'],
    logTimings: true,
    disableExtraction: process.env.NODE_ENV === 'development',
    useReactNativeWebLite: true // <-- add this
  })
]

module.exports = withExpo(plugins.reduce((acc, next) => next(acc), nextConfig))