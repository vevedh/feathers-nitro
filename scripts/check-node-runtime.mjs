import { readFileSync } from 'node:fs'
import process from 'node:process'

const expectedEngine = '^22.19.0 || ^24.11.0 || >=26.0.0'
const recommendedNode = '22.20.0'
const manifests = [
  'package.json',
  'playground/feathers-api/package.json',
  'playground/nuxt-app/package.json',
]

function parseVersion(version) {
  const match = /^v?(\d+)\.(\d+)\.(\d+)/u.exec(version)
  if (!match) {
    throw new Error(`Unable to parse Node.js version: ${version}`)
  }
  return match.slice(1).map(Number)
}

function isSupported([major, minor]) {
  if (major === 22)
    return minor >= 19
  if (major === 24)
    return minor >= 11
  return major >= 26
}

const failures = []
const currentVersion = parseVersion(process.version)
if (!isSupported(currentVersion)) {
  failures.push(
    `Node.js ${process.version} does not satisfy the Patch 014 runtime floor ${expectedEngine}.`,
  )
}

for (const manifestPath of manifests) {
  const manifest = JSON.parse(readFileSync(manifestPath, 'utf8'))
  if (manifest.engines?.node !== expectedEngine) {
    failures.push(`${manifestPath} engines.node must be ${expectedEngine}.`)
  }
}

for (const versionFile of ['.nvmrc', '.node-version']) {
  const version = readFileSync(versionFile, 'utf8').trim()
  if (version !== recommendedNode) {
    failures.push(`${versionFile} must pin the recommended Node.js ${recommendedNode}.`)
  }
}

const ci = readFileSync('.github/workflows/ci.yml', 'utf8')
if (!ci.includes(`node-version: ${recommendedNode}`)) {
  failures.push(`CI must pin Node.js ${recommendedNode}.`)
}

if (failures.length) {
  console.error('Node runtime policy validation failed:')
  for (const failure of failures)
    console.error(`- ${failure}`)
  process.exit(1)
}

console.log(
  `Node runtime policy is coherent: ${expectedEngine}; CI and local version files pin ${recommendedNode}.`,
)
