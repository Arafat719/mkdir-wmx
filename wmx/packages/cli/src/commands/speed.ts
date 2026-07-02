import type { Command } from 'commander'
import ora from 'ora'
import { scanPerformance } from 'wmx-os-scanners'
import type { PerformanceIssue, PerformanceReport } from 'wmx-os-scanners'

function colorize(text: string, code: number): string {
  return `\x1b[${code}m${text}\x1b[0m`
}

const gray    = (t: string) => colorize(t, 90)
const white   = (t: string) => colorize(t, 97)
const bold    = (t: string) => colorize(t, 1)
const magenta = (t: string) => colorize(t, 35)
const cyan    = (t: string) => colorize(t, 36)
const green   = (t: string) => colorize(t, 32)

function printIssue(issue: PerformanceIssue): void {
  console.log('  ' + bold(cyan(issue.file)))
  console.log('  ' + gray(`${issue.lines} lines`))
  console.log()
  console.log('  ' + white('Recommendation:'))
  for (const rec of issue.recommendations) {
    console.log('    ' + green('● ') + white(rec))
  }
  console.log()
}

function printReport(report: PerformanceReport): void {
  console.log()
  console.log(magenta(bold('  ╔══════════════════════════════════╗')))
  console.log(magenta(bold('  ║        WMX Performance            ║')))
  console.log(magenta(bold('  ╚══════════════════════════════════╝')))
  console.log()

  if (report.issues.length === 0) {
    console.log(green('  ✔  No performance issues detected.'))
    console.log()
    return
  }

  console.log(bold('  Largest Component' + (report.issues.length > 1 ? 's' : '')))
  console.log(gray('─'.repeat(18)))
  console.log()

  for (const issue of report.issues) {
    printIssue(issue)
  }

  console.log(gray('─'.repeat(50)))
  console.log('  ' + bold(white(String(report.issues.length))) + gray(' file(s) flagged for performance improvements'))
  console.log()
}

export function register(program: Command): void {
  program
    .command('speed')
    .description('Analyze React/Next components and suggest performance optimizations')
    .option('--threshold <n>', 'Line count threshold to flag a component', '200')
    .option('--json', 'Output raw JSON')
    .action(async (opts: { threshold: string; json?: boolean }) => {
      const cwd = process.cwd()
      const threshold = Math.max(1, parseInt(opts.threshold, 10) || 200)
      const spinner = ora('Analyzing performance...').start()

      let report: PerformanceReport
      try {
        report = await scanPerformance(cwd, threshold)
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
