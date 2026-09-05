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

StackBlitz automatic dependency installation is disabled because this repository is a pnpm catalog workspace. The online playground starts through `scripts/stackblitz-bootstrap.mjs`.

The project itself remains pinned to pnpm `10.34.5` for local development, CI, verification, and publication. StackBlitz uses a WebContainer-specific compatibility path instead: the bootstrap reads the direct versions already recorded in `pnpm-lock.yaml` for the root package, `playground/nuxt-app`, and `playground/feathers-api`, generates an isolated `.stackblitz-runtime/` manifest, and installs those exact direct versions with the WebContainer's native npm client.

The npm runtime intentionally excludes `@gabortorma/nuxt-eslint-layer@1.0.0`: that package's published/source manifest uses pnpm `catalog:` dependency specifiers, which npm cannot parse. The bootstrap instead creates a local lock-versioned shim for that tooling-only layer that preserves TypeScript checking but omits the ESLint checker inside StackBlitz. Windows, CI, and release verification continue to use the real layer through pnpm.

After that isolated install, the bootstrap links the repository root and Nuxt playground `node_modules` paths to `.stackblitz-runtime/node_modules`, links `feathers-api` back to the checked-in workspace source, and starts Nuxt directly through the isolated `nuxi` binary. This keeps the demo source identical to the pnpm workspace while avoiding pnpm's current WebContainer `realpath(.../node_modules)` failure during recursive workspace installation.

The generated `.stackblitz-runtime/` directory is gitignored and never belongs in the npm package. No project manifest, pnpm catalog, or lockfile is rewritten by the StackBlitz bootstrap.

`pnpm check:stackblitz` verifies that this isolated-runtime contract remains in place and rejects the older pnpm/npx/workspace-`.npmrc` workarounds.

For the WebContainer preview, the bootstrap starts Nuxt explicitly on port `3000` and sets a StackBlitz-only flag that disables Vite's separate HMR server. Nuxt 4.4.8 otherwise opens HMR on port `24678`, which StackBlitz can mistakenly select as the Preview and display as `426 Upgrade Required`. Local development and CI keep the normal Vite HMR behavior.

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
