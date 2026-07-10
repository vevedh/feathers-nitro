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

for (const file of filesToCheck) {
  const content = await readFile(file, 'utf8')

  for (const { label, pattern } of forbiddenPatterns) {
    if (pattern.test(content)) {
      violations.push(`${file}: ${label}`)
    }
  }
}

if (violations.length > 0) {
  console.error('Package-manager portability check failed:')
  for (const violation of violations) {
    console.error(`- ${violation}`)
  }
  process.exitCode = 1
}
else {
  console.log('Package-manager files are portable and contain no forbidden private registry URLs.')
}
