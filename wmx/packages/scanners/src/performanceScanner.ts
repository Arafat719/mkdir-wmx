import fs from 'fs/promises'
import path from 'path'
import fg from 'fast-glob'

export type PerformanceRecommendation = 'Dynamic Import' | 'Memo' | 'Split' | 'Virtual Scroll'

export interface PerformanceIssue {
  file: string
  lines: number
  recommendations: PerformanceRecommendation[]
}

export interface PerformanceReport {
  issues: PerformanceIssue[]
  threshold: number
}

const IGNORE = ['**/node_modules/**', '**/dist/**', '**/build/**', '**/.next/**', '**/.git/**']
const COMPONENT_EXTS = new Set(['.tsx', '.jsx'])

function looksLikeComponent(content: string): boolean {
  return /return\s*\(?\s*</.test(content) || /<[A-Za-z][\s\S]*\/?>/.test(content)
}

function analyze(content: string, ext: string, lines: number, threshold: number): PerformanceRecommendation[] {
  const recommendations: PerformanceRecommendation[] = []
  const isComponent = COMPONENT_EXTS.has(ext) && looksLikeComponent(content)

  if (lines > threshold) {
    recommendations.push('Split')

    const alreadyLazy = /next\/dynamic|React\.lazy|lazy\s*\(\s*\(\)\s*=>\s*import/.test(content)
    if (!alreadyLazy) recommendations.push('Dynamic Import')
  }

  const minMeaningfulLines = Math.max(20, threshold / 4)

  if (isComponent && lines > minMeaningfulLines) {
    const alreadyMemoized = /React\.memo\s*\(|(?<![a-zA-Z])memo\s*\(/.test(content)
    if (!alreadyMemoized) recommendations.push('Memo')

    const mapsInJsx = /\.map\s*\(\s*(\([^)]*\)|[a-zA-Z_$][\w$]*)\s*=>/.test(content) && /<[A-Za-z]/.test(content)
    const alreadyVirtualized = /react-window|react-virtualized|@tanstack\/react-virtual/.test(content)
    if (mapsInJsx && !alreadyVirtualized && lines > threshold / 2) {
      recommendations.push('Virtual Scroll')
    }
  }

  return recommendations
}

export async function scanPerformance(cwd: string, threshold = 200): Promise<PerformanceReport> {
  const files = await fg(['**/*.{ts,tsx,js,jsx}'], { cwd, ignore: IGNORE, absolute: true })
  const uniqueFiles = Array.from(new Set(files))

  const issues: PerformanceIssue[] = []

  for (const absFile of uniqueFiles) {
    const ext = path.extname(absFile)
    let content: string
    try {
      content = await fs.readFile(absFile, 'utf8')
    } catch {
      continue
    }

    const lines = content.split('\n').length
    const recommendations = analyze(content, ext, lines, threshold)
    if (recommendations.length === 0) continue

    issues.push({
      file: path.relative(cwd, absFile),
      lines,
      recommendations,
    })
  }

  issues.sort((a, b) => b.lines - a.lines)

  return { issues, threshold }
}
