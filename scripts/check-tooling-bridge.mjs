import { readFile } from 'node:fs/promises'
import { dirname, resolve } from 'node:path'
import process from 'node:process'
import { fileURLToPath } from 'node:url'

const EXPECTED = {
  nuxt: '4.4.8',
  testUtils: '4.0.3',
  vitest: '4.1.10',
  vueTsc: '3.3.11',
}

const VITEST_SNAPSHOT = '4.1.10(@types/node@22.20.0)(vite@7.3.6(@types/node@22.20.0)'
const VUE_TSC_SNAPSHOT = '3.3.11(typescript@5.9.3)'
const VUE_TSC_INTEGRITY = 'sha512-gOb0B9rtU2+f1dszwPqSH5kAieIF9ReeLhD3kSRNHv5WZZUQz/JdVXW0RTdqhNTMlQkqKzrTTviqKr/4FYZraQ=='
const LANGUAGE_CORE_INTEGRITY = 'sha512-QJmpliwAVpC/OxubIByPAhNzsQPRc8/gxlN2qnVzVfIMjMDz/9RnXRFoetjz5yEg'
  + 'XVXyp4LqhXq3V53PjmNzFw=='

const scriptDirectory = dirname(fileURLToPath(import.meta.url))
const projectRoot = resolve(scriptDirectory, '..')
const [packageContent, lockContent] = await Promise.all([
  readFile(resolve(projectRoot, 'package.json'), 'utf8'),
  readFile(resolve(projectRoot, 'pnpm-lock.yaml'), 'utf8'),
])

const packageJson = JSON.parse(packageContent)
const violations = []
const devDependencies = packageJson.devDependencies ?? {}

for (const [name, expected] of [
  ['nuxt', EXPECTED.nuxt],
  ['@nuxt/test-utils', EXPECTED.testUtils],
  ['vitest', EXPECTED.vitest],
  ['vue-tsc', EXPECTED.vueTsc],
]) {
  if (devDependencies[name] !== expected) {
    violations.push(`${name} must be ${expected}, got ${devDependencies[name] ?? 'missing'}`)
  }
}

const requiredLockSnippets = [
  `specifier: ${EXPECTED.vitest}\n        version: ${VITEST_SNAPSHOT}`,
  `specifier: ${EXPECTED.vueTsc}\n        version: ${VUE_TSC_SNAPSHOT}`,
  `vue-tsc@${EXPECTED.vueTsc}:\n    resolution: {integrity: ${VUE_TSC_INTEGRITY}}`,
  `'@vue/language-core@${EXPECTED.vueTsc}':\n    resolution: {integrity: ${LANGUAGE_CORE_INTEGRITY}}`,
  `vue-tsc@${VUE_TSC_SNAPSHOT}:\n`
    + `    dependencies:\n      '@volar/typescript': 2.4.28\n`
    + `      '@vue/language-core': ${EXPECTED.vueTsc}`,
  `'@vue/language-core@${EXPECTED.vueTsc}':\n`
    + `    dependencies:\n      '@volar/language-core': 2.4.28\n`
    + `      '@vue/compiler-dom': 3.5.39\n      '@vue/shared': 3.5.39`,
]

for (const snippet of requiredLockSnippets) {
  if (!lockContent.includes(snippet)) {
    violations.push(`pnpm-lock.yaml is missing tooling bridge contract: ${snippet.split('\n')[0]}`)
  }
}

if (!lockContent.includes('nuxt@4.4.8')) {
  violations.push('Nuxt must remain on 4.4.8 during the tooling-only bridge')
}

if (!lockContent.includes('@nuxt/test-utils@4.0.3')) {
  violations.push('@nuxt/test-utils must remain on 4.0.3 during the tooling-only bridge')
}

if (violations.length > 0) {
  console.error('Tooling bridge validation failed:')
  for (const violation of violations) {
    console.error(`- ${violation}`)
  }
  process.exitCode = 1
}
else {
  console.log(
    `Tooling bridge is coherent: Vitest ${EXPECTED.vitest} and vue-tsc ${EXPECTED.vueTsc}; `
      + `Nuxt ${EXPECTED.nuxt} and @nuxt/test-utils ${EXPECTED.testUtils} remain frozen for Patch 014.`,
  )
}
