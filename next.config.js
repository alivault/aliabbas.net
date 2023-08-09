/** @type {import('next').NextConfig} */
const nextConfig = {
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'raw.githubusercontent.com',
        port: '',
        pathname: '/alivault/articles/main/images/**',
      },
    ],
  },
  unstable_includeFiles: ['node_modules/.pnpm/**/shiki/**/*.json'],
  output: 'standalone',
  future: {
    webpack5: true,
  },
  webpack(config) {
    config.resolve.fallback = {
      ...config.resolve.fallback,
      fs: false,
    };
  },
};

module.exports = nextConfig;
