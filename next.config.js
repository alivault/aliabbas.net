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
};

module.exports = nextConfig;
