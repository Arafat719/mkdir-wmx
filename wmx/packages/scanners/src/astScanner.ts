import fs from 'fs/promises'
import path from 'path'
import fg from 'fast-glob'

export interface RouteEntry {
  method: string
  path: string
  file: string
  line: number
}

export interface ImportEntry {
  from: string
  to: string
}

export interface ExportEntry {
  name: string
  file: string
  type: 'function' | 'class' | 'const' | 'type'
}

export interface AnalysisResult {
  folderTree: string
  routes: RouteEntry[]
  imports: ImportEntry[]
  exports: ExportEntry[]
}

const IGNORE_DIRS = new Set([
  'node_modules', '.git', 'dist', 'build', '.next', '.wmx', 'coverage'
])

async function buildTree(
  dir: string,
  prefix: string,
  depth: number,
  maxDepth: number
): Promise<string> {
  if (depth > maxDepth) return ''

  let entries: string[]
  try {
    entries = await fs.readdir(dir)
  } catch {
    return ''
  }

  const filtered = entries.filter(e => !IGNORE_DIRS.has(e) && !e.startsWith('.'))
  filtered.sort()

  const lines: string[] = []

  for (let i = 0; i < filtered.length; i++) {
    const entry     = filtered[i]
    const isLast    = i === filtered.length - 1
    const connector = isLast ? '└── ' : '├── '
    const childPfx  = isLast ? '    ' : '│   '

    const fullPath = path.join(dir, entry)
    let stat: Awaited<ReturnType<typeof fs.stat>>
    try {
      stat = await fs.stat(fullPath)
    } catch {
      continue
    }

    if (stat.isDirectory()) {
      lines.push(prefix + connector + entry + '/')
      const subtree = await buildTree(fullPath, prefix + childPfx, depth + 1, maxDepth)
      if (subtree) lines.push(subtree)
    } else {
      lines.push(prefix + connector + entry)
    }
  }

  return lines.join('\n')
}

async function getFolderTree(cwd: string, maxDepth = 4): Promise<string> {
  const rootName = path.basename(cwd)
  const tree     = await buildTree(cwd, '', 1, maxDepth)
  return rootName + '/\n' + tree
}

async function scanRoutes(cwd: string): Promise<RouteEntry[]> {
  const files = await fg(['**/*.{ts,js}'], {
    cwd,
    ignore: ['**/node_modules/**', '**/dist/**', '**/build/**', '**/.next/**'],
    absolute: true
  })

  const routes: RouteEntry[] = []
  const expressPattern = /\b(app|router)\.(get|post|put|delete|patch)\s*\(\s*['"`]([^'"`]+)['"`]/g

  for (const file of files) {
    const relFile = path.relative(cwd, file)
    const normalised = relFile.replace(/\\/g, '/')

    if (normalised.includes('app/') || normalised.includes('pages/')) {
      const isRouteFile = /\/(page|route|layout)\.(tsx?|jsx?)$/.test(normalised)
      if (isRouteFile) {
        const routePath = normalised
          .replace(/^.*?(?:app|pages)\//, '/')
          .replace(/\/(page|route|layout)\.(tsx?|jsx?)$/, '')
          .replace(/\/index$/, '')
          || '/'
        routes.push({ method: 'GET', path: routePath, file: relFile, line: 1 })
      }
    }

    let content: string
    try {
      content = await fs.readFile(file, 'utf8')
    } catch {
      continue
    }

    const lines = content.split('\n')
    for (let i = 0; i < lines.length; i++) {
      let match: RegExpExecArray | null
      expressPattern.lastIndex = 0
      const lineText = lines[i]
      while ((match = expressPattern.exec(lineText)) !== null) {
        routes.push({
          method: match[2].toUpperCase(),
          path:   match[3],
          file:   relFile,
          line:   i + 1
        })
      }
    }
  }

  return routes
}

async function scanImports(cwd: string): Promise<ImportEntry[]> {
  const files = await fg(['**/*.{ts,tsx,js,jsx}'], {
    cwd,
    ignore: ['**/node_modules/**', '**/dist/**', '**/build/**'],
    absolute: true
  })

  const imports: ImportEntry[] = []
  const importPattern  = /import\s+(?:.*?\s+from\s+)?['"`]([^'"`]+)['"`]/g
  const requirePattern = /require\s*\(\s*['"`]([^'"`]+)['"`]\s*\)/g

  for (const file of files) {
    const relFile = path.relative(cwd, file)
    let content: string
    try {
      content = await fs.readFile(file, 'utf8')
    } catch {
      continue
    }

    for (const pattern of [importPattern, requirePattern]) {
      pattern.lastIndex = 0
      let match: RegExpExecArray | null
      while ((match = pattern.exec(content)) !== null) {
        imports.push({ from: relFile, to: match[1] })
      }
    }
  }

  return imports
}

async function scanExports(cwd: string): Promise<ExportEntry[]> {
  const files = await fg(['**/*.{ts,tsx,js,jsx}'], {
    cwd,
    ignore: ['**/node_modules/**', '**/dist/**', '**/build/**'],
    absolute: true
  })

  const exports: ExportEntry[] = []

  const patterns: Array<{ regex: RegExp; type: ExportEntry['type'] }> = [
    { regex: /export\s+(?:async\s+)?function\s+(\w+)/g,  type: 'function' },
    { regex: /export\s+class\s+(\w+)/g,                  type: 'class'    },
    { regex: /export\s+(?:const|let|var)\s+(\w+)/g,      type: 'const'    },
    { regex: /export\s+type\s+(\w+)/g,                   type: 'type'     }
  ]

  for (const file of files) {
    const relFile = path.relative(cwd, file)
    let content: string
    try {
      content = await fs.readFile(file, 'utf8')
    } catch {
      continue
    }

    for (const { regex, type } of patterns) {
      regex.lastIndex = 0
      let match: RegExpExecArray | null
      while ((match = regex.exec(content)) !== null) {
        exports.push({ name: match[1], file: relFile, type })
      }
    }
  }

  return exports
}

export async function analyzeProject(cwd: string): Promise<AnalysisResult> {
  const [folderTree, routes, imports, exports] = await Promise.all([
    getFolderTree(cwd, 4),
    scanRoutes(cwd),
    scanImports(cwd),
    scanExports(cwd)
  ])

  return { folderTree, routes, imports, exports }
}
