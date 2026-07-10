$ErrorActionPreference = 'Stop'

$Package = '@vevedh/feathers-nitro'
$Version = '0.4.4'
$Repository = 'https://github.com/vevedh/feathers-nitro.git'
$Registry = 'https://registry.npmjs.org/'

$origin = (git remote get-url origin).Trim()
if ($origin -ne $Repository) {
  throw "Unexpected origin: $origin"
}
if ((git branch --show-current).Trim() -ne 'main') {
  throw 'Publication must run from main.'
}
if (git status --porcelain) {
  throw 'Working tree must be clean before publication.'
}

pnpm verify
if ($LASTEXITCODE -ne 0) { throw 'pnpm verify failed.' }

git push -u origin main
git push origin "v$Version"

npm whoami --registry=$Registry
if ($LASTEXITCODE -ne 0) { throw 'Run npm login before publishing.' }

$published = npm view "$Package@$Version" version --registry=$Registry 2>$null
if ($LASTEXITCODE -eq 0 -and $published.Trim() -eq $Version) {
  throw "$Package@$Version is already published."
}

pnpm publish --access public --registry=$Registry --no-git-checks
if ($LASTEXITCODE -ne 0) { throw 'npm publication failed.' }

npm view "$Package@$Version" name version dist-tags.latest dist.tarball --registry=$Registry
