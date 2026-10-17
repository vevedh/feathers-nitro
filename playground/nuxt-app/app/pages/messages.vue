<script setup lang="ts">
import type { Message } from 'feathers-api/src/client'

const { api } = useFeathers()
const auth = useAuthStore(usePinia())
const service = api.service('messages')
const messages = ref<Message[]>([])
const events = ref<string[]>([])
const newMessage = ref('')
const user = computed(() => auth.user)

function normalizeMessages(result: Message[] | { data: Message[] }) {
  return Array.isArray(result) ? result : result.data
}

async function loadMessages() {
  messages.value = normalizeMessages(await service.find({ query: { $limit: 20 } }))
}

async function addMessage() {
  const text = newMessage.value.trim()
  if (!text)
    return

  await service.create({ text })
  newMessage.value = ''
  if (import.meta.server)
    await loadMessages()
}

function onCreated(message: Message) {
  if (!messages.value.some(item => item.id === message.id))
    messages.value.unshift(message)

  events.value.unshift(`created #${message.id}: ${message.text}`)
  events.value = events.value.slice(0, 8)
}

await loadMessages()
onMounted(() => {
  service.on('created', onCreated)
})
onBeforeUnmount(() => {
  service.off('created', onCreated)
})
</script>

<template>
  <div class="showcase-page">
    <section class="hero">
      <p class="eyebrow">
        Realtime transport
      </p>
      <h1>REST on SSR, Socket.IO in the browser.</h1>
      <p class="lead">
        Authenticated as {{ user?.userId }}. Initial data is loaded through the typed
        Feathers service and browser creations are observed through realtime events.
      </p>
    </section>

    <div class="grid">
      <section class="card">
        <h2>Create message</h2>
        <form @submit.prevent="addMessage">
          <label>
            Message
            <input v-model="newMessage" autocomplete="off" maxlength="500">
          </label>
          <p>
            <button class="button" type="submit">
              Create via Feathers
            </button>
          </p>
        </form>
        <h3>Messages ({{ messages.length }})</h3>
        <ul class="list">
          <li v-for="message in messages" :key="message.id" class="event">
            #{{ message.id }} · {{ message.text }}
          </li>
        </ul>
      </section>
      <section class="card">
        <h2>Realtime event stream</h2>
        <p class="muted">
          Create a message in this or another browser tab to see the `created` event.
        </p>
        <ul class="list">
          <li v-for="event in events" :key="event" class="event">
            {{ event }}
          </li>
          <li v-if="events.length === 0" class="muted">
            Waiting for an event…
          </li>
        </ul>
      </section>
    </div>
  </div>
</template>
