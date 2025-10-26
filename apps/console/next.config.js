/** @type {import('next').NextConfig} */
const nextConfig = {
  webpack: (config) => {
    // Force-resolve NextAuth server import to the server build entry
    config.resolve = config.resolve || {}
    config.resolve.alias = config.resolve.alias || {}
    config.resolve.alias['next-auth'] = 'next-auth/next'
    return config
  },
}

module.exports = nextConfig
