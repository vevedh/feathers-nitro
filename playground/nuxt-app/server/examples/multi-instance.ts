import { app as expressApp } from 'feathers-api/src/app-express'
import { app as koaApp } from 'feathers-api/src/app-koa'
import { setupMultiple } from '../../../../src/runtime/setup'

export default defineNitroPlugin((nitroApp) => {
  void setupMultiple(nitroApp, [
    { app: expressApp, options: { id: 'express-api', basePath: '/express' } },
    { app: koaApp, options: { id: 'koa-api', basePath: '/koa' } },
  ])
})
