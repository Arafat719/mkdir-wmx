import fs from 'fs/promises'
import path from 'path'
import fg from 'fast-glob'

export interface RefactorSuggestion {
  file: string
  lines: number
  type: 'split-component' | 'large-file'
  suggestedSplits: string[]
  reason: string
}

export interface RefactorReport {
  suggestions: RefactorSuggestion[]
  threshold: number
}

const IGNORE = ['**/node_modules/**', '**/dist/**', '**/build/**', '**/.next/**', '**/.git/**']
const COMPONENT_EXTS = new Set(['.tsx', '.jsx'])
const SOURCE_EXTS = new Set(['.ts', '.tsx', '.js', '.jsx'])

const KEYWORD_MAP: Array<[RegExp, string]> = [
  [/nav(bar)?|navigation/i, 'Navbar'],
  [/sidebar|aside/i, 'Sidebar'],
  [/profile|account/i, 'ProfileMenu'],
  [/notification|alert/i, 'NotificationPanel'],
  [/header/i, 'Header'],
  [/footer/i, 'Footer'],
  [/modal|dialog/i, 'Modal'],
  [/search|filter/i, 'SearchFilter'],
  [/settings/i, 'SettingsPanel'],
  [/chart|graph/i, 'Chart'],
  [/comment/i, 'CommentSection'],
  [/cart/i, 'CartPanel'],
  [/table/i, 'Table'],
  [/pagination/i, 'Pagination'],
  [/breadcrumb/i, 'Breadcrumb'],
  [/tab(s)?\b/i, 'Tabs'],
  [/toolbar/i, 'Toolbar'],
  [/dropdown-menu|hamburger-menu|context-menu/i, 'Menu'],
]

function countLines(content: string): number {
  return content.split('\n').length
}

function looksLikeComponent(content: string): boolean {
  return /return\s*\(?\s*</.test(content) || /<[A-Za-z][\s\S]*\/?>/.test(content)
}

function suggestSplits(content: string): string[] {
  const found = new Set<string>()
  for (const [pattern, name] of KEYWORD_MAP) {
    if (pattern.test(content)) found.add(name)
    if (found.size >= 6) break
  }
  return Array.from(found)
}

export async function scanRefactor(cwd: string, threshold = 200): Promise<RefactorReport> {
  const files = await fg(['src/**/*.{ts,tsx,js,jsx}', '**/*.{ts,tsx,js,jsx}'], {
    cwd,
    ignore: IGNORE,
    absolute: true,
  })

  const uniqueFiles = Array.from(new Set(files))
  const suggestions: RefactorSuggestion[] = []

  for (const absFile of uniqueFiles) {
    const ext = path.extname(absFile)
    if (!SOURCE_EXTS.has(ext)) continue

    let content: string
    try {
      content = await fs.readFile(absFile, 'utf8')
    } catch {
      continue
    }

    const lines = countLines(content)
    if (lines < threshold) continue

    const relFile = path.relative(cwd, absFile)
    const isComponentFile = COMPONENT_EXTS.has(ext) && looksLikeComponent(content)

    if (isComponentFile) {
      const splits = suggestSplits(content)
      if (splits.length >= 2) {
        suggestions.push({
          file: relFile,
          lines,
          type: 'split-component',
          suggestedSplits: splits,
          reason: `This component has ${lines} lines and mixes multiple concerns.`,
        })
        continue
      }
    }

    suggestions.push({
      file: relFile,
      lines,
      type: 'large-file',
      suggestedSplits: [],
      reason: `This file has ${lines} lines — consider splitting it into smaller modules.`,
    })
  }

  suggestions.sort((a, b) => b.lines - a.lines)

  return { suggestions, threshold }
}
