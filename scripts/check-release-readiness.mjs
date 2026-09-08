import { access, readFile } from 'node:fs/promises'
import { dirname, resolve } from 'node:path'
import process from 'node:process'
import { fileURLToPath } from 'node:url'

const scriptDirectory = dirname(fileURLToPath(import.meta.url))
const projectRoot = resolve(scriptDirectory, '..')
const expectedVersion = '0.6.0'
const expectedPublishDryRun = 'npm publish --dry-run --access public --registry=https://registry.npmjs.org/'
const showcasePageFiles = [
  'playground/nuxt-app/app/pages/index.vue',
  'playground/nuxt-app/app/pages/messages.vue',
  'playground/nuxt-app/app/pages/adapters.vue',
  'playground/nuxt-app/app/pages/multi-instance.vue',
]
const requiredPlaygroundFiles = [
  'playground/nuxt-app/app/layouts/default.vue',
  ...showcasePageFiles,
  'playground/nuxt-app/server/examples/README.md',
  'playground/nuxt-app/server/utils/embedded-feathers-config.ts',
  'test/playground-showcase.test.ts',
  'scripts/check-packed-artifact.mjs',
]

const packageJson = JSON.parse(await readFile(resolve(projectRoot, 'package.json'), 'utf8'))
const publishing = await readFile(resolve(projectRoot, 'PUBLISHING.md'), 'utf8')
const playgroundDeclarations = await readFile(
  resolve(projectRoot, 'playground/feathers-api/src/declarations.ts'),
  'utf8',
)
const koaApplication = await readFile(
  resolve(projectRoot, 'playground/feathers-api/src/app-koa.ts'),
  'utf8',
)
const showcasePages = await Promise.all(
  showcasePageFiles.map(relativePath => readFile(resolve(projectRoot, relativePath), 'utf8')),
)
const publicationScripts = await Promise.all([
  'scripts/publish-direct.ps1',
  'scripts/bootstrap-and-publish.ps1',
  'scripts/reset-git.ps1',
].map(relativePath => readFile(resolve(projectRoot, relativePath), 'utf8')))
const errors = []

if (packageJson.version !== expectedVersion)
  errors.push(`package version must be ${expectedVersion}, got ${packageJson.version}`)

if (packageJson.publishConfig?.access !== 'public')
  errors.push('publishConfig.access must be public')

if (JSON.stringify(packageJson.files) !== JSON.stringify(['dist']))
  errors.push('npm files whitelist must contain only dist')

if (!packageJson.scripts?.verify?.includes('check:release'))
  errors.push('verify must execute check:release')

if (!packageJson.scripts?.verify?.includes('check:artifact'))
  errors.push('verify must execute check:artifact after pack:check')

if (!packageJson.scripts?.['test:showcase'])
  errors.push('package scripts must expose test:showcase')

if (packageJson.scripts?.['publish:dry-run'] !== expectedPublishDryRun)
  errors.push('publish:dry-run must use npm public-registry dry-run semantics')

if (packageJson.scripts?.['release:certify'] !== 'pnpm verify && pnpm publish:dry-run')
  errors.push('release:certify must run verify before the npm publish dry-run')

if (!playgroundDeclarations.includes('Application as FeathersApplication'))
  errors.push('playground declarations must import the adapter-neutral Feathers Application type')

if (!playgroundDeclarations.includes('export type Application = FeathersApplication<ServiceTypes, Configuration>'))
  errors.push('shared playground configuration must use the adapter-neutral Feathers Application contract')

for (const configureCall of ['authentication', 'services', 'channels', 'dummy']) {
  if (!koaApplication.includes(`app.configure(${configureCall})`))
    errors.push(`Koa showcase must configure ${configureCall}`)
}

for (const [index, pageContent] of showcasePages.entries()) {
  if (!pageContent.includes('<template>\n  <div class="showcase-page">'))
    errors.push(`showcase page must use the single-root contract: ${showcasePageFiles[index]}`)
}

if (publishing.includes('v0.5.0') || publishing.includes('@0.5.0'))
  errors.push('PUBLISHING.md still references the previous 0.5.0 release')

if (publicationScripts.some(content => content.includes('$Version = \'0.5.0\'')))
  errors.push('a publication helper still hard-codes version 0.5.0')

for (const relativePath of requiredPlaygroundFiles) {
  try {
    await access(resolve(projectRoot, relativePath))
  }
  catch {
    errors.push(`missing showcase file: ${relativePath}`)
  }
}

if (errors.length > 0) {
  console.error('Release readiness validation failed:')
  for (const error of errors)
    console.error(`- ${error}`)
  process.exitCode = 1
}
else {
  console.log(
    `Release ready: ${packageJson.name}@${expectedVersion}; public-only package and showcase contract present.`,
  )
}
