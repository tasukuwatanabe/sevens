import { defineConfig } from "vite-plus";

export default defineConfig({
  fmt: {
    ignorePatterns: [],
  },
  staged: {
    "*": "vp fmt",
    "**/*.{ts,vue,js,cjs,mjs}": "vp check --fix",
  },
  lint: { options: { typeAware: true, typeCheck: true } },
});
