# Publishing `@vevedh/feathers-nitro`

## Stable 0.6.0 release

Patch 018 records `0.6.0` as Windows release-certified. `pnpm release:certify` has passed end to end on Node `22.20.0` with pnpm `10.34.5`, including the six built-showcase smoke scenarios, strict tarball audit and npm public/latest dry-run. Publication is still allowed only after the local visual playground review and a real StackBlitz/WebContainer preview are green.

## 1. Validate the exact release tree

```powershell
corepack prepare pnpm@10.34.5 --activate
pnpm install --frozen-lockfile
pnpm release:certify
```

`pnpm release:certify` runs `pnpm verify` and then `npm publish --dry-run`. The verification chain includes runtime, identity, dependency, Nuxt stack, release-readiness, type, lint, lower-level integration tests, the real Nuxt showcase smoke suite, `pnpm pack`, and a strict tarball-content audit.

The certified Windows run produced a 39-file tarball containing only `dist/**`, `README.md`, `LICENSE`, and `package.json`; npm accepted the dry-run for `@vevedh/feathers-nitro@0.6.0` with public access and the `latest` tag. The `[DEP0155]` messages seen in Nuxt/Feathers Koa test processes are upstream/transitive Node deprecation warnings and are not suppressed by this project.

## 2. Review the live showcase

```powershell
pnpm --filter nuxt-app dev
```

Review `/`, `/adapters`, `/multi-instance`, authenticate with the seeded `test` / `12345` account, then validate `/messages` in two browser tabs so a created message is received as a realtime event. Repeat the preview in StackBlitz before tagging the stable release.

## 3. Commit and tag

```powershell
git add -A
git commit -m "release: @vevedh/feathers-nitro v0.6.0"
git tag -a v0.6.0 -m "@vevedh/feathers-nitro v0.6.0"
git push origin main
git push origin v0.6.0
```

## 4. Authenticate and publish

```powershell
npm login --registry=https://registry.npmjs.org/
npm whoami --registry=https://registry.npmjs.org/
./scripts/publish-direct.ps1
```

The helper reads the version directly from `package.json`, reruns `pnpm release:certify`, requires the Git tag to point to the current `HEAD`, rejects an already-published version, publishes with public access and confirms the `latest` dist-tag.

## 5. Verify npm

```powershell
npm view @vevedh/feathers-nitro@0.6.0 name version dist-tags.latest dist.tarball --registry=https://registry.npmjs.org/
```
