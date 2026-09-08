<script setup lang="ts">
const auth = useAuthStore()

async function logout() {
  await auth.logout()
  await navigateTo('/')
}
</script>

<template>
  <div class="shell">
    <header class="topbar">
      <NuxtLink class="brand" to="/">
        Feathers Nitro Playground
      </NuxtLink>
      <nav class="nav" aria-label="Playground navigation">
        <NuxtLink to="/adapters">
          Adapters
        </NuxtLink>
        <NuxtLink to="/multi-instance">
          Multi-instance
        </NuxtLink>
        <NuxtLink v-if="auth.isAuthenticated" to="/messages">
          Realtime
        </NuxtLink>
        <button v-if="auth.isAuthenticated" class="link-button" type="button" @click="logout">
          Logout
        </button>
      </nav>
    </header>
    <main class="page">
      <slot />
    </main>
    <footer class="footer">
      Nuxt 4 · Nitro 2 · FeathersJS 5 · REST · Express · Koa · Socket.IO
    </footer>
  </div>
</template>
