import { defineConfig } from 'taze'

export default defineConfig({
  maturityPeriod: 14,
  ignorePaths: [
    '**/node_modules/**',
    '**/dist/**',
    '**/.nuxt/**',
    '**/.output/**',
    '**/coverage/**',
  ],
  exclude: [
    // Runtime ABI-sensitive dependencies deliberately pinned for Nitro/H3 compatibility.
    'h3',
    'nitropack',
    // Local workspace alias, not an npm package to bump.
    'feathers-api',
  ],
  packageMode: {
    'nuxt': 'minor',
    'nuxi': 'minor',
    '@nuxt/schema': 'minor',
    '@nuxt/test-utils': 'minor',
    '@nuxt/devtools': 'minor',
    'typescript': 'minor',
    'vitest': 'minor',
    'vue-tsc': 'minor',
    'release-it': 'minor',
    '@pinia/nuxt': 'patch',
    'nuxt-feathers-pinia': 'patch',
    '@gabortorma/nuxt-eslint-layer': 'patch',
  },
})
