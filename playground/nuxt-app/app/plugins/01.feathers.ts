import rest from '@feathersjs/rest-client'
import socketioClient from '@feathersjs/socketio-client'
import { createClient } from 'feathers-api/src/client'
import { io } from 'socket.io-client'

/**
 * Creates a typed Feathers client for both SSR and browser execution.
 *
 * REST is used during SSR because it is deterministic and does not keep an
 * open socket in the server renderer. Socket.IO is used in the browser.
 */
export default defineNuxtPlugin(() => {
  const runtimeConfig = useRuntimeConfig()
  const fallbackOrigin = import.meta.server
    ? useRequestURL().origin
    : window.location.origin
  const host = runtimeConfig.public.feathersBaseUrl || fallbackOrigin

  const storageKey = 'feathers-jwt'
  const jwt = useCookie<string | null>(storageKey, {
    sameSite: 'lax',
    secure: import.meta.env.PROD,
  })

  const storage = {
    getItem: (_key: string) => jwt.value,
    setItem: (_key: string, value: string) => {
      jwt.value = value
    },
    removeItem: (_key: string) => {
      jwt.value = null
    },
  }

  const connection = import.meta.server
    ? rest(`${host}/feathers`).fetch(globalThis.fetch.bind(globalThis))
    : socketioClient(io(host, { transports: ['websocket'] }))

  const api = createClient(connection, { storage, storageKey })

  return {
    provide: {
      api,
    },
  }
})
