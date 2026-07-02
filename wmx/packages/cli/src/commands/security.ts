import type { Command } from 'commander'
import ora from 'ora'
import { scanSecurity } from 'wmx-os-scanners'
import type { SecurityFinding, SecurityReport } from 'wmx-os-scanners'

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

const CATEGORY_LABEL: Record<SecurityFinding['category'], string> = {
  secret: 'API Key / Secret Leak',
  password: 'Hardcoded Password',
  'env-committed': '.env Committed to Git',
  xss: 'XSS Risk',
  'sql-injection': 'SQL Injection Risk',
  cors: 'CORS Misconfiguration',
  jwt: 'JWT Problem',
}

function severityColor(severity: SecurityFinding['severity']): (t: string) => string {
  if (severity === 'high') return red
  if (severity === 'medium') return yellow
  return gray
}

function printReport(report: SecurityReport): void {
  console.log()
  console.log(magenta(bold('  ╔══════════════════════════════════╗')))
  console.log(magenta(bold('  ║        WMX Security Audit        ║')))
  console.log(magenta(bold('  ╚══════════════════════════════════╝')))
  console.log()

  if (report.findings.length === 0) {
    console.log(green('  ✔  No security issues found.'))
    console.log()
    return
  }

  const grouped = new Map<SecurityFinding['category'], SecurityFinding[]>()
  for (const finding of report.findings) {
    const list = grouped.get(finding.category) ?? []
    list.push(finding)
    grouped.set(finding.category, list)
  }

  for (const [category, findings] of grouped) {
    const title = `${CATEGORY_LABEL[category]} (${findings.length})`
    console.log(bold(title))
    console.log(gray('─'.repeat(title.length)))
    for (const finding of findings) {
      const color = severityColor(finding.severity)
      console.log(
        '  ' + color(`●  [${finding.severity.toUpperCase()}]`) + ' ' +
        white(finding.message)
      )
      console.log('     ' + cyan(`${finding.file}:${finding.line}`) + '  ' + gray(finding.snippet))
    }
    console.log()
  }

  const high = report.findings.filter(f => f.severity === 'high').length
  const medium = report.findings.filter(f => f.severity === 'medium').length
  const low = report.findings.filter(f => f.severity === 'low').length

  console.log(gray('─'.repeat(50)))
  console.log(
    '  ' +
    bold(red(String(high))) + gray(' high, ') +
    bold(yellow(String(medium))) + gray(' medium, ') +
    bold(gray(String(low))) + gray(' low  — ') +
    bold(white(String(report.findings.length))) + gray(' total findings')
  )
  console.log()
}

export function register(program: Command): void {
  program
    .command('security')
    .description('Run a security audit: secrets, XSS, SQL injection, CORS, and JWT issues')
    .option('--json', 'Output raw JSON')
    .action(async (opts: { json?: boolean }) => {
      const cwd = process.cwd()
      const spinner = ora('Running security audit...').start()

      let report: SecurityReport
      try {
        report = await scanSecurity(cwd)
      } catch (err) {
        spinner.fail('Security audit failed')
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
