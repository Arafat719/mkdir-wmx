import type { Command } from 'commander'
import ora from 'ora'
import { scanClean } from 'wmx-os-scanners'
import type { CleanEntry, CleanReport } from 'wmx-os-scanners'

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

const SECTIONS: Array<{ key: keyof CleanReport; title: string }> = [
  { key: 'components', title: 'Unused Components' },
  { key: 'hooks',      title: 'Unused Hooks' },
  { key: 'pages',      title: 'Unused Pages' },
  { key: 'css',        title: 'Unused CSS' },
  { key: 'images',     title: 'Unused Images' },
  { key: 'icons',      title: 'Unused Icons' },
  { key: 'fonts',      title: 'Unused Fonts' },
]

function printEntry(entry: CleanEntry): void {
  if (entry.name) {
    console.log('  ' + yellow('● ') + white(entry.name) + gray('  ') + cyan(entry.file))
  } else {
    console.log('  ' + yellow('● ') + cyan(entry.file))
  }
}

function printReport(report: CleanReport): void {
  console.log()
  console.log(magenta(bold('  ╔══════════════════════════════════╗')))
  console.log(magenta(bold('  ║      WMX Dead Code Finder         ║')))
  console.log(magenta(bold('  ╚══════════════════════════════════╝')))
  console.log()

  let total = 0

  for (const { key, title } of SECTIONS) {
    const entries = report[key] as CleanEntry[]
    total += entries.length
    const label = `${title} (${entries.length})`
    console.log(bold(label))
    console.log(gray('─'.repeat(label.length)))
    if (entries.length === 0) {
      console.log(green('  ✔  None found'))
    } else {
      for (const entry of entries) printEntry(entry)
    }
    console.log()
  }

  console.log(gray('─'.repeat(50)))
  console.log('  ' + bold(white(String(total))) + gray(' unused item(s) found across the project'))
  console.log()
}

export function register(program: Command): void {
  program
    .command('clean')
    .description('Find dead code: unused components, hooks, pages, CSS, images, icons, and fonts')
    .option('--json', 'Output raw JSON')
    .action(async (opts: { json?: boolean }) => {
      const cwd = process.cwd()
      const spinner = ora('Scanning for dead code...').start()

      let report: CleanReport
      try {
        report = await scanClean(cwd)
      } catch (err) {
        spinner.fail('Scan failed')
        console.error(err)
        process.exit(1)
      }

      spinner.stop()

      if (opts.json) {
        process.stdout.write(JSON.stringify(report, null, 2) + '\n')
        return
      }

      printReport(report)
    })
}
