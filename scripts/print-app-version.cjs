const path = require('node:path')
const { resolveAppVersion } = require('./app-version.cjs')

const rootDir = path.resolve(__dirname, '..')
const pkg = require(path.join(rootDir, 'package.json'))

process.stdout.write(resolveAppVersion(pkg.version))
