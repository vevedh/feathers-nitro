# @vevedh/feathers-nitro

[![npm version][npm-version-src]][npm-version-href]
[![npm downloads][npm-downloads-src]][npm-downloads-href]
[![License][license-src]][license-href]
[![CI][ci-src]][ci-href]

Nitro adapter plugin for FeathersJS APIs. It integrates Feathers applications with Nuxt/Nitro through Express, Koa, or Socket.IO adapters and supports multiple adapter instances.

[🏀 Online playground](https://stackblitz.com/github/vevedh/feathers-nitro?file=playground%2Fnuxt-app%2Fapp%2Fapp.vue)

## Requirements

- Node.js `^22.12.0`, `^24.11.0`, or `>=26.0.0`
- Nuxt 4 / Nitro 2
- FeathersJS `^5.0.49`

## Install

```bash
pnpm add -D @vevedh/feathers-nitro
```

Equivalent commands:

```bash
npm install --save-dev @vevedh/feathers-nitro
# or
yarn add --dev @vevedh/feathers-nitro
```

## Usage with Nuxt 4

Create a Nitro plugin in the `server/plugins` directory. Nuxt 4 keeps server code at the project root, while application UI code normally lives under `app/`.

### Express adapter

```ts
// server/plugins/feathers-express.ts
import { createFeathersExpressAdapterNitroPlugin } from '@vevedh/feathers-nitro'
import { app } from 'feathers-api/src/app'

export default createFeathersExpressAdapterNitroPlugin(app)
```

See the [Express fixture](./test/fixtures/express/) for a complete test setup.

### Koa adapter

```ts
// server/plugins/feathers-koa.ts
import { createFeathersKoaAdapterNitroPlugin } from '@vevedh/feathers-nitro'
import { app } from 'feathers-api/src/app'

export default createFeathersKoaAdapterNitroPlugin(app)
```

See the [Koa fixture](./test/fixtures/koa/) for a complete test setup.

### Socket.IO adapter

```ts
// server/plugins/feathers-socket.io.ts
import { createFeathersSocketIoAdapterNitroPlugin } from '@vevedh/feathers-nitro'
import { app } from 'feathers-api/src/app'

export default createFeathersSocketIoAdapterNitroPlugin(app)
```

See the [Socket.IO fixture](./test/fixtures/socket.io/) for a complete test setup.

## Exported entry points

The package exposes the following public entry points:

```ts
import { /* adapter factories */ } from '@vevedh/feathers-nitro'
import { /* router helpers */ } from '@vevedh/feathers-nitro/routers'
import { /* plugin helpers */ } from '@vevedh/feathers-nitro/plugins'
import { /* request handlers */ } from '@vevedh/feathers-nitro/handlers'
import { /* setup helpers */ } from '@vevedh/feathers-nitro/setup'
```

The [`playground`](./playground/) directory contains a Nuxt 4 example combining REST, Socket.IO, Pinia 3, and authentication without the obsolete `nuxt-feathers-pinia` auto-import layer.

### StackBlitz WebContainer

StackBlitz automatic dependency installation is disabled because the workspace uses pnpm catalogs. The project bootstraps the exact pnpm version declared by the repository before installing dependencies and starting the Nuxt playground.

```bash
npx --yes pnpm@10.34.5 install --frozen-lockfile
npx --yes pnpm@10.34.5 --filter nuxt-app dev
```

If StackBlitz reports that `catalog:` is unsupported or that the lockfile is incompatible with the current pnpm, reload the project from a revision containing the current `.stackblitzrc`. Do not replace the pinned bootstrap with `ni`/`nr`, because package-manager auto-detection can select an incompatible pnpm in WebContainers.

## Development

```bash
corepack enable
corepack prepare pnpm@10.34.5 --activate
pnpm install --frozen-lockfile
pnpm verify
```

`pnpm verify` validates package identity, lockfile portability, the coordinated FeathersJS 5.0.49 dependency train, the Vitest retry classifier, strict TypeScript, ESLint, Feathers/Nuxt integration tests, and the npm tarball contents.

Dependency maintenance is based on Taze with a 14-day maturity period:

```bash
pnpm deps:check:recursive
pnpm deps:update:safe:recursive
```

pnpm enforces the same 14-day maturity window when resolving new versions. Dependency install scripts are denied by default except for the reviewed native/build helpers required by this workspace (`esbuild`, `@parcel/watcher`, and `unrs-resolver`).

Review Nuxt, Nitro, H3, TypeScript, Vitest, Feathers, and other coordinated or major upgrades independently before regenerating the lockfile.

## Publishing

The package is configured as a public scoped npm package.

```bash
npm login --registry=https://registry.npmjs.org/
pnpm verify
pnpm publish --access public --registry=https://registry.npmjs.org/ --no-git-checks
```

Before publication, create the `vevedh/feathers-nitro` repository, authenticate with npm, and follow [`PUBLISHING.md`](./PUBLISHING.md). On Windows, `./scripts/publish-direct.ps1` validates the project, pushes `main` and `v0.5.0`, then publishes the public scoped package directly to npm.

## Attribution

This repository is a maintained fork of [`@gabortorma/feathers-nitro-adapter`](https://github.com/GaborTorma/feathers-nitro-adapter). The original author is credited in `package.json` and `LICENSE`.

## License

MIT

<!-- Badges -->

[npm-version-src]: https://img.shields.io/npm/v/@vevedh/feathers-nitro/latest.svg?style=flat&colorA=18181B&colorB=28CF8D
[npm-version-href]: https://npmjs.com/package/@vevedh/feathers-nitro
[npm-downloads-src]: https://img.shields.io/npm/dm/@vevedh/feathers-nitro.svg?style=flat&colorA=18181B&colorB=28CF8D
[npm-downloads-href]: https://npmjs.com/package/@vevedh/feathers-nitro
[license-src]: https://img.shields.io/npm/l/@vevedh/feathers-nitro.svg?style=flat&colorA=18181B&colorB=28CF8D
[license-href]: https://npmjs.com/package/@vevedh/feathers-nitro
[ci-src]: https://github.com/vevedh/feathers-nitro/actions/workflows/ci.yml/badge.svg
[ci-href]: https://github.com/vevedh/feathers-nitro/actions/workflows/ci.yml
