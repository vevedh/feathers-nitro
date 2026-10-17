import type { MessageData } from './fixtures/express/feathers-api/src/services/messages/messages.schema'
import { fileURLToPath } from 'node:url'
import { $fetch, setup } from '@nuxt/test-utils/e2e'
import { assert, describe, expect, it } from 'vitest'
import { fastNuxtE2EConfig } from './utils/fast-nuxt-e2e'

describe('express default and custom paths', async () => {
  await setup({
    rootDir: fileURLToPath(new URL('./fixtures/express/nuxt-app', import.meta.url)),
    nuxtConfig: fastNuxtE2EConfig,
  })

  it('renders the index page', async () => {
    const html = await $fetch('/')
    expect(html).toContain('index')
  })

  for (const basePath of ['/feathers', '/express']) {
    it(`renders the static feathers-api page at ${basePath}`, async () => {
      const html = await $fetch(basePath)
      expect(html).toContain('feathers-api')
    })

    it(`gets messages with $fetch at ${basePath}`, async () => {
      const messages: Array<MessageData> = await $fetch(`${basePath}/messages`)
      expect(messages.length).greaterThan(1)
    })

    it(`returns the Feathers 404 contract at ${basePath}`, async () => {
      try {
        await $fetch(`${basePath}/no-express-path`)
        assert.fail('Should never catch this')
      }
      catch (error: any) {
        expect(error.response.status).toBe(404)
        expect(error.response.statusText).toBe('[feathers] Page not found: /no-express-path')
      }
    })
  }
})
