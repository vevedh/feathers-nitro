import { defineNitroPlugin } from 'nitropack/runtime/plugin'
import { createFeathersKoaAdapterNitroPlugin } from '../../../../../../src/runtime/plugins/koa'
import { createKoaRouter } from '../../../../../../src/runtime/routers/koa'
import { app } from '../../../feathers-api/src/app'

const customPathPlugin = createFeathersKoaAdapterNitroPlugin(app, '/koa')

export default defineNitroPlugin((nitroApp) => {
  // Keep both historical routing contracts in one real Nitro server build.
  nitroApp.hooks.hook('feathers:afterSetup', async (feathersApp) => {
    if (feathersApp === app)
      createKoaRouter(app)
  })

  customPathPlugin(nitroApp)
})
