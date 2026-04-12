import { defineConfig } from "vite-plus";
import vue from "@vitejs/plugin-vue";
import { fileURLToPath, URL } from "node:url";

export default defineConfig({
  plugins: [vue()],
  resolve: {
    alias: { "@": fileURLToPath(new URL("./app", import.meta.url)) },
  },
  server: {
    port: 3000,
    proxy: { "/api": "http://localhost:8787" },
  },
  css: {
    postcss: "./postcss.config.js",
  },
  build: { outDir: "dist", emptyOutDir: true },
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
