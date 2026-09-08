import { readFile } from 'node:fs/promises'
import { dirname, resolve } from 'node:path'
import process from 'node:process'
import { fileURLToPath } from 'node:url'

const EXPECTED = {
  nuxt: '4.5.2',
  rolldown: '1.2.4',
  schema: '4.5.2',
  testUtils: '4.2.0',
  vite: '8.2.2',
  vitest: '4.1.11',
  vue: '3.5.42',
  vueTsc: '3.3.11',
}

const FROZEN_RUNTIME = {
  feathers: '^5.0.49',
  h3: '1.15.11',
  nitropack: '2.13.4',
}

const scriptDirectory = dirname(fileURLToPath(import.meta.url))
const projectRoot = resolve(scriptDirectory, '..')

function unquoteYamlScalar(value) {
  const trimmed = value.trim()
  if (
    (trimmed.startsWith('\'') && trimmed.endsWith('\''))
    || (trimmed.startsWith('"') && trimmed.endsWith('"'))
  ) {
    return trimmed.slice(1, -1)
  }
  return trimmed
}

function normalizeLockedVersion(value) {
  const unquoted = unquoteYamlScalar(value)
  const peerSuffixIndex = unquoted.indexOf('(')
  return peerSuffixIndex === -1 ? unquoted : unquoted.slice(0, peerSuffixIndex)
}

function parseRootImporter(lockfileContent) {
  const dependencies = new Map()
  const lines = lockfileContent.split(/\r?\n/u)
  let insideImporters = false
  let insideRootImporter = false
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

    if (line.length > 0 && !line.startsWith(' ')) {
      break
    }

    const trimmedLine = line.trim()
    const isImporterLine = [
      line.startsWith('  '),
      !line.startsWith('    '),
      trimmedLine.endsWith(':'),
    ].every(Boolean)

    if (isImporterLine) {
      insideRootImporter = unquoteYamlScalar(trimmedLine.slice(0, -1)) === '.'
      dependencyGroup = null
      dependencyName = null
      continue
    }

    if (!insideRootImporter) {
      continue
    }

    const groupName = trimmedLine.endsWith(':') ? trimmedLine.slice(0, -1) : ''
    const isDependencyGroup = [
      line.startsWith('    '),
      !line.startsWith('      '),
      ['dependencies', 'devDependencies'].includes(groupName),
    ].every(Boolean)

    if (isDependencyGroup) {
      dependencyGroup = groupName
      dependencyName = null
      continue
    }

    if (!dependencyGroup) {
      continue
    }

    const isDependencyLine = [
      line.startsWith('      '),
      !line.startsWith('        '),
      trimmedLine.endsWith(':'),
    ].every(Boolean)

    if (isDependencyLine) {
      dependencyName = unquoteYamlScalar(trimmedLine.slice(0, -1))
      continue
    }

    if (!dependencyName || !line.startsWith('        version:')) {
      continue
    }

    dependencies.set(
      dependencyName,
      normalizeLockedVersion(line.slice('        version:'.length)),
    )
  }

  return dependencies
}

const [packageContent, workspaceContent, lockContent] = await Promise.all([
  readFile(resolve(projectRoot, 'package.json'), 'utf8'),
  readFile(resolve(projectRoot, 'pnpm-workspace.yaml'), 'utf8'),
  readFile(resolve(projectRoot, 'pnpm-lock.yaml'), 'utf8'),
])

const packageJson = JSON.parse(packageContent)
const devDependencies = packageJson.devDependencies ?? {}
const dependencies = packageJson.dependencies ?? {}
const rootImporter = parseRootImporter(lockContent)
const violations = []
let lockMigrationRequired = false

const expectedDirectDependencies = [
  ['@nuxt/schema', EXPECTED.schema],
  ['@nuxt/test-utils', EXPECTED.testUtils],
  ['nuxt', EXPECTED.nuxt],
  ['rolldown', EXPECTED.rolldown],
  ['vite', EXPECTED.vite],
  ['vitest', EXPECTED.vitest],
  ['vue', EXPECTED.vue],
  ['vue-tsc', EXPECTED.vueTsc],
]

for (const [name, expectedVersion] of expectedDirectDependencies) {
  if (devDependencies[name] !== expectedVersion) {
    violations.push(`${name} must be ${expectedVersion}, got ${devDependencies[name] ?? 'missing'}`)
  }

  if (rootImporter.get(name) !== expectedVersion) {
    lockMigrationRequired = true
    violations.push(
      `pnpm-lock.yaml root importer must resolve ${name} to ${expectedVersion}, got ${rootImporter.get(name) ?? 'missing'}`,
    )
  }
}

for (const [name, expectedVersion] of [
  ['nuxt', EXPECTED.nuxt],
  ['rolldown', EXPECTED.rolldown],
  ['vite', EXPECTED.vite],
  ['vitest', EXPECTED.vitest],
  ['vue', EXPECTED.vue],
]) {
  const catalogLine = `  '${name}': '${expectedVersion}'`
  if (!workspaceContent.includes(catalogLine)) {
    violations.push(`pnpm workspace catalog must pin ${name} to ${expectedVersion}`)
  }
}

const requiredPackageHeaders = [
  `'@nuxt/schema@${EXPECTED.schema}':`,
  `'@nuxt/test-utils@${EXPECTED.testUtils}':`,
  `nuxt@${EXPECTED.nuxt}:`,
  `rolldown@${EXPECTED.rolldown}:`,
  `vite@${EXPECTED.vite}`,
  `vitest@${EXPECTED.vitest}`,
  `vue@${EXPECTED.vue}`,
  `vue-tsc@${EXPECTED.vueTsc}:`,
]

for (const packageHeader of requiredPackageHeaders) {
  if (!lockContent.includes(packageHeader)) {
    lockMigrationRequired = true
    violations.push(`pnpm-lock.yaml is missing migrated package entry: ${packageHeader}`)
  }
}

for (const name of [
  '@feathersjs/errors',
  '@feathersjs/express',
  '@feathersjs/feathers',
  '@feathersjs/koa',
  '@feathersjs/socketio',
]) {
  if (dependencies[name] !== FROZEN_RUNTIME.feathers) {
    violations.push(`${name} must remain ${FROZEN_RUNTIME.feathers}`)
  }
}

if (dependencies.h3 !== FROZEN_RUNTIME.h3) {
  violations.push(`h3 must remain ${FROZEN_RUNTIME.h3}`)
}
if (dependencies.nitropack !== FROZEN_RUNTIME.nitropack) {
  violations.push(`nitropack must remain ${FROZEN_RUNTIME.nitropack}`)
}

const overrides = packageJson.pnpm?.overrides ?? {}
for (const [name, expectedVersion] of [
  ['rolldown', EXPECTED.rolldown],
  ['vite', EXPECTED.vite],
  ['vue', EXPECTED.vue],
]) {
  if (overrides[name] !== expectedVersion) {
    violations.push(`pnpm override ${name} must remain ${expectedVersion}`)
  }
}

if (violations.length > 0) {
  console.error('Coordinated Nuxt stack validation failed:')
  for (const violation of violations) {
    console.error(`- ${violation}`)
  }
  if (lockMigrationRequired) {
    console.error('Run `pnpm install --no-frozen-lockfile` once for Patch 015, then rerun `pnpm verify`.')
  }
  process.exitCode = 1
}
else {
  console.log([
    `Coordinated Nuxt stack is coherent: Nuxt ${EXPECTED.nuxt}, Vite ${EXPECTED.vite},`,
    `Vue ${EXPECTED.vue}, @nuxt/test-utils ${EXPECTED.testUtils}, Vitest ${EXPECTED.vitest},`,
    `Rolldown ${EXPECTED.rolldown}, and Vue TSC ${EXPECTED.vueTsc};`,
    `FeathersJS 5.0.49, Nitro ${FROZEN_RUNTIME.nitropack}, and H3 ${FROZEN_RUNTIME.h3} remain frozen.`,
  ].join(' '))
}
