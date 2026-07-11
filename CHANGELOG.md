# Changelog

All notable changes to this fork are documented in this file.

## [Unreleased]


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
