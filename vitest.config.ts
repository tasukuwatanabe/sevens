import { defineConfig } from "vite-plus/test/config";
import { resolve } from "path";

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
        test: {
          name: "integration",
          include: ["tests/integration/**/*.test.ts"],
          environment: "node",
        },
      },
    ],
  },
});
