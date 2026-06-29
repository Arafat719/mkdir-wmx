import type { Command } from 'commander'
import ora from 'ora'
import { scanStats } from 'wmx-os-scanners'
import type { ProjectStats } from 'wmx-os-scanners'

function colorize(text: string, code: number): string {
  return `\x1b[${code}m${text}\x1b[0m`
}

const gray   = (t: string) => colorize(t, 90)
const white  = (t: string) => colorize(t, 97)
const bold   = (t: string) => colorize(t, 1)
const purple = (t: string) => colorize(t, 35)
const cyan   = (t: string) => colorize(t, 36)
const green  = (t: string) => colorize(t, 32)
const yellow = (t: string) => colorize(t, 33)
const blue   = (t: string) => colorize(t, 34)

function pad(label: string, width: number): string {
  return label.padEnd(width)
}

function formatNumber(n: number): string {
  return n.toLocaleString()
}

function statRow(label: string, value: string | number, labelWidth = 22): string {
  return `  ${gray(pad(label, labelWidth))} ${bold(white(String(value)))}`
}

function typeBar(label: string, count: number, total: number, colorFn: (s: string) => string): string {
  if (total === 0) return ''
  const pct      = Math.round((count / total) * 100)
  const filled   = Math.round(pct / 5)
  const empty    = 20 - filled
  const bar      = colorFn('█'.repeat(filled)) + gray('░'.repeat(empty))
  const labelPad = label.padEnd(6)
  const pctPad   = `${pct}%`.padStart(4)
  return `  ${gray(labelPad)} [${bar}] ${gray(pctPad)}  ${gray(formatNumber(count) + ' files')}`
}

function printReport(stats: ProjectStats): void {
  console.log()
  console.log(purple(bold('  wmx project statistics')))
  console.log()

  const left: string[]  = []
  const right: string[] = []

  left.push(statRow('Source Files',    formatNumber(stats.sourceFiles)))
  left.push(statRow('Source Lines',    formatNumber(stats.sourceLines)))
  left.push(statRow('Total Files',     formatNumber(stats.totalFiles)))
  left.push(statRow('Total Lines',     formatNumber(stats.totalLines)))
  left.push(statRow('Components',      formatNumber(stats.components)))
  left.push(statRow('Pages',           formatNumber(stats.pages)))

  right.push(statRow('API Routes',     formatNumber(stats.routes)))
  right.push(statRow('Prod Deps',      formatNumber(stats.dependencies.prod)))
  right.push(statRow('Dev Deps',       formatNumber(stats.dependencies.dev)))
  right.push(statRow('Images',         formatNumber(stats.assets.images)))
  right.push(statRow('Fonts',          formatNumber(stats.assets.fonts)))
  right.push(statRow('SVGs',           formatNumber(stats.assets.svgs)))

  const rows = Math.max(left.length, right.length)
  for (let i = 0; i < rows; i++) {
    const l = left[i]  ?? ''
    const r = right[i] ?? ''
    const lVisible = l.replace(/\x1b\[[0-9;]*m/g, '')
    const lPad     = 42 - lVisible.length
    console.log(l + ' '.repeat(Math.max(0, lPad)) + r)
  }

  console.log()
  if (stats.largestFile.path) {
    console.log(
      `  ${gray('Largest File'.padEnd(22))} ${bold(white(stats.largestFile.path))} ` +
      gray(`(${formatNumber(stats.largestFile.lines)} lines)`)
    )
  }

  const { ts, tsx, js, jsx, css, other } = stats.fileTypes
  const sourceTotal = ts + tsx + js + jsx + css + other

  console.log()
  console.log(bold('  File Types'))
  if (sourceTotal > 0) {
    if (ts)    console.log(typeBar('.ts',    ts,    sourceTotal, cyan))
    if (tsx)   console.log(typeBar('.tsx',   tsx,   sourceTotal, blue))
    if (js)    console.log(typeBar('.js',    js,    sourceTotal, yellow))
    if (jsx)   console.log(typeBar('.jsx',   jsx,   sourceTotal, green))
    if (css)   console.log(typeBar('.css',   css,   sourceTotal, purple))
    if (other) console.log(typeBar('other',  other, sourceTotal, (s) => colorize(s, 90)))
  } else {
    console.log(gray('  No source files found'))
  }

  console.log()
}

export function register(program: Command): void {
  program
    .command('stats')
    .description('Display detailed statistics about the current project')
    .option('--json', 'Output results as JSON')
    .action(async (opts: { json?: boolean }) => {
      const spinner = ora('Analyzing project...').start()

      let stats: ProjectStats
      try {
        stats = await scanStats(process.cwd())
      } catch (err) {
        spinner.fail('Analysis failed')
        console.error(err)
        process.exit(1)
      }

      spinner.stop()

      if (opts.json) {
        process.stdout.write(JSON.stringify(stats, null, 2) + '\n')
        process.exit(0)
      }

      printReport(stats)
    })
}
