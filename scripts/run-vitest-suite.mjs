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
const defaultIntegrationConcurrency = 4
const maxIntegrationConcurrency = 4

const fastUnitTestFiles = [
  'test/manager.test.ts',
  'test/setup-integration.test.ts',
]

// Patch022 r1p keeps the r1o 6 -> 3 consolidation and places the showcase in
// the same isolated-process build wave. Every Nuxt test still owns its own
// build directory, server process and random port; only wall-clock scheduling
// changes.
const nuxtBuildTestFiles = [
  'test/express.test.ts',
  'test/koa.test.ts',
  'test/socket.io.test.ts',
  'test/playground-showcase.test.ts',
]

function resolveIntegrationConcurrency() {
  const configured = process.env.FEATHERS_NITRO_TEST_CONCURRENCY
  if (!configured)
    return defaultIntegrationConcurrency

  const parsed = Number.parseInt(configured, 10)
  if (!Number.isInteger(parsed) || parsed < 1 || parsed > maxIntegrationConcurrency) {
    throw new Error(
      `FEATHERS_NITRO_TEST_CONCURRENCY must be an integer between 1 and ${maxIntegrationConcurrency}; received ${configured}`,
    )
  }

  return parsed
}

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
      if (settled)
        return

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

async function runVitestFileWithRetry(testFile) {
  for (let attempt = 1; attempt <= maxPortAttempts; attempt += 1) {
    const attemptSuffix = attempt === 1 ? '' : ` (retry ${attempt}/${maxPortAttempts})`
    console.log(`[vitest] ${testFile}${attemptSuffix}`)

    const result = await runVitestFile(testFile)

    if (isSuccessful(result))
      return 0

    if (result.error)
      console.error(`[vitest] ${testFile} failed: ${result.error.message}`)

    const canRetry = attempt < maxPortAttempts && hasRetryablePortCollision(result)
    if (canRetry) {
      console.warn(`[vitest] transient port collision detected for ${testFile}; retrying with a fresh test server`)
      continue
    }

    return result.status ?? 1
  }

  return 1
}

async function runSequential(testFiles) {
  for (const testFile of testFiles) {
    const failureCode = await runVitestFileWithRetry(testFile)
    if (failureCode !== 0)
      return failureCode
  }

  return 0
}

async function runConcurrent(testFiles, concurrency) {
  let cursor = 0
  let failureCode = 0

  async function worker() {
    while (failureCode === 0) {
      const index = cursor
      cursor += 1

      if (index >= testFiles.length)
        return

      const testFile = testFiles[index]
      const resultCode = await runVitestFileWithRetry(testFile)
      if (resultCode !== 0)
        failureCode = resultCode
    }
  }

  const workerCount = Math.min(concurrency, testFiles.length)
  console.log(`[vitest] running ${testFiles.length} isolated Nuxt build tests in one wave with concurrency=${workerCount}`)
  await Promise.all(Array.from({ length: workerCount }, () => worker()))

  return failureCode
}

let failureCode = await runSequential(fastUnitTestFiles)

if (failureCode === 0) {
  const integrationConcurrency = resolveIntegrationConcurrency()
  failureCode = await runConcurrent(nuxtBuildTestFiles, integrationConcurrency)
}

if (failureCode !== 0)
  process.exitCode = failureCode
