$ErrorActionPreference = 'Stop'

$Remote = 'https://github.com/vevedh/feathers-nitro.git'
$PackageJson = Get-Content -Raw -Path (Join-Path $PSScriptRoot '..\package.json') | ConvertFrom-Json
$Version = $PackageJson.version

if (Test-Path '.git') {
  Remove-Item -Recurse -Force '.git'
}

git init -b main
git remote add origin $Remote
git add -A
git commit -m "feat: initialize @vevedh/feathers-nitro v$Version"
git tag -a "v$Version" -m "@vevedh/feathers-nitro v$Version"

git status --short
git remote -v
