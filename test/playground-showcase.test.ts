import type { Socket } from 'socket.io-client'
import type { ClientApplication, Message } from '../playground/feathers-api/src/client'
import { fileURLToPath } from 'node:url'
import socketio from '@feathersjs/socketio-client'
import { $fetch, setup, url } from '@nuxt/test-utils/e2e'
import ioc from 'socket.io-client'
import { afterAll, beforeAll, describe, expect, it } from 'vitest'
import { createClient } from '../playground/feathers-api/src/client'
import { configureEmbeddedFeathersEnvironment } from '../playground/nuxt-app/server/utils/embedded-feathers-config'

configureEmbeddedFeathersEnvironment()

interface AuthenticationResponse {
  accessToken: string
  user?: {
    userId?: string
  }
}

describe('nuxt showcase playground', async () => {
  await setup({
    rootDir: fileURLToPath(new URL('../playground/nuxt-app', import.meta.url)),
  })

  let accessToken = ''
  let feathersClient: ClientApplication | undefined

  function getFeathersClient(): ClientApplication {
    if (!feathersClient)
      throw new Error('Showcase Socket.IO client was not initialized')

    return feathersClient
  }

  beforeAll(async () => {
    const authentication = await $fetch<AuthenticationResponse>('/feathers/authentication', {
      method: 'POST',
      body: {
        strategy: 'local',
        userId: 'test',
        password: '12345',
      },
    })

    accessToken = authentication.accessToken
    expect(authentication.user?.userId).toBe('test')

    const io = ioc(url('/'), { transports: ['websocket'] })
    feathersClient = createClient(socketio(io))
    await feathersClient.authenticate({
      strategy: 'jwt',
      accessToken,
    })
  })

  afterAll(async () => {
    if (feathersClient)
      await feathersClient.teardown()
  })

  it.each([
    ['/', 'FeathersJS applications inside Nuxt and Nitro.'],
    ['/adapters', 'Choose the Feathers application style you already use.'],
    ['/multi-instance', 'Run independent Feathers instances in one Nitro process.'],
  ])('renders public showcase page %s', async (route, expectedText) => {
    const html = await $fetch<string>(route)
    expect(html).toContain(expectedText)
  })

  it('exposes the seeded Express REST API', async () => {
    const messages = await $fetch<Message[]>('/feathers/messages')
    expect(messages.length).toBeGreaterThanOrEqual(2)
    expect(messages.some(message => message.text.includes('dummy setup hook'))).toBe(true)
  })

  it('renders the authenticated messages page through SSR REST re-authentication', async () => {
    const html = await $fetch<string>('/messages', {
      headers: {
        cookie: `feathers-jwt=${accessToken}`,
      },
    })

    expect(html).toContain('REST on SSR, Socket.IO in the browser.')
    expect(html).toContain('Authenticated as test')
  })

  it('receives a created event over the live Socket.IO transport', async () => {
    const client = getFeathersClient()
    const receivedPromise = new Promise<Message>((resolve, reject) => {
      const timeout = setTimeout(() => {
        reject(new Error('Timed out waiting for the showcase Socket.IO created event'))
      }, 10_000)

      const socket = client.io as Socket
      socket.once('messages created', (message: Message) => {
        clearTimeout(timeout)
        resolve(message)
      })
    })

    const created = await client.service('messages').create({
      text: `Showcase smoke ${Date.now()}`,
    })
    const received = await receivedPromise

    expect(received.id).toBe(created.id)
    expect(received.text).toBe(created.text)
  })
})
