import { readFile } from 'node:fs/promises'
import { dirname, resolve } from 'node:path'
import process from 'node:process'
import { fileURLToPath } from 'node:url'

const EXPECTED_PACKAGE_NAME = '@vevedh/feathers-nitro'
const UPSTREAM_PACKAGE_NAME = '@gabortorma/feathers-nitro-adapter'
const EXPECTED_REPOSITORY = 'git+https://github.com/vevedh/feathers-nitro.git'

const scriptDirectory = dirname(fileURLToPath(import.meta.url))
const projectRoot = resolve(scriptDirectory, '..')

async function readUtf8(relativePath) {
  return readFile(resolve(projectRoot, relativePath), 'utf8')
}

const packageJson = JSON.parse(await readUtf8('package.json'))
const readme = await readUtf8('README.md')

const errors = []

if (packageJson.name !== EXPECTED_PACKAGE_NAME) {
  errors.push(`package.json name must be ${EXPECTED_PACKAGE_NAME}`)
}

if (packageJson.repository?.url !== EXPECTED_REPOSITORY) {
  errors.push(`package.json repository.url must be ${EXPECTED_REPOSITORY}`)
}

if (!readme.includes(EXPECTED_PACKAGE_NAME)) {
  errors.push(`README.md must reference ${EXPECTED_PACKAGE_NAME}`)
}

const forbiddenReadmePatterns = [
  new RegExp(`(?:pnpm\\s+add|npm\\s+install|yarn\\s+add)[^\\n]*${UPSTREAM_PACKAGE_NAME.replace('/', '\\/')}`, 'i'),
  new RegExp(`from\\s+['\"]${UPSTREAM_PACKAGE_NAME.replace('/', '\\/')}(?:\\/[^'\"]*)?['\"]`, 'i'),
  new RegExp(`npmjs\\.com/package/${UPSTREAM_PACKAGE_NAME.replace('/', '\\/')}`, 'i'),
  new RegExp(`img\\.shields\\.io/npm/[^\\s)]*${UPSTREAM_PACKAGE_NAME.replace('/', '\\/')}`, 'i'),
]

for (const pattern of forbiddenReadmePatterns) {
  if (pattern.test(readme)) {
    errors.push(`README.md contains a stale upstream install, import, or npm badge target matching ${pattern}`)
  }
}

if (errors.length > 0) {
  console.error('Package identity validation failed:')
  for (const error of errors) {
    console.error(`- ${error}`)
  }
  process.exitCode = 1
}
else {
  console.log(`Package identity is valid: ${EXPECTED_PACKAGE_NAME}`)
}
