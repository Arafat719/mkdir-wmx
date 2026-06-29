import type { Command } from 'commander'
import ora from 'ora'
import { scanProject } from 'wmx-os-scanners'
import type { ProjectIssue } from 'wmx-os-scanners'

function colorize(text: string, code: number): string {
  return `\x1b[${code}m${text}\x1b[0m`
}

const green  = (t: string) => colorize(t, 32)
const red    = (t: string) => colorize(t, 31)
const yellow = (t: string) => colorize(t, 33)
const blue   = (t: string) => colorize(t, 34)
const gray   = (t: string) => colorize(t, 90)
const bold   = (t: string) => colorize(t, 1)
const purple = (t: string) => colorize(t, 35)

function scoreLabel(score: number): string {
  if (score >= 80) return green('HEALTHY')
  if (score >= 50) return yellow('NEEDS ATTENTION')
  return red('CRITICAL')
}

function scoreBar(score: number): string {
  const filled = Math.round(score / 5)   // out of 20 segments
  const empty  = 20 - filled
  const bar    = '█'.repeat(filled) + '░'.repeat(empty)
  if (score >= 80) return green(bar)
  if (score >= 50) return yellow(bar)
  return red(bar)
}

function printIssue(issue: ProjectIssue): void {
  let icon: string
  if (issue.type === 'error') icon = red('✘')
  else if (issue.type === 'warn') icon = yellow('⚠')
  else icon = blue('ℹ')

  console.log(`  ${icon}  ${gray(issue.code.padEnd(10))}  ${issue.message}`)
  if (issue.fix) {
    console.log(`           ${gray('↳ fix:')} ${issue.fix}`)
  }
}

function printReport(issues: ProjectIssue[]): void {
  const timestamp = new Date().toLocaleString()

  console.log()
  console.log(purple(bold(`  wmx doctor report`)) + gray(`  ${timestamp}`))
  console.log()

  const errors   = issues.filter(i => i.type === 'error')
  const warnings = issues.filter(i => i.type === 'warn')
  const infos    = issues.filter(i => i.type === 'info')

  if (errors.length > 0) {
    console.log(red(bold(`  ERRORS (${errors.length})`)))
    for (const issue of errors) printIssue(issue)
    console.log()
  }

  if (warnings.length > 0) {
    console.log(yellow(bold(`  WARNINGS (${warnings.length})`)))
    for (const issue of warnings) printIssue(issue)
    console.log()
  }

  if (infos.length > 0) {
    console.log(blue(bold(`  INFO (${infos.length})`)))
    for (const issue of infos) printIssue(issue)
    console.log()
  }

  if (issues.length === 0) {
    console.log(green('  No issues found — project looks healthy!'))
    console.log()
  }

  const score = Math.max(0, 100 - errors.length * 10 - warnings.length * 3)

  console.log(bold('  Health Score'))
  console.log(`  ${scoreBar(score)} ${bold(String(score))}/100  ${scoreLabel(score)}`)
  console.log()
}

export function register(program: Command): void {
  program
    .command('doctor')
    .description('Scan the current project for errors, warnings, and health issues')
    .option('--fix',  'Attempt to auto-fix detected issues')
    .option('--json', 'Output results as JSON')
    .action(async (opts: { fix?: boolean; json?: boolean }) => {
      const spinner = ora('Scanning project...').start()

      let issues: ProjectIssue[]
      try {
        issues = await scanProject(process.cwd())
      } catch (err) {
        spinner.fail('Scan failed')
        console.error(err)
        process.exit(1)
      }

      spinner.stop()

      if (opts.json) {
        process.stdout.write(JSON.stringify(issues, null, 2) + '\n')
        process.exit(0)
      }

      if (opts.fix) {
        for (const issue of issues) {
          console.log(`  Auto-fix for ${issue.code} coming soon`)
        }
        console.log()
      }

      printReport(issues)

      const hasErrors = issues.some(i => i.type === 'error')
      process.exit(hasErrors ? 1 : 0)
    })
}
