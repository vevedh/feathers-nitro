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
    // Runtime ABI-sensitive dependencies: review and validate together.
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
    'typescript': 'minor',
    'vitest': 'minor',
    'vue-tsc': 'minor',
    'release-it': 'minor',
    'unbuild': 'minor',
    '@pinia/nuxt': 'patch',
    'pinia': 'minor',
    'vue': 'minor',
    'vue-router': 'minor',
    '@gabortorma/nuxt-eslint-layer': 'patch',
    '@gabortorma/antfu-eslint-config': 'patch',
  },
})
