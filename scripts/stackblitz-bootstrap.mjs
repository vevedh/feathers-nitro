import { spawn } from 'node:child_process'
import { lstat, mkdir, readFile, rm, symlink, writeFile } from 'node:fs/promises'
import { dirname, join, relative, resolve } from 'node:path'
import process from 'node:process'
import { fileURLToPath } from 'node:url'

const scriptDirectory = dirname(fileURLToPath(import.meta.url))
const projectRoot = resolve(scriptDirectory, '..')
const runtimeRoot = join(projectRoot, '.stackblitz-runtime')
const runtimeModulesDirectory = join(runtimeRoot, 'node_modules')
const rootModulesDirectory = join(projectRoot, 'node_modules')
const nuxtAppRoot = join(projectRoot, 'playground', 'nuxt-app')
const nuxtAppModulesDirectory = join(nuxtAppRoot, 'node_modules')
const feathersApiRoot = join(projectRoot, 'playground', 'feathers-api')
const feathersApiLink = join(runtimeModulesDirectory, 'feathers-api')
const nuxiBinary = join(runtimeModulesDirectory, '.bin', 'nuxi')
const lockfilePath = join(projectRoot, 'pnpm-lock.yaml')
const rootPackagePath = join(projectRoot, 'package.json')
const nuxtAppPackagePath = join(nuxtAppRoot, 'package.json')
const feathersApiPackagePath = join(feathersApiRoot, 'package.json')

const ROOT_DEV_RUNTIME_PACKAGES = new Set([
  '@types/node',
  'nuxi',
  'nuxt',
  'typescript',
  'vue-tsc',
])

const NUXT_ESLINT_LAYER_NAME = '@gabortorma/nuxt-eslint-layer'
const NUXT_ESLINT_LAYER_ROOT = join(runtimeModulesDirectory, '@gabortorma', 'nuxt-eslint-layer')

const STACKBLITZ_NUXT_ENV = {
  FEATHERS_NITRO_STACKBLITZ: '1',
}

const NUXT_DEV_ARGS = [
  'dev',
  '--host',
  '0.0.0.0',
  '--port',
  '3000',
]

const NPM_INSTALL_ARGS = [
  'install',
  '--package-lock=false',
  '--legacy-peer-deps',
  '--fund=false',
  '--audit=false',
]

function formatCommand(command, args, cwd, envOverrides = {}) {
  const environment = Object.entries(envOverrides)
    .map(([name, value]) => `${name}=${JSON.stringify(value)}`)
    .join(' ')
  const commandLine = [command, ...args]
    .map((value) => JSON.stringify(value))
    .join(' ')
  const prefix = environment ? `${environment} ` : ''
  return `(cd ${JSON.stringify(cwd)} && ${prefix}${commandLine})`
}

async function run(command, args, cwd, envOverrides = {}) {
  if (process.env.STACKBLITZ_BOOTSTRAP_DRY_RUN === '1') {
    console.log(formatCommand(command, args, cwd))
    return
  }

  await new Promise((resolvePromise, rejectPromise) => {
    const child = spawn(command, args, {
      cwd,
      env: { ...process.env, ...envOverrides },
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

function unquoteYamlScalar(value) {
  const trimmed = value.trim()
  if (
    (trimmed.startsWith("'") && trimmed.endsWith("'"))
    || (trimmed.startsWith('"') && trimmed.endsWith('"'))
  ) {
    return trimmed.slice(1, -1)
  }
  return trimmed
}

function normalizeLockedVersion(value) {
  const unquoted = unquoteYamlScalar(value)
  if (unquoted.startsWith('link:') || unquoted.startsWith('file:') || unquoted.startsWith('workspace:')) {
    return null
  }

  const peerSuffixIndex = unquoted.indexOf('(')
  return peerSuffixIndex === -1 ? unquoted : unquoted.slice(0, peerSuffixIndex)
}

function parseImporterVersions(lockfileContent, importerName) {
  const versions = new Map()
  const lines = lockfileContent.split(/\r?\n/u)
  let insideImporters = false
  let insideTargetImporter = false
  let dependencyGroup = null
  let dependencyName = null

  for (const line of lines) {
    if (line === 'importers:') {
      insideImporters = true
      continue
    }

    if (!insideImporters) {
      continue
    }

    if (/^[^\s].*:\s*$/u.test(line)) {
      break
    }

    const importerMatch = /^  ([^\s].*):\s*$/u.exec(line)
    if (importerMatch) {
      insideTargetImporter = unquoteYamlScalar(importerMatch[1]) === importerName
      dependencyGroup = null
      dependencyName = null
      continue
    }

    if (!insideTargetImporter) {
      continue
    }

    const groupMatch = /^    (dependencies|devDependencies|optionalDependencies):\s*$/u.exec(line)
    if (groupMatch) {
      dependencyGroup = groupMatch[1]
      dependencyName = null
      continue
    }

    if (!dependencyGroup) {
      continue
    }

    const dependencyMatch = /^      (.+):\s*$/u.exec(line)
    if (dependencyMatch) {
      dependencyName = unquoteYamlScalar(dependencyMatch[1])
      continue
    }

    if (!dependencyName) {
      continue
    }

    const versionMatch = /^        version:\s+(.+)$/u.exec(line)
    if (versionMatch) {
      const version = normalizeLockedVersion(versionMatch[1])
      if (version) {
        versions.set(dependencyName, version)
      }
    }
  }

  return versions
}

function addDependencies(target, manifest, lockedVersions, dependencyFields, filter = () => true) {
  for (const dependencyField of dependencyFields) {
    for (const dependencyName of Object.keys(manifest[dependencyField] ?? {})) {
      if (!filter(dependencyName)) {
        continue
      }

      const declaredSpecifier = manifest[dependencyField][dependencyName]
      if (typeof declaredSpecifier === 'string' && declaredSpecifier.startsWith('workspace:')) {
        continue
      }

      const lockedVersion = lockedVersions.get(dependencyName)
      if (!lockedVersion) {
        const manifestName = manifest.name ?? 'unnamed package'
        throw new Error(
          `No locked registry version found for ${dependencyName} in ${manifestName} ${dependencyField}`,
        )
      }

      const existingVersion = target.get(dependencyName)
      if (existingVersion && existingVersion !== lockedVersion) {
        throw new Error(
          `Conflicting locked versions for ${dependencyName}: ${existingVersion} versus ${lockedVersion}`,
        )
      }

      target.set(dependencyName, lockedVersion)
    }
  }
}

async function buildStandaloneRuntimeManifest() {
  const [
    lockfileContent,
    rootPackageContent,
    nuxtAppPackageContent,
    feathersApiPackageContent,
  ] = await Promise.all([
    readFile(lockfilePath, 'utf8'),
    readFile(rootPackagePath, 'utf8'),
    readFile(nuxtAppPackagePath, 'utf8'),
    readFile(feathersApiPackagePath, 'utf8'),
  ])

  const rootManifest = JSON.parse(rootPackageContent)
  const nuxtAppManifest = JSON.parse(nuxtAppPackageContent)
  const feathersApiManifest = JSON.parse(feathersApiPackageContent)
  const rootLockedVersions = parseImporterVersions(lockfileContent, '.')
  const nuxtLockedVersions = parseImporterVersions(lockfileContent, 'playground/nuxt-app')
  const feathersLockedVersions = parseImporterVersions(lockfileContent, 'playground/feathers-api')
  const runtimeDependencies = new Map()
  const nuxtEslintLayerVersion = rootLockedVersions.get(NUXT_ESLINT_LAYER_NAME)

  if (!nuxtEslintLayerVersion) {
    throw new Error(`No locked version found for ${NUXT_ESLINT_LAYER_NAME}`)
  }

  addDependencies(runtimeDependencies, rootManifest, rootLockedVersions, ['dependencies'])
  addDependencies(
    runtimeDependencies,
    rootManifest,
    rootLockedVersions,
    ['devDependencies'],
    (dependencyName) => ROOT_DEV_RUNTIME_PACKAGES.has(dependencyName),
  )
  addDependencies(
    runtimeDependencies,
    nuxtAppManifest,
    nuxtLockedVersions,
    ['dependencies', 'devDependencies'],
    (dependencyName) => dependencyName !== NUXT_ESLINT_LAYER_NAME,
  )
  addDependencies(runtimeDependencies, feathersApiManifest, feathersLockedVersions, ['dependencies'])

  return {
    manifest: {
      name: 'feathers-nitro-stackblitz-runtime',
      private: true,
      version: '0.0.0',
      type: 'module',
      dependencies: Object.fromEntries(
        [...runtimeDependencies.entries()].sort(([left], [right]) => left.localeCompare(right)),
      ),
    },
    nuxtEslintLayerVersion,
  }
}

async function createNuxtEslintLayerShim(version) {
  await mkdir(NUXT_ESLINT_LAYER_ROOT, { recursive: true })
  await writeFile(
    join(NUXT_ESLINT_LAYER_ROOT, 'package.json'),
    `${JSON.stringify({
      name: NUXT_ESLINT_LAYER_NAME,
      version,
      private: true,
      type: 'module',
      main: './nuxt.config.ts',
    }, null, 2)}\n`,
    'utf8',
  )
  await writeFile(
    join(NUXT_ESLINT_LAYER_ROOT, 'nuxt.config.ts'),
    "export default {\n  typescript: {\n    typeCheck: true,\n  },\n}\n",
    'utf8',
  )
}

async function createRuntimeLinks() {
  await rm(rootModulesDirectory, { recursive: true, force: true })
  await rm(nuxtAppModulesDirectory, { recursive: true, force: true })

  await symlink(relative(projectRoot, runtimeModulesDirectory), rootModulesDirectory, 'dir')
  await symlink(relative(nuxtAppRoot, runtimeModulesDirectory), nuxtAppModulesDirectory, 'dir')

  if (!(await pathExists(feathersApiLink))) {
    await symlink(relative(runtimeModulesDirectory, feathersApiRoot), feathersApiLink, 'dir')
  }
}

const { manifest: runtimeManifest, nuxtEslintLayerVersion } = await buildStandaloneRuntimeManifest()
const runtimeDependencyCount = Object.keys(runtimeManifest.dependencies).length

if (process.env.STACKBLITZ_BOOTSTRAP_DRY_RUN === '1') {
  console.log(`[stackblitz] create isolated npm runtime with ${runtimeDependencyCount} lock-aligned registry dependencies`)
  console.log(`[stackblitz] create local ${NUXT_ESLINT_LAYER_NAME}@${nuxtEslintLayerVersion} tooling shim`)
  console.log(formatCommand('npm', NPM_INSTALL_ARGS, runtimeRoot))
  console.log('[stackblitz] link root and nuxt-app node_modules to .stackblitz-runtime/node_modules')
  console.log('[stackblitz] link .stackblitz-runtime/node_modules/feathers-api to playground/feathers-api')
  console.log(formatCommand(nuxiBinary, NUXT_DEV_ARGS, nuxtAppRoot, STACKBLITZ_NUXT_ENV))
  process.exit(0)
}

await rm(runtimeRoot, { recursive: true, force: true })
await mkdir(runtimeRoot, { recursive: true })
await writeFile(join(runtimeRoot, 'package.json'), `${JSON.stringify(runtimeManifest, null, 2)}\n`, 'utf8')
await writeFile(join(runtimeRoot, '.npmrc'), 'registry=https://registry.npmjs.org/\n', 'utf8')

console.log(`[stackblitz] installing isolated npm runtime with ${runtimeDependencyCount} lock-aligned registry dependencies`)
await run('npm', NPM_INSTALL_ARGS, runtimeRoot)

if (!(await pathExists(runtimeModulesDirectory))) {
  throw new Error(`Expected npm runtime modules at ${runtimeModulesDirectory}`)
}

await createNuxtEslintLayerShim(nuxtEslintLayerVersion)
await createRuntimeLinks()
if (!(await pathExists(nuxiBinary))) {
  throw new Error(`Expected Nuxt CLI at ${nuxiBinary} after isolated npm install`)
}

console.log('[stackblitz] isolated runtime ready; starting Nuxt playground')
await run(nuxiBinary, NUXT_DEV_ARGS, nuxtAppRoot, STACKBLITZ_NUXT_ENV)
