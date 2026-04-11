import { defineConfig } from "vite-plus";

export default defineConfig({
  fmt: {
    ignorePatterns: [],
  },
  staged: {
    "**/*.{ts,vue,js,cjs,mjs}": ["vp fmt", "vp check --fix"],
  },
  lint: {
    options: { typeAware: true, typeCheck: true },
    rules: {
      "@typescript-eslint/no-explicit-any": "error",
    },
  },
});
