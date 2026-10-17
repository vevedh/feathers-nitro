import { readFile } from 'node:fs/promises'
import { dirname, resolve } from 'node:path'
import process from 'node:process'
import { fileURLToPath } from 'node:url'

const EXPECTED = {
  nodeTypes: '22.20.4',
  nuxt: '4.6.2',
  rolldown: '1.2.14',
  schema: '4.6.2',
  testUtils: '4.3.3',
  vite: '8.3.4',
  vitest: '4.1.11',
  vue: '3.5.44',
  vueTsc: '3.3.13',
}

const FROZEN_RUNTIME = {
  feathers: '^5.0.49',
  h3: '1.15.11',
  nitropack: '2.13.4',
}

const REQUIRED_MATURITY_EXCLUDES = [
  'nuxt@4.6.2',
  '@nuxt/schema@4.6.2',
  '@nuxt/kit@4.6.2',
  '@nuxt/nitro-server@4.6.2',
  '@nuxt/vite-builder@4.6.2',
  '@nuxt/vite-server@4.6.2',
  '@nuxt/test-utils@4.3.3',
  'rolldown@1.2.14',
  'vue-tsc@3.3.13',
  'my-bad@0.2.11',
  'clickable-path@0.1.1',
  'package-manager-detector@1.9.0',
  'unhead@3.4.3',
  '@unhead/vue@3.4.3',
  'devalue@6.0.3',
  'exsolve@1.1.3',
  '@nuxt/cli@4.0.1',
  '@nuxt/devtools@3.4.3',
  '@nuxt/devtools-kit@3.4.3',
  '@nuxt/devtools-wizard@3.4.3',
  'hookable@6.1.2',
  'ignore@7.0.12',
  'std-env@4.3.0',
  'vue-router@5.4.0',
  'undici@8.12.1',
  'vue-component-type-helpers@3.3.13',
  'srvx@1.0.5',
  '@rolldown/binding-android-arm-eabi@1.2.14',
  '@rolldown/binding-android-arm64@1.2.14',
  '@rolldown/binding-darwin-arm64@1.2.14',
  '@rolldown/binding-darwin-universal@1.2.14',
  '@rolldown/binding-darwin-x64@1.2.14',
  '@rolldown/binding-freebsd-arm64@1.2.14',
  '@rolldown/binding-freebsd-x64@1.2.14',
  '@rolldown/binding-linux-arm-gnueabihf@1.2.14',
  '@rolldown/binding-linux-arm-musleabihf@1.2.14',
  '@rolldown/binding-linux-arm64-gnu@1.2.14',
  '@rolldown/binding-linux-arm64-musl@1.2.14',
  '@rolldown/binding-linux-loong64-gnu@1.2.14',
  '@rolldown/binding-linux-loong64-musl@1.2.14',
  '@rolldown/binding-linux-ppc64-gnu@1.2.14',
  '@rolldown/binding-linux-riscv64-gnu@1.2.14',
  '@rolldown/binding-linux-riscv64-musl@1.2.14',
  '@rolldown/binding-linux-s390x-gnu@1.2.14',
  '@rolldown/binding-linux-x64-gnu@1.2.14',
  '@rolldown/binding-linux-x64-musl@1.2.14',
  '@rolldown/binding-openharmony-arm@1.2.14',
  '@rolldown/binding-openharmony-arm64@1.2.14',
  '@rolldown/binding-openharmony-x64@1.2.14',
  '@rolldown/binding-wasm32-wasi@1.2.14',
  '@rolldown/binding-win32-arm64-msvc@1.2.14',
  '@rolldown/binding-win32-ia32-msvc@1.2.14',
  '@rolldown/binding-win32-x64-gnu@1.2.14',
  '@rolldown/binding-win32-x64-msvc@1.2.14',
  '@unhead/bundler@3.4.3',
  'oxc-parser@0.154.0',
  '@oxc-project/types@0.154.0',
  '@oxc-parser/binding-android-arm-eabi@0.154.0',
  '@oxc-parser/binding-android-arm64@0.154.0',
  '@oxc-parser/binding-darwin-arm64@0.154.0',
  '@oxc-parser/binding-darwin-universal@0.154.0',
  '@oxc-parser/binding-darwin-x64@0.154.0',
  '@oxc-parser/binding-freebsd-arm64@0.154.0',
  '@oxc-parser/binding-freebsd-x64@0.154.0',
  '@oxc-parser/binding-linux-arm-gnueabihf@0.154.0',
  '@oxc-parser/binding-linux-arm-musleabihf@0.154.0',
  '@oxc-parser/binding-linux-arm64-gnu@0.154.0',
  '@oxc-parser/binding-linux-arm64-musl@0.154.0',
  '@oxc-parser/binding-linux-loong64-gnu@0.154.0',
  '@oxc-parser/binding-linux-loong64-musl@0.154.0',
  '@oxc-parser/binding-linux-ppc64-gnu@0.154.0',
  '@oxc-parser/binding-linux-riscv64-gnu@0.154.0',
  '@oxc-parser/binding-linux-riscv64-musl@0.154.0',
  '@oxc-parser/binding-linux-s390x-gnu@0.154.0',
  '@oxc-parser/binding-linux-x64-gnu@0.154.0',
  '@oxc-parser/binding-linux-x64-musl@0.154.0',
  '@oxc-parser/binding-openharmony-arm@0.154.0',
  '@oxc-parser/binding-openharmony-arm64@0.154.0',
  '@oxc-parser/binding-openharmony-x64@0.154.0',
  '@oxc-parser/binding-wasm32-wasi@0.154.0',
  '@oxc-parser/binding-wasm32-wasip1@0.154.0',
  '@oxc-parser/binding-win32-arm64-msvc@0.154.0',
  '@oxc-parser/binding-win32-ia32-msvc@0.154.0',
  '@oxc-parser/binding-win32-x64-gnu@0.154.0',
  '@oxc-parser/binding-win32-x64-msvc@0.154.0',
]

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
  ['@types/node', EXPECTED.nodeTypes],
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
  ['@types/node', EXPECTED.nodeTypes],
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

for (const maturityExclude of REQUIRED_MATURITY_EXCLUDES) {
  const expectedLine = `  - '${maturityExclude}'`
  if (!workspaceContent.includes(expectedLine)) {
    violations.push(`pnpm minimumReleaseAgeExclude must include the reviewed version-scoped entry ${maturityExclude}`)
  }
}

function maturityExcludeLine(packageName) {
  return `  - '${packageName}'`
}

if (workspaceContent.includes(maturityExcludeLine('@nuxt/*'))) {
  violations.push('pnpm minimumReleaseAgeExclude must not use a broad @nuxt/* exemption; keep Patch022 exceptions version-scoped')
}

const forbiddenBroadTransitiveExcludes = [
  '@unhead/*',
  'unhead',
  'my-bad',
  'clickable-path',
  'package-manager-detector',
  'devalue',
  'exsolve',
  '@nuxt/cli',
  '@nuxt/devtools',
  '@nuxt/devtools-kit',
  '@nuxt/devtools-wizard',
  'hookable',
  'ignore',
  'std-env',
  'vue-router',
  'undici',
  'vue-component-type-helpers',
  'srvx',
  '@unhead/bundler',
  'oxc-parser',
  '@oxc-project/types',
  '@oxc-parser/binding-android-arm-eabi',
  '@oxc-parser/binding-android-arm64',
  '@oxc-parser/binding-darwin-arm64',
  '@oxc-parser/binding-darwin-universal',
  '@oxc-parser/binding-darwin-x64',
  '@oxc-parser/binding-freebsd-arm64',
  '@oxc-parser/binding-freebsd-x64',
  '@oxc-parser/binding-linux-arm-gnueabihf',
  '@oxc-parser/binding-linux-arm-musleabihf',
  '@oxc-parser/binding-linux-arm64-gnu',
  '@oxc-parser/binding-linux-arm64-musl',
  '@oxc-parser/binding-linux-loong64-gnu',
  '@oxc-parser/binding-linux-loong64-musl',
  '@oxc-parser/binding-linux-ppc64-gnu',
  '@oxc-parser/binding-linux-riscv64-gnu',
  '@oxc-parser/binding-linux-riscv64-musl',
  '@oxc-parser/binding-linux-s390x-gnu',
  '@oxc-parser/binding-linux-x64-gnu',
  '@oxc-parser/binding-linux-x64-musl',
  '@oxc-parser/binding-openharmony-arm',
  '@oxc-parser/binding-openharmony-arm64',
  '@oxc-parser/binding-openharmony-x64',
  '@oxc-parser/binding-wasm32-wasi',
  '@oxc-parser/binding-wasm32-wasip1',
  '@oxc-parser/binding-win32-arm64-msvc',
  '@oxc-parser/binding-win32-ia32-msvc',
  '@oxc-parser/binding-win32-x64-gnu',
  '@oxc-parser/binding-win32-x64-msvc',
  '@rolldown/binding-android-arm-eabi',
  '@rolldown/binding-android-arm64',
  '@rolldown/binding-darwin-arm64',
  '@rolldown/binding-darwin-universal',
  '@rolldown/binding-darwin-x64',
  '@rolldown/binding-freebsd-arm64',
  '@rolldown/binding-freebsd-x64',
  '@rolldown/binding-linux-arm-gnueabihf',
  '@rolldown/binding-linux-arm-musleabihf',
  '@rolldown/binding-linux-arm64-gnu',
  '@rolldown/binding-linux-arm64-musl',
  '@rolldown/binding-linux-loong64-gnu',
  '@rolldown/binding-linux-loong64-musl',
  '@rolldown/binding-linux-ppc64-gnu',
  '@rolldown/binding-linux-riscv64-gnu',
  '@rolldown/binding-linux-riscv64-musl',
  '@rolldown/binding-linux-s390x-gnu',
  '@rolldown/binding-linux-x64-gnu',
  '@rolldown/binding-linux-x64-musl',
  '@rolldown/binding-openharmony-arm',
  '@rolldown/binding-openharmony-arm64',
  '@rolldown/binding-openharmony-x64',
  '@rolldown/binding-wasm32-wasi',
  '@rolldown/binding-win32-arm64-msvc',
  '@rolldown/binding-win32-ia32-msvc',
  '@rolldown/binding-win32-x64-gnu',
  '@rolldown/binding-win32-x64-msvc',
]

for (const broadExclude of forbiddenBroadTransitiveExcludes) {
  const broadExcludeLine = maturityExcludeLine(broadExclude)
  if (workspaceContent.includes(broadExcludeLine)) {
    violations.push(`pnpm minimumReleaseAgeExclude must not use broad transitive exemption ${broadExcludeLine.trim()}; keep Patch022 entries version-scoped`)
  }
}

for (const forbiddenRolldownBypass of [
  '@rolldown/*',
  '@rolldown/binding-*',
]) {
  const forbiddenLine = maturityExcludeLine(forbiddenRolldownBypass)
  if (workspaceContent.includes(forbiddenLine)) {
    violations.push(`pnpm minimumReleaseAgeExclude must not use ${forbiddenLine.trim()}; enumerate the reviewed Rolldown 1.2.14 binding packages exactly`)
  }
}

for (const forbiddenToolchainBypass of [
  '@unhead/*',
  '@oxc-parser/*',
  '@oxc-project/*',
]) {
  const forbiddenLine = maturityExcludeLine(forbiddenToolchainBypass)
  if (workspaceContent.includes(forbiddenLine)) {
    violations.push(`pnpm minimumReleaseAgeExclude must not use ${forbiddenLine.trim()}; keep Unhead/Oxc Patch022 exceptions version-scoped`)
  }
}

if (
  workspaceContent.includes(maturityExcludeLine('@types/node'))
  || workspaceContent.includes(maturityExcludeLine('@types/node@22.20.4'))
) {
  violations.push('@types/node@22.20.4 is already mature and must not bypass minimumReleaseAge')
}

const requiredPackageHeaders = [
  `'@types/node@${EXPECTED.nodeTypes}':`,
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
    console.error('Run `pnpm install --no-frozen-lockfile` once for Patch 022, then rerun `pnpm verify`.')
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
