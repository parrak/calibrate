/** @type {import('next').NextConfig} */
const nextConfig = {
  eslint: {
    // ESLint runs during build, but we can ignore errors if needed
    ignoreDuringBuilds: false,
  },
  typescript: {
    // Exclude test files and vitest config from TypeScript compilation
    ignoreBuildErrors: false,
  },
  // Exclude test files and vitest config from webpack build
  webpack: (config, { isServer }) => {
    // Ignore vitest config files during build
    config.module.rules.push({
      test: /vitest\.config\.(ts|js)$/,
      use: 'ignore-loader',
    })
    
    if (!isServer) {
      config.resolve.fallback = {
        ...config.resolve.fallback,
        fs: false,
      }
    }
    return config
  },
}

module.exports = nextConfig
