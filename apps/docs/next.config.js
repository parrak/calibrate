/** @type {import('next').NextConfig} */
const nextConfig = {
  eslint: {
    // ESLint runs during build
    ignoreDuringBuilds: false,
  },
  typescript: {
    // TypeScript errors are checked, but vitest.config.ts is excluded in tsconfig.json
    ignoreBuildErrors: false,
  },
  // Exclude test files from webpack build
  webpack: (config, { isServer }) => {
    // Exclude vitest config and test files from webpack compilation
    // These files are already excluded in tsconfig.json, but we ensure webpack ignores them too
    config.module.rules.push({
      test: /(vitest\.config|\.test|\.spec)\.(ts|tsx|js|jsx)$/,
      exclude: /node_modules/,
      use: {
        loader: 'ignore-loader',
      },
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
