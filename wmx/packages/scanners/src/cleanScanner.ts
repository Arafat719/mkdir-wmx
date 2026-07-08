import fs from 'fs/promises'
import path from 'path'
import fg from 'fast-glob'
import { analyzeProject } from './astScanner.js'
import type { ExportEntry, ImportEntry } from './astScanner.js'

export interface CleanEntry {
  file: string
  name?: string
}

export interface CleanReport {
  components: CleanEntry[]
  hooks: CleanEntry[]
  css: CleanEntry[]
  fonts: CleanEntry[]
  icons: CleanEntry[]
  images: CleanEntry[]
  pages: CleanEntry[]
}

const IGNORE = ['**/node_modules/**', '**/dist/**', '**/build/**', '**/.next/**', '**/.git/**', '**/.wmx/**']

const CSS_EXTS = new Set(['.css', '.scss', '.sass', '.less'])
const FONT_EXTS = new Set(['.ttf', '.woff', '.woff2', '.eot', '.otf'])
const IMAGE_EXTS = new Set(['.png', '.jpg', '.jpeg', '.gif', '.webp', '.bmp'])
const SKIP_EXPORT_NAMES = new Set(['default', '_'])

function resolveRelativeImport(fromFile: string, to: string): string | null {
  if (!to.startsWith('.')) return null
  const fromDir = path.posix.dirname(fromFile.replace(/\\/g, '/'))
  return path.posix.normalize(path.posix.join(fromDir, to))
}

function isFileImported(exportFile: string, imports: ImportEntry[]): boolean {
  const normalised = exportFile.replace(/\\/g, '/').replace(/\.(ts|tsx|js|jsx)$/, '')
  const normalisedNoIndex = normalised.replace(/\/index$/, '')
  return imports.some(({ from, to }) => {
    const resolved = resolveRelativeImport(from, to)
    if (!resolved) return false
    return resolved === normalised || resolved === normalisedNoIndex
  })
}

function isAssetReferenced(assetFile: string, imports: ImportEntry[]): boolean {
  const normalised = assetFile.replace(/\\/g, '/')
  return imports.some(({ from, to }) => resolveRelativeImport(from, to) === normalised)
}

export function classifyExport(exp: ExportEntry): 'component' | 'hook' | null {
  if (SKIP_EXPORT_NAMES.has(exp.name) || exp.name.startsWith('__')) return null
  if (exp.type !== 'function' && exp.type !== 'const') return null

  if (/^use[A-Z]/.test(exp.name)) return 'hook'

  const normFile = exp.file.replace(/\\/g, '/')
  const isPascalName = /^[A-Z]/.test(exp.name)
  const inComponentsDir = /(^|\/)components?(\/|$)/i.test(normFile)
  const isComponentExt = /\.(tsx|jsx)$/.test(normFile)

  if (isPascalName && (inComponentsDir || isComponentExt)) return 'component'
  return null
}

function isPageFile(relFile: string): boolean {
  const normalised = relFile.replace(/\\/g, '/')
  if (/\/(page|route|layout)\.(tsx?|jsx?)$/.test(normalised)) return true
  if (/^(src\/)?pages\//.test(normalised) && !/\/(_app|_document|api)\//.test(normalised)) return true
  return false
}

function routePathFor(relFile: string): string | null {
  const normalised = relFile.replace(/\\/g, '/')
  const route = normalised
    .replace(/^(src\/)?(app|pages)\//, '/')
    .replace(/\/(page|route|layout)\.(tsx?|jsx?)$/, '')
    .replace(/\.(tsx?|jsx?)$/, '')
    .replace(/\/index$/, '')
  return route || '/'
}

async function walkFiles(cwd: string): Promise<string[]> {
  return fg(['**/*'], { cwd, ignore: IGNORE, onlyFiles: true, dot: false })
}

export async function scanClean(cwd: string): Promise<CleanReport> {
  const [analysis, allFiles] = await Promise.all([
    analyzeProject(cwd),
    walkFiles(cwd),
  ])

  const imports = analysis.imports

  const components: CleanEntry[] = []
  const hooks: CleanEntry[] = []
  for (const exp of analysis.exports) {
    const kind = classifyExport(exp)
    if (!kind) continue
    if (isFileImported(exp.file, imports)) continue
    const entry = { file: exp.file, name: exp.name }
    if (kind === 'component') components.push(entry)
    else hooks.push(entry)
  }

  const css: CleanEntry[] = []
  const fonts: CleanEntry[] = []
  const icons: CleanEntry[] = []
  const images: CleanEntry[] = []

  for (const relFile of allFiles) {
    const ext = path.extname(relFile).toLowerCase()
    const base = path.basename(relFile).toLowerCase()
    const normalised = relFile.replace(/\\/g, '/')

    if (CSS_EXTS.has(ext)) {
      if (!isAssetReferenced(relFile, imports)) css.push({ file: relFile })
      continue
    }
    if (FONT_EXTS.has(ext)) {
      if (!isAssetReferenced(relFile, imports)) fonts.push({ file: relFile })
      continue
    }
    if (ext === '.svg' && (base.includes('icon') || normalised.includes('/icons/'))) {
      if (!isAssetReferenced(relFile, imports)) icons.push({ file: relFile })
      continue
    }
    if (IMAGE_EXTS.has(ext)) {
      if (!isAssetReferenced(relFile, imports)) images.push({ file: relFile })
      continue
    }
  }

  const pageFiles = allFiles.filter(isPageFile)
  const codeFiles = allFiles.filter(f => /\.(ts|tsx|js|jsx)$/.test(f))
  const pages: CleanEntry[] = []

  if (pageFiles.length > 1) {
    const fileContents = new Map<string, string>()
    for (const relFile of codeFiles) {
      try {
        fileContents.set(relFile, await fs.readFile(path.join(cwd, relFile), 'utf8'))
      } catch {
        // skip unreadable file
      }
    }

    for (const pageFile of pageFiles) {
      const route = routePathFor(pageFile)
      if (!route || route === '/') continue

      let referenced = false
      for (const [otherFile, content] of fileContents) {
        if (otherFile === pageFile) continue
        if (content.includes(`"${route}"`) || content.includes(`'${route}'`) || content.includes(`\`${route}\``)) {
          referenced = true
          break
        }
      }

      if (!referenced) pages.push({ file: pageFile, name: route })
    }
  }

  return { components, hooks, css, fonts, icons, images, pages }
}
