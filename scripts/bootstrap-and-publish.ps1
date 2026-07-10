$ErrorActionPreference = 'Stop'

$RepositoryName = 'vevedh/feathers-nitro'
$RepositoryUrl = 'https://github.com/vevedh/feathers-nitro.git'
$Package = '@vevedh/feathers-nitro'
$Version = '0.4.4'
$Registry = 'https://registry.npmjs.org/'

if (-not (Get-Command gh -ErrorAction SilentlyContinue)) {
  throw 'GitHub CLI is required. Install it with: winget install --id GitHub.cli'
}

gh auth status
if ($LASTEXITCODE -ne 0) {
  throw 'Authenticate GitHub CLI first with: gh auth login'
}

pnpm verify
if ($LASTEXITCODE -ne 0) {
  throw 'pnpm verify failed; publication cancelled.'
}

$repoExists = $true
gh repo view $RepositoryName *> $null
if ($LASTEXITCODE -ne 0) {
  $repoExists = $false
}

if (-not $repoExists) {
  gh repo create $RepositoryName `
    --public `
    --description 'FeathersJS integration for Nuxt/Nitro with Express, Koa, Socket.IO, and multi-instance support'
  if ($LASTEXITCODE -ne 0) {
    throw 'GitHub repository creation failed.'
  }
}

if (git remote get-url origin 2>$null) {
  git remote set-url origin $RepositoryUrl
}
else {
  git remote add origin $RepositoryUrl
}

git push -u origin main
git push origin "v$Version"

npm whoami --registry=$Registry
if ($LASTEXITCODE -ne 0) {
  throw 'Authenticate npm first with: npm login --registry=https://registry.npmjs.org/'
}

npm view "$Package@$Version" version --registry=$Registry *> $null
if ($LASTEXITCODE -eq 0) {
  throw "$Package@$Version is already published."
}

pnpm publish --access public --registry=$Registry --no-git-checks
if ($LASTEXITCODE -ne 0) {
  throw 'npm publication failed.'
}

npm view "$Package@$Version" name version dist-tags.latest dist.tarball --registry=$Registry
