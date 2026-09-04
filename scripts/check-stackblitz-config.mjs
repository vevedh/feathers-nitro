import { readFile } from 'node:fs/promises'
import { dirname, resolve } from 'node:path'
import process from 'node:process'
import { fileURLToPath } from 'node:url'

const EXPECTED_PNPM_VERSION = '10.34.5'
const EXPECTED_PACKAGE_MANAGER = `pnpm@${EXPECTED_PNPM_VERSION}`
const EXPECTED_INSTALL_COMMAND = `npx --yes pnpm@${EXPECTED_PNPM_VERSION} install --frozen-lockfile`
const EXPECTED_DEV_COMMAND = `npx --yes pnpm@${EXPECTED_PNPM_VERSION} --filter nuxt-app dev`

const scriptDirectory = dirname(fileURLToPath(import.meta.url))
const projectRoot = resolve(scriptDirectory, '..')

async function readUtf8(relativePath) {
  return readFile(resolve(projectRoot, relativePath), 'utf8')
}

const [packageContent, stackblitzContent] = await Promise.all([
  readUtf8('package.json'),
  readUtf8('.stackblitzrc'),
])

const packageJson = JSON.parse(packageContent)
const stackblitzConfig = JSON.parse(stackblitzContent)
const violations = []

if (packageJson.packageManager !== EXPECTED_PACKAGE_MANAGER) {
  violations.push(
    `package.json packageManager must be ${EXPECTED_PACKAGE_MANAGER}, got ${packageJson.packageManager ?? 'missing'}`,
  )
}

if (stackblitzConfig.installDependencies !== false) {
  violations.push('.stackblitzrc must set installDependencies to false')
}

const startCommand = stackblitzConfig.startCommand
if (typeof startCommand !== 'string') {
  violations.push('.stackblitzrc startCommand must be a string')
}
else {
  if (!startCommand.includes(EXPECTED_INSTALL_COMMAND)) {
    violations.push(`.stackblitzrc must install with pinned pnpm ${EXPECTED_PNPM_VERSION}`)
  }

  if (!startCommand.includes(EXPECTED_DEV_COMMAND)) {
    violations.push('.stackblitzrc must start the Nuxt playground with the pinned pnpm CLI')
  }

  if (/\b(?:ni|nr)\b/u.test(startCommand)) {
    violations.push('.stackblitzrc must not use ni/nr package-manager auto-detection')
  }
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
    `StackBlitz WebContainer bootstrap is deterministic and pinned to pnpm ${EXPECTED_PNPM_VERSION}.`,
  )
}
