export default defineNuxtConfig({
  srcDir: 'app/',
  ssr: true,
  devtools: { enabled: false },
  css: ['~/assets/main.css'],
  runtimeConfig: {
    apiInternalBase: process.env.NUXT_API_INTERNAL_BASE || 'http://backend:3001/api',
    public: {
      siteUrl: process.env.NUXT_PUBLIC_SITE_URL || 'http://localhost:3000',
      apiBase: process.env.NUXT_PUBLIC_API_BASE || '/api',
    },
  },
  compatibilityDate: '2026-05-11',
});
