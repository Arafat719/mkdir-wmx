import fs from 'fs/promises'
import path from 'path'
import fg from 'fast-glob'

export interface ProjectStats {
  totalFiles: number
  totalLines: number
  sourceFiles: number
  sourceLines: number
  components: number
  pages: number
  routes: number
  apiEndpoints: number
  assets: {
    images: number
    fonts: number
    svgs: number
  }
  dependencies: {
    total: number
    dev: number
    prod: number
  }
  largestFile: {
    path: string
    lines: number
  }
  fileTypes: {
    ts: number
    tsx: number
    js: number
    jsx: number
    css: number
    other: number
  }
}

async function countLines(filePath: string): Promise<number> {
  try {
    const content = await fs.readFile(filePath, 'utf8')
    return content.split('\n').length
  } catch {
    return 0
  }
}

async function readPackageJson(cwd: string): Promise<{ prod: number; dev: number; total: number }> {
  try {
    const raw = await fs.readFile(path.join(cwd, 'package.json'), 'utf8')
    const pkg = JSON.parse(raw)
    const prod = Object.keys(pkg.dependencies ?? {}).length
    const dev  = Object.keys(pkg.devDependencies ?? {}).length
    return { prod, dev, total: prod + dev }
  } catch {
    return { prod: 0, dev: 0, total: 0 }
  }
}

export async function scanStats(cwd: string): Promise<ProjectStats> {
  const allFiles = await fg(['**/*'], {
    cwd,
    dot: true,
    ignore: [
      '**/node_modules/**',
      '**/.git/**',
      '**/dist/**',
      '**/build/**',
      '**/.next/**',
      '**/*.lock'
    ],
    onlyFiles: true
  })

  const sourceExtensions = new Set(['.ts', '.tsx', '.js', '.jsx'])
  const imageExtensions  = new Set(['.png', '.jpg', '.jpeg', '.gif', '.webp'])
  const fontExtensions   = new Set(['.ttf', '.woff', '.woff2'])

  let totalLines   = 0
  let sourceLines  = 0
  let sourceFiles  = 0
  let components   = 0
  let pages        = 0
  let routes       = 0
  let images       = 0
  let fonts        = 0
  let svgs         = 0

  const fileTypes = { ts: 0, tsx: 0, js: 0, jsx: 0, css: 0, other: 0 }

  let largestFile = { path: '', lines: 0 }

  for (const relFile of allFiles) {
    const absFile = path.join(cwd, relFile)
    const ext     = path.extname(relFile).toLowerCase()
    const base    = path.basename(relFile).toLowerCase()
    const dirParts = relFile.split('/')

    if (imageExtensions.has(ext)) { images++; continue }
    if (fontExtensions.has(ext))  { fonts++;  continue }
    if (ext === '.svg')            { svgs++;   continue }

    if      (ext === '.ts')  fileTypes.ts++
    else if (ext === '.tsx') fileTypes.tsx++
    else if (ext === '.js')  fileTypes.js++
    else if (ext === '.jsx') fileTypes.jsx++
    else if (ext === '.css') fileTypes.css++
    else                     fileTypes.other++

    const lineCount = await countLines(absFile)
    totalLines += lineCount

    if (lineCount > largestFile.lines) {
      largestFile = { path: relFile, lines: lineCount }
    }

    if (sourceExtensions.has(ext)) {
      sourceFiles++
      sourceLines += lineCount

      const inComponentsDir = dirParts.some(p => p.toLowerCase() === 'components')
      const isComponentFile = /\.component\.(ts|tsx|js|jsx)$/.test(base)
      if (inComponentsDir || isComponentFile) components++

      const inPagesDir = dirParts.some(p => p.toLowerCase() === 'pages')
      const inAppDir   = dirParts.some(p => p.toLowerCase() === 'app')
      const isPageFile = /^(page|route|index)\.(tsx|jsx|ts|js)$/.test(base)
      if ((inPagesDir || inAppDir) && isPageFile) pages++

      try {
        const content = await fs.readFile(absFile, 'utf8')
        const routePattern = /\b(router|app)\.(get|post|put|delete|patch)\s*\(/gm
        const matches = content.match(routePattern)
        if (matches) routes += matches.length
      } catch {
        // skip
      }
    }
  }

  const dependencies = await readPackageJson(cwd)

  return {
    totalFiles:  allFiles.length,
    totalLines,
    sourceFiles,
    sourceLines,
    components,
    pages,
    routes,
    apiEndpoints: routes,
    assets: { images, fonts, svgs },
    dependencies,
    largestFile,
    fileTypes
  }
}
