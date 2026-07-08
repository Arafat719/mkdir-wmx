import type { Command } from 'commander'
import chalk from 'chalk'
import ora from 'ora'
import { execa } from 'execa'
import inquirer from 'inquirer'
import { existsSync } from 'fs'
import { join } from 'path'
import { scanDependencies } from 'wmx-os-scanners'

function detectPackageManager(cwd: string): string {
  if (existsSync(join(cwd, 'pnpm-lock.yaml')))   return 'pnpm'
  if (existsSync(join(cwd, 'yarn.lock')))         return 'yarn'
  if (existsSync(join(cwd, 'package-lock.json'))) return 'npm'
  return 'npm'
}

export function register(program: Command): void {
  program
    .command('upgrade')
    .description('Interactively upgrade outdated dependencies')
    .option('--dry-run', 'Preview upgrade without making changes')
    .action(async (opts: { dryRun?: boolean }) => {
      const cwd = process.cwd()
      const packageManager = detectPackageManager(cwd)

      // Step a — Scan
      const spinner = ora('Checking for outdated packages...').start()
      let report: Awaited<ReturnType<typeof scanDependencies>>
      try {
        report = await scanDependencies(cwd)
      } catch (err) {
        spinner.fail('Dependency scan failed')
        console.error(err)
        process.exit(1)
      }
      spinner.stop()

      // Step b — Nothing outdated
      if (report.outdated.length === 0) {
        console.log(chalk.green('✔ All dependencies are up to date.'))
        process.exit(0)
      }

      // Step c — Checkbox prompt
      const { selected } = await inquirer.prompt<{ selected: string[] }>([
        {
          type: 'checkbox',
          name: 'selected',
          message: 'Select packages to upgrade:',
          choices: report.outdated.map(dep => ({
            name: `${dep.name}  ${dep.current} → ${dep.latest}  [${dep.type}]`,
            value: dep.name,
            checked: false,
          })),
        },
      ])

      // Step d — Nothing selected
      if (selected.length === 0) {
        console.log(chalk.gray('No packages selected. Exiting.'))
        process.exit(0)
      }

      // Step e — Preview install command
      const installArgs = selected.map(name => `${name}@latest`)
      const installSubcommand = packageManager === 'yarn' ? 'add' : 'install'
      console.log(chalk.cyan('Will run: ') + chalk.white(`${packageManager} ${installSubcommand} ${installArgs.join(' ')}`))

      // Step f — Dry run exit
      if (opts.dryRun) {
        console.log(chalk.blue('ℹ Dry run complete. No changes made.'))
        process.exit(0)
      }

      // Step g — Confirm prompt
      const { proceed } = await inquirer.prompt<{ proceed: boolean }>([
        {
          type: 'confirm',
          name: 'proceed',
          message: 'Proceed with upgrade?',
          default: false,
        },
      ])

      if (!proceed) {
        console.log(chalk.gray('Upgrade cancelled.'))
        process.exit(0)
      }

      // Step h — Run install
      const installSpinner = ora('Installing upgrades...').start()
      try {
        await execa(packageManager, [installSubcommand, ...installArgs], { cwd, stdio: 'pipe' })
        installSpinner.succeed()
        console.log(chalk.green('✔ Upgrade complete.'))
      } catch (error) {
        installSpinner.fail('Upgrade failed.')
        const message = error instanceof Error ? error.message : String(error)
        console.log(chalk.red(message))
        process.exit(1)
      }
    })
}
