// For more information about this file see https://dove.feathersjs.com/guides/cli/application.html

import type { KoaApplication } from './declarations'
import configuration from '@feathersjs/configuration'
import { feathers } from '@feathersjs/feathers'
import { bodyParser, koa as feathersKoa, parseAuthentication, rest, serveStatic } from '@feathersjs/koa'
import socketio from '@feathersjs/socketio'
import { authentication } from './authentication'
import { channels } from './channels'
import { configurationValidator } from './configuration'
import { dummy } from './dummy'
import { services } from './services/index'

export const app: KoaApplication = feathersKoa(feathers())

app.configure(configuration(configurationValidator))
app.use(serveStatic(app.get('public')))
app.use(parseAuthentication())
app.use(bodyParser())

app.configure(rest())
app.configure(
  socketio({
    transports: ['websocket'],
    cors: { origin: app.get('origins') },
  }),
)

app.hooks({
  around: {},
  before: {},
  after: {},
  error: {},
})

app.hooks({
  setup: [],
  teardown: [],
})

app.configure(authentication)
app.configure(services)
app.configure(channels)
app.configure(dummy)
