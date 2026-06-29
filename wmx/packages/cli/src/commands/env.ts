import type { Command } from 'commander'
import path from 'path'
import chalk from 'chalk'
import ora from 'ora'
import fse from 'fs-extra'
import inquirer from 'inquirer'
import { parseEnvFile, scanEnvSync } from 'wmx-os-scanners'
import type { EnvEntry } from 'wmx-os-scanners'

async function writeEnvFile(filePath: string, entries: EnvEntry[]): Promise<void> {
  const content = entries.map(e => `${e.key}=${e.value}`).join('\n') + '\n'
  await fse.outputFile(filePath, content, 'utf-8')
}

async function writeExampleFile(filePath: string, keys: string[]): Promise<void> {
  const content = keys.map(k => `${k}=`).join('\n') + '\n'
  await fse.outputFile(filePath, content, 'utf-8')
}

export function register(program: Command): void {
  const env = program
    .command('env')
    .description('Manage project environment variables')

  // ── list ────────────────────────────────────────────────────────────────────

  env
    .command('list')
    .description('List all keys and masked values from .env')
    .action(async () => {
      const envPath = path.join(process.cwd(), '.env')
      const entries = await parseEnvFile(envPath)

      if (entries.length === 0) {
        console.log(chalk.gray('No .env file found or file is empty.'))
        return
      }

      console.log(chalk.cyan.bold('.env — ' + envPath))
      console.log()
      console.log(chalk.gray('  KEY'.padEnd(30)) + chalk.gray('VALUE'))
      console.log(chalk.gray('  ' + '─'.repeat(50)))

      for (const entry of entries) {
        console.log(chalk.white(entry.key.padEnd(30)) + chalk.yellow(entry.masked))
      }

      console.log()
      console.log(chalk.gray(`${entries.length} key(s) found.`))
    })

  // ── add ─────────────────────────────────────────────────────────────────────

  env
    .command('add <key> <value>')
    .description('Add or update a key in .env and .env.example')
    .action(async (key: string, value: string) => {
      const cwd         = process.cwd()
      const envPath     = path.join(cwd, '.env')
      const examplePath = path.join(cwd, '.env.example')

      key   = key.trim().toUpperCase()
      value = value.trim()

      if (!/^[A-Z][A-Z0-9_]*$/.test(key)) {
        console.log(chalk.red('Invalid key name. Use uppercase letters, numbers, underscores.'))
        process.exit(1)
      }

      const entries      = await parseEnvFile(envPath)
      const existingIdx  = entries.findIndex(e => e.key === key)
      if (existingIdx !== -1) {
        entries[existingIdx].value = value
      } else {
        entries.push({ key, value, masked: '' })
      }
      await writeEnvFile(envPath, entries)

      const exampleEntries = await parseEnvFile(examplePath)
      const inExample      = exampleEntries.some(e => e.key === key)
      if (!inExample) {
        exampleEntries.push({ key, value: '', masked: '' })
        await writeExampleFile(examplePath, exampleEntries.map(e => e.key))
      }

      console.log(chalk.green(`✔  Added ${key} to .env`))
      if (!inExample) {
        console.log(chalk.green(`✔  Added ${key} to .env.example (value left blank)`))
      } else {
        console.log(chalk.gray(`   ${key} already present in .env.example`))
      }
    })

  // ── remove ──────────────────────────────────────────────────────────────────

  env
    .command('remove <key>')
    .description('Remove a key from .env (with confirmation)')
    .action(async (key: string) => {
      const cwd     = process.cwd()
      const envPath = path.join(cwd, '.env')

      key = key.trim().toUpperCase()

      const entries = await parseEnvFile(envPath)
      const found   = entries.some(e => e.key === key)

      if (!found) {
        console.log(chalk.yellow(`⚠  Key "${key}" not found in .env`))
        return
      }

      const { confirm } = await inquirer.prompt<{ confirm: boolean }>([
        {
          type: 'confirm',
          name: 'confirm',
          message: `Remove "${key}" from .env?`,
          default: false,
        },
      ])

      if (!confirm) {
        console.log(chalk.gray('Removal cancelled.'))
        return
      }

      await writeEnvFile(envPath, entries.filter(e => e.key !== key))

      console.log(chalk.green(`✔  Removed ${key} from .env`))
      console.log(chalk.gray('Note: .env.example was not modified. Remove the key manually if needed.'))
    })

  // ── sync ─────────────────────────────────────────────────────────────────────

  env
    .command('sync')
    .description('Compare .env and .env.example and report differences')
    .action(async () => {
      const cwd     = process.cwd()
      const spinner = ora('Comparing .env and .env.example...').start()
      const report  = await scanEnvSync(cwd)
      spinner.stop()

      console.log(chalk.cyan.bold('Env Sync Report'))
      console.log()

      console.log(chalk.red.bold(`Missing in .env (${report.missingInEnv.length})`))
      if (report.missingInEnv.length === 0) {
        console.log(chalk.gray('  None — all example keys are present in .env'))
      } else {
        for (const k of report.missingInEnv) {
          console.log(chalk.red('  ✖ ') + chalk.white(k))
        }
        console.log(chalk.gray('  Tip: add these keys to your .env file'))
      }

      console.log()

      console.log(chalk.yellow.bold(`Missing in .env.example (${report.missingInExample.length})`))
      if (report.missingInExample.length === 0) {
        console.log(chalk.gray('  None — all .env keys are documented in .env.example'))
      } else {
        for (const k of report.missingInExample) {
          console.log(chalk.yellow('  ⚠ ') + chalk.white(k))
        }
        console.log(chalk.gray('  Tip: run wmx env add <KEY> <value> to document these keys'))
      }

      console.log()

      console.log(chalk.green.bold(`In sync (${report.presentInBoth.length})`))
      if (report.presentInBoth.length === 0) {
        console.log(chalk.gray('  No keys found in both files'))
      } else {
        for (const k of report.presentInBoth) {
          console.log(chalk.green('  ✔ ') + chalk.white(k))
        }
      }

      console.log()
      if (report.missingInEnv.length === 0 && report.missingInExample.length === 0) {
        console.log(chalk.green('✔  .env and .env.example are fully in sync.'))
      } else {
        console.log(chalk.yellow(`⚠  ${report.missingInEnv.length + report.missingInExample.length} issue(s) found.`))
      }
    })
}
