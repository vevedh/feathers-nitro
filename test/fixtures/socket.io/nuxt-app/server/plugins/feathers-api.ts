import { defineNitroPlugin } from 'nitropack/runtime/plugin'
import { createSocketIoRouter } from '../../../../../../src/runtime/routers/socket.io'
import { setup } from '../../../../../../src/runtime/setup'
import { app as customPathApp } from '../../../../socket.io-path/feathers-api/src/app'
import { app as defaultApp } from '../../../feathers-api/src/app'

export default defineNitroPlugin((nitroApp) => {
  nitroApp.hooks.hook('feathers:afterSetup', async (feathersApp) => {
    if (feathersApp === defaultApp || feathersApp === customPathApp)
      await createSocketIoRouter(feathersApp)
  })

  // Distinct manager IDs are required because these are two independent
  // Feathers applications sharing one Nitro process and two Engine.IO paths.
  void setup(nitroApp, defaultApp, { id: 'socket-default' })
  void setup(nitroApp, customPathApp, { id: 'socket-custom-path' })
})
