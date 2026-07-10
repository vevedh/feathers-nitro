$ErrorActionPreference = 'Stop'

$Remote = 'https://github.com/vevedh/feathers-nitro.git'
$Version = '0.4.4'

if (Test-Path '.git') {
  Remove-Item -Recurse -Force '.git'
}

git init -b main
git config user.name 'Hervé de CHAVIGNY'
git config user.email 'vevedh@gmail.com'
git remote add origin $Remote
git add -A
git commit -m "feat: initialize @vevedh/feathers-nitro v$Version"
git tag -a "v$Version" -m "@vevedh/feathers-nitro v$Version"

git status --short
git remote -v
