import { readFile } from 'node:fs/promises'
import { dirname, resolve } from 'node:path'
import process from 'node:process'
import { fileURLToPath } from 'node:url'

const EXPECTED_VERSION = '5.0.49'
const LEGACY_VERSION = '5.0.46'

const catalogPackages = [
  '@feathersjs/adapter-commons',
  '@feathersjs/authentication',
  '@feathersjs/authentication-client',
  '@feathersjs/authentication-local',
  '@feathersjs/cli',
  '@feathersjs/configuration',
  '@feathersjs/errors',
  '@feathersjs/express',
  '@feathersjs/feathers',
  '@feathersjs/koa',
  '@feathersjs/memory',
  '@feathersjs/rest-client',
  '@feathersjs/schema',
  '@feathersjs/socketio',
  '@feathersjs/socketio-client',
  '@feathersjs/transport-commons',
  '@feathersjs/typebox',
]

const lockedPackages = [
  ...catalogPackages,
  '@feathersjs/commons',
  '@feathersjs/generators',
]

const expectedIntegrities = {
  '@feathersjs/adapter-commons': 'sha512-APPd108+smkvTiDRj8wJ6qWqMIjUriC6Iy/CCnQupAvbdH4OTB3H9K+iB1/Nj1HWg0V0NzBOw5SrzZwKlfj2Ug==',
  '@feathersjs/authentication': 'sha512-7bXEohEXcPKVw+PHjWMsWE+ap/ljL8bBX05f+fNAaaGULinsbaG+Qfjgd7Ny9TdVkSA3GHw/8xiOEsGd1Vfevw==',
  '@feathersjs/authentication-client': 'sha512-frgm6j1fl21BEBMMhMRyKlqupcYICwJ8YtSFgm1Ju6jtL8HC3fCwU3GCBLcG6LQ+gUNIrrmH9Ra/sW95wWbfmg==',
  '@feathersjs/authentication-local': 'sha512-/v4yhzcvUQvfhZzQS5mGRyVsED05sXAL+rgncwpBAIrA+5v91Zb3LSRpz9e3iR/LA3qdvWXY86AWfv0v83fbXA==',
  '@feathersjs/cli': 'sha512-cCfbnQo+C6g+yOfHcfqiDZCPm7dgF6Vga6yB4KuFsbOuluOyFIqhpk/2nkLOLUZ6qJm2/YakHrVAbgorhnFtwg==',
  '@feathersjs/commons': 'sha512-A74QexhiglOe1L+C9pBEULMgiMyhCK994WiswLob7uPaprDAoNtChN7mMAaN4cj6bbTaT8YMvRXLBtd5Folzfg==',
  '@feathersjs/configuration': 'sha512-tuZYIngFVzs7FUzdywum9UIOCvNbphMoYb6qDiP/KybTZUGeeVzn5Lr3zGZDLWiVIcGr1SwNsxZyS7UxCWo69Q==',
  '@feathersjs/errors': 'sha512-68pp+Nu1luhgoLhXHYwl2lfxkBMEmxi1O4zS7VeW3JgpcKhYEHluRF0tO4ZIZFFSkejpxPwzrkwrISS7TRW+Tg==',
  '@feathersjs/express': 'sha512-hzlszQetbpV9ylamqzMJvfugwiEZT8xuJnSIsRUckYay1Io1qhvvAvx+XP6TWfhmIk518VMDZnBbJIXzGgjGiw==',
  '@feathersjs/feathers': 'sha512-UAy/ndcxY5s6uT6EjhHLkoMVvDYwo+1QsYlr/rhvTwxfKcM20Q07eoK5Xk1S4AZHF236Lil+if5+IVXrBpYlRg==',
  '@feathersjs/generators': 'sha512-TBZI0LjdljSKfkktOcepwcXYkdOf4NKDpe1lvMIRcdhKhnXR87b159t3GmSjeLns+1teCD3oABo4QG2stbqq0w==',
  '@feathersjs/koa': 'sha512-Hy8sMlWLz0emxEL5bEBJkrxU/XyUErcZj5lgG/RmeHIl/lnYA/nk8ID/cnT+KLn1g14LoRZEx6tVQDcegRdDNQ==',
  '@feathersjs/memory': 'sha512-bqaCiJhMB+RIo2qgRFTgnbFTrN32YqxWKkCyL/30yF4T7G1lcq6WSKtGS9+DpT+9TKaaBUv0BLqU/NOPMmQwuQ==',
  '@feathersjs/rest-client': 'sha512-Shrfc3vP/I7Pw/EZ+GbIspb9Po+01JkSu0McVNKTqJIT38oP1tB0+nI5M+dUUis3TOv0FIuJYASG7pg9Itt+hQ==',
  '@feathersjs/schema': 'sha512-n3/UhwKg3g7A56cUSEQFQY2SBCx7U4IDcWKks6MAYIshc2HVegGsLYdl1OJpTENqhURufQF+L8MLciYRmXiwPg==',
  '@feathersjs/socketio-client': 'sha512-gs2Q6/IUzF+5AED0Ej6Ka5vN17ycVlklHR4ieTsuXBaUtJXLf3hwqlg8QvQmuO5+NicDl22bkRPEE1z1DXcxVA==',
  '@feathersjs/socketio': 'sha512-e3x/C0gkXFzXhSuvFEllJMzwQEuxfUxIilOlf/fX0T4jG/iRBSQgQOQqaEJFb1COp4EM7yCkEu/pL2Ykr4bslA==',
  '@feathersjs/transport-commons': 'sha512-HmDPycuRizU4hb1CqOCK4LtylECBDdB5MxjWYPdB5FfNfoCyf9NhE42uG4dpZQaHSAQMcDOSeybGuTSvjEjR7Q==',
  '@feathersjs/typebox': 'sha512-uhhox2PsRN+gzNG3nDNn93zEM2eUJvk+Jm3HJJ8987ubwesqf4jLmMZe2YZh/xqLTatk61X9D246fzkafB51DA==',
}

const directRuntimePackages = [
  '@feathersjs/errors',
  '@feathersjs/express',
  '@feathersjs/feathers',
  '@feathersjs/koa',
  '@feathersjs/socketio',
]

const scriptDirectory = dirname(fileURLToPath(import.meta.url))
const projectRoot = resolve(scriptDirectory, '..')

async function readUtf8(relativePath) {
  return readFile(resolve(projectRoot, relativePath), 'utf8')
}

function escapeRegExp(value) {
  return value.replace(/[.*+?^${}()|[\]\\]/gu, '\\$&')
}

const [packageContent, workspaceContent, lockfileContent] = await Promise.all([
  readUtf8('package.json'),
  readUtf8('pnpm-workspace.yaml'),
  readUtf8('pnpm-lock.yaml'),
])

const packageJson = JSON.parse(packageContent)
const violations = []

for (const packageName of directRuntimePackages) {
  const declared = packageJson.dependencies?.[packageName]
  const expected = `^${EXPECTED_VERSION}`
  if (declared !== expected) {
    violations.push(`package.json: ${packageName} must be ${expected}, got ${declared ?? 'missing'}`)
  }
}

for (const packageName of catalogPackages) {
  const packagePattern = escapeRegExp(packageName)
  const expectedSpecifier = packageName === '@feathersjs/cli' ? EXPECTED_VERSION : `^${EXPECTED_VERSION}`
  const workspacePattern = new RegExp(`^\\s{2}'${packagePattern}':\\s+'${escapeRegExp(expectedSpecifier)}'\\s*$`, 'mu')

  if (!workspacePattern.test(workspaceContent)) {
    violations.push(`pnpm-workspace.yaml: ${packageName} must use ${expectedSpecifier}`)
  }

  const lockCatalogPattern = new RegExp(
    `^\\s{4}'${packagePattern}':\\n\\s{6}specifier: ${escapeRegExp(expectedSpecifier)}\\n\\s{6}version: ${escapeRegExp(EXPECTED_VERSION)}(?:\\s|$)`,
    'mu',
  )

  if (!lockCatalogPattern.test(lockfileContent)) {
    violations.push(`pnpm-lock.yaml catalog: ${packageName} must resolve ${expectedSpecifier} -> ${EXPECTED_VERSION}`)
  }
}

for (const packageName of lockedPackages) {
  const packagePattern = escapeRegExp(packageName)
  const expectedIntegrity = expectedIntegrities[packageName]
  const packageBlockPattern = new RegExp(
    `^\\s{2}'${packagePattern}@${escapeRegExp(EXPECTED_VERSION)}':\\n\\s{4}resolution: \\{integrity: ${escapeRegExp(expectedIntegrity)}\\}`,
    'mu',
  )

  if (!packageBlockPattern.test(lockfileContent)) {
    violations.push(
      [
        `pnpm-lock.yaml packages: ${packageName}@${EXPECTED_VERSION} is missing`,
        'or has an unexpected integrity value',
      ].join(' '),
    )
  }
}

const legacyVersionFound = [
  workspaceContent,
  lockfileContent,
  packageContent,
].some(content => content.includes(LEGACY_VERSION))

if (legacyVersionFound) {
  violations.push(`active dependency metadata still references legacy Feathers ${LEGACY_VERSION}`)
}

const stalePackageVersionPattern = /@feathersjs\/[a-z0-9-]+@5\.0\.(?!49\b)\d+/giu
const staleLockedVersions = [...new Set(lockfileContent.match(stalePackageVersionPattern) ?? [])]
if (staleLockedVersions.length > 0) {
  violations.push(`pnpm-lock.yaml contains mixed Feathers v5 package versions: ${staleLockedVersions.join(', ')}`)
}

const packagesMarker = '\npackages:\n'
const snapshotsMarker = '\nsnapshots:\n'
const packagesStart = lockfileContent.indexOf(packagesMarker)
const snapshotsStart = lockfileContent.indexOf(snapshotsMarker)

if (packagesStart === -1 || snapshotsStart === -1 || snapshotsStart <= packagesStart) {
  violations.push('pnpm-lock.yaml: expected pnpm v9 packages/snapshots sections were not found')
}
else {
  const packagesSection = lockfileContent.slice(packagesStart + packagesMarker.length, snapshotsStart)
  const packageBlockCount = lockedPackages.reduce((count, packageName) => {
    const pattern = new RegExp(`^\\s{2}'${escapeRegExp(packageName)}@${escapeRegExp(EXPECTED_VERSION)}':`, 'gmu')
    return count + [...packagesSection.matchAll(pattern)].length
  }, 0)

  if (packageBlockCount !== lockedPackages.length) {
    violations.push(`pnpm-lock.yaml expected ${lockedPackages.length} unique Feathers ${EXPECTED_VERSION} package blocks, found ${packageBlockCount}`)
  }
}

if (violations.length > 0) {
  console.error(`FeathersJS ${EXPECTED_VERSION} suite validation failed:`)
  for (const violation of violations) {
    console.error(`- ${violation}`)
  }
  process.exitCode = 1
}
else {
  console.log(`FeathersJS suite is coherently pinned to ${EXPECTED_VERSION} across manifests, catalog, importers, snapshots, and integrity metadata.`)
}
