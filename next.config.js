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
      '/': ['node_modules/shiki/**/*'],
    },
  },
};

module.exports = nextConfig;
