import type { Command } from 'commander'
import ora from 'ora'
import { scanRelease } from 'wmx-os-scanners'
import type { ReleaseCheck, ReleaseReport } from 'wmx-os-scanners'

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
const red     = (t: string) => colorize(t, 31)

function statusIcon(status: ReleaseCheck['status']): string {
  if (status === 'pass') return green('✔')
  if (status === 'warn') return yellow('⚠')
  if (status === 'fail') return red('✘')
  return gray('○')
}

function printCheck(check: ReleaseCheck): void {
  console.log(`  ${statusIcon(check.status)}  ${white(check.label.padEnd(18))} ${gray(check.message)}`)
}

function scoreColor(score: number): (t: string) => string {
  if (score >= 80) return green
  if (score >= 50) return yellow
  return red
}

function printReport(report: ReleaseReport): void {
  console.log()
  console.log(magenta(bold('  ╔══════════════════════════════════╗')))
  console.log(magenta(bold('  ║       WMX Release Assistant       ║')))
  console.log(magenta(bold('  ╚══════════════════════════════════╝')))
  console.log()

  for (const check of report.checks) printCheck(check)
  console.log()

  const lh = report.lighthouseEstimate
  console.log(bold('  Lighthouse Estimate') + gray('  (heuristic — not a real Lighthouse run)'))
  console.log('  ' + gray('─'.repeat(19)))
  console.log('  ' + white('Performance:     ') + scoreColor(lh.performance)(String(lh.performance)))
  console.log('  ' + white('SEO:             ') + scoreColor(lh.seo)(String(lh.seo)))
  console.log('  ' + white('Best Practices:  ') + scoreColor(lh.bestPractices)(String(lh.bestPractices)))
  console.log('  ' + bold(white('Overall:         ')) + bold(scoreColor(lh.overall)(String(lh.overall))))
  console.log()

  const failed = report.checks.filter(c => c.status === 'fail').length
  const warned = report.checks.filter(c => c.status === 'warn').length

  if (report.readyToShip) {
    console.log(green(bold('  ✔ Ready to ship')) + gray(warned > 0 ? ` (${warned} warning(s) to review)` : ''))
  } else {
    console.log(red(bold(`  ✘ Not ready to ship — ${failed} failing check(s)`)))
  }
  console.log()
}

export function register(program: Command): void {
  program
    .command('release')
    .description('Run a pre-deploy release checklist: build, tests, SEO, security, performance, and more')
    .option('--skip-build', 'Skip running the build script')
    .option('--skip-tests', 'Skip running the test script')
    .option('--json', 'Output raw JSON')
    .action(async (opts: { skipBuild?: boolean; skipTests?: boolean; json?: boolean }) => {
      const cwd = process.cwd()
      const spinner = ora('Running release checklist...').start()

      let report: ReleaseReport
      try {
        report = await scanRelease(cwd, { skipBuild: opts.skipBuild, skipTests: opts.skipTests })
      } catch (err) {
        spinner.fail('Release check failed')
        console.error(err)
        process.exit(1)
      }

      spinner.stop()

      if (opts.json) {
        process.stdout.write(JSON.stringify(report, null, 2) + '\n')
        process.exit(report.readyToShip ? 0 : 1)
      }

      printReport(report)
      process.exit(report.readyToShip ? 0 : 1)
    })
}
