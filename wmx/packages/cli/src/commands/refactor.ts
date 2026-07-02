import type { Command } from 'commander'
import ora from 'ora'
import { scanRefactor } from 'wmx-os-scanners'
import type { RefactorReport, RefactorSuggestion } from 'wmx-os-scanners'

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

function printSuggestion(s: RefactorSuggestion): void {
  console.log('  ' + yellow(s.file) + gray(`  (${s.lines} lines)`))
  console.log('  ' + gray(s.reason))

  if (s.type === 'split-component') {
    console.log('  ' + white('Split into:'))
    for (const name of s.suggestedSplits) {
      console.log('    ' + cyan('● ') + white(name))
    }
  }
  console.log()
}

function printReport(report: RefactorReport): void {
  console.log()
  console.log(magenta(bold('  ╔══════════════════════════════════╗')))
  console.log(magenta(bold('  ║         WMX Refactor              ║')))
  console.log(magenta(bold('  ╚══════════════════════════════════╝')))
  console.log()
  console.log(gray(`  Files over ${report.threshold} lines`))
  console.log()

  if (report.suggestions.length === 0) {
    console.log(green('  ✔  No refactor suggestions — all files are a healthy size.'))
    console.log()
    return
  }

  for (const s of report.suggestions) {
    printSuggestion(s)
  }

  console.log(gray('─'.repeat(50)))
  console.log('  ' + bold(white(String(report.suggestions.length))) + gray(' file(s) flagged for refactoring'))
  console.log()
}

export function register(program: Command): void {
  program
    .command('refactor')
    .description('Scan the project and suggest refactor opportunities for large files/components')
    .option('--threshold <n>', 'Line count threshold to flag a file', '200')
    .option('--json', 'Output raw JSON')
    .action(async (opts: { threshold: string; json?: boolean }) => {
      const cwd = process.cwd()
      const threshold = Math.max(1, parseInt(opts.threshold, 10) || 200)
      const spinner = ora('Scanning project for refactor opportunities...').start()

      let report: RefactorReport
      try {
        report = await scanRefactor(cwd, threshold)
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
