import { readFileSync } from 'node:fs'
import process from 'node:process'

const expectedEngine = '^22.19.0 || ^24.11.0 || >=26.0.0'
const recommendedNode = '22.22.3'
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

function isSupportedDevelopmentRuntime([major, minor, patch]) {
  if (major === 22)
    return minor > 22 || (minor === 22 && patch >= 3)
  if (major === 24)
    return minor >= 15
  return major >= 26
}

const failures = []
const currentVersion = parseVersion(process.version)
if (!isSupportedDevelopmentRuntime(currentVersion)) {
  failures.push(
    `Node.js ${process.version} is below the Patch 022 Nuxt 4.6 development floor (^22.22.3 || ^24.15.0 || >=26.0.0).`,
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
  `Node runtime policy is coherent: package engines remain ${expectedEngine}; Patch 022 CI/local tooling pins ${recommendedNode}.`,
)
