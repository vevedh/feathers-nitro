import { readFile } from 'node:fs/promises'
import process from 'node:process'

const filesToCheck = [
  'pnpm-lock.yaml',
  '.npmrc',
  'package.json',
  'playground/feathers-api/package.json',
  'playground/nuxt-app/package.json',
]

const forbiddenPatterns = [
  {
    label: 'OpenAI internal package registry',
    pattern: /packages\.applied-caas-gateway\d*\.internal\.api\.openai\.org/iu,
  },
  {
    label: 'OpenAI internal API hostname',
    pattern: /internal\.api\.openai\.org/iu,
  },
  {
    label: 'credentials embedded in an HTTP(S) URL',
    pattern: /https?:\/\/[^\s/:]+:[^\s/@]+@/iu,
  },
]

const violations = []
let lockfileContent = ''

for (const file of filesToCheck) {
  const content = await readFile(file, 'utf8')

  if (file === 'pnpm-lock.yaml') {
    lockfileContent = content
  }

  for (const { label, pattern } of forbiddenPatterns) {
    if (pattern.test(content)) {
      violations.push(`${file}: ${label}`)
    }
  }
}

// pnpm security advisories published in 2026 made fail-open installs without an
// integrity field a concrete supply-chain risk. Keep every external package
// entry in the portable lockfile content-addressed.
const packagesMarker = '\npackages:\n'
const snapshotsMarker = '\nsnapshots:\n'
const packagesStart = lockfileContent.indexOf(packagesMarker)
const snapshotsStart = lockfileContent.indexOf(snapshotsMarker)

if (packagesStart === -1 || snapshotsStart === -1 || snapshotsStart <= packagesStart) {
  violations.push('pnpm-lock.yaml: expected pnpm v9 packages/snapshots sections were not found')
}
else {
  const packagesSection = lockfileContent.slice(packagesStart + packagesMarker.length, snapshotsStart)
  const packageBlocks = packagesSection
    .split(/\n(?= {2}\S)/u)
    .map(block => block.trimEnd())
    .filter(Boolean)

  for (const block of packageBlocks) {
    const [header = 'unknown package'] = block.split('\n', 1)
    if (!block.includes('resolution: {integrity: sha512-')) {
      violations.push(`pnpm-lock.yaml: missing sha512 integrity for ${header.trim().replace(/:$/u, '')}`)
    }
  }
}

if (violations.length > 0) {
  console.error('Package-manager portability/security check failed:')
  for (const violation of violations) {
    console.error(`- ${violation}`)
  }
  process.exitCode = 1
}
else {
  console.log('Package-manager files are portable, registry-neutral, and all locked packages have sha512 integrity.')
}
