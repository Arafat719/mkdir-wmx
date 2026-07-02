import type { Command } from 'commander'
import ora from 'ora'
import { scanArchitecture } from 'wmx-os-scanners'
import type { ArchitectureResult } from 'wmx-os-scanners'

function colorize(text: string, code: number): string {
  return `\x1b[${code}m${text}\x1b[0m`
}

const gray    = (t: string) => colorize(t, 90)
const white   = (t: string) => colorize(t, 97)
const bold    = (t: string) => colorize(t, 1)
const magenta = (t: string) => colorize(t, 35)
const cyan    = (t: string) => colorize(t, 36)
const green   = (t: string) => colorize(t, 32)

function printReport(result: ArchitectureResult): void {
  console.log()
  console.log(magenta(bold('  ╔══════════════════════════════════╗')))
  console.log(magenta(bold('  ║        WMX Architecture           ║')))
  console.log(magenta(bold('  ╚══════════════════════════════════╝')))
  console.log()

  console.log('  ' + bold(cyan(result.appName)))
  console.log()

  if (result.modules.length === 0) {
    console.log(gray('  No feature modules detected — try running this from a project with src/ or app/ subfolders.'))
    console.log()
    return
  }

  result.modules.forEach((mod, i) => {
    const isLast = i === result.modules.length - 1
    const connector = isLast ? '└── ' : '├── '
    console.log('  ' + gray(connector) + white(mod))
  })

  console.log()
  console.log(gray(`  Detected from ${result.root || '.'}/`))
  console.log(green('  ✔ Found ') + white(String(result.modules.length)) + green(' module(s).'))
  console.log()
}

export function register(program: Command): void {
  program
    .command('architecture')
    .description('Visualize the project architecture as a module graph')
    .option('--json', 'Output raw JSON')
    .action(async (opts: { json?: boolean }) => {
      const cwd = process.cwd()
      const spinner = ora('Scanning project architecture...').start()

      let result: ArchitectureResult
      try {
        result = await scanArchitecture(cwd)
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
