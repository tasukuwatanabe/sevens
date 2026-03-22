import { defineConfig } from "vite-plus/test/config";
import vue from "@vitejs/plugin-vue";
import { resolve } from "path";
import { playwright } from "vitest/browser-playwright";

const alias = { "@": resolve(__dirname, "app") };

export default defineConfig({
  test: {
    projects: [
      {
        resolve: { alias },
        test: {
          name: "unit",
          include: ["tests/unit/**/*.test.ts"],
          environment: "node",
        },
      },
      {
        resolve: { alias },
        plugins: [vue()],
        define: { "process.env.NODE_ENV": JSON.stringify("test") },
        test: {
          name: "browser",
          include: ["tests/browser/**/*.test.ts"],
          browser: {
            enabled: true,
            provider: playwright(),
            instances: [{ browser: "chromium" }],
          },
          setupFiles: ["tests/browser/setup.ts"],
        },
      },
      {
        resolve: { alias },
        test: {
          name: "integration",
          include: ["tests/integration/**/*.test.ts"],
          environment: "node",
        },
      },
    ],
  },
});
