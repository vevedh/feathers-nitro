<script setup lang="ts">
const authStore = useAuthStore()
const credentials = reactive({ userId: 'test', password: '12345' })
const errorMessage = ref('')

const capabilities = [
  ['Express adapter', 'Mount an existing Feathers Express application inside Nitro.'],
  ['Koa adapter', 'Use a Feathers Koa application with Nitro request handling.'],
  ['Socket.IO', 'Keep Feathers realtime events and browser subscriptions.'],
  ['SSR + REST', 'Use REST during server rendering without holding open sockets.'],
  ['Authentication', 'Local strategy, JWT persistence and SSR re-authentication.'],
  ['Multi-instance', 'Register and manage several named Feathers applications.'],
]

async function login() {
  errorMessage.value = ''
  try {
    await authStore.authenticate({ strategy: 'local', ...credentials })
    await navigateTo('/messages')
  }
  catch (error) {
    errorMessage.value = error instanceof Error ? error.message : 'Authentication failed'
  }
}
</script>

<template>
  <div class="showcase-page">
    <section class="hero">
      <p class="eyebrow">
        @vevedh/feathers-nitro · showcase
      </p>
      <h1>FeathersJS applications inside Nuxt and Nitro.</h1>
      <p class="lead">
        A runnable Nuxt 4 playground covering Express, Koa, Socket.IO, SSR REST calls,
        authentication, Pinia and multi-instance integration.
      </p>
      <div class="badges">
        <span class="badge">Nuxt 4.5.2</span>
        <span class="badge">Vite 8.2.2</span>
        <span class="badge">Vue 3.5.42</span>
        <span class="badge">FeathersJS 5.0.49</span>
      </div>
    </section>

    <section class="grid" aria-label="Capabilities">
      <article v-for="capability in capabilities" :key="capability[0]" class="card">
        <h2>{{ capability[0] }}</h2>
        <p class="muted">
          {{ capability[1] }}
        </p>
      </article>
    </section>

    <section class="panel">
      <template v-if="authStore.isAuthenticated">
        <h2>Authenticated as {{ authStore.user?.userId }}</h2>
        <p class="muted">
          Open the realtime demo to create a message and receive the Feathers `created`
          event over Socket.IO.
        </p>
        <NuxtLink class="button" to="/messages">
          Open realtime demo
        </NuxtLink>
      </template>
      <template v-else>
        <h2>Try authentication + realtime</h2>
        <p class="muted">
          The seeded playground account is intentionally public: test / 12345.
        </p>
        <form class="form-grid" @submit.prevent="login">
          <label>
            User ID
            <input v-model="credentials.userId" autocomplete="username" required>
          </label>
          <label>
            Password
            <input
              v-model="credentials.password"
              type="password"
              autocomplete="current-password"
              required
            >
          </label>
          <button class="button" type="submit">
            Authenticate
          </button>
        </form>
        <p v-if="errorMessage" role="alert">
          {{ errorMessage }}
        </p>
      </template>
    </section>
  </div>
</template>
