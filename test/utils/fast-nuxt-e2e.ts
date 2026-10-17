import type { NuxtConfig } from '@nuxt/schema'

/**
 * Third-party runtime packages that are already installed in the workspace and
 * do not need to be rebundled into every local Nuxt integration fixture.
 *
 * Project-under-test sources and each fixture's local feathers-api sources stay
 * bundled so adapter, routing, SSR and Socket.IO integration coverage remains real.
 */
const nitroE2EExternalPackages = new Set([
  '@feathersjs/adapter-commons',
  '@feathersjs/authentication',
  '@feathersjs/authentication-client',
  '@feathersjs/authentication-local',
  '@feathersjs/configuration',
  '@feathersjs/errors',
  '@feathersjs/express',
  '@feathersjs/feathers',
  '@feathersjs/koa',
  '@feathersjs/memory',
  '@feathersjs/rest-client',
  '@feathersjs/schema',
  '@feathersjs/socketio',
  '@feathersjs/socketio-client',
  '@feathersjs/transport-commons',
  '@feathersjs/typebox',
  'compression',
  'engine.io',
  'express',
  'koa',
  'socket.io',
  'socket.io-client',
  'winston',
])

function isNitroE2EExternal(id: string) {
  const segments = id.split('/')
  const packageName = id.startsWith('@') ? segments.slice(0, 2).join('/') : segments[0]
  return packageName ? nitroE2EExternalPackages.has(packageName) : false
}

/**
 * Fast local E2E overrides. The normal Nuxt configuration and production build
 * remain strict; these overrides remove only work that does not add integration
 * coverage to the fixture build itself.
 */
export const fastNuxtE2EConfig: NuxtConfig = {
  typescript: {
    typeCheck: false,
  },
  devtools: {
    enabled: false,
  },
  nitro: {
    minify: false,
    logging: {
      compressedSizes: false,
    },
    rollupConfig: {
      external: isNitroE2EExternal,
    },
  },
}
