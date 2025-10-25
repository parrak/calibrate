/** @type {import('next').NextConfig} */
const nextConfig = {
  output: 'standalone',
  eslint: {
    ignoreDuringBuilds: true,
  },
  typescript: {
    ignoreBuildErrors: true,
  },
  experimental: {
    serverComponentsExternalPackages: ['@prisma/client']
  },
  transpilePackages: ['isomorphic-dompurify'],
  webpack: (config) => {
    config.externals = [...(config.externals || []), 'jsdom']
    return config
  }
}

module.exports = nextConfig
