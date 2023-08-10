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
  experimental: {
    outputFileTracingIncludes: {
      '/lib/articles.ts': ['node_modules/shiki/**/*'],
    },
  },
};

module.exports = nextConfig;
