import type { User } from 'feathers-api/src/client'
import { acceptHMRUpdate, defineStore } from 'pinia'

export const useAuthStore = defineStore('auth', () => {
  const { api } = useFeathers()

  const user = shallowRef<User | null>(null)
  const ready = ref(false)
  let initialization: Promise<void> | null = null

  const isAuthenticated = computed(() => user.value !== null)

  function applyAuthenticatedUser(result: Awaited<ReturnType<typeof api.authenticate>>) {
    user.value = (result.user as User | undefined) ?? null
  }

  async function authenticate(credentials: Parameters<typeof api.authenticate>[0]) {
    const result = await api.authenticate(credentials)
    applyAuthenticatedUser(result)
    return result
  }

  async function reAuthenticate() {
    initialization ??= (async () => {
      try {
        const result = await api.reAuthenticate()
        applyAuthenticatedUser(result)
      }
      catch {
        user.value = null
      }
      finally {
        ready.value = true
      }
    })()

    await initialization
  }

  async function logout() {
    try {
      await api.logout()
    }
    finally {
      user.value = null
      ready.value = true
    }
  }

  async function getPromise() {
    return initialization ?? Promise.resolve()
  }

  return {
    authenticate,
    getPromise,
    isAuthenticated,
    logout,
    ready,
    reAuthenticate,
    user,
  }
})

if (import.meta.hot)
  import.meta.hot.accept(acceptHMRUpdate(useAuthStore, import.meta.hot))
