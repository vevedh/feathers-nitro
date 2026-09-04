import { spawn } from 'node:child_process'
import { mkdir } from 'node:fs/promises'
import { homedir } from 'node:os'
import { join } from 'node:path'
import process from 'node:process'

const PNPM_VERSION = '10.34.5'
const projectRoot = process.cwd()
const homeDirectory = process.env.HOME || homedir()
const pnpmPrefix = join(homeDirectory, '.local')
const pnpmBinary = join(pnpmPrefix, 'bin', 'pnpm')
const pnpmRuntimeFlags = [
  '--config.manage-package-manager-versions=false',
  '--ignore-pnpmfile',
]
const requiredModulesDirectories = [
  join(projectRoot, 'node_modules'),
  join(projectRoot, 'playground', 'feathers-api', 'node_modules'),
  join(projectRoot, 'playground', 'nuxt-app', 'node_modules'),
]

const commands = [
  {
    command: 'npm',
    args: ['install', '--global', '--prefix', pnpmPrefix, `pnpm@${PNPM_VERSION}`],
  },
  {
    command: pnpmBinary,
    args: [
      ...pnpmRuntimeFlags,
      'install',
      '--frozen-lockfile',
      '--config.ignore-lockfile-settings-checks=true',
    ],
  },
  {
    command: pnpmBinary,
    args: [...pnpmRuntimeFlags, '--filter', 'nuxt-app', 'dev'],
  },
]

function formatCommand(command, args) {
  return [command, ...args].map((value) => JSON.stringify(value)).join(' ')
}

async function run(command, args) {
  if (process.env.STACKBLITZ_BOOTSTRAP_DRY_RUN === '1') {
    console.log(formatCommand(command, args))
    return
  }

  await new Promise((resolvePromise, rejectPromise) => {
    const child = spawn(command, args, {
      cwd: projectRoot,
      env: process.env,
      stdio: 'inherit',
    })

    child.once('error', rejectPromise)
    child.once('exit', (code, signal) => {
      if (code === 0) {
        resolvePromise()
        return
      }

      const detail = signal ? `signal ${signal}` : `exit code ${code ?? 'unknown'}`
      rejectPromise(new Error(`${command} failed with ${detail}`))
    })
  })
}

if (process.env.STACKBLITZ_BOOTSTRAP_DRY_RUN !== '1') {
  await mkdir(pnpmPrefix, { recursive: true })
  for (const modulesDirectory of requiredModulesDirectories) {
    await mkdir(modulesDirectory, { recursive: true })
  }
}

for (const { command, args } of commands) {
  await run(command, args)
}
