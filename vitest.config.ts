import { defineConfig } from "vite-plus/test/config";
import vue from "@vitejs/plugin-vue";

export default defineConfig({
  test: {
    projects: [
      {
        test: {
          name: "unit",
          include: ["tests/unit/**/*.test.ts"],
          environment: "node",
        },
      },
      {
        plugins: [vue()],
        test: {
          name: "browser",
          include: ["tests/browser/**/*.test.ts"],
          environment: "happy-dom",
          setupFiles: ["tests/browser/setup.ts"],
        },
      },
      {
        test: {
          name: "integration",
          include: ["tests/integration/**/*.test.ts"],
          environment: "node",
        },
      },
    ],
  },
});
