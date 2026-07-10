import { spawnSync } from 'node:child_process'
import { dirname, resolve } from 'node:path'
import process from 'node:process'
import { fileURLToPath } from 'node:url'
import { isRetryablePortCollision } from './lib/port-collision.mjs'

const scriptDirectory = dirname(fileURLToPath(import.meta.url))
const projectRoot = resolve(scriptDirectory, '..')
const vitestBin = resolve(projectRoot, 'node_modules/vitest/vitest.mjs')
const maxPortAttempts = 3

const testFiles = [
  'test/manager.test.ts',
  'test/setup-integration.test.ts',
  'test/express-path.test.ts',
  'test/express.test.ts',
  'test/koa-path.test.ts',
  'test/koa.test.ts',
  'test/socket.io-path.test.ts',
  'test/socket.io.test.ts',
]

function runVitestFile(testFile) {
  return spawnSync(process.execPath, [
    vitestBin,
    'run',
    testFile,
    '--maxWorkers=1',
    '--minWorkers=1',
  ], {
    cwd: projectRoot,
    encoding: 'utf8',
    env: process.env,
    maxBuffer: 32 * 1024 * 1024,
    timeout: 180_000,
  })
}

function writeResult(result) {
  if (result.stdout) {
    process.stdout.write(result.stdout)
  }
  if (result.stderr) {
    process.stderr.write(result.stderr)
  }
}

function isSuccessful(result) {
  return !result.error && result.status === 0
}

function hasRetryablePortCollision(result) {
  const output = `${result.stdout ?? ''}\n${result.stderr ?? ''}`
  return isRetryablePortCollision(output)
}

let failureCode = 0

for (const testFile of testFiles) {
  let passed = false

  for (let attempt = 1; attempt <= maxPortAttempts; attempt += 1) {
    const attemptSuffix = attempt === 1 ? '' : ` (retry ${attempt}/${maxPortAttempts})`
    console.log(`[vitest] ${testFile}${attemptSuffix}`)

    const result = runVitestFile(testFile)
    writeResult(result)

    if (isSuccessful(result)) {
      passed = true
      break
    }

    if (result.error) {
      console.error(`[vitest] ${testFile} failed: ${result.error.message}`)
    }

    const canRetry = attempt < maxPortAttempts && hasRetryablePortCollision(result)
    if (canRetry) {
      console.warn(`[vitest] transient port collision detected for ${testFile}; retrying with a fresh test server`)
      continue
    }

    failureCode = result.status ?? 1
    break
  }

  if (!passed) {
    break
  }
}

if (failureCode !== 0) {
  process.exitCode = failureCode
}
