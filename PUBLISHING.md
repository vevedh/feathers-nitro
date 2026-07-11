# Publishing `@vevedh/feathers-nitro`

## Automated GitHub + npm publication

With authenticated GitHub CLI and npm sessions, run:

```powershell
./scripts/bootstrap-and-publish.ps1
```

The helper creates the public GitHub repository when needed, pushes `main` and `v0.5.0`, verifies npm authentication, rejects an already-published version, and publishes directly to npm.

## 1. Create the GitHub repository

Create the empty public repository:

- owner: `vevedh`
- name: `feathers-nitro`
- URL: `https://github.com/vevedh/feathers-nitro`

Do not initialize it with a README, license, or `.gitignore`; this project already contains them.

## 2. Prepare and publish Git

For a new repository, initialize the validated `0.5.0` baseline with:

```powershell
./scripts/reset-git.ps1
git push -u origin main
git push origin v0.5.0
```

For an existing repository, commit the Nuxt 4 migration normally, create the tag, and push:

```powershell
git add -A
git commit -m "feat: migrate to Nuxt 4 and release v0.5.0"
git tag -a v0.5.0 -m "@vevedh/feathers-nitro v0.5.0"
git push origin main
git push origin v0.5.0
```

## 3. Authenticate with npm

```powershell
npm login --registry=https://registry.npmjs.org/
npm whoami --registry=https://registry.npmjs.org/
```

The authenticated account must own or be allowed to publish under the `@vevedh` scope.

## 4. Verify and publish directly

```powershell
pnpm i --frozen-lockfile
pnpm verify
pnpm publish --access public --registry=https://registry.npmjs.org/ --no-git-checks
```

The PowerShell helper performs the Git push, npm authentication check, duplicate-version check, and direct npm publication:

```powershell
./scripts/publish-direct.ps1
```

## 5. Confirm the publication

```powershell
npm view @vevedh/feathers-nitro@0.5.0 name version dist-tags.latest dist.tarball --registry=https://registry.npmjs.org/
```
