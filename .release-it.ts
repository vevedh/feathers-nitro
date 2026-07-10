export default {
  git: {
    commitMessage: 'chore(release): v${version}',
    tagName: 'v${version}',
    requireBranch: 'main',
    requireCleanWorkingDir: true,
    push: true,
  },
  github: {
    release: true,
  },
  npm: {
    publish: true,
  },
}
