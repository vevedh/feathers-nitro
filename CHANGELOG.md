# Changelog

## 0.6.0 - release candidate (Windows certified)

- Certify the Nuxt 4.5.2 / Vite 8.2.2 / Vue 3.5.42 migration with the frozen Windows lockfile.
- Upgrade the playground from a test UI to a structured showcase for Express, Koa, REST/SSR, Socket.IO, authentication, Pinia and multi-instance usage.
- Make the Koa playground application fully configured with authentication, services, channels and deterministic seed data.
- Add a release-readiness gate and make direct npm publication derive the version from `package.json`.
- Keep the npm package payload restricted to `dist/`; playground and private patch memory remain repository-only.
- Stabilize the release showcase after Windows validation: use an adapter-neutral Feathers application type for shared Express/Koa configuration and normalize all Vue showcase pages to the repository single-root/lint contract.
- Add release-candidate certification for the actual Nuxt showcase: public-page SSR, seeded REST data, local/JWT authentication, authenticated message rendering and Socket.IO realtime are now exercised by the root test gate.
- Audit the generated npm tarball after `pnpm pack` and reject any payload outside compiled `dist/` plus npm metadata; publication helpers now require a full npm dry-run and a release tag that points to `HEAD`.
- Certify the complete Windows release chain on Node `22.20.0` / pnpm `10.34.5`: frozen install, all lower-level suites, 6/6 built showcase smoke scenarios, publish-safe 39-file tarball audit, and `npm publish --dry-run` for public `latest` all pass.


All notable changes to this fork are documented in this file.

## [Unreleased]

### Fixed

- Removed the legacy StackBlitz-only `vite.server.hmr = false` override after the real Nuxt 4.5.2 / Vite 8.2.2 WebContainer preview rendered SSR but routed `/_nuxt/*` CSS/client requests into Vue Router; Nuxt 4.5.2 now owns shared-server HMR on the explicit port `3000`.
- Removed the now-unused `FEATHERS_NITRO_STACKBLITZ` bootstrap environment flag and strengthened `check:stackblitz` to reject reintroduction of the old HMR-disable workaround; isolated npm runtime, root Nuxt prepare, dependency graph, lockfile and published runtime remain unchanged.
- Prepared the repository-root Nuxt type scaffold inside the StackBlitz isolated bootstrap before launching the playground, closing the Vite 8/Oxc `TSCONFIG_ERROR` raised when WebContainer transformed Nuxt middleware while the root `tsconfig.json` still referenced a missing `.nuxt/tsconfig.json`.
- Extended the StackBlitz contract gate to require that root `nuxi prepare` step and the generated root tsconfig assertion; package runtime, dependencies, lockfile and npm payload remain unchanged from the Windows-certified `0.6.0` candidate.

### Fixed

- Moved the built-showcase node-config/public-path bootstrap into the release smoke harness before `@nuxt/test-utils` starts its production child process, and restored the embedded Nitro plugins to their synchronous adapter exports. This preserves correct built-test configuration without top-level await or async callbacks where Nitro expects `void`.
- Removed the duplicated blank line in the Nuxt playground README that stopped the first Patch 017 `release:certify` run at workspace lint; release certification logic and runtime behavior are unchanged.
- Normalized the 0.6.0 showcase stylesheet to the repository Prettier contract and reordered imports in the four server examples, closing the final 39 workspace-lint diagnostics reported by Patch 016-r2 without changing runtime behavior.
- Closed the final Patch 016-r1 root ESLint failure by expressing the release-readiness check for the legacy PowerShell `$Version = '0.5.0'` literal with the repository-required single-quote syntax; release logic and runtime behavior are unchanged.
- Fixed Patch 016 Koa showcase typing by moving shared authentication/services/channels/setup configuration from the Express-specific application alias to the common Feathers application contract; also closed the four Vue multi-root errors and twelve template-format warnings reported by the live Nuxt dev ESLint plugin.
- Removed the terminal blank line left in the Express playground after the expected-error log cleanup, closing the workspace ESLint `style/no-multiple-empty-lines` failure without changing runtime or test behavior.
- Removed the residual `console.warn('app-express.ts')` from the Feathers Express playground and disabled the Express error-handler logger only in tests that intentionally assert HTTP errors, keeping 404/401 behavior covered without printing misleading expected stack traces.
- Normalized the Patch 014 Node runtime gate to the repository ESLint contract: explicit `node:process` import, simplified version regex, and multiline control-flow formatting; runtime policy and dependency graph are unchanged.
- Restored direct Vitest `4.1.9` after Windows integration tests showed Vitest `4.1.10` losing the active suite context inside `@nuxt/test-utils` `4.0.3` `setup()`; Vue TSC `3.3.11` remains upgraded and the Nuxt runtime graph stays frozen.
- Imported `process` explicitly from `node:process` in the Nuxt playground configuration, closing the final Windows workspace-lint failure without changing the StackBlitz-only HMR flag behavior.
- Normalized the Patch 013 StackBlitz/tooling gates to the repository ESLint contract and replaced the bootstrap lockfile regex parser with indentation-aware parsing, removing the Windows lint failures without changing dependency resolution.
- Reworked the StackBlitz WebContainer bootstrap to avoid pnpm's recursive workspace `realpath(.../node_modules)` failure: derive lock-aligned direct versions from the checked-in pnpm lockfile, install an isolated `.stackblitz-runtime/` with native npm, link the root/Nuxt module paths to that runtime, link the local Feathers API source explicitly, and launch `nuxi` directly.
- Excluded `@gabortorma/nuxt-eslint-layer@1.0.0` from the isolated npm runtime because its package manifest uses pnpm `catalog:` dependencies that npm cannot parse; StackBlitz now materializes a local lock-versioned tooling shim while normal pnpm workflows keep the real layer.
- Added a `check:stackblitz` release gate that preserves the isolated-runtime contract, rejects the obsolete pnpm/npx/workspace-`.npmrc` workarounds, and keeps `.stackblitz-runtime/` out of versioned artifacts.
- Pin the StackBlitz Nuxt preview to HTTP port `3000` and disable only Vite's separate `24678` HMR listener in that WebContainer path, preventing StackBlitz from opening the HMR socket endpoint as the Preview (`426 Upgrade Required`).
- Removed the final `style/max-len` warning from `check-feathers-suite` after the complete Windows verification passed through all Express/Koa/Socket.IO integration suites and `pack:check`.
- Normalized the Patch 012 Feathers-suite guard and security regression test to satisfy the repository max-line-length and lowercase test-title lint contracts discovered by the full Windows `pnpm verify` gate.

### Changed

- Recorded Patch 018 as the Windows release-certification closure for `0.6.0`: `pnpm release:certify` passes end to end, including 6/6 real built-showcase tests, `pack:check`, strict tarball audit and npm public/latest dry-run. The runtime, dependency graph and frozen lockfile remain unchanged; real StackBlitz/WebContainer preview remains the final technical publication gate.
- Certified Patch 015-r1 on Windows with the regenerated pnpm lockfile: Nuxt 4.5.2, Vite 8.2.2, Vue 3.5.42, @nuxt/test-utils 4.2.0, Vitest 4.1.11, Rolldown 1.2.4, and Vue TSC 3.3.11 pass types, lint, all Feathers/Nuxt Express/Koa/Socket.IO suites, `unbuild`, and `pack:check`.
- Captured the validated Patch 015 lockfile and restored `pnpm install --frozen-lockfile` as the normal install path after the one-time coordinated graph regeneration.
- Started the coordinated Patch 015 Nuxt toolchain migration to Nuxt `4.5.2`, Vite `8.2.2`, Vue `3.5.42`, `@nuxt/test-utils` `4.2.0`, Vitest `4.1.11`, Rolldown `1.2.4`, and Vue TSC `3.3.11`; FeathersJS `5.0.49`, Nitro `2.13.4`, H3 `1.15.11`, TypeScript `5.9.3`, Node `22.20.0`, and pnpm `10.34.5` remain frozen.
- Replaced the temporary tooling-bridge release gate with `check:nuxt-stack`, while keeping `check:tooling-bridge` as a compatibility alias. The one-time Patch 015 graph regeneration is complete and the validated lockfile is now frozen.
- Added temporary pnpm maturity-window exceptions for the exact reviewed Patch 015 train and its young Vue/Vitest/magic-string dependencies; the 14-day default remains enabled for all other dependency resolution.
- Recorded Patch 014-r3 as fully Windows-verified through clean Feathers Mocha output, all Nuxt Express/Koa/Socket.IO suites, `unbuild`, and `pack:check`.
- Recorded Patch 014-r1 as fully Windows-verified through runtime policy, types, lint, all Feathers/Nuxt integration suites, `unbuild`, and `pack:check`; Patch 014-r2 only cleans expected Express test diagnostics.
- Raised the supported Node.js runtime floor to `^22.19.0 || ^24.11.0 || >=26.0.0`, pinned CI plus `.nvmrc`/`.node-version` to Node `22.20.0`, added `check:runtime`, and aligned CI with the runtime/Feathers/StackBlitz/tooling policy gates before the upcoming Nuxt 4.5.2 migration.
- Recorded Patch 013-r3 as Windows-verified through Feathers API, all Nuxt/Express/Koa/Socket.IO Vitest suites, transient port retry, `unbuild`, and `pack:check`.
- Added a tooling-only compatibility bridge for Vue TSC `3.3.5` to `3.3.11` while retaining Vitest `4.1.9` after the 4.1.10 candidate exposed a Nuxt test-utils suite-context regression; the validated Nuxt 4.4.8 / Nitro 2.13.4 / H3 1.15.11 runtime graph remains unchanged.
- Added `check:tooling-bridge` to keep Nuxt `4.4.8` and `@nuxt/test-utils` `4.0.3` frozen while the direct test/type-check executables advance independently. The coordinated Nuxt 4.5/Vue/Vite migration is deferred to Patch 014.
- Upgraded the coordinated FeathersJS v5 dependency train from `5.0.46` to `5.0.49` across the package, playground catalogs, importers, and lockfile snapshots.
- Added `check:feathers-suite` to reject mixed Feathers versions or incomplete lockfile integrity metadata before release and during `pnpm verify`.
- Added a playground regression test that rejects an unknown `$where` operator hidden inside nested `$or` arrays.
- Upgraded the pinned package manager from pnpm `9.15.9` to pnpm `10.34.5`, moving the project back onto a supported pnpm major with the 2026 integrity/path-traversal fixes.
- Upgraded the standalone `nuxi` compatibility CLI from `3.36.0` to `3.37.0`; the published `nuxi` package has no runtime dependencies, so this update does not perturb the Nuxt/Nitro graph.
- Added a pnpm-level 14-day `minimumReleaseAge` policy and an explicit dependency build-script allowlist for `esbuild`, `@parcel/watcher`, and `unrs-resolver`.
- Kept Nitro `2.13.4` and H3 `1.15.11` deliberately pinned while H3 2 remains a separate compatibility line.

### Security

- Includes the FeathersJS 5.0.49 `adapter-commons` fix that validates query operators nested inside arrays.
- Extended `check:portability` to reject pnpm lockfile package entries that do not carry a SHA-512 integrity value.


## [0.5.0] - 2026-07-10

### Changed

- Migrated the package and integration playground from Nuxt 3.21 to Nuxt 4.4.8 using a Taze-guided dependency review.
- Upgraded the validated toolchain to Nitro 2.13.4, H3 1.15.11, `@nuxt/test-utils` 4.0.3, Vitest 4.1.9, Vue TSC 3.3.5, Unbuild 3.6.1, Pinia 3.0.4, and `@pinia/nuxt` 0.11.3.
- Incremented the package version from `0.4.4` to `0.5.0` because Nuxt 4 and the new Node engine floor are compatibility-significant changes.
- Migrated the playground UI to Nuxt 4's native `app/` directory and centralized workspace dependency versions with pnpm catalogs.
- Replaced the obsolete `nuxt-feathers-pinia` layer with an explicit strict Feathers client plugin and Pinia 3 authentication store.
- Reworked the isolated Vitest runner around asynchronous child processes for stable Vitest 4 E2E execution and live output.

### Fixed

- Removed the Nuxt `useModel` auto-import collision emitted by `nuxt-feathers-pinia@0.1.0`.
- Adapted strict TypeScript assertions and Vitest 4 CLI options without weakening compiler rules.
- Added an explicit Nitro compatibility date to eliminate environment-dependent Nitro preparation warnings.


## [0.4.4] - 2026-07-10

### Changed

- Renamed the npm package from `@gabortorma/feathers-nitro-adapter` to `@vevedh/feathers-nitro`.
- Updated repository, homepage, issue tracker, badges, installation commands, and import examples.
- Replaced the upstream-specific release helper with a standalone `release-it` configuration.
- Added an automated package identity regression check.
- Hardened CI by pinning pnpm and using the frozen lockfile.

### Added

- Added MIT license attribution for the upstream project and this fork.
- Added project maintenance instructions in `AGENTS.md`.
- Added persistent patch history under `patch-memory/`.

## Patch 002 - 2026-07-03

### Fixed

- Added a standalone `.release-it.ts` to overwrite stale upstream release configuration when extracting over an existing checkout.
- Removed the obsolete Nuxt TypeScript include for `../.release-it.ts`.
- Typed Vitest hook call tuples in `test/setup-integration.test.ts` to avoid implicit `any` under strict TypeScript.
- Pruned stale `@gabortorma/mwm` lockfile entries that were no longer referenced by any workspace importer.

## Patch 003 - 2026-07-03

### Changed

- Updated the dependency baseline with conservative patch/minor upgrades across the root package and playground workspaces.
- Upgraded the pinned package manager baseline from pnpm `9.12.0` to `9.15.9`.
- Added `taze` and dependency maintenance scripts for safe recursive audits and updates.
- Added `taze.config.js` with a 14-day maturity period and explicit exclusions for Nitro/H3 ABI-sensitive packages.
- Replaced `nr`-based quality scripts with explicit pnpm commands to avoid runner-detection issues.
- Switched the root Vitest suite to `scripts/run-vitest-suite.mjs`, running Nuxt/Nitro E2E files one by one with one worker.
- Added `pnpm pack:check` because pnpm 9.x does not support `pnpm pack --dry-run`.

### Fixed

- Stabilized strict linting after dependency updates by ignoring generated test fixtures and relaxing unsafe-any rules only for mock-heavy test files.
- Added `skipLibCheck` to the Feathers playground TypeScript config to keep third-party declaration checks from dominating strict project type checks under TypeScript 5.9.
- Fixed updated lint expectations in source exports, setup helpers, and package identity scripts.

## Patch 004 - 2026-07-10

### Fixed

- Cast Nitro's Node request to the Engine.IO request boundary type when calling `handleRequest`, restoring strict TypeScript compatibility after the Engine.IO update.
- Replaced POSIX single-quoted ESLint globs with portable directory targets so `pnpm lint` works on Windows and POSIX shells.
- Switched CI package validation from unsupported `pnpm pack --dry-run` on pnpm 9 to `pnpm pack:check`.
- Replaced nested npm calls in the Feathers playground test and client-bundle scripts with pnpm equivalents to avoid inherited-config warnings.

## Patch 005 - 2026-07-10

### Fixed

- Removed 1,999 environment-specific `tarball` URLs from `pnpm-lock.yaml` that incorrectly targeted an internal build-sandbox registry and caused `ETIMEDOUT` on developer workstations.
- Added an explicit public npm registry default in `.npmrc` while keeping the lockfile registry-neutral.
- Made the root ESLint configuration independent of generated `playground/nuxt-app/.nuxt` files and forced root lint scripts to use the intended flat config explicitly.
- Kept `pnpm lint` as a complete three-workspace validation by splitting root lint from workspace lint and preparing the Nuxt playground before its lint pass.
- Added a portable `eslint.config.js` compatibility shim so extracting the archive over an older checkout overwrites the stale Nuxt-dependent root config.
- Declared the root ESLint configuration and ESLint packages as direct development dependencies.

### Added

- Added `pnpm check:portability` and CI enforcement to prevent private registry hosts or embedded credentials from being committed again.



## Patch 006 - 2026-07-10

### Fixed

- Removed the now-redundant Engine.IO request assertion, resolving `ts/no-unnecessary-type-assertion` with `engine.io@6.6.9` while preserving strict type checking.
- Made Socket.IO test teardown conditional so a failed Nuxt server bootstrap does not cause a secondary `undefined.teardown()` failure.
- Added narrowly scoped retry handling for transient Nuxt test-server port collisions (`EADDRINUSE` and `GetPortError`) without retrying functional test failures.
## Patch 007 - 2026-07-10

### Fixed

- Removed an unnecessary non-capturing group from the Vitest port-collision retry regex, satisfying `regexp/no-useless-non-capturing-group` without changing the two retryable error signatures.

## Patch 008 - 2026-07-10

### Changed

- Added root `.gitignore` rules for `AGENTS.md` and `patch-memory/` so local AI-assisted maintenance context is not committed to the public repository.
- Kept both artifacts in complete development archives for continuity between patches.

## Patch 009 - 2026-07-10

### Fixed

- Reworked transient Vitest port-collision classification to use stable error tokens instead of one exact line, so ANSI-coloured `GetPortError` output is correctly retried on Windows.
- Added `pnpm check:test-runner` to prevent regressions in retry classification while ensuring ordinary assertion failures are never retried.

## Patch 010 - 2026-07-10

### Changed

- Renamed the maintained fork from `@vevedh/feathers-nitro-adapter` to `@vevedh/feathers-nitro`.
- Retargeted repository metadata, badges, installation examples, imports, issue links, and StackBlitz links to `vevedh/feathers-nitro`.
- Prepared a fresh Git history with one initial commit on `main` and the `v0.4.4` tag.
- Kept the upstream `@gabortorma/feathers-nitro-adapter` attribution intact.
