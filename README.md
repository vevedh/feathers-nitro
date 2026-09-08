# @vevedh/feathers-nitro

[![npm version][npm-version-src]][npm-version-href]
[![npm downloads][npm-downloads-src]][npm-downloads-href]
[![License][license-src]][license-href]
[![CI][ci-src]][ci-href]

Nitro adapter plugin for FeathersJS APIs. It integrates Feathers applications with Nuxt/Nitro through Express, Koa, or Socket.IO adapters and supports multiple adapter instances.

[🏀 Online playground](https://stackblitz.com/github/vevedh/feathers-nitro?file=playground%2Fnuxt-app%2Fapp%2Fapp.vue)

## Requirements

- Node.js `^22.19.0`, `^24.11.0`, or `>=26.0.0` (Node `22.20.0` is the recommended pinned development baseline)
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

The [`playground`](./playground/) directory is a runnable Nuxt 4 showcase covering Express, a complete Koa application, REST during SSR, Socket.IO realtime events, Pinia 3 authentication state, JWT re-authentication, typed services, and multi-instance examples.

### StackBlitz WebContainer

StackBlitz automatic dependency installation is disabled because this repository is a pnpm catalog workspace. The online playground starts through `scripts/stackblitz-bootstrap.mjs`.

The project itself remains pinned to pnpm `10.34.5` for local development, CI, verification, and publication. StackBlitz uses a WebContainer-specific compatibility path instead: the bootstrap reads the direct versions already recorded in `pnpm-lock.yaml` for the root package, `playground/nuxt-app`, and `playground/feathers-api`, generates an isolated `.stackblitz-runtime/` manifest, and installs those exact direct versions with the WebContainer's native npm client.

The npm runtime intentionally excludes `@gabortorma/nuxt-eslint-layer@1.0.0`: that package's published/source manifest uses pnpm `catalog:` dependency specifiers, which npm cannot parse. The bootstrap instead creates a local lock-versioned shim for that tooling-only layer that preserves TypeScript checking but omits the ESLint checker inside StackBlitz. Windows, CI, and release verification continue to use the real layer through pnpm.

After that isolated install, the bootstrap links the repository root and Nuxt playground `node_modules` paths to `.stackblitz-runtime/node_modules`, links `feathers-api` back to the checked-in workspace source, runs a repository-root `nuxi prepare`, and then starts the Nuxt playground directly through the isolated `nuxi` binary. The root prepare is required for Vite 8/Oxc tsconfig discovery in WebContainer because the repository `tsconfig.json` extends `./.nuxt/tsconfig.json`; the bootstrap asserts that generated file exists before serving the preview. This keeps the demo source identical to the pnpm workspace while avoiding pnpm's current WebContainer `realpath(.../node_modules)` failure during recursive workspace installation.

The generated `.stackblitz-runtime/` directory is gitignored and never belongs in the npm package. No project manifest, pnpm catalog, or lockfile is rewritten by the StackBlitz bootstrap.

`pnpm check:stackblitz` verifies that this isolated-runtime contract remains in place and rejects the older pnpm/npx/workspace-`.npmrc` workarounds.

For the WebContainer preview, the bootstrap starts Nuxt explicitly on port `3000` and leaves Vite HMR under Nuxt's native control. Patch 020 removes the old Patch 012 StackBlitz-only `hmr: false` override: Nuxt 4.5.2 now attaches HMR to its own main dev-server listener, avoiding the historical separate-port `24678` preview problem while allowing `/_nuxt/*` client assets to stay on the Vite middleware path.

## Development

```bash
node --version
corepack enable
corepack prepare pnpm@10.34.5 --activate
pnpm install --frozen-lockfile
pnpm verify
```

Patch 015-r1 includes the Windows-generated and Windows-validated coordinated lockfile. Normal development and CI therefore use `pnpm install --frozen-lockfile`; do not regenerate the lockfile unless a dependency change is intentional and will be revalidated through the complete integration gate.

`pnpm verify` first validates the Node.js runtime floor, then package identity, lockfile portability, the coordinated FeathersJS 5.0.49 dependency train, the Nuxt/Vite/Vue stack contract, the Vitest retry classifier, strict TypeScript, ESLint, Feathers/Nuxt integration tests, the real showcase playground smoke suite, StackBlitz bootstrap invariants, and the exact npm tarball contents. The tarball audit rejects any repository-only file outside `dist/`, `README.md`, `LICENSE`, and `package.json`.

Dependency maintenance is based on Taze with a 14-day maturity period:

```bash
pnpm deps:check:recursive
pnpm deps:update:safe:recursive
```

pnpm enforces the same 14-day maturity window when resolving new versions. Patch 015 temporarily exempts only the reviewed Nuxt/Vite/Vue test-tooling train and `magic-string`, because several exact releases are still inside that window; the exceptions are documented in `pnpm-workspace.yaml` and should be removed once the releases mature. Dependency install scripts are denied by default except for the reviewed native/build helpers required by this workspace (`esbuild`, `@parcel/watcher`, and `unrs-resolver`).

Review Nuxt, Nitro, H3, TypeScript, Vitest, Feathers, and other coordinated or major upgrades independently before regenerating the lockfile.

Patch 015-r1 is the Windows-validated coordinated baseline: Nuxt `4.5.2`, Vite `8.2.2`, Vue `3.5.42`, `@nuxt/test-utils` `4.2.0`, Vitest `4.1.11`, Rolldown `1.2.4`, and Vue TSC `3.3.11`, while FeathersJS `5.0.49`, Nitro `2.13.4`, H3 `1.15.11`, direct/root TypeScript `5.9.3`, Node `22.20.0`, and pnpm `10.34.5` remain pinned. The checked-in lockfile has passed the complete Windows `pnpm verify` gate and subsequent installs use `--frozen-lockfile`. Patch 020 removes the old StackBlitz-only HMR disable after the real migrated preview proved Nuxt 4.5.2 could boot on port 3000 but `/_nuxt/*` client assets fell through to Vue Router under that legacy guard.

### Showcase smoke test

The release suite boots the actual `playground/nuxt-app` with `@nuxt/test-utils` and validates the public pages, seeded Express REST API, local authentication, authenticated SSR rendering, and a live Socket.IO `created` event:

```bash
pnpm test:showcase
```

This complements the lower-level Express/Koa/Socket.IO fixtures and ensures the public playground remains executable rather than documentation-only.

Patch 018 records the complete Windows `pnpm release:certify` pass for `0.6.0`: all six built-showcase scenarios pass, the generated tarball is restricted to 39 publish-safe files, and `npm publish --dry-run` accepts the package as public with the `latest` tag. Patch 019 then fixed the first real StackBlitz Vite/Oxc root-tsconfig failure. The next live run rendered SSR successfully but exposed the remaining legacy HMR boundary: `/_nuxt/*` client assets fell through to Vue Router while StackBlitz forced `hmr: false`. Patch 020 removes that obsolete override; revalidate the styled/realtime WebContainer preview before final npm publish.

## Publishing

The package is configured as a public scoped npm package.

```bash
npm login --registry=https://registry.npmjs.org/
pnpm verify
pnpm publish --access public --registry=https://registry.npmjs.org/ --no-git-checks
```

Before publication, authenticate with npm and follow [`PUBLISHING.md`](./PUBLISHING.md). Patch 017 added the release-certification automation, and Patch 018 records its complete Windows pass for version `0.6.0` without changing the runtime implementation. `pnpm release:certify` runs the complete verification gate followed by an npm publish dry-run. On Windows, `./scripts/publish-direct.ps1` reads the current package version, validates the exact tree, requires `v0.6.0` to point to `HEAD`, rejects duplicate publication, and publishes the scoped package with public access.

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
