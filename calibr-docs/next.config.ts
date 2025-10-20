import createMDX from '@next/mdx'
import type { NextConfig } from "next";

const withMDX = createMDX({
  extension: /\.mdx?$/,
})

const nextConfig: NextConfig = {
  pageExtensions: ['ts', 'tsx', 'mdx'],
  experimental: {
    mdxRs: true, // Next 15+ built-in MDX runtime
  },
}

export default withMDX(nextConfig)
