import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import { configDefaults } from "vitest/config";

export default defineConfig({
  plugins: [react()],
  ssr: {
    optimizeDeps: {
      include: ["antd"],
    },
  },
  build: {
    minify: false,
  },
  test: {
    exclude: ["./node_modules"],
    environment: "jsdom",
    globals: true,
    coverage: {
      provider: "c8",
      reporter: ["text"],
    },
    testTimeout: 30000,
  },
});
