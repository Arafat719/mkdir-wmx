import type { Command } from 'commander'
import ora from 'ora'
import { scanMigrations } from 'wmx-os-scanners'
import type { MigrateResult, MigrationPath } from 'wmx-os-scanners'

function colorize(text: string, code: number): string {
  return `\x1b[${code}m${text}\x1b[0m`
}

const gray    = (t: string) => colorize(t, 90)
const white   = (t: string) => colorize(t, 97)
const bold    = (t: string) => colorize(t, 1)
const magenta = (t: string) => colorize(t, 35)
const cyan    = (t: string) => colorize(t, 36)
const green   = (t: string) => colorize(t, 32)

function printPath(m: MigrationPath): void {
  console.log('  ' + white(m.from))
  console.log('  ' + gray('↓'))
  console.log('  ' + bold(cyan(m.to)))
  console.log()
  console.log('  ' + gray(m.reason))
  console.log()
  console.log('  ' + white('Steps:'))
  m.steps.forEach((step, i) => {
    console.log('    ' + gray(`${i + 1}.`) + ' ' + white(step))
  })
  console.log()
}

function printReport(result: MigrateResult): void {
  console.log()
  console.log(magenta(bold('  ╔══════════════════════════════════╗')))
  console.log(magenta(bold('  ║         WMX Migration             ║')))
  console.log(magenta(bold('  ╚══════════════════════════════════╝')))
  console.log()

  if (result.detected.length === 0) {
    console.log(green('  ✔  No obvious migration opportunities detected.'))
    console.log()
    return
  }

  result.detected.forEach((m, i) => {
    printPath(m)
    if (i < result.detected.length - 1) console.log(gray('  ─'.repeat(25)) + '\n')
  })
}

export function register(program: Command): void {
  program
    .command('migrate')
    .description('Detect outdated tech and suggest migration paths (e.g. React Router → Next.js, Tailwind v3 → v4)')
    .option('--json', 'Output raw JSON')
    .action(async (opts: { json?: boolean }) => {
      const cwd = process.cwd()
      const spinner = ora('Scanning for migration opportunities...').start()

      let result: MigrateResult
      try {
        result = await scanMigrations(cwd)
      } catch (err) {
        spinner.fail('Scan failed')
        console.error(err)
        process.exit(1)
      }

      spinner.stop()

      if (opts.json) {
        process.stdout.write(JSON.stringify(result, null, 2) + '\n')
        return
      }

      printReport(result)
    })
}
