import { readdir, readFile } from 'node:fs/promises'
import { extname, join, relative, resolve } from 'node:path'
import process from 'node:process'
import { fileURLToPath } from 'node:url'

const scriptDirectory = resolve(fileURLToPath(new URL('.', import.meta.url)))
const projectRoot = resolve(scriptDirectory, '..')
const sourceRoot = resolve(projectRoot, 'src')
const violations = []
const checkedFiles = []

async function walk(directory) {
  for (const entry of await readdir(directory, { withFileTypes: true })) {
    const absolute = join(directory, entry.name)
    if (entry.isDirectory()) {
      await walk(absolute)
      continue
    }

    if (!['.ts', '.mts', '.cts'].includes(extname(entry.name)))
      continue

    const content = await readFile(absolute, 'utf8')
    const relativePath = relative(projectRoot, absolute).replaceAll('\\', '/')
    checkedFiles.push(relativePath)

    if (/['"]nitropack\/dist\//u.test(content)) {
      violations.push(`${relativePath}: imports a private nitropack/dist/** implementation path`)
    }
  }
}

await walk(sourceRoot)

for (const relativePath of [
  'src/runtime/plugins/express.ts',
  'src/runtime/plugins/koa.ts',
  'src/runtime/plugins/socket.io.ts',
]) {
  const content = await readFile(resolve(projectRoot, relativePath), 'utf8')
  if (!content.includes('from \'nitropack/runtime/plugin\'')) {
    violations.push(`${relativePath}: must use the exported nitropack/runtime/plugin subpath`)
  }
}

if (violations.length > 0) {
  console.error('Nitro public API boundary validation failed:')
  for (const violation of violations)
    console.error(`- ${violation}`)
  process.exit(1)
}

console.log(
  `Nitro public API boundary is clean across ${checkedFiles.length} source files; no nitropack/dist/** imports remain.`,
)
