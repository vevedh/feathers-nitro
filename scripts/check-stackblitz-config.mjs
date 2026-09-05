import { readFile } from 'node:fs/promises'
import { dirname, resolve } from 'node:path'
import process from 'node:process'
import { fileURLToPath } from 'node:url'

const EXPECTED_PNPM_VERSION = '10.34.5'
const EXPECTED_PACKAGE_MANAGER = `pnpm@${EXPECTED_PNPM_VERSION}`
const EXPECTED_START_COMMAND = 'node scripts/stackblitz-bootstrap.mjs'
const REQUIRED_BOOTSTRAP_SNIPPETS = [
  `const PNPM_VERSION = '${EXPECTED_PNPM_VERSION}'`,
  "const projectRoot = resolve(scriptDirectory, '..')",
  "['install', '--global', '--prefix', pnpmPrefix, `pnpm@${PNPM_VERSION}`]",
  "'--config.manage-package-manager-versions=false'",
  "'--ignore-pnpmfile'",
  "'--frozen-lockfile'",
  "'--config.ignore-lockfile-settings-checks=true'",
  "const nuxtAppPackagePath = join(nuxtAppRoot, 'package.json')",
  "if (prepareScript !== 'nuxi prepare')",
  'delete temporaryManifest.scripts.prepare',
  'await installWithoutNuxtPrepare()',
  "const nuxiBinary = join(rootModulesDirectory, '.bin', 'nuxi')",
  "const feathersApiLink = join(nuxtAppModulesDirectory, 'feathers-api')",
  "const feathersApiLinkTarget = relative(nuxtAppModulesDirectory, feathersApiRoot)",
  "await symlink(feathersApiLinkTarget, feathersApiLink, 'dir')",
  "if (!(await pathExists(nuxiBinary)))",
  "await run(nuxiBinary, ['dev', '--host'], nuxtAppRoot)",
  "process.env.STACKBLITZ_BOOTSTRAP_DRY_RUN === '1'",
]

const FORBIDDEN_BOOTSTRAP_SNIPPETS = [
  "'--filter', 'nuxt-app', 'dev'",
  "join(projectRoot, 'playground', 'nuxt-app', 'node_modules'),\n]",
]

const scriptDirectory = dirname(fileURLToPath(import.meta.url))
const projectRoot = resolve(scriptDirectory, '..')

async function readUtf8(relativePath) {
  return readFile(resolve(projectRoot, relativePath), 'utf8')
}

async function readWorkspaceNpmrc(relativePath) {
  try {
    return await readUtf8(relativePath)
  }
  catch (error) {
    if (error && typeof error === 'object' && error.code === 'ENOENT') {
      return null
    }
    throw error
  }
}

const [
  packageContent,
  stackblitzContent,
  bootstrapContent,
  nuxtAppPackageContent,
  rootNpmrc,
  feathersApiNpmrc,
  nuxtAppNpmrc,
] = await Promise.all([
  readUtf8('package.json'),
  readUtf8('.stackblitzrc'),
  readUtf8('scripts/stackblitz-bootstrap.mjs'),
  readUtf8('playground/nuxt-app/package.json'),
  readUtf8('.npmrc'),
  readWorkspaceNpmrc('playground/feathers-api/.npmrc'),
  readWorkspaceNpmrc('playground/nuxt-app/.npmrc'),
])

const packageJson = JSON.parse(packageContent)
const nuxtAppPackageJson = JSON.parse(nuxtAppPackageContent)
const stackblitzConfig = JSON.parse(stackblitzContent)
const violations = []

if (packageJson.packageManager !== EXPECTED_PACKAGE_MANAGER) {
  violations.push(
    `package.json packageManager must be ${EXPECTED_PACKAGE_MANAGER}, got ${packageJson.packageManager ?? 'missing'}`,
  )
}

if (packageJson.scripts?.['stackblitz:bootstrap'] !== EXPECTED_START_COMMAND) {
  violations.push(`package.json stackblitz:bootstrap must be "${EXPECTED_START_COMMAND}"`)
}

if (nuxtAppPackageJson.scripts?.prepare !== 'nuxi prepare') {
  violations.push('playground/nuxt-app must keep its normal "prepare": "nuxi prepare" script outside StackBlitz')
}

if (rootNpmrc.trim().length === 0) {
  violations.push('the root .npmrc must keep the workspace pnpm configuration')
}

for (const [workspaceName, workspaceNpmrc] of [
  ['playground/feathers-api', feathersApiNpmrc],
  ['playground/nuxt-app', nuxtAppNpmrc],
]) {
  if (workspaceNpmrc === null) {
    violations.push(`${workspaceName}/.npmrc is required for pnpm 10 on StackBlitz WebContainers`)
  }
  else if (workspaceNpmrc.length !== 0) {
    violations.push(
      `${workspaceName}/.npmrc must stay empty so it cannot alter the frozen workspace lockfile configuration`,
    )
  }
}

if (stackblitzConfig.installDependencies !== false) {
  violations.push('.stackblitzrc must set installDependencies to false')
}

if (stackblitzConfig.startCommand !== EXPECTED_START_COMMAND) {
  violations.push(`.stackblitzrc startCommand must be "${EXPECTED_START_COMMAND}"`)
}

for (const snippet of REQUIRED_BOOTSTRAP_SNIPPETS) {
  if (!bootstrapContent.includes(snippet)) {
    violations.push(`scripts/stackblitz-bootstrap.mjs is missing required contract: ${snippet}`)
  }
}

for (const snippet of FORBIDDEN_BOOTSTRAP_SNIPPETS) {
  if (bootstrapContent.includes(snippet)) {
    violations.push(`scripts/stackblitz-bootstrap.mjs contains obsolete StackBlitz workaround: ${snippet}`)
  }
}

if (/\bnpx\b/u.test(bootstrapContent)) {
  violations.push('StackBlitz bootstrap must not invoke pnpm through npx')
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
    `StackBlitz bootstrap installs pnpm ${EXPECTED_PNPM_VERSION} under HOME/.local, disables pnpm self-management, `
      + 'keeps dependency resolution frozen, suppresses only the Nuxt workspace prepare lifecycle during install, '
      + 'restores the manifest, links feathers-api explicitly, and launches nuxi directly.',
  )
}
