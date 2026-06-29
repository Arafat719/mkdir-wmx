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
const PATH_W   = 30
const FILE_W   = 36

function printRoutes(routes: RouteEntry[]): void {
  console.log()
  console.log(magenta(bold('  ╔══════════════════════════════════╗')))
  console.log(magenta(bold('  ║         WMX Route Scanner        ║')))
  console.log(magenta(bold('  ╚══════════════════════════════════╝')))
  console.log()

  if (routes.length === 0) {
    console.log(gray('  No routes detected.'))
    console.log()
    console.log(gray('  Tip: Make sure you\'re running wmx route inside a project with'))
    console.log(gray('       Express routes or Next.js pages.'))
    console.log()
    return
  }

  for (const route of routes) {
    const colorFn   = methodColor(route.method)
    const method    = colorFn(route.method.padEnd(METHOD_W))
    const routePath = white(route.path.slice(0, PATH_W - 1).padEnd(PATH_W))
    const file      = gray(route.file.slice(0, FILE_W - 1).padEnd(FILE_W))
    const lineNum   = gray('line ' + String(route.line))
    console.log('  ' + method + routePath + file + lineNum)
  }

  console.log()
  console.log('  ' + gray('─'.repeat(METHOD_W + PATH_W + FILE_W + 6)))
  console.log()
  console.log(
    '  ' +
    bold(white(String(routes.length))) +
    gray(routes.length === 1 ? ' route found' : ' routes found')
  )
  console.log()
}

export function register(program: Command): void {
  program
    .command('route')
    .description('Scan and display all detected API and page routes')
    .option('--filter <method>', 'Filter by HTTP method (GET, POST, PUT, DELETE, PATCH)')
    .option('--json', 'Output raw JSON array')
    .action(async (opts: { filter?: string; json?: boolean }) => {
      const cwd     = process.cwd()
      const spinner = ora('Scanning routes...').start()

      let routes: RouteEntry[]
      try {
        const result = await analyzeProject(cwd)
        routes = result.routes
      } catch (err) {
        spinner.fail('Route scan failed')
        console.error(err)
        process.exit(1)
      }

      spinner.stop()

      if (opts.filter) {
        const upper = opts.filter.toUpperCase()
        routes = routes.filter(r => r.method.toUpperCase() === upper)
      }

      if (opts.json) {
        process.stdout.write(JSON.stringify(routes, null, 2) + '\n')
        process.exit(0)
      }

      printRoutes(routes)
    })
}
