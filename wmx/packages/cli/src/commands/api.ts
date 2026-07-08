import type { Command } from 'commander'
import ora from 'ora'
import { analyzeProject } from 'wmx-os-scanners'
import type { RouteEntry } from 'wmx-os-scanners'

function colorize(text: string, code: number): string {
  return `\x1b[${code}m${text}\x1b[0m`
}

const gray    = (t: string) => colorize(t, 90)
const white   = (t: string) => colorize(t, 97)
const bold    = (t: string) => colorize(t, 1)
const magenta = (t: string) => colorize(t, 35)
const cyan    = (t: string) => colorize(t, 36)
const green   = (t: string) => colorize(t, 32)
const yellow  = (t: string) => colorize(t, 33)
const red     = (t: string) => colorize(t, 31)

function methodColor(method: string): (s: string) => string {
  switch (method.toUpperCase()) {
    case 'GET':    return green
    case 'POST':   return yellow
    case 'PUT':    return cyan
    case 'DELETE': return red
    case 'PATCH':  return magenta
    default:       return white
  }
}

const METHOD_W = 8

function isNextJsPageRoute(route: RouteEntry): boolean {
  return route.source === 'file' && !route.path.startsWith('/api')
}

function groupByFile(routes: RouteEntry[]): Map<string, RouteEntry[]> {
  const map = new Map<string, RouteEntry[]>()
  for (const route of routes) {
    const group = map.get(route.file) ?? []
    group.push(route)
    map.set(route.file, group)
  }
  return map
}

function printApiRoutes(routes: RouteEntry[]): void {
  console.log()
  console.log(magenta(bold('  ╔══════════════════════════════════╗')))
  console.log(magenta(bold('  ║         WMX API Inspector        ║')))
  console.log(magenta(bold('  ╚══════════════════════════════════╝')))
  console.log()

  if (routes.length === 0) {
    console.log(gray('  No API endpoints detected.'))
    console.log()
    console.log(gray('  Tip: Make sure you\'re running wmx api inside an Express project.'))
    console.log()
    return
  }

  const groups = groupByFile(routes)
  let fileCount = 0

  for (const [file, fileRoutes] of groups) {
    fileCount++
    console.log('  ' + magenta(bold(file)))
    console.log('  ' + gray('─'.repeat(file.length)))

    for (const route of fileRoutes) {
      const colorFn = methodColor(route.method)
      const method  = colorFn(route.method.padEnd(METHOD_W))
      console.log('  ' + method + white(route.path))
    }

    console.log()
  }

  const totalWidth = METHOD_W + 30
  console.log('  ' + gray('─'.repeat(totalWidth)))
  console.log()
  console.log(
    '  ' +
    white(bold(String(routes.length))) +
    white(routes.length === 1 ? ' endpoint across ' : ' endpoints across ') +
    white(bold(String(fileCount))) +
    white(fileCount === 1 ? ' file' : ' files')
  )
  console.log()
}

export function register(program: Command): void {
  program
    .command('api')
    .description('List all Express API endpoints grouped by file')
    .option('--method <method>', 'Filter by HTTP method (GET, POST, PUT, DELETE, PATCH)')
    .option('--file <pattern>', 'Filter by file path substring')
    .option('--json', 'Output raw JSON array')
    .action(async (opts: { method?: string; file?: string; json?: boolean }) => {
      const cwd     = process.cwd()
      const spinner = ora('Scanning API endpoints...').start()

      let routes: RouteEntry[]
      try {
        const result = await analyzeProject(cwd)
        routes = result.routes
      } catch (err) {
        spinner.fail('API scan failed')
        console.error(err)
        process.exit(1)
      }

      spinner.stop()

      routes = routes.filter(r => !isNextJsPageRoute(r))

      if (opts.method) {
        const upper = opts.method.toUpperCase()
        routes = routes.filter(r => r.method.toUpperCase() === upper)
      }

      if (opts.file) {
        routes = routes.filter(r => r.file.includes(opts.file!))
      }

      if (opts.json) {
        process.stdout.write(JSON.stringify(routes, null, 2) + '\n')
        process.exit(0)
      }

      printApiRoutes(routes)
    })
}
