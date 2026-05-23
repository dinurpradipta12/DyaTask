const fs = require('node:fs')
const path = require('node:path')
const { execSync } = require('node:child_process')

const rootDir = path.resolve(__dirname, '..')
const pkg = require(path.join(rootDir, 'package.json'))

const readGitValue = (command, fallback = '') => {
  try {
    return execSync(command, {
      cwd: rootDir,
      stdio: ['ignore', 'pipe', 'ignore']
    }).toString().trim() || fallback
  } catch {
    return fallback
  }
}

const commit = process.env.CF_PAGES_COMMIT_SHA || readGitValue('git rev-parse HEAD', 'dev')
const branch = process.env.CF_PAGES_BRANCH || readGitValue('git rev-parse --abbrev-ref HEAD', 'local')
const buildTime = process.env.CF_PAGES_COMMIT_TIME || readGitValue('git show -s --format=%cI HEAD', new Date().toISOString())

const deployVersion = {
  app: 'dyatask-manager',
  version: pkg.version,
  commit,
  shortCommit: commit.slice(0, 7),
  branch,
  buildTime,
  buildId: commit,
  source: 'github-cloudflare'
}

const outputPath = path.join(rootDir, 'public', 'deploy-version.json')
fs.writeFileSync(outputPath, `${JSON.stringify(deployVersion, null, 2)}\n`)
console.log(`Generated ${path.relative(rootDir, outputPath)} for ${deployVersion.shortCommit}`)
