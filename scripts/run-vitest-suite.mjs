import { spawn } from 'node:child_process'
import { dirname, resolve } from 'node:path'
import process from 'node:process'
import { fileURLToPath } from 'node:url'
import { isRetryablePortCollision } from './lib/port-collision.mjs'

const scriptDirectory = dirname(fileURLToPath(import.meta.url))
const projectRoot = resolve(scriptDirectory, '..')
const vitestBin = resolve(projectRoot, 'node_modules/vitest/vitest.mjs')
const maxPortAttempts = 3
const testTimeoutMs = 240_000

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

/**
 * Run one Vitest file in an isolated process while preserving live output.
 *
 * @param {string} testFile Relative test-file path.
 * @returns {Promise<{
 *   status: number | null
 *   signal: NodeJS.Signals | null
 *   stdout: string
 *   stderr: string
 *   error: Error | null
 * }>} Process result.
 */
function runVitestFile(testFile) {
  return new Promise((resolveResult) => {
    const child = spawn(process.execPath, [
      vitestBin,
      'run',
      testFile,
      '--maxWorkers=1',
      '--no-file-parallelism',
    ], {
      cwd: projectRoot,
      env: process.env,
      stdio: ['ignore', 'pipe', 'pipe'],
      windowsHide: true,
    })

    let stdout = ''
    let stderr = ''
    let spawnError = null
    let timedOut = false
    let settled = false

    child.stdout.setEncoding('utf8')
    child.stderr.setEncoding('utf8')

    child.stdout.on('data', (chunk) => {
      stdout += chunk
      process.stdout.write(chunk)
    })

    child.stderr.on('data', (chunk) => {
      stderr += chunk
      process.stderr.write(chunk)
    })

    child.on('error', (error) => {
      spawnError = error
    })

    const timeout = setTimeout(() => {
      timedOut = true
      child.kill('SIGTERM')
    }, testTimeoutMs)

    child.on('close', (status, signal) => {
      if (settled) {
        return
      }

      settled = true
      clearTimeout(timeout)

      const error = timedOut
        ? new Error(`Vitest timed out after ${testTimeoutMs}ms`)
        : spawnError

      resolveResult({
        status,
        signal,
        stdout,
        stderr,
        error,
      })
    })
  })
}

function isSuccessful(result) {
  return !result.error && result.status === 0
}

function hasRetryablePortCollision(result) {
  const output = `${result.stdout}\n${result.stderr}`
  return isRetryablePortCollision(output)
}

let failureCode = 0

for (const testFile of testFiles) {
  let passed = false

  for (let attempt = 1; attempt <= maxPortAttempts; attempt += 1) {
    const attemptSuffix = attempt === 1 ? '' : ` (retry ${attempt}/${maxPortAttempts})`
    console.log(`[vitest] ${testFile}${attemptSuffix}`)

    const result = await runVitestFile(testFile)

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
