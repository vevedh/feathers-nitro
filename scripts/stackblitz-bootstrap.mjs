import { spawn } from 'node:child_process'
import { lstat, mkdir, readFile, symlink, writeFile } from 'node:fs/promises'
import { homedir } from 'node:os'
import { dirname, join, relative, resolve } from 'node:path'
import process from 'node:process'
import { fileURLToPath } from 'node:url'

const PNPM_VERSION = '10.34.5'
const scriptDirectory = dirname(fileURLToPath(import.meta.url))
const projectRoot = resolve(scriptDirectory, '..')
const homeDirectory = process.env.HOME || homedir()
const pnpmPrefix = join(homeDirectory, '.local')
const pnpmBinary = join(pnpmPrefix, 'bin', 'pnpm')
const rootModulesDirectory = join(projectRoot, 'node_modules')
const nuxtAppRoot = join(projectRoot, 'playground', 'nuxt-app')
const nuxtAppModulesDirectory = join(nuxtAppRoot, 'node_modules')
const nuxtAppPackagePath = join(nuxtAppRoot, 'package.json')
const feathersApiRoot = join(projectRoot, 'playground', 'feathers-api')
const feathersApiLink = join(nuxtAppModulesDirectory, 'feathers-api')
const feathersApiLinkTarget = relative(nuxtAppModulesDirectory, feathersApiRoot)
const nuxiBinary = join(rootModulesDirectory, '.bin', 'nuxi')
const pnpmRuntimeFlags = [
  '--config.manage-package-manager-versions=false',
  '--ignore-pnpmfile',
]

function formatCommand(command, args, cwd = projectRoot) {
  return `(cd ${JSON.stringify(cwd)} && ${[command, ...args].map((value) => JSON.stringify(value)).join(' ')})`
}

async function run(command, args, cwd = projectRoot) {
  if (process.env.STACKBLITZ_BOOTSTRAP_DRY_RUN === '1') {
    console.log(formatCommand(command, args, cwd))
    return
  }

  await new Promise((resolvePromise, rejectPromise) => {
    const child = spawn(command, args, {
      cwd,
      env: process.env,
      stdio: 'inherit',
    })

    child.once('error', rejectPromise)
    child.once('exit', (code, signal) => {
      if (code === 0) {
        resolvePromise()
        return
      }

      const detail = signal ? `signal ${signal}` : `exit code ${code ?? 'unknown'}`
      rejectPromise(new Error(`${command} failed with ${detail}`))
    })
  })
}

async function pathExists(pathname) {
  try {
    await lstat(pathname)
    return true
  }
  catch (error) {
    if (error && typeof error === 'object' && error.code === 'ENOENT') {
      return false
    }
    throw error
  }
}

async function installWithoutNuxtPrepare() {
  const originalContent = await readFile(nuxtAppPackagePath, 'utf8')
  const manifest = JSON.parse(originalContent)
  const prepareScript = manifest.scripts?.prepare

  if (prepareScript !== 'nuxi prepare') {
    throw new Error(
      `Unexpected nuxt-app prepare script: ${JSON.stringify(prepareScript)}. `
      + 'Refusing to mutate the StackBlitz bootstrap contract.',
    )
  }

  const temporaryManifest = structuredClone(manifest)
  delete temporaryManifest.scripts.prepare

  await writeFile(nuxtAppPackagePath, `${JSON.stringify(temporaryManifest, null, 2)}\n`, 'utf8')

  try {
    await run(pnpmBinary, [
      ...pnpmRuntimeFlags,
      'install',
      '--frozen-lockfile',
      '--config.ignore-lockfile-settings-checks=true',
    ])
  }
  finally {
    await writeFile(nuxtAppPackagePath, originalContent, 'utf8')
  }
}

async function ensureNuxtWorkspaceLinks() {
  await mkdir(nuxtAppModulesDirectory, { recursive: true })

  if (!(await pathExists(feathersApiLink))) {
    await symlink(feathersApiLinkTarget, feathersApiLink, 'dir')
  }
}

if (process.env.STACKBLITZ_BOOTSTRAP_DRY_RUN === '1') {
  console.log(`[stackblitz] temporarily remove playground/nuxt-app prepare script (${JSON.stringify('nuxi prepare')})`)
  console.log(formatCommand('npm', ['install', '--global', '--prefix', pnpmPrefix, `pnpm@${PNPM_VERSION}`]))
  console.log(formatCommand(pnpmBinary, [
    ...pnpmRuntimeFlags,
    'install',
    '--frozen-lockfile',
    '--config.ignore-lockfile-settings-checks=true',
  ]))
  console.log('[stackblitz] restore playground/nuxt-app/package.json and ensure node_modules/feathers-api workspace link')
  console.log(formatCommand(nuxiBinary, ['dev', '--host'], nuxtAppRoot))
  process.exit(0)
}

await mkdir(pnpmPrefix, { recursive: true })
console.log(`[stackblitz] installing pnpm ${PNPM_VERSION} under ${pnpmPrefix}`)
await run('npm', ['install', '--global', '--prefix', pnpmPrefix, `pnpm@${PNPM_VERSION}`])
console.log('[stackblitz] installing workspace with nuxt-app prepare temporarily disabled')
await installWithoutNuxtPrepare()
console.log('[stackblitz] dependency install complete; nuxt-app package.json restored')
await ensureNuxtWorkspaceLinks()
if (!(await pathExists(nuxiBinary))) {
  throw new Error(`Expected Nuxt CLI at ${nuxiBinary} after pnpm install`)
}
console.log(`[stackblitz] starting Nuxt playground with ${nuxiBinary}`)
await run(nuxiBinary, ['dev', '--host'], nuxtAppRoot)
