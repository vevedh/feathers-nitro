import { readFile } from 'node:fs/promises'
import { dirname, resolve } from 'node:path'
import process from 'node:process'
import { fileURLToPath } from 'node:url'

const EXPECTED_PNPM_VERSION = '10.34.5'
const EXPECTED_PACKAGE_MANAGER = `pnpm@${EXPECTED_PNPM_VERSION}`
const EXPECTED_START_COMMAND = 'node scripts/stackblitz-bootstrap.mjs'
const REQUIRED_BOOTSTRAP_SNIPPETS = [
  "const runtimeRoot = join(projectRoot, '.stackblitz-runtime')",
  "const runtimeModulesDirectory = join(runtimeRoot, 'node_modules')",
  "const lockfilePath = join(projectRoot, 'pnpm-lock.yaml')",
  "parseImporterVersions(lockfileContent, '.')",
  "parseImporterVersions(lockfileContent, 'playground/nuxt-app')",
  "parseImporterVersions(lockfileContent, 'playground/feathers-api')",
  "addDependencies(runtimeDependencies, rootManifest, rootLockedVersions, ['dependencies'])",
  "addDependencies(runtimeDependencies, nuxtAppManifest, nuxtLockedVersions, ['dependencies', 'devDependencies'])",
  "addDependencies(runtimeDependencies, feathersApiManifest, feathersLockedVersions, ['dependencies'])",
  'const NPM_INSTALL_ARGS = [',
  "'--package-lock=false'",
  "'--legacy-peer-deps'",
  "await run('npm', NPM_INSTALL_ARGS, runtimeRoot)",
  "await symlink(relative(projectRoot, runtimeModulesDirectory), rootModulesDirectory, 'dir')",
  "await symlink(relative(nuxtAppRoot, runtimeModulesDirectory), nuxtAppModulesDirectory, 'dir')",
  "await symlink(relative(runtimeModulesDirectory, feathersApiRoot), feathersApiLink, 'dir')",
  "await run(nuxiBinary, ['dev', '--host'], nuxtAppRoot)",
  "process.env.STACKBLITZ_BOOTSTRAP_DRY_RUN === '1'",
]

const FORBIDDEN_BOOTSTRAP_SNIPPETS = [
  'installWithoutNuxtPrepare',
  'manage-package-manager-versions',
  'ignore-lockfile-settings-checks',
  '--frozen-lockfile',
  '--ignore-pnpmfile',
  'pnpmBinary',
  "'--filter', 'nuxt-app', 'dev'",
]

const scriptDirectory = dirname(fileURLToPath(import.meta.url))
const projectRoot = resolve(scriptDirectory, '..')

async function readUtf8(relativePath) {
  return readFile(resolve(projectRoot, relativePath), 'utf8')
}

async function pathIsAbsent(relativePath) {
  try {
    await readUtf8(relativePath)
    return false
  }
  catch (error) {
    if (error && typeof error === 'object' && error.code === 'ENOENT') {
      return true
    }
    throw error
  }
}

const [
  packageContent,
  stackblitzContent,
  bootstrapContent,
  gitignoreContent,
  feathersApiNpmrcAbsent,
  nuxtAppNpmrcAbsent,
] = await Promise.all([
  readUtf8('package.json'),
  readUtf8('.stackblitzrc'),
  readUtf8('scripts/stackblitz-bootstrap.mjs'),
  readUtf8('.gitignore'),
  pathIsAbsent('playground/feathers-api/.npmrc'),
  pathIsAbsent('playground/nuxt-app/.npmrc'),
])

const packageJson = JSON.parse(packageContent)
const stackblitzConfig = JSON.parse(stackblitzContent)
const violations = []

if (packageJson.packageManager !== EXPECTED_PACKAGE_MANAGER) {
  violations.push(
    `package.json packageManager must remain ${EXPECTED_PACKAGE_MANAGER}, got ${packageJson.packageManager ?? 'missing'}`,
  )
}

if (packageJson.scripts?.['stackblitz:bootstrap'] !== EXPECTED_START_COMMAND) {
  violations.push(`package.json stackblitz:bootstrap must be "${EXPECTED_START_COMMAND}"`)
}

if (stackblitzConfig.installDependencies !== false) {
  violations.push('.stackblitzrc must set installDependencies to false')
}

if (stackblitzConfig.startCommand !== EXPECTED_START_COMMAND) {
  violations.push(`.stackblitzrc startCommand must be "${EXPECTED_START_COMMAND}"`)
}

if (!gitignoreContent.split(/\r?\n/u).includes('.stackblitz-runtime/')) {
  violations.push('.gitignore must exclude .stackblitz-runtime/')
}

if (!feathersApiNpmrcAbsent || !nuxtAppNpmrcAbsent) {
  violations.push('obsolete playground-local .npmrc placeholders must be removed')
}

for (const snippet of REQUIRED_BOOTSTRAP_SNIPPETS) {
  if (!bootstrapContent.includes(snippet)) {
    violations.push(`scripts/stackblitz-bootstrap.mjs is missing required contract: ${snippet}`)
  }
}

for (const snippet of FORBIDDEN_BOOTSTRAP_SNIPPETS) {
  if (bootstrapContent.includes(snippet)) {
    violations.push(`scripts/stackblitz-bootstrap.mjs contains obsolete pnpm/WebContainer workaround: ${snippet}`)
  }
}

if (/\bnpx\b/u.test(bootstrapContent)) {
  violations.push('StackBlitz bootstrap must not use npx package-manager indirection')
}

if (/\.pnpm[/\\]\.tools/u.test(bootstrapContent)) {
  violations.push('StackBlitz bootstrap must not depend on pnpm managed-tool paths')
}

if (/\b(?:ni|nr)\b/u.test(bootstrapContent)) {
  violations.push('StackBlitz bootstrap must not use ni/nr package-manager auto-detection')
}

if (violations.length > 0) {
  console.error('StackBlitz WebContainer configuration validation failed:')
  for (const violation of violations) {
    console.error(`- ${violation}`)
  }
  process.exitCode = 1
}
else {
  console.log(
    `StackBlitz uses an isolated npm runtime derived from the pnpm ${EXPECTED_PNPM_VERSION} lockfile, `
      + 'links the root and Nuxt playground to that runtime, links feathers-api locally, and launches nuxi directly.',
  )
}
