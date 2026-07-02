import type { Command } from 'commander'
import ora from 'ora'
import { scanGraph } from 'wmx-os-scanners'
import type { ComponentGraph } from 'wmx-os-scanners'

function colorize(text: string, code: number): string {
  return `\x1b[${code}m${text}\x1b[0m`
}

const gray    = (t: string) => colorize(t, 90)
const white   = (t: string) => colorize(t, 97)
const bold    = (t: string) => colorize(t, 1)
const magenta = (t: string) => colorize(t, 35)
const cyan    = (t: string) => colorize(t, 36)
const green   = (t: string) => colorize(t, 32)

const MAX_DEPTH = 8

function printTree(
  name: string,
  adjacency: Map<string, string[]>,
  prefix: string,
  visited: Set<string>,
  depth: number
): void {
  const children = adjacency.get(name) ?? []
  const nextVisited = new Set(visited).add(name)

  children.forEach((child, i) => {
    const isLast = i === children.length - 1
    const connector = isLast ? '└── ' : '├── '
    const childPrefix = prefix + (isLast ? '    ' : '│   ')

    if (nextVisited.has(child)) {
      console.log(prefix + gray(connector) + white(child) + gray(' (circular)'))
      return
    }
    if (depth >= MAX_DEPTH) {
      console.log(prefix + gray(connector) + white(child) + gray(' …'))
      return
    }

    console.log(prefix + gray(connector) + white(child))
    printTree(child, adjacency, childPrefix, nextVisited, depth + 1)
  })
}

function printReport(graph: ComponentGraph, filterComponent?: string): void {
  console.log()
  console.log(magenta(bold('  ╔══════════════════════════════════╗')))
  console.log(magenta(bold('  ║      WMX Dependency Graph         ║')))
  console.log(magenta(bold('  ╚══════════════════════════════════╝')))
  console.log()

  if (graph.nodes.length === 0) {
    console.log(gray('  No components detected in this project.'))
    console.log()
    return
  }

  const adjacency = new Map<string, string[]>()
  const hasIncoming = new Set<string>()
  for (const edge of graph.edges) {
    const list = adjacency.get(edge.from) ?? []
    list.push(edge.to)
    adjacency.set(edge.from, list)
    hasIncoming.add(edge.to)
  }

  if (filterComponent) {
    if (!graph.nodes.some(n => n.name === filterComponent)) {
      console.log(gray(`  Component "${filterComponent}" not found.`))
      console.log()
      return
    }
    console.log('  ' + bold(cyan(filterComponent)))
    printTree(filterComponent, adjacency, '  ', new Set(), 0)
    console.log()
    return
  }

  const connectedNames = new Set<string>([...adjacency.keys(), ...hasIncoming])
  const roots = graph.nodes
    .map(n => n.name)
    .filter(name => connectedNames.has(name) && !hasIncoming.has(name))

  if (roots.length === 0) {
    console.log(gray('  No component-to-component dependencies detected.'))
  }

  for (const root of roots) {
    console.log('  ' + bold(cyan(root)))
    printTree(root, adjacency, '  ', new Set(), 0)
    console.log()
  }

  const isolated = graph.nodes.map(n => n.name).filter(name => !connectedNames.has(name))
  if (isolated.length > 0) {
    console.log(gray(`  ${isolated.length} standalone component(s) with no detected dependencies (use --component <name> to inspect).`))
    console.log()
  }

  console.log(green('  ✔ ') + white(String(graph.nodes.length)) + gray(' components, ') + white(String(graph.edges.length)) + gray(' dependency edges'))
  console.log()
}

export function register(program: Command): void {
  program
    .command('graph')
    .description('Show the component dependency graph: which components import which')
    .option('--component <name>', 'Show the dependency chain for a single component')
    .option('--json', 'Output raw JSON')
    .action(async (opts: { component?: string; json?: boolean }) => {
      const cwd = process.cwd()
      const spinner = ora('Building component dependency graph...').start()

      let graph: ComponentGraph
      try {
        graph = await scanGraph(cwd)
      } catch (err) {
        spinner.fail('Scan failed')
        console.error(err)
        process.exit(1)
      }

      spinner.stop()

      if (opts.json) {
        process.stdout.write(JSON.stringify(graph, null, 2) + '\n')
        return
      }

      printReport(graph, opts.component)
    })
}
