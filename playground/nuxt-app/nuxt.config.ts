import process from 'node:process'

export default defineNuxtConfig({
  compatibilityDate: '2026-07-10',

  extends: [
    '@gabortorma/nuxt-eslint-layer',
  ],

  modules: [
    '@pinia/nuxt',
  ],

  css: ['~/assets/css/main.css'],

  imports: {
    autoImport: true,
  },

  devtools: { enabled: true },

  vite: {
    server: {
      hmr: process.env.FEATHERS_NITRO_STACKBLITZ === '1' ? false : undefined,
    },
  },

  runtimeConfig: {
    public: {
      feathersBaseUrl: '',
    },
  },

  nitro: {
    experimental: {
      websocket: true,
    },
  },

  typescript: {
    strict: true,
    typeCheck: true,
  },
})
