import { defineNitroPlugin } from 'nitropack/runtime/plugin'
import { createFeathersExpressAdapterNitroPlugin } from '../../../../../../src/runtime/plugins/express'
import { createExpressRouter } from '../../../../../../src/runtime/routers/express'
import { app } from '../../../feathers-api/src/app'

const customPathPlugin = createFeathersExpressAdapterNitroPlugin(app, '/express')

export default defineNitroPlugin((nitroApp) => {
  // The showcase already covers the factory's default path. Here the factory
  // exercises its custom-path argument while the same initialized app is also
  // mounted at the historical default path, avoiding a second Nuxt build.
  nitroApp.hooks.hook('feathers:afterSetup', async (feathersApp) => {
    if (feathersApp === app)
      createExpressRouter(app)
  })

  customPathPlugin(nitroApp)
})
