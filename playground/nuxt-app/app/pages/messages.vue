<script setup lang="ts">
import type { Message } from 'feathers-api/src/client'

const { api } = useFeathers()
const service = api.service('messages')
const messages = ref<Message[]>([])
const newMessage = ref('')
const user = computed(() => useAuthStore().user)

const total = computed(() => messages.value.length)

function normalizeMessages(result: Message[] | { data: Message[] }) {
  return Array.isArray(result) ? result : result.data
}

async function loadMessages() {
  const result = await service.find({ query: { $limit: 20 } })
  messages.value = normalizeMessages(result)
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

async function logout() {
  await useAuthStore().logout()
  await navigateTo('/')
}

function onCreated(message: Message) {
  if (!messages.value.some(item => item.id === message.id))
    messages.value.unshift(message)
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
  <main style="max-width: 32rem; margin: 2rem auto;">
    <button style="float: right;" type="button" @click="logout">
      Logout
    </button>

    <h2>
      User: <strong>{{ user?.userId }}</strong>
    </h2>

    <form @submit.prevent="addMessage">
      <label for="message">Add your message</label>
      <input id="message" v-model="newMessage" autocomplete="off" maxlength="500">
      <button type="submit">
        Add message
      </button>
    </form>

    <h3>Total: {{ total }}</h3>
    <p v-for="message in messages" :key="message.id">
      {{ message.id }}: {{ message.text }}
    </p>
  </main>
</template>
