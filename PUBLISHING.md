# Publishing `@vevedh/feathers-nitro`


## Automated GitHub + npm publication

With authenticated GitHub CLI and npm sessions, the complete sequence can be executed with:

```powershell
./scripts/bootstrap-and-publish.ps1
```

This helper creates the public GitHub repository when it does not exist, pushes `main` and `v0.4.4`, verifies npm authentication, rejects an already-published version, and publishes directly to npm.

## 1. Create the GitHub repository

Create the empty public repository:

- owner: `vevedh`
- name: `feathers-nitro`
- URL: `https://github.com/vevedh/feathers-nitro`

Do not initialize it with a README, license, or `.gitignore`; this project already contains them.

## 2. Publish the fresh Git history

The delivered repository contains one initial commit on `main` and the `v0.4.4` tag.

```powershell
git remote -v
git status
git push -u origin main
git push origin v0.4.4
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
npm view @vevedh/feathers-nitro@0.4.4 name version dist-tags.latest dist.tarball --registry=https://registry.npmjs.org/
```
