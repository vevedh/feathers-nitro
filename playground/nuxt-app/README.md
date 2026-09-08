# Nuxt 4 showcase playground

This workspace is both an integration fixture and a runnable product showcase for `@vevedh/feathers-nitro`.

## What it demonstrates

- Express application mounted in Nitro
- complete Koa Feathers application
- Socket.IO realtime events in the browser
- REST transport during SSR
- local authentication + JWT cookie persistence + SSR re-authentication
- Pinia 3 authentication state
- typed Feathers services
- multi-instance setup examples

## Run

```bash
pnpm install --frozen-lockfile
pnpm --filter nuxt-app dev
```

Open `http://localhost:3000`. The public seeded playground account is `test` / `12345`.

The files under `server/examples/` are copyable integration examples and are not auto-loaded by Nuxt.

Normal playground commands run from this workspace and load its `config/` directory directly.
The root release smoke harness also provides absolute node-config and public paths before
`@nuxt/test-utils` launches its production-mode child process from the monorepo root.

## Automated release smoke coverage

From the repository root, run:

```bash
pnpm test:showcase
```

The smoke suite boots this exact Nuxt application and validates `/`, `/adapters`, `/multi-instance`, the seeded Express REST endpoint, `test` local authentication, authenticated SSR rendering of `/messages`, and a real Socket.IO `messages created` event.
