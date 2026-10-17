import type { Socket } from 'socket.io-client'
import type { ClientApplication, Message } from '../playground/feathers-api/src/client'
import { fileURLToPath } from 'node:url'
import socketio from '@feathersjs/socketio-client'
import { $fetch, buildFixture, createTest, fetch as fetchResponse, loadFixture, setTestContext, startServer, url } from '@nuxt/test-utils/e2e'
import ioc from 'socket.io-client'
import { afterAll, afterEach, beforeAll, beforeEach, describe, expect, it } from 'vitest'
import { createClient } from '../playground/feathers-api/src/client'
import { configureEmbeddedFeathersEnvironment } from '../playground/nuxt-app/server/utils/embedded-feathers-config'

configureEmbeddedFeathersEnvironment()

interface RenderRequestOptions {
  headers?: Record<string, string>
}

function formatDiagnosticPayload(payload: unknown, limit = 6000) {
  let serialized = ''

  if (typeof payload === 'string') {
    serialized = payload
  }
  else {
    try {
      serialized = JSON.stringify(payload, null, 2) ?? String(payload)
    }
    catch {
      serialized = String(payload)
    }
  }

  if (serialized.length <= limit)
    return serialized

  return `${serialized.slice(0, limit)}\n…[diagnostic payload truncated]`
}

async function readDiagnosticBody(response: Response) {
  const body = await response.text()
  const contentType = response.headers.get('content-type') ?? ''

  if (!contentType.includes('application/json'))
    return body

  try {
    return JSON.parse(body) as unknown
  }
  catch {
    return body
  }
}

async function fetchRenderedPage(route: string, options: RenderRequestOptions = {}) {
  const htmlResponse = await fetchResponse(route, {
    headers: {
      accept: 'text/html',
      ...options.headers,
    },
  })
  const htmlBody = await htmlResponse.text()

  if (htmlResponse.status < 400)
    return htmlBody

  const diagnosticResponse = await fetchResponse(route, {
    headers: {
      accept: 'application/json',
      ...options.headers,
    },
  })
  const diagnosticBody = await readDiagnosticBody(diagnosticResponse)

  throw new Error([
    `Nuxt showcase SSR failed for ${route}: HTTP ${htmlResponse.status} ${htmlResponse.statusText}`,
    `JSON diagnostic (${diagnosticResponse.status} ${diagnosticResponse.statusText}):`,
    formatDiagnosticPayload(diagnosticBody),
    'HTML error body:',
    formatDiagnosticPayload(htmlBody),
  ].join('\n'))
}

interface AuthenticationResponse {
  accessToken: string
  user?: {
    userId?: string
  }
}

describe('nuxt showcase playground', () => {
  const showcaseRootDir = fileURLToPath(new URL('../playground/nuxt-app', import.meta.url))
  let buildTimelineStartedAt = 0

  function logBuildMilestone(label: string) {
    const elapsed = buildTimelineStartedAt === 0 ? 0 : Date.now() - buildTimelineStartedAt
    console.info(`[Patch022 showcase build] ${label} (+${elapsed}ms)`)
  }

  const nitroE2EExternalPackages = new Set([
    '@feathersjs/adapter-commons',
    '@feathersjs/authentication',
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

  const nuxtTest = createTest({
    rootDir: showcaseRootDir,
    captureServerLogs: false,
    logLevel: 4,
    serverStartTimeout: 120_000,
    nuxtConfig: {
      // `pnpm verify` runs the strict type gate before `test:all`; do not run
      // the same expensive Vue TSC check a second time inside this E2E build.
      typescript: {
        typeCheck: false,
      },
      // DevTools are not part of the showcase contract and only add test-build work.
      devtools: {
        enabled: false,
      },
      nitro: {
        // E2E correctness does not depend on minification or gzip/brotli size
        // reporting. Keep production defaults untouched while avoiding work that
        // adds no integration coverage here.
        minify: false,
        logging: {
          compressedSizes: false,
        },
        // Nitro 2.13.4 production bundling can spend most of its time resolving
        // and parsing the CommonJS graphs behind Feathers/Express/Koa/Socket.IO.
        // Rollup's native external gate runs before Nitro's resolver plugins.
        // Keep local project sources bundled; externalize only reviewed third-party
        // runtime packages that are present in this pnpm workspace during E2E.
        rollupConfig: {
          external: isNitroE2EExternal,
        },
        hooks: {
          'build:before': (nitro) => {
            logBuildMilestone('nitro build:before')
          },
          'rollup:before': () => {
            logBuildMilestone(`nitro rollup:before externalPackages=${nitroE2EExternalPackages.size}`)
          },
          'compiled': () => {
            logBuildMilestone('nitro compiled')
          },
        },
      },
    },
  })

  async function runSetupPhase(label: string, task: () => Promise<unknown>) {
    const startedAt = Date.now()
    console.info(`[Patch022 showcase setup] START ${label}`)

    try {
      await task()
      console.info(`[Patch022 showcase setup] DONE ${label} (${Date.now() - startedAt}ms)`)
    }
    catch (error) {
      console.error(`[Patch022 showcase setup] FAILED ${label} (${Date.now() - startedAt}ms)`, error)
      throw error
    }
  }

  beforeAll(async () => {
    setTestContext(nuxtTest.ctx)
    await runSetupPhase('loadFixture', loadFixture)
  }, 90_000)

  beforeAll(async () => {
    setTestContext(nuxtTest.ctx)
    buildTimelineStartedAt = Date.now()
    await runSetupPhase('buildFixture', buildFixture)
  }, 360_000)

  beforeAll(async () => {
    setTestContext(nuxtTest.ctx)
    await runSetupPhase('startServer', async () => startServer(nuxtTest.ctx.options.env))
  }, 120_000)

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

  beforeEach(nuxtTest.beforeEach)
  afterEach(nuxtTest.afterEach)

  afterAll(async () => {
    if (feathersClient)
      await feathersClient.teardown()

    await nuxtTest.afterAll()
  }, 120_000)

  it.each([
    ['/', 'FeathersJS applications inside Nuxt and Nitro.'],
    ['/adapters', 'Choose the Feathers application style you already use.'],
    ['/multi-instance', 'Run independent Feathers instances in one Nitro process.'],
  ])('renders public showcase page %s', async (route, expectedText) => {
    const html = await fetchRenderedPage(route)
    expect(html).toContain(expectedText)
  })

  it('exposes the seeded Express REST API', async () => {
    const messages = await $fetch<Message[]>('/feathers/messages')
    expect(messages.length).toBeGreaterThanOrEqual(2)
    expect(messages.some(message => message.text.includes('dummy setup hook'))).toBe(true)
  })

  it('renders the authenticated messages page through SSR REST re-authentication', async () => {
    const html = await fetchRenderedPage('/messages', {
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
