import fs from 'fs/promises'
import path from 'path'

export interface ArchitectureResult {
  appName: string
  root: string
  modules: string[]
}

const CANDIDATE_ROOTS = [
  'src/features',
  'src/modules',
  'app',
  'src/app',
  'pages',
  'src/pages',
  'src',
]

const EXCLUDE_DIRS = new Set([
  'components', 'component', 'hooks', 'hook', 'lib', 'libs', 'utils', 'util',
  'styles', 'style', 'assets', 'public', 'static', 'types', 'type', 'config',
  'constants', 'store', 'stores', 'context', 'contexts', 'services', 'service',
  'middleware', 'middlewares', 'node_modules', '__tests__', 'test', 'tests',
  'api', 'helpers', 'helper', '.git', 'dist', 'build', '.next', 'fonts',
  'images', 'icons', 'layouts',
])

function toModuleName(dirName: string): string {
  return dirName
    .replace(/[-_]+/g, ' ')
    .split(' ')
    .filter(Boolean)
    .map(w => w[0].toUpperCase() + w.slice(1))
    .join(' ')
}

async function listSubdirs(absDir: string): Promise<string[]> {
  let entries: Array<{ name: string; isDirectory: () => boolean }>
  try {
    entries = await fs.readdir(absDir, { withFileTypes: true })
  } catch {
    return []
  }
  return entries
    .filter(e => e.isDirectory())
    .map(e => e.name)
    .filter(name => !name.startsWith('.') && !name.startsWith('[') && !name.startsWith('_'))
    .filter(name => !EXCLUDE_DIRS.has(name.toLowerCase()))
}

async function readAppName(cwd: string): Promise<string> {
  try {
    const raw = await fs.readFile(path.join(cwd, 'package.json'), 'utf8')
    const pkg = JSON.parse(raw)
    if (typeof pkg.name === 'string' && pkg.name.length > 0) return pkg.name
  } catch {
    // ignore
  }
  return path.basename(cwd)
}

export async function scanArchitecture(cwd: string): Promise<ArchitectureResult> {
  const appName = await readAppName(cwd)

  for (const candidate of CANDIDATE_ROOTS) {
    const absDir = path.join(cwd, candidate)
    const subdirs = await listSubdirs(absDir)
    if (subdirs.length > 0) {
      const modules = subdirs.sort().map(toModuleName)
      return { appName, root: candidate, modules }
    }
  }

  return { appName, root: '', modules: [] }
}
