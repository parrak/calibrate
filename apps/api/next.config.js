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
  transpilePackages: ['isomorphic-dompurify', '@calibr/shopify-connector', '@calibr/amazon-connector', '@calibr/db'],
  webpack: (config) => {
    config.externals = [...(config.externals || []), 'jsdom']
    return config
  }
}

module.exports = nextConfig
