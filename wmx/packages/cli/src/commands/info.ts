import type { Command } from 'commander'
import ora from 'ora'
import { createContext } from 'wmx-os-core'
import { existsSync, readFileSync } from 'fs'
import { join } from 'path'
import { execa } from 'execa'

function colorize(text: string, code: number): string {
  return `\x1b[${code}m${text}\x1b[0m`
}

const gray    = (t: string) => colorize(t, 90)
const white   = (t: string) => colorize(t, 97)
const bold    = (t: string) => colorize(t, 1)
const magenta = (t: string) => colorize(t, 35)
const cyan    = (t: string) => colorize(t, 36)

interface ProjectInfo {
  name: string
  version: string
  framework: string
  backend: string
  database: string
  packageManager: string
  nodeVersion: string
  gitBranch: string
  lastCommit: string
}

function readPkg(cwd: string): Record<string, unknown> {
  const p = join(cwd, 'package.json')
  if (!existsSync(p)) return {}
  try { return JSON.parse(readFileSync(p, 'utf8')) } catch { return {} }
}

function detectFramework(
  deps: Record<string, string>,
  devDeps: Record<string, string>,
  configured?: string
): string {
  if (configured) return configured
  if ('next' in deps) return 'Next.js'
  if ('vite' in devDeps) return 'Vite + React'
  if ('react' in deps) return 'React'
  return 'Unknown'
}

function detectBackend(deps: Record<string, string>, configured?: string): string {
  if (configured) return configured
  if ('express' in deps) return 'Express'
  if ('fastify' in deps) return 'Fastify'
  return 'None'
}

function detectDatabase(deps: Record<string, string>, configured?: string): string {
  if (configured) return configured
  if ('mongoose' in deps) return 'MongoDB'
  if ('prisma' in deps || '@prisma/client' in deps) return 'Prisma'
  return 'None'
}

function detectPackageManager(cwd: string): string {
  if (existsSync(join(cwd, 'pnpm-lock.yaml')))   return 'pnpm'
  if (existsSync(join(cwd, 'yarn.lock')))         return 'yarn'
  if (existsSync(join(cwd, 'package-lock.json'))) return 'npm'
  return 'unknown'
}

async function gitInfo(cwd: string): Promise<{ branch: string; lastCommit: string }> {
  let branch = 'N/A'
  let lastCommit = 'N/A'
  try {
    const r = await execa('git', ['rev-parse', '--abbrev-ref', 'HEAD'], { cwd })
    branch = r.stdout.trim() || 'N/A'
  } catch { /* not a git repo */ }
  try {
    const r = await execa('git', ['log', '-1', '--format=%s'], { cwd })
    lastCommit = r.stdout.trim() || 'N/A'
  } catch { /* no commits */ }
  return { branch, lastCommit }
}

async function gatherInfo(cwd: string): Promise<ProjectInfo> {
  const [ctx, { branch, lastCommit }] = await Promise.all([
    createContext(),
    gitInfo(cwd),
  ])

  const pkg     = readPkg(cwd)
  const deps    = (pkg.dependencies    as Record<string, string>) ?? {}
  const devDeps = (pkg.devDependencies as Record<string, string>) ?? {}

  return {
    name:           (pkg.name    as string) ?? 'unknown',
    version:        (pkg.version as string) ?? '0.0.0',
    framework:      detectFramework(deps, devDeps, ctx.config?.framework),
    backend:        detectBackend(deps, ctx.config?.backend),
    database:       detectDatabase(deps, ctx.config?.database),
    packageManager: detectPackageManager(cwd),
    nodeVersion:    process.version,
    gitBranch:      branch,
    lastCommit,
  }
}

function row(label: string, value: string): string {
  return `  ${cyan(label.padEnd(14))} ${bold(white(value))}`
}

function printInfo(info: ProjectInfo): void {
  console.log()
  console.log(magenta(bold('  ╔══════════════════════════════════╗')))
  console.log(magenta(bold('  ║       WMX Project Info           ║')))
  console.log(magenta(bold('  ╚══════════════════════════════════╝')))
  console.log()
  console.log(row('Project',     info.name))
  console.log(row('Version',     info.version))
  console.log(row('Framework',   info.framework))
  console.log(row('Backend',     info.backend))
  console.log(row('Database',    info.database))
  console.log(row('Pkg Manager', info.packageManager))
  console.log(row('Node',        info.nodeVersion))
  console.log(row('Git Branch',  info.gitBranch))
  console.log(row('Last Commit', info.lastCommit))
  console.log()
}

export function register(program: Command): void {
  program
    .command('info')
    .description('Show a quick summary of the current project')
    .option('--json', 'Output results as JSON')
    .action(async (opts: { json?: boolean }) => {
      const spinner = ora('Gathering project info...').start()
      const cwd = process.cwd()

      let info: ProjectInfo
      try {
        info = await gatherInfo(cwd)
      } catch (err) {
        spinner.fail('Failed to gather project info')
        console.error(err)
        process.exit(1)
      }

      spinner.stop()

      if (opts.json) {
        process.stdout.write(JSON.stringify(info, null, 2) + '\n')
        process.exit(0)
      }

      printInfo(info)
    })
}
