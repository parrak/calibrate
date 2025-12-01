// vitest.config.mts
import { defineConfig } from "file:///Users/rakes/Documents/antigravity/calibrate/node_modules/.pnpm/vitest@1.6.1_@types+node@20.19.22_@vitest+ui@4.0.4_jsdom@22.1.0/node_modules/vitest/dist/config.js";
import react from "file:///Users/rakes/Documents/antigravity/calibrate/node_modules/.pnpm/@vitejs+plugin-react@5.1.0_vite@7.1.12_@types+node@20.19.22_jiti@1.21.7_tsx@4.20.6_yaml@2.8.1_/node_modules/@vitejs/plugin-react/dist/index.js";
import path from "path";
var __vite_injected_original_dirname = "/Users/rakes/Documents/antigravity/calibrate/apps/docs";
var vitest_config_default = defineConfig({
  plugins: [react()],
  test: {
    environment: "jsdom",
    globals: true,
    setupFiles: ["./vitest.setup.ts"],
    // Avoid fork pool issues on CI runners with constrained envs
    pool: "threads",
    poolOptions: {
      threads: {
        minThreads: 1,
        maxThreads: 2
      }
    },
    // Increase timeout for CI environments
    testTimeout: 1e4,
    hookTimeout: 1e4,
    passWithNoTests: true
  },
  resolve: {
    alias: {
      "@": path.resolve(__vite_injected_original_dirname, "./")
    }
  }
});
export {
  vitest_config_default as default
};
//# sourceMappingURL=data:application/json;base64,ewogICJ2ZXJzaW9uIjogMywKICAic291cmNlcyI6IFsidml0ZXN0LmNvbmZpZy5tdHMiXSwKICAic291cmNlc0NvbnRlbnQiOiBbImNvbnN0IF9fdml0ZV9pbmplY3RlZF9vcmlnaW5hbF9kaXJuYW1lID0gXCIvVXNlcnMvcmFrZXMvRG9jdW1lbnRzL2FudGlncmF2aXR5L2NhbGlicmF0ZS9hcHBzL2RvY3NcIjtjb25zdCBfX3ZpdGVfaW5qZWN0ZWRfb3JpZ2luYWxfZmlsZW5hbWUgPSBcIi9Vc2Vycy9yYWtlcy9Eb2N1bWVudHMvYW50aWdyYXZpdHkvY2FsaWJyYXRlL2FwcHMvZG9jcy92aXRlc3QuY29uZmlnLm10c1wiO2NvbnN0IF9fdml0ZV9pbmplY3RlZF9vcmlnaW5hbF9pbXBvcnRfbWV0YV91cmwgPSBcImZpbGU6Ly8vVXNlcnMvcmFrZXMvRG9jdW1lbnRzL2FudGlncmF2aXR5L2NhbGlicmF0ZS9hcHBzL2RvY3Mvdml0ZXN0LmNvbmZpZy5tdHNcIjtpbXBvcnQgeyBkZWZpbmVDb25maWcgfSBmcm9tICd2aXRlc3QvY29uZmlnJ1xuaW1wb3J0IHJlYWN0IGZyb20gJ0B2aXRlanMvcGx1Z2luLXJlYWN0J1xuaW1wb3J0IHBhdGggZnJvbSAncGF0aCdcblxuZXhwb3J0IGRlZmF1bHQgZGVmaW5lQ29uZmlnKHtcbiAgcGx1Z2luczogW3JlYWN0KCldLFxuICB0ZXN0OiB7XG4gICAgZW52aXJvbm1lbnQ6ICdqc2RvbScsXG4gICAgZ2xvYmFsczogdHJ1ZSxcbiAgICBzZXR1cEZpbGVzOiBbJy4vdml0ZXN0LnNldHVwLnRzJ10sXG4gICAgLy8gQXZvaWQgZm9yayBwb29sIGlzc3VlcyBvbiBDSSBydW5uZXJzIHdpdGggY29uc3RyYWluZWQgZW52c1xuICAgIHBvb2w6ICd0aHJlYWRzJyxcbiAgICBwb29sT3B0aW9uczoge1xuICAgICAgdGhyZWFkczoge1xuICAgICAgICBtaW5UaHJlYWRzOiAxLFxuICAgICAgICBtYXhUaHJlYWRzOiAyLFxuICAgICAgfSxcbiAgICB9LFxuICAgIC8vIEluY3JlYXNlIHRpbWVvdXQgZm9yIENJIGVudmlyb25tZW50c1xuICAgIHRlc3RUaW1lb3V0OiAxMDAwMCxcbiAgICBob29rVGltZW91dDogMTAwMDAsXG4gICAgcGFzc1dpdGhOb1Rlc3RzOiB0cnVlLFxuICB9LFxuICByZXNvbHZlOiB7XG4gICAgYWxpYXM6IHtcbiAgICAgICdAJzogcGF0aC5yZXNvbHZlKF9fZGlybmFtZSwgJy4vJyksXG4gICAgfSxcbiAgfSxcbn0pXG5cbiJdLAogICJtYXBwaW5ncyI6ICI7QUFBMFYsU0FBUyxvQkFBb0I7QUFDdlgsT0FBTyxXQUFXO0FBQ2xCLE9BQU8sVUFBVTtBQUZqQixJQUFNLG1DQUFtQztBQUl6QyxJQUFPLHdCQUFRLGFBQWE7QUFBQSxFQUMxQixTQUFTLENBQUMsTUFBTSxDQUFDO0FBQUEsRUFDakIsTUFBTTtBQUFBLElBQ0osYUFBYTtBQUFBLElBQ2IsU0FBUztBQUFBLElBQ1QsWUFBWSxDQUFDLG1CQUFtQjtBQUFBO0FBQUEsSUFFaEMsTUFBTTtBQUFBLElBQ04sYUFBYTtBQUFBLE1BQ1gsU0FBUztBQUFBLFFBQ1AsWUFBWTtBQUFBLFFBQ1osWUFBWTtBQUFBLE1BQ2Q7QUFBQSxJQUNGO0FBQUE7QUFBQSxJQUVBLGFBQWE7QUFBQSxJQUNiLGFBQWE7QUFBQSxJQUNiLGlCQUFpQjtBQUFBLEVBQ25CO0FBQUEsRUFDQSxTQUFTO0FBQUEsSUFDUCxPQUFPO0FBQUEsTUFDTCxLQUFLLEtBQUssUUFBUSxrQ0FBVyxJQUFJO0FBQUEsSUFDbkM7QUFBQSxFQUNGO0FBQ0YsQ0FBQzsiLAogICJuYW1lcyI6IFtdCn0K
