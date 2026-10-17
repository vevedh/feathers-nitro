/**
 * Make sure reAuthenticate finishes before we begin rendering.
 *
 * Pinia remains an explicit runtime dependency. The Feathers client plugin is
 * ordered before this file by Nuxt's deterministic alphabetical plugin order:
 * 01.feathers.ts -> 02.feathers-auth.ts.
 *
 * Passing Nuxt's Pinia instance avoids relying on Pinia's global active
 * instance during SSR.
 */
export default defineNuxtPlugin({
  name: 'feathers-auth',
  dependsOn: ['pinia'],
  async setup() {
    const auth = useAuthStore(usePinia())
    await auth.reAuthenticate()
  },
})
