import type { NextConfig } from 'next';
import createNextIntlPlugin from 'next-intl/plugin';

const withNextIntl = createNextIntlPlugin();

const nextConfig: NextConfig = {
  reactStrictMode: true,
  images: {
    domains: ['placeholder.com', 'www-cdn.plant-for-the-planet.org'],
  },
};

export default withNextIntl(nextConfig);
