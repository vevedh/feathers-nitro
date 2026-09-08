import { existsSync } from 'node:fs'
import { dirname, resolve } from 'node:path'
import process from 'node:process'

function findWorkspaceRoot(startDirectory: string): string {
  let currentDirectory = resolve(startDirectory)

  while (true) {
    if (existsSync(resolve(currentDirectory, 'pnpm-workspace.yaml')))
      return currentDirectory

    const parentDirectory = dirname(currentDirectory)
    if (parentDirectory === currentDirectory) {
      throw new Error(
        `Unable to locate the playground workspace root from ${startDirectory}`,
      )
    }

    currentDirectory = parentDirectory
  }
}

export function configureEmbeddedFeathersEnvironment(): void {
  const workspaceRoot = findWorkspaceRoot(process.cwd())
  const configDirectory = resolve(workspaceRoot, 'playground/nuxt-app/config')
  const publicDirectory = resolve(workspaceRoot, 'playground/feathers-api/public')

  process.env.NODE_CONFIG_DIR ??= configDirectory
  process.env.NODE_CONFIG ??= JSON.stringify({ public: publicDirectory })
}
