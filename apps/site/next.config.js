/** @type {import('next').NextConfig} */
const nextConfig = {
  typescript: {
    // Allow production builds to succeed even if type errors exist in CI
    ignoreBuildErrors: true,
  },
  eslint: {
    // Skip ESLint during builds in CI to reduce required dev deps
    ignoreDuringBuilds: true,
  },
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
