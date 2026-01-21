/** @type {import('next').NextConfig} */
const nextConfig = {
  typescript: {
    ignoreBuildErrors: true
  },
  eslint: {
    ignoreDuringBuilds: true
  },
  images: {
    unoptimized: true
  },
  webpack: (config) => {
    config.resolve.fallback = {
      ...config.resolve.fallback,
      fs: false,
      net: false,
      tls: false,
      "node:buffer": false,
      "node:util": false,
      "node:stream": false,
      "node:events": false
    };
    config.resolve.alias = {
      ...config.resolve.alias,
      '@': '.'
    };
    return config;
  }
};

module.exports = nextConfig;