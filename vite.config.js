import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { execSync } from 'node:child_process'
import { readFileSync } from 'node:fs'
import { createRequire } from 'node:module'

const require = createRequire(import.meta.url)
const pkg = JSON.parse(readFileSync(new URL('./package.json', import.meta.url), 'utf8'))
const { resolveAppVersion } = require('./scripts/app-version.cjs')

const readGitValue = (command, fallback = '') => {
  try {
    return execSync(command, { stdio: ['ignore', 'pipe', 'ignore'] }).toString().trim() || fallback
  } catch {
    return fallback
  }
}

const deployCommit = process.env.CF_PAGES_COMMIT_SHA || readGitValue('git rev-parse HEAD', 'dev')
const deployBuildTime = process.env.CF_PAGES_COMMIT_TIME || readGitValue('git show -s --format=%cI HEAD', new Date().toISOString())
const appVersion = resolveAppVersion(pkg.version)

// https://vite.dev/config/
export default defineConfig({
  base: './',
  plugins: [react()],
  define: {
    'import.meta.env.VITE_DEPLOY_COMMIT': JSON.stringify(deployCommit),
    'import.meta.env.VITE_DEPLOY_BUILD_TIME': JSON.stringify(deployBuildTime),
    'import.meta.env.VITE_APP_VERSION': JSON.stringify(appVersion),
  },
})
