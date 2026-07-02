import fs from 'fs/promises'
import path from 'path'
import { analyzeProject } from './astScanner.js'
import { classifyExport } from './cleanScanner.js'

export interface ComponentNode {
  name: string
  file: string
}

export interface ComponentEdge {
  from: string
  to: string
}

export interface ComponentGraph {
  nodes: ComponentNode[]
  edges: ComponentEdge[]
}

const RESOLVE_EXTS = ['.tsx', '.ts', '.jsx', '.js']

async function fileExists(p: string): Promise<boolean> {
  try {
    await fs.access(p)
    return true
  } catch {
    return false
  }
}

async function resolveImportTarget(cwd: string, fromFile: string, to: string): Promise<string | null> {
  if (!to.startsWith('.')) return null

  const importerDir = path.dirname(path.join(cwd, fromFile))
  const base = path.resolve(importerDir, to)

  const candidates = [
    base,
    ...RESOLVE_EXTS.map(ext => base + ext),
    ...RESOLVE_EXTS.map(ext => path.join(base, 'index' + ext)),
  ]

  for (const candidate of candidates) {
    if (await fileExists(candidate)) {
      return path.relative(cwd, candidate)
    }
  }
  return null
}

export async function scanGraph(cwd: string): Promise<ComponentGraph> {
  const analysis = await analyzeProject(cwd)

  const fileToComponent = new Map<string, string>()
  for (const exp of analysis.exports) {
    if (fileToComponent.has(exp.file)) continue
    if (classifyExport(exp) === 'component') {
      fileToComponent.set(exp.file, exp.name)
    }
  }

  const nodes: ComponentNode[] = Array.from(fileToComponent.entries()).map(([file, name]) => ({ name, file }))
  const edgeSet = new Set<string>()
  const edges: ComponentEdge[] = []

  for (const imp of analysis.imports) {
    const fromComponent = fileToComponent.get(imp.from)
    if (!fromComponent) continue

    const resolved = await resolveImportTarget(cwd, imp.from, imp.to)
    if (!resolved) continue

    const toComponent = fileToComponent.get(resolved)
    if (!toComponent || toComponent === fromComponent) continue

    const key = `${fromComponent}->${toComponent}`
    if (edgeSet.has(key)) continue
    edgeSet.add(key)
    edges.push({ from: fromComponent, to: toComponent })
  }

  return { nodes, edges }
}
