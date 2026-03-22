// https://nuxt.com/docs/api/configuration/nuxt-config
export default defineNuxtConfig({
  compatibilityDate: "2025-07-15",
  devtools: { enabled: true },
  modules: ["@nuxtjs/tailwindcss", "@vite-pwa/nuxt"],
  components: {
    dirs: [{ path: "~/components", pathPrefix: false }],
  },
  app: {
    head: {
      htmlAttrs: { lang: "ja" },
      title: "7並べ",
      meta: [{ name: "description", content: "ブラウザで遊べる7並べカードゲーム" }],
      link: [
        { rel: "icon", href: "/favicon.ico", sizes: "any" },
        { rel: "icon", href: "/icon.svg", type: "image/svg+xml" },
        { rel: "apple-touch-icon", href: "/apple-touch-icon-180x180.png" },
      ],
    },
  },
  nitro: {
    compressPublicAssets: {
      gzip: true,
      brotli: true,
    },
  },
  pwa: {
    registerType: "autoUpdate",
    manifest: {
      name: "7並べ",
      short_name: "7並べ",
      description: "ブラウザで遊べる7並べカードゲーム",
      theme_color: "#166534",
      background_color: "#166534",
      display: "standalone",
      start_url: "/",
      lang: "ja",
      icons: [
        { src: "pwa-64x64.png", sizes: "64x64", type: "image/png" },
        { src: "pwa-192x192.png", sizes: "192x192", type: "image/png" },
        { src: "pwa-512x512.png", sizes: "512x512", type: "image/png" },
        {
          src: "maskable-icon-512x512.png",
          sizes: "512x512",
          type: "image/png",
          purpose: "maskable",
        },
      ],
    },
    workbox: {
      navigateFallback: "/",
      globPatterns: ["**/*.{js,css,html,ico,png,svg}"],
    },
    devOptions: {
      enabled: true,
      type: "module",
    },
  },
});
