import fs from 'fs/promises'
import path from 'path'
import fg from 'fast-glob'
import { analyzeProject } from './astScanner.js'
import type { RouteEntry } from './astScanner.js'
import { classifyExport } from './cleanScanner.js'
import { detectDatabase } from './explainScanner.js'
import { FrameworkScanner } from './scanners/FrameworkScanner.js'

export interface MemoryComponent {
  name: string
  file: string
}

export interface CodingStyle {
  quotes: 'single' | 'double' | 'mixed'
  semicolons: boolean
  indent: string
}

export interface NamingConvention {
  componentFiles: string
  generalFiles: string
}

export interface ProjectMemory {
  projectName: string
  description: string
  framework: string | null
  database: string | null
  packageManager: string | null
  folderTree: string
  routes: RouteEntry[]
  apiRoutes: RouteEntry[]
  components: MemoryComponent[]
  hooks: MemoryComponent[]
  codingStyle: CodingStyle
  namingConvention: NamingConvention
}

const IGNORE = ['**/node_modules/**', '**/dist/**', '**/build/**', '**/.next/**', '**/.git/**']

interface PackageJson {
  name?: string
  description?: string
  dependencies?: Record<string, string>
  devDependencies?: Record<string, string>
}

async function readPackageJson(cwd: string): Promise<PackageJson> {
  try {
    const raw = await fs.readFile(path.join(cwd, 'package.json'), 'utf8')
    return JSON.parse(raw)
  } catch {
    return {}
  }
}

export function detectPackageManager(rootFiles: string[]): string | null {
  if (rootFiles.includes('pnpm-lock.yaml')) return 'pnpm'
  if (rootFiles.includes('yarn.lock')) return 'yarn'
  if (rootFiles.includes('bun.lockb')) return 'bun'
  if (rootFiles.includes('package-lock.json')) return 'npm'
  return null
}

async function detectCodingStyle(cwd: string): Promise<CodingStyle> {
  const files = await fg(['**/*.{ts,tsx,js,jsx}'], { cwd, ignore: IGNORE, absolute: true })
  const sample = files.slice(0, 25)

  let single = 0
  let double = 0
  let semi = 0
  let noSemi = 0
  const indentCounts = new Map<string, number>()

  for (const file of sample) {
    let content: string
    try {
      content = await fs.readFile(file, 'utf8')
    } catch {
      continue
    }

    single += (content.match(/'[^'\n]*'/g) ?? []).length
    double += (content.match(/"[^"\n]*"/g) ?? []).length

    for (const line of content.split('\n')) {
      const trimmed = line.trimEnd()
      if (/[)\]\w'"`]\s*$/.test(trimmed) && !trimmed.endsWith('{') && !trimmed.endsWith('(') && trimmed.length > 0) {
        if (trimmed.endsWith(';')) semi++
        else if (/[)\]\w'"`]$/.test(trimmed)) noSemi++
      }

      const match = line.match(/^(\s+)\S/)
      if (match) {
        const indent = match[1].includes('\t') ? 'tabs' : `${match[1].length}-space`
        indentCounts.set(indent, (indentCounts.get(indent) ?? 0) + 1)
      }
    }
  }

  const quotes = single > double * 1.5 ? 'single' : double > single * 1.5 ? 'double' : 'mixed'
  const semicolons = semi >= noSemi

  let indent = '2-space'
  let bestCount = -1
  for (const [key, count] of indentCounts) {
    if (count > bestCount) {
      bestCount = count
      indent = key
    }
  }

  return { quotes, semicolons, indent }
}

async function detectNamingConvention(cwd: string): Promise<NamingConvention> {
  const componentFiles = await fg(['**/components/**/*.{tsx,jsx}', '**/*.component.{tsx,jsx,ts,js}'], {
    cwd, ignore: IGNORE,
  })
  const allFiles = await fg(['**/*.{ts,tsx,js,jsx}'], { cwd, ignore: IGNORE })

  const classify = (files: string[]): string => {
    if (files.length === 0) return 'unknown'
    let pascal = 0
    let kebab = 0
    let camel = 0
    for (const f of files) {
      const base = path.basename(f).replace(/\.(tsx|jsx|ts|js)$/, '')
      if (/^[A-Z][a-zA-Z0-9]*$/.test(base)) pascal++
      else if (/^[a-z0-9]+(-[a-z0-9]+)+$/.test(base)) kebab++
      else if (/^[a-z][a-zA-Z0-9]*$/.test(base)) camel++
    }
    const max = Math.max(pascal, kebab, camel)
    if (max === 0) return 'mixed'
    if (max === pascal) return 'PascalCase'
    if (max === kebab) return 'kebab-case'
    return 'camelCase'
  }

  return {
    componentFiles: classify(componentFiles),
    generalFiles: classify(allFiles),
  }
}

export async function scanMemory(cwd: string): Promise<ProjectMemory> {
  const pkg = await readPackageJson(cwd)
  const deps = { ...(pkg.dependencies ?? {}), ...(pkg.devDependencies ?? {}) }

  const [analysis, frameworkInfo, rootFiles, codingStyle, namingConvention] = await Promise.all([
    analyzeProject(cwd),
    new FrameworkScanner(cwd).scan(),
    fs.readdir(cwd).catch(() => [] as string[]),
    detectCodingStyle(cwd),
    detectNamingConvention(cwd),
  ])

  const database = detectDatabase(deps)
  const packageManager = detectPackageManager(rootFiles)

  const components: MemoryComponent[] = []
  const hooks: MemoryComponent[] = []
  for (const exp of analysis.exports) {
    const kind = classifyExport(exp)
    if (kind === 'component') components.push({ name: exp.name, file: exp.file })
    else if (kind === 'hook') hooks.push({ name: exp.name, file: exp.file })
  }

  const apiRoutes = analysis.routes.filter(r => r.source === 'handler' || /\/api\//.test(r.file))
  const pageRoutes = analysis.routes.filter(r => !apiRoutes.includes(r))

  return {
    projectName: pkg.name ?? path.basename(cwd),
    description: pkg.description ?? '',
    framework: frameworkInfo.name,
    database,
    packageManager,
    folderTree: analysis.folderTree,
    routes: pageRoutes,
    apiRoutes,
    components,
    hooks,
    codingStyle,
    namingConvention,
  }
}
