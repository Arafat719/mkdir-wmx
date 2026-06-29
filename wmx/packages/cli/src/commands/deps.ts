import type { Command } from 'commander'
import chalk from 'chalk'
import ora from 'ora'
import { scanDependencies } from 'wmx-os-scanners'
import type { DependencyReport } from 'wmx-os-scanners'

const NAME_W  = 28
const VER_W   = 14
const TYPE_W  = 6

function printOutdatedTable(report: DependencyReport): void {
  if (report.outdated.length === 0) {
    console.log(chalk.gray('  None found'))
    return
  }

  const header =
    '  ' +
    chalk.bold('Name'.padEnd(NAME_W)) +
    chalk.bold('Current'.padEnd(VER_W)) +
    chalk.bold('Latest'.padEnd(VER_W)) +
    chalk.bold('Type'.padEnd(TYPE_W))
  console.log(header)
  console.log('  ' + chalk.gray('─'.repeat(NAME_W + VER_W + VER_W + TYPE_W)))

  for (const dep of report.outdated) {
    console.log(
      '  ' +
      chalk.white(dep.name.padEnd(NAME_W)) +
      chalk.yellow(dep.current.padEnd(VER_W)) +
      chalk.green(dep.latest.padEnd(VER_W)) +
      chalk.gray(dep.type.padEnd(TYPE_W))
    )
  }
}

export function register(program: Command): void {
  program
    .command('deps')
    .description('Analyze project dependencies')
    .option('--unused',   'Show unused dependencies')
    .option('--heavy',    'Show heavy dependencies with alternatives')
    .option('--outdated', 'Show outdated dependencies')
    .option('--all',      'Show all categories (default)')
    .option('--json',     'Output as JSON')
    .action(async (opts: { unused?: boolean; heavy?: boolean; outdated?: boolean; all?: boolean; json?: boolean }) => {
      const showAll     = opts.all ?? (!opts.unused && !opts.heavy && !opts.outdated)
      const showUnused  = showAll || (opts.unused  ?? false)
      const showHeavy   = showAll || (opts.heavy   ?? false)
      const showOutdated = showAll || (opts.outdated ?? false)

      const cwd     = process.cwd()
      const spinner = ora('Scanning dependencies...').start()
      const report  = await scanDependencies(cwd)
      spinner.stop()

      if (opts.json) {
        const filtered: Partial<DependencyReport> = {}
        if (showUnused)   filtered.unused   = report.unused
        if (showHeavy)    filtered.heavy    = report.heavy
        if (showOutdated) filtered.outdated = report.outdated
        filtered.missing = report.missing
        console.log(JSON.stringify(filtered, null, 2))
        return
      }

      let first = true

      if (showUnused) {
        if (!first) console.log()
        first = false
        console.log(chalk.red.bold(`Unused Dependencies (${report.unused.length})`))
        if (report.unused.length === 0) {
          console.log(chalk.gray('  None found'))
        } else {
          for (const name of report.unused) {
            console.log(chalk.red('  ● ') + name)
          }
        }
      }

      if (showHeavy) {
        if (!first) console.log()
        first = false
        console.log(chalk.yellow.bold(`Heavy Dependencies (${report.heavy.length})`))
        if (report.heavy.length === 0) {
          console.log(chalk.gray('  None found'))
        } else {
          for (const entry of report.heavy) {
            console.log(chalk.yellow('  ● ') + chalk.white(entry.name))
            console.log(chalk.gray(`    Reason: ${entry.reason}`))
            console.log(chalk.green(`    Alternative: ${entry.alternative}`))
          }
        }
      }

      if (showOutdated) {
        if (!first) console.log()
        first = false
        console.log(chalk.cyan.bold(`Outdated Dependencies (${report.outdated.length})`))
        printOutdatedTable(report)
      }

      // Missing is always shown
      if (!first) console.log()
      console.log(chalk.magenta.bold(`Missing Dependencies (${report.missing.length})`))
      if (report.missing.length === 0) {
        console.log(chalk.gray('  None found'))
      } else {
        for (const name of report.missing) {
          console.log(chalk.magenta('  ● ') + name)
        }
      }

      console.log()
    })
}
