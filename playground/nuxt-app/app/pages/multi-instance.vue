<template>
  <div class="showcase-page">
    <section class="hero">
      <p class="eyebrow">
        Multiple Feathers applications
      </p>
      <h1>Run independent Feathers instances in one Nitro process.</h1>
      <p class="lead">
        Use named instances when an application needs separate APIs, transports or
        lifecycle boundaries while sharing a single Nuxt/Nitro deployment.
      </p>
    </section>
    <section class="panel">
      <pre class="code"><code>import { setupMultiple } from '@vevedh/feathers-nitro/setup'

export default defineNitroPlugin((nitroApp) =&gt; {
  void setupMultiple(nitroApp, [
    { app: publicApp, options: { id: 'public-api', basePath: '/public' } },
    { app: adminApp, options: { id: 'admin-api', basePath: '/admin' } },
  ])
})</code></pre>
      <p class="muted">
        The package also exports `FeathersInstanceManager`,
        `getFeathersInstanceManager`, and individual router/plugin helpers for
        lower-level composition.
      </p>
    </section>
  </div>
</template>
