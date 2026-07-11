# Nuxt 4 playground

This workspace validates `@vevedh/feathers-nitro` against Nuxt 4 with
Express, Socket.IO, Pinia 3, SSR authentication, and the native Nuxt 4
`app/` directory structure.

## Requirements

- Node.js 22.12 or newer supported by Nuxt 4
- pnpm 9.15.9

## Commands

```bash
pnpm install --frozen-lockfile
pnpm --filter nuxt-app dev
pnpm --filter nuxt-app build
pnpm --filter nuxt-app test:types
```
