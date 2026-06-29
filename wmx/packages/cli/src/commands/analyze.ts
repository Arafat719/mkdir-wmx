import type { Command } from 'commander'
import ora from 'ora'
import path from 'path'
import { analyzeProject } from 'wmx-os-scanners'
import { generateAnalysis } from 'wmx-os-generators'

function colorize(text: string, code: number): string {
  return `\x1b[${code}m${text}\x1b[0m`
}

const gray   = (t: string) => colorize(t, 90)
const white  = (t: string) => colorize(t, 97)
const bold   = (t: string) => colorize(t, 1)
const purple = (t: string) => colorize(t, 35)
const cyan   = (t: string) => colorize(t, 36)
const green  = (t: string) => colorize(t, 32)
const yellow = (t: string) => colorize(t, 33)

function truncateTree(tree: string, maxDepth: number): string {
  return tree
    .split('\n')
    .filter(line => {
      const indent = line.length - line.trimStart().length
      const depth  = Math.floor(indent / 4)
      return depth <= maxDepth
    })
    .join('\n')
}

function printRoutesTable(routes: Array<{ method: string; path: string; file: string; line: number }>): void {
  if (routes.length === 0) return

  console.log()
  console.log(bold('  API Routes'))
  console.log()

  const methodW = 8
  const pathW   = 30
  const fileW   = 40

  const header =
    '  ' +
    bold(cyan('METHOD'.padEnd(methodW))) +
    bold(cyan('PATH'.padEnd(pathW))) +
    bold(cyan('FILE'.padEnd(fileW))) +
    bold(cyan('LINE'))

  console.log(header)
  console.log('  ' + gray('─'.repeat(methodW + pathW + fileW + 6)))

  for (const route of routes) {
    const methodColor = route.method === 'GET'    ? green
      : route.method === 'POST'   ? yellow
      : route.method === 'DELETE' ? (s: string) => colorize(s, 31)
      : white

    console.log(
      '  ' +
      methodColor(route.method.padEnd(methodW)) +
      white(route.path.slice(0, pathW - 1).padEnd(pathW)) +
      gray(route.file.slice(0, fileW - 1).padEnd(fileW)) +
      gray(String(route.line))
    )
  }
}

export function register(program: Command): void {
  program
    .command('analyze')
    .description('Analyze project architecture: folder tree, routes, imports, and exports')
    .option('--output <dir>', 'Output directory for analysis files', '.wmx')
    .option('--no-routes',  'Skip route detection')
    .option('--no-imports', 'Skip import graph scanning')
    .action(async (opts: { output: string; routes: boolean; imports: boolean }) => {
      const cwd       = process.cwd()
      const outputDir = path.resolve(cwd, opts.output)

      const spinner = ora('Analyzing project architecture...').start()

      let result: Awaited<ReturnType<typeof analyzeProject>>
      try {
        result = await analyzeProject(cwd)
      } catch (err) {
        spinner.fail('Analysis failed')
        console.error(err)
        process.exit(1)
      }

      if (!opts.routes)  result.routes  = []
      if (!opts.imports) result.imports = []

      spinner.stop()

      console.log()
      console.log(purple(bold('  wmx analyze')))

      console.log()
      console.log(bold('  Folder Structure') + gray('  (top 3 levels)'))
      console.log()
      const terminalTree = truncateTree(result.folderTree, 3)
      terminalTree.split('\n').forEach(line => console.log('  ' + gray(line)))

      if (opts.routes) {
        printRoutesTable(result.routes)
      }

      console.log()
      console.log(
        `  ${green('✔')} Found ` +
        bold(white(String(result.routes.length)))  + gray(' routes, ') +
        bold(white(String(result.imports.length))) + gray(' imports, ') +
        bold(white(String(result.exports.length))) + gray(' exports')
      )

      try {
        await generateAnalysis(result, outputDir)
      } catch (err) {
        console.error('Failed to write analysis files:', err)
        process.exit(1)
      }

      const relOutput = path.relative(cwd, outputDir)
      console.log()
      console.log(`  ${green('✔')} Analysis saved to ${cyan(relOutput + '/analysis.md')} and ${cyan(relOutput + '/analysis.json')}`)
      console.log()
    })
}
