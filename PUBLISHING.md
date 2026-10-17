# Publishing `@vevedh/feathers-nitro`

## Current state

- Public stable: `0.6.1` (`latest`), certified on Windows and Ubuntu with npm Trusted Publishing provenance.
- Maintenance candidate: `0.6.2`, keeping the certified Nuxt `4.6.2` / Nitro `2.13.4` / H3 `1.15.11` baseline.
- `0.6.2` does not change the dependency graph; the checked-in lockfile remains the certified source of truth.

## 1. Use the pinned toolchain

```powershell
node --version
corepack prepare pnpm@10.34.5 --activate
pnpm --version
```

Expected release baseline: Node `22.22.3`, pnpm `10.34.5`.

## 2. Install from the frozen lockfile

```powershell
pnpm install --frozen-lockfile
```

Do not regenerate `pnpm-lock.yaml` for `0.6.2`: Nuxt remains `4.6.2` and the coordinated dependency graph is unchanged.

## 3. Certify the exact release tree

```powershell
$env:FEATHERS_NITRO_TEST_CONCURRENCY = '4'
pnpm release:certify
```

The gate covers runtime policy, Nitro public API usage, package identity, lockfile portability, FeathersJS coordination, StackBlitz invariants, the Nuxt stack, strict TypeScript, lint, integration tests, the runnable Nuxt showcase, package creation, artifact audit, and npm publish dry-run.

## 4. Commit and push the release candidate

```powershell
git add -A
git diff --cached --check
git commit -m "release: @vevedh/feathers-nitro 0.6.2"
git push origin main
```

Wait for the `ci` workflow on `main` to pass before creating the release tag.

## 5. Tag the certified commit

```powershell
git tag -a v0.6.2 -m "@vevedh/feathers-nitro v0.6.2"
git push origin v0.6.2
```

The `Publish npm` workflow verifies that the package version and tag match the exact checkout before publishing.

## 6. Trusted Publishing

Publication is performed by `.github/workflows/publish.yml` through npm Trusted Publishing / GitHub Actions OIDC. No long-lived npm token is required for the publish step.

The workflow:

1. installs the frozen dependency graph;
2. verifies that `v0.6.2` points to the checked-out commit;
3. refuses duplicate versions;
4. runs `pnpm release:certify`;
5. publishes `@vevedh/feathers-nitro@0.6.2` with public access and provenance;
6. waits for the exact version to become visible on npm without treating delayed `latest` propagation as a false publication failure.

## 7. Verify npm

```powershell
npm view @vevedh/feathers-nitro@0.6.2 name version dist.tarball --registry=https://registry.npmjs.org/
npm view @vevedh/feathers-nitro dist-tags --registry=https://registry.npmjs.org/
```

Expected result: version `0.6.2` exists and `latest` resolves to `0.6.2` once registry propagation is complete.
