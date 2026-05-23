import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { execSync } from 'node:child_process'

const readGitValue = (command, fallback = '') => {
  try {
    return execSync(command, { stdio: ['ignore', 'pipe', 'ignore'] }).toString().trim() || fallback
  } catch {
    return fallback
  }
}

const deployCommit = process.env.CF_PAGES_COMMIT_SHA || readGitValue('git rev-parse HEAD', 'dev')
const deployBuildTime = process.env.CF_PAGES_COMMIT_TIME || readGitValue('git show -s --format=%cI HEAD', new Date().toISOString())

// https://vite.dev/config/
export default defineConfig({
  base: './',
  plugins: [react()],
  define: {
    'import.meta.env.VITE_DEPLOY_COMMIT': JSON.stringify(deployCommit),
    'import.meta.env.VITE_DEPLOY_BUILD_TIME': JSON.stringify(deployBuildTime),
  },
})
