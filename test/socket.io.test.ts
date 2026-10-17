import type { Socket } from 'socket.io-client'
import type { ClientApplication } from './fixtures/socket.io/feathers-api/src/client'
import type { Message } from './fixtures/socket.io/feathers-api/src/services/messages/messages.schema'
import { fileURLToPath } from 'node:url'
import socketio from '@feathersjs/socketio-client'
import { setup, url } from '@nuxt/test-utils/e2e'
import ioc from 'socket.io-client'
import { afterAll, beforeAll, describe, expect, it } from 'vitest'
import { createClient } from './fixtures/socket.io/feathers-api/src/client'
import { fastNuxtE2EConfig } from './utils/fast-nuxt-e2e'

interface ClientVariant {
  label: string
  path?: string
  client?: ClientApplication
}

const variants: ClientVariant[] = [
  { label: 'default' },
  { label: 'custom /websocket', path: '/websocket' },
]

describe('socket.io default and custom paths', async () => {
  await setup({
    rootDir: fileURLToPath(new URL('./fixtures/socket.io/nuxt-app', import.meta.url)),
    nuxtConfig: fastNuxtE2EConfig,
  })

  function getFeathersClient(variant: ClientVariant): ClientApplication {
    if (!variant.client)
      throw new Error(`Socket.IO client was not initialized for ${variant.label}`)

    return variant.client
  }

  beforeAll(() => {
    for (const variant of variants) {
      const io = ioc(url('/'), {
        ...(variant.path ? { path: variant.path } : {}),
        transports: ['websocket'],
      })
      variant.client = createClient(socketio(io))
    }
  })

  afterAll(async () => {
    await Promise.all(variants.map(async (variant) => {
      if (variant.client)
        await variant.client.teardown()
    }))
  })

  for (const variant of variants) {
    it(`gets messages with featherClient on ${variant.label}`, async () => {
      const messages = await getFeathersClient(variant).service('messages').find({ paginate: false })
      expect(messages.length).greaterThan(1)
    })

    it(`creates a message with featherClient on ${variant.label}`, async () => {
      const client = getFeathersClient(variant)
      const message = await client.service('messages').create({ text: `Hello ${variant.label}` })
      const messages = await client.service('messages').find({
        query: {
          id: message.id,
        },
        paginate: false,
      })
      expect(messages.length).toBe(1)
    })

    it(`receives created events on ${variant.label}`, async () => {
      const client = getFeathersClient(variant)
      const [received, created] = await Promise.all([
        new Promise(resolve => (client.io as Socket).on('messages created', resolve)),
        client.service('messages').create({ text: `Realtime ${variant.label}` }),
      ])
      expect((received as Message)?.id).toBe(created?.id)
    })
  }
})
