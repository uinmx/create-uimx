import { defineConfig } from "vitest/config"

export default defineConfig({
  test: {
    include: ["test/**/*.test.[tj]s"],
    exclude: ["**/node_modules/**", "**/dist/**"],
    testTimeout: 20000,
    isolate: false,
  },
})
