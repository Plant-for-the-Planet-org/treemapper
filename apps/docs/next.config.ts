import type { NextConfig } from 'next';
import createNextIntlPlugin from 'next-intl/plugin';

const withNextIntl = createNextIntlPlugin();

const nextConfig: NextConfig = {
  reactStrictMode: true,
  basePath: process.env.NODE_ENV === 'production' ? '/docs' : '',
  images: {
    domains: ['placeholder.com', 'www-cdn.plant-for-the-planet.org', 'pub-261389c3bd084eb3a62686b2f08ce42b.r2.dev'],
  },
};

export default withNextIntl(nextConfig);
