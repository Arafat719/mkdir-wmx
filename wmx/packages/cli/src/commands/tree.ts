import type { Command } from 'commander'
import { readdirSync, statSync } from 'fs'
import { join } from 'path'

function colorize(text: string, code: number): string {
  return `\x1b[${code}m${text}\x1b[0m`
}

const white = (t: string) => colorize(t, 97)
const bold  = (t: string) => colorize(t, 1)
const cyan  = (t: string) => colorize(t, 36)
const gray  = (t: string) => colorize(t, 90)

const IGNORE = new Set([
  'node_modules', '.git', 'dist', 'build', '.next',
  'coverage', '.turbo', '__pycache__', '.cache',
])

interface TreeNode {
  name: string
  isDir: boolean
  children?: TreeNode[]
}

function buildTree(dir: string, depth: number, maxDepth: number): TreeNode[] {
  if (depth > maxDepth) return []

  let entries: string[]
  try {
    entries = readdirSync(dir)
  } catch {
    return []
  }

  const dirs: string[]  = []
  const files: string[] = []

  for (const name of entries) {
    if (IGNORE.has(name)) continue
    try {
      if (statSync(join(dir, name)).isDirectory()) dirs.push(name)
      else files.push(name)
    } catch { /* skip unreadable entries */ }
  }

  dirs.sort()
  files.sort()

  const nodes: TreeNode[] = []

  for (const name of dirs) {
    nodes.push({ name, isDir: true, children: buildTree(join(dir, name), depth + 1, maxDepth) })
  }
  for (const name of files) {
    nodes.push({ name, isDir: false })
  }

  return nodes
}

function printTree(nodes: TreeNode[], prefix: string): void {
  for (let i = 0; i < nodes.length; i++) {
    const node   = nodes[i]!
    const isLast = i === nodes.length - 1
    const branch = isLast ? '└── ' : '├── '
    const label  = node.isDir ? bold(cyan(node.name + '/')) : white(node.name)

    console.log(prefix + gray(branch) + label)

    if (node.isDir && node.children && node.children.length > 0) {
      printTree(node.children, prefix + gray(isLast ? '    ' : '│   '))
    }
  }
}

export function register(program: Command): void {
  program
    .command('tree')
    .description('Show a visual directory tree of the project')
    .option('--depth <n>', 'Max depth to traverse', '3')
    .option('--json', 'Output raw JSON tree')
    .action((opts: { depth: string; json?: boolean }) => {
      const cwd      = process.cwd()
      const maxDepth = Math.max(1, parseInt(opts.depth, 10) || 3)
      const nodes    = buildTree(cwd, 1, maxDepth)

      if (opts.json) {
        process.stdout.write(JSON.stringify(nodes, null, 2) + '\n')
        process.exit(0)
      }

      console.log()
      console.log(bold(cyan('./')))
      printTree(nodes, '')
      console.log()
    })
}
