/** @type {import('next').NextConfig} */
const nextConfig = {
  eslint: {
    // Disable ESLint during production builds - linting is done separately
    ignoreDuringBuilds: true,
  },
}

module.exports = nextConfig
