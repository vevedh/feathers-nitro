import { readFile } from 'node:fs/promises'
import { dirname, resolve } from 'node:path'
import process from 'node:process'
import { fileURLToPath } from 'node:url'
import { gunzipSync } from 'node:zlib'

const scriptDirectory = dirname(fileURLToPath(import.meta.url))
const projectRoot = resolve(scriptDirectory, '..')
const packageJson = JSON.parse(await readFile(resolve(projectRoot, 'package.json'), 'utf8'))
const archiveName = `${packageJson.name.replace(/^@/u, '').replace('/', '-')}-${packageJson.version}.tgz`
const archivePath = resolve(projectRoot, '.pack-check', archiveName)

function readTarString(buffer, start, length) {
  return buffer
    .subarray(start, start + length)
    .toString('utf8')
    .replace(/\0.*$/u, '')
}

function readTarSize(buffer, start, length) {
  const raw = readTarString(buffer, start, length).trim()
  return raw ? Number.parseInt(raw, 8) : 0
}

function isZeroBlock(buffer, offset) {
  for (let index = offset; index < offset + 512; index += 1) {
    if (buffer[index] !== 0)
      return false
  }
  return true
}

const compressed = await readFile(archivePath)
const tar = gunzipSync(compressed)
const files = new Map()
let offset = 0

while (offset + 512 <= tar.length && !isZeroBlock(tar, offset)) {
  const name = readTarString(tar, offset, 100)
  const prefix = readTarString(tar, offset + 345, 155)
  const path = prefix ? `${prefix}/${name}` : name
  const size = readTarSize(tar, offset + 124, 12)
  const typeFlag = readTarString(tar, offset + 156, 1) || '0'
  const contentStart = offset + 512

  if (typeFlag === '0')
    files.set(path, tar.subarray(contentStart, contentStart + size))

  offset = contentStart + Math.ceil(size / 512) * 512
}

const exactAllowedFiles = new Set([
  'package/LICENSE',
  'package/README.md',
  'package/package.json',
])
const requiredFiles = [
  ...exactAllowedFiles,
  'package/dist/index.cjs',
  'package/dist/index.mjs',
  'package/dist/index.d.ts',
  'package/dist/runtime/handlers/index.cjs',
  'package/dist/runtime/handlers/index.mjs',
  'package/dist/runtime/handlers/index.d.ts',
  'package/dist/runtime/plugins/index.cjs',
  'package/dist/runtime/plugins/index.mjs',
  'package/dist/runtime/plugins/index.d.ts',
  'package/dist/runtime/routers/index.cjs',
  'package/dist/runtime/routers/index.mjs',
  'package/dist/runtime/routers/index.d.ts',
  'package/dist/runtime/setup.cjs',
  'package/dist/runtime/setup.mjs',
  'package/dist/runtime/setup.d.ts',
]
const errors = []

for (const path of files.keys()) {
  if (!path.startsWith('package/dist/') && !exactAllowedFiles.has(path))
    errors.push(`unexpected npm tarball file: ${path}`)
}

for (const path of requiredFiles) {
  if (!files.has(path))
    errors.push(`missing npm tarball file: ${path}`)
}

const packedManifestContent = files.get('package/package.json')
if (!packedManifestContent) {
  errors.push('packed package.json could not be read')
}
else {
  const packedManifest = JSON.parse(packedManifestContent.toString('utf8'))
  if (packedManifest.name !== packageJson.name)
    errors.push(`packed package name mismatch: ${packedManifest.name ?? 'missing'}`)
  if (packedManifest.version !== packageJson.version)
    errors.push(`packed package version mismatch: ${packedManifest.version ?? 'missing'}`)
  if (JSON.stringify(packedManifest.files) !== JSON.stringify(['dist']))
    errors.push('packed package files whitelist must contain only dist')
}

if (errors.length > 0) {
  console.error(`Packed artifact validation failed for ${archiveName}:`)
  for (const error of errors)
    console.error(`- ${error}`)
  process.exitCode = 1
}
else {
  console.log(
    `Packed artifact is publish-safe: ${archiveName}; ${files.size} files, only dist plus npm metadata.`,
  )
}
