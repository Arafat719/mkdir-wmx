import type { Command } from 'commander'
import inquirer from 'inquirer'
import { existsSync, unlinkSync } from 'fs'
import { join } from 'path'
import { loadConfig, saveConfig } from 'wmx-os-core'
import type { WmxConfig } from 'wmx-os-core'

function colorize(text: string, code: number): string {
  return `\x1b[${code}m${text}\x1b[0m`
}

const white   = (t: string) => colorize(t, 97)
const bold    = (t: string) => colorize(t, 1)
const magenta = (t: string) => colorize(t, 35)
const cyan    = (t: string) => colorize(t, 36)
const green   = (t: string) => colorize(t, 32)
const yellow  = (t: string) => colorize(t, 33)

function row(label: string, value: string): string {
  return `  ${cyan(label.padEnd(14))} ${bold(white(value))}`
}

const FRAMEWORKS       = ['Vite + React', 'Next.js', 'React + CRA', 'Express only', 'Other'] as const
const BACKENDS         = ['Express', 'Fastify', 'None'] as const
const DATABASES        = ['MongoDB', 'PostgreSQL', 'MySQL', 'SQLite', 'None'] as const
const PKG_MANAGERS     = ['pnpm', 'npm', 'yarn'] as const
const DEPLOY_PROVIDERS = ['Vercel', 'Netlify', 'Render', 'Railway', 'None'] as const

function defaultOf<T>(choices: readonly T[], value: T | undefined): T {
  return (value !== undefined && (choices as readonly unknown[]).includes(value))
    ? value
    : choices[0]
}

function detectPackageManager(cwd: string): string {
  if (existsSync(join(cwd, 'pnpm-lock.yaml')))   return 'pnpm'
  if (existsSync(join(cwd, 'yarn.lock')))         return 'yarn'
  if (existsSync(join(cwd, 'package-lock.json'))) return 'npm'
  return 'unknown'
}

async function runWizard(cwd: string): Promise<void> {
  const existing = loadConfig(cwd)

  const answers = await inquirer.prompt([
    {
      type: 'list',
      name: 'framework',
      message: 'Framework:',
      choices: [...FRAMEWORKS],
      default: defaultOf(FRAMEWORKS, existing?.framework as typeof FRAMEWORKS[number] | undefined),
    },
    {
      type: 'list',
      name: 'backend',
      message: 'Backend:',
      choices: [...BACKENDS],
      default: defaultOf(BACKENDS, existing?.backend as typeof BACKENDS[number] | undefined),
    },
    {
      type: 'list',
      name: 'database',
      message: 'Database:',
      choices: [...DATABASES],
      default: defaultOf(DATABASES, existing?.database as typeof DATABASES[number] | undefined),
    },
    {
      type: 'list',
      name: 'packageManager',
      message: 'Package Manager:',
      choices: [...PKG_MANAGERS],
      default: PKG_MANAGERS[0],
    },
    {
      type: 'list',
      name: 'deploy',
      message: 'Deploy Provider:',
      choices: [...DEPLOY_PROVIDERS],
      default: defaultOf(DEPLOY_PROVIDERS, existing?.deploy?.provider as typeof DEPLOY_PROVIDERS[number] | undefined),
    },
  ])

  const config: WmxConfig = {
    framework: answers.framework as string,
    backend:   answers.backend   as string,
    database:  answers.database  as string,
    deploy:    { provider: answers.deploy as string },
  }

  saveConfig(config, cwd)

  console.log()
  console.log(magenta(bold('  ╔══════════════════════════════════╗')))
  console.log(magenta(bold('  ║       WMX Config Saved ✔         ║')))
  console.log(magenta(bold('  ╚══════════════════════════════════╝')))
  console.log()
  console.log(row('Framework',   answers.framework      as string))
  console.log(row('Backend',     answers.backend        as string))
  console.log(row('Database',    answers.database       as string))
  console.log(row('Pkg Manager', answers.packageManager as string))
  console.log(row('Deploy',      answers.deploy         as string))
  console.log()
  console.log('  ' + green('Saved to .wmxrc.json'))
  console.log()
}

function runShow(cwd: string): void {
  const config = loadConfig(cwd)

  if (!config) {
    console.log()
    console.log('  ' + yellow('No .wmxrc.json found. Run wmx config set to create one.'))
    console.log()
    return
  }

  console.log()
  console.log(magenta(bold('  ╔══════════════════════════════════╗')))
  console.log(magenta(bold('  ║        WMX Config                ║')))
  console.log(magenta(bold('  ╚══════════════════════════════════╝')))
  console.log()
  console.log(row('Framework',   config.framework        ?? 'N/A'))
  console.log(row('Backend',     config.backend          ?? 'N/A'))
  console.log(row('Database',    config.database         ?? 'N/A'))
  console.log(row('Pkg Manager', detectPackageManager(cwd)))
  console.log(row('Deploy',      config.deploy?.provider ?? 'N/A'))
  console.log()
}

function runReset(cwd: string): void {
  const configPath = join(cwd, '.wmxrc.json')

  if (!existsSync(configPath)) {
    console.log()
    console.log('  ' + yellow('Nothing to reset — .wmxrc.json not found.'))
    console.log()
    return
  }

  unlinkSync(configPath)
  console.log()
  console.log('  ' + green('✔  .wmxrc.json removed.'))
  console.log()
}

export function register(program: Command): void {
  const configCmd = program
    .command('config')
    .description('Create or update .wmxrc.json config for the current project')

  configCmd
    .command('set')
    .description('Run the interactive config wizard')
    .action(async () => { await runWizard(process.cwd()) })

  configCmd
    .command('show')
    .description('Display the current .wmxrc.json config')
    .action(() => { runShow(process.cwd()) })

  configCmd
    .command('reset')
    .description('Delete .wmxrc.json from the current directory')
    .action(() => { runReset(process.cwd()) })

  configCmd.action(async () => { await runWizard(process.cwd()) })
}
