/** @type {import('next').NextConfig} */
const nextConfig = {
  webpack: (config) => {
    // Ensure TS path alias `@/*` is resolved in production builds
    config.resolve.alias = {
      ...(config.resolve.alias || {}),
      '@': __dirname,
    }
    return config
  },
}

module.exports = nextConfig
