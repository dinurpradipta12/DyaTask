const { execSync } = require('node:child_process')

const readGitValue = (command, fallback = '') => {
  try {
    return execSync(command, {
      stdio: ['ignore', 'pipe', 'ignore']
    }).toString().trim() || fallback
  } catch {
    return fallback
  }
}

const resolveAppVersion = (packageVersion = '0.0.0') => {
  const [major = '0', minor = '1'] = String(packageVersion || '0.0.0').split('.')
  const commitCount = Number(readGitValue('git rev-list --count HEAD', '0'))
  const fallbackPatch = Math.floor(Date.now() / 1000)
  const patch = commitCount > 0 ? commitCount : fallbackPatch
  return `${major}.${minor === '0' ? '1' : minor}.${patch}`
}

module.exports = {
  resolveAppVersion
}
