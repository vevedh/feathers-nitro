<template>
  <div class="showcase-page">
    <section class="hero">
      <p class="eyebrow">
        Adapter matrix
      </p>
      <h1>Choose the Feathers application style you already use.</h1>
      <p class="lead">
        The package exposes Nitro plugin factories for Express, Koa and Socket.IO.
        The live playground activates Express for REST and a fully configured
        Koa-backed application for Socket.IO.
      </p>
    </section>
    <section class="grid">
      <article class="card">
        <h2>Express</h2>
        <p class="muted">
          Active in `server/plugins/feathers-express-api.ts` and mounted under `/feathers`.
        </p>
      </article>
      <article class="card">
        <h2>Koa</h2>
        <p class="muted">
          Complete Koa application included; use the example plugin when Koa is your
          primary HTTP adapter.
        </p>
      </article>
      <article class="card">
        <h2>Socket.IO</h2>
        <p class="muted">
          Active browser transport with Nitro websocket support enabled.
        </p>
      </article>
    </section>
    <section class="panel">
      <h2>Minimal Nitro plugin</h2>
      <pre class="code"><code>import { createFeathersExpressAdapterNitroPlugin } from '@vevedh/feathers-nitro'
import { app } from 'feathers-api/src/app-express'

export default createFeathersExpressAdapterNitroPlugin(app)</code></pre>
      <p class="muted">
        See `server/examples/` for Express, Koa, Socket.IO and multi-instance variants.
      </p>
    </section>
  </div>
</template>
