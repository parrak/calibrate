import { defineConfig } from 'vitest/config'
import { resolve } from 'path'

export default defineConfig({
  resolve: {
    alias: {
      '@calibr/monitor': resolve(__dirname, 'tests/mocks/monitor.ts'),
      '@calibr/pricing-engine': resolve(__dirname, '../pricing-engine/index.ts'),
    },
    extensions: ['.ts', '.js', '.json'],
  },
  test: {
    globals: true,
    environment: 'node',
    coverage: {
      provider: 'v8',
      reporter: ['text', 'json', 'html'],
      exclude: ['**/*.test.ts', '**/*.config.ts', '**/dist/**']
    }
  }
})
