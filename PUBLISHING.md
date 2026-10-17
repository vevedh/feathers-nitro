# Publishing `@vevedh/feathers-nitro`

## Current state

- Public stable: `0.6.0` (`latest`).
- Patch 022 candidate: `0.6.1` targeting Nuxt `4.6.2` while keeping Nitro `2.13.4` / H3 `1.15.11`.
- Do not publish `0.6.1` until its regenerated lockfile and complete Windows certification are green.

## 1. Use the pinned toolchain

```powershell
node --version
corepack prepare pnpm@10.34.5 --activate
pnpm --version
```

Expected development baseline for Patch 022: Node `22.22.3`, pnpm `10.34.5`.

## 2. Refresh the coordinated lockfile once

Patch 022 changes the Nuxt/Vite/Vue development matrix. From the repository root on Windows:

```powershell
./scripts/patch022-refresh-lockfile.ps1
```

Equivalent manual sequence:

```powershell
pnpm install --no-frozen-lockfile
pnpm check:runtime
pnpm check:nitro-api
pnpm check:nuxt-stack
pnpm check:portability
pnpm verify
```

After that intentional migration, return to frozen installs:

```powershell
pnpm install --frozen-lockfile
```

## 3. Certify the release candidate

```powershell
pnpm release:certify
```

The gate covers runtime policy, Nitro public API usage, package identity, lockfile portability, FeathersJS coordination, StackBlitz invariants, the Nuxt stack, strict TypeScript, lint, integration tests, the runnable Nuxt showcase, package creation, artifact audit, and npm publish dry-run.

## 4. Review the live showcase

```powershell
pnpm --filter nuxt-app dev
```

Review `/`, `/adapters`, `/multi-instance`, authenticate with the seeded test account, then validate `/messages` in two tabs so a created message is received through Socket.IO. Repeat the preview in StackBlitz before tagging.

## 5. Commit and tag only after certification

```powershell
git add -A
git commit -m "release: @vevedh/feathers-nitro v0.6.1"
git tag -a v0.6.1 -m "@vevedh/feathers-nitro v0.6.1"
git push origin main
git push origin v0.6.1
```

## 6. Publish

```powershell
npm login --registry=https://registry.npmjs.org/
npm whoami --registry=https://registry.npmjs.org/
./scripts/publish-direct.ps1
```

The helper derives the version from `package.json`, requires a clean `main`, requires the matching tag to point to `HEAD`, reruns release certification, rejects duplicate publication, and publishes with public access.

## 7. Verify npm

```powershell
npm view @vevedh/feathers-nitro@0.6.1 name version dist-tags.latest dist.tarball --registry=https://registry.npmjs.org/
```
