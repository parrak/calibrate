/** @type {import('next').NextConfig} */
const nextConfig = {
  eslint: {
    // Disable ESLint during production builds - linting is done separately
    ignoreDuringBuilds: true,
  },
  typescript: {
    // TypeScript errors are checked separately in CI, allow builds to proceed
    ignoreBuildErrors: true,
  },
}

module.exports = nextConfig
