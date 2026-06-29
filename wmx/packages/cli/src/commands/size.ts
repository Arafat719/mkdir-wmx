import type { Command } from 'commander'
import ora from 'ora'
import fs from 'fs/promises'
import path from 'path'

function colorize(text: string, code: number): string {
  return `\x1b[${code}m${text}\x1b[0m`
}

const gray    = (t: string) => colorize(t, 90)
const white   = (t: string) => colorize(t, 97)
const bold    = (t: string) => colorize(t, 1)
const magenta = (t: string) => colorize(t, 35)
const cyan    = (t: string) => colorize(t, 36)
const yellow  = (t: string) => colorize(t, 33)
const purple  = (t: string) => colorize(t, 35)

const SOURCE_EXTS = new Set(['.ts', '.tsx', '.js', '.jsx'])
const IMAGE_EXTS  = new Set(['.png', '.jpg', '.jpeg', '.gif', '.webp'])
const CSS_EXTS    = new Set(['.css'])

const IGNORE_DIRS = new Set([
  'node_modules', '.git', 'dist', 'build', '.next', '.wmx', 'coverage', '.turbo',
])

interface FileEntry {
  file:   string
  lines?: number
  bytes?: number
}

interface SizeReport {
  sources: FileEntry[]
  images:  FileEntry[]
  css:     FileEntry[]
}

async function walk(dir: string, cwd: string, results: string[]): Promise<void> {
  try {
    const entries = await fs.readdir(dir, { withFileTypes: true })
    for (const entry of entries) {
      if (IGNORE_DIRS.has(entry.name)) continue
      const fullPath = path.join(dir, entry.name)
      if (entry.isDirectory()) {
        await walk(fullPath, cwd, results)
      } else if (entry.isFile()) {
        results.push(path.relative(cwd, fullPath))
      }
    }
  } catch {
    return
  }
}

async function countLines(absPath: string): Promise<number> {
  try {
    const content = await fs.readFile(absPath, 'utf8')
    return content.split('\n').length
  } catch {
    return 0
  }
}

async function buildReport(cwd: string, topN: number): Promise<SizeReport> {
  const allFiles: string[] = []
  await walk(cwd, cwd, allFiles)

  const sourcePaths = allFiles.filter(f => SOURCE_EXTS.has(path.extname(f).toLowerCase()))
  const imagePaths  = allFiles.filter(f => IMAGE_EXTS.has(path.extname(f).toLowerCase()))
  const cssPaths    = allFiles.filter(f => CSS_EXTS.has(path.extname(f).toLowerCase()))

  const [sourceEntries, imageEntries, cssEntries] = await Promise.all([
    Promise.all(sourcePaths.map(async f => ({
      file:  f,
      lines: await countLines(path.join(cwd, f)),
    }))),
    Promise.all(imagePaths.map(async f => {
      try {
        const stat = await fs.stat(path.join(cwd, f))
        return { file: f, bytes: stat.size }
      } catch {
        return { file: f, bytes: 0 }
      }
    })),
    Promise.all(cssPaths.map(async f => ({
      file:  f,
      lines: await countLines(path.join(cwd, f)),
    }))),
  ])

  sourceEntries.sort((a, b) => (b.lines ?? 0) - (a.lines ?? 0))
  imageEntries.sort((a, b)  => (b.bytes ?? 0) - (a.bytes ?? 0))
  cssEntries.sort((a, b)    => (b.lines ?? 0) - (a.lines ?? 0))

  return {
    sources: sourceEntries.slice(0, topN),
    images:  imageEntries.slice(0, topN),
    css:     cssEntries.slice(0, topN),
  }
}

function formatBytes(bytes: number): string {
  if (bytes >= 1024 * 1024) return (bytes / (1024 * 1024)).toFixed(1) + ' MB'
  if (bytes >= 1024)        return Math.round(bytes / 1024) + ' KB'
  return bytes + ' B'
}

function printSection(
  title: string,
  entries: FileEntry[],
  valueFn: (e: FileEntry) => string,
  pathColor: (s: string) => string,
): void {
  console.log(magenta(bold('  ' + title)))
  console.log('  ' + gray('─'.repeat(title.length)))
  if (entries.length === 0) {
    console.log(gray('  None found.'))
  } else {
    const pathW = Math.min(Math.max(...entries.map(e => e.file.length), 20) + 4, 56)
    for (const entry of entries) {
      console.log('  ' + pathColor(entry.file.padEnd(pathW)) + bold(white(valueFn(entry))))
    }
  }
  console.log()
}

function printReport(report: SizeReport): void {
  console.log()
  console.log(magenta(bold('  ╔══════════════════════════════════╗')))
  console.log(magenta(bold('  ║          WMX Size Report         ║')))
  console.log(magenta(bold('  ╚══════════════════════════════════╝')))
  console.log()

  printSection(
    'Largest JS Files',
    report.sources,
    e => (e.lines ?? 0).toLocaleString() + ' lines',
    cyan,
  )

  printSection(
    'Largest Images',
    report.images,
    e => formatBytes(e.bytes ?? 0),
    yellow,
  )

  printSection(
    'Largest CSS',
    report.css,
    e => (e.lines ?? 0).toLocaleString() + ' lines',
    purple,
  )
}

export function register(program: Command): void {
  program
    .command('size')
    .description('Show the largest JS, CSS, and image files in the project')
    .option('--top <n>', 'Number of files to show per section', '5')
    .option('--json', 'Output raw JSON')
    .action(async (opts: { top: string; json?: boolean }) => {
      const cwd    = process.cwd()
      const topN   = Math.max(1, parseInt(opts.top, 10) || 5)
      const spinner = ora('Scanning file sizes...').start()

      let report: SizeReport
      try {
        report = await buildReport(cwd, topN)
      } catch (err) {
        spinner.fail('Scan failed')
        console.error(err)
        process.exit(1)
      }

      spinner.stop()

      if (opts.json) {
        process.stdout.write(JSON.stringify(report, null, 2) + '\n')
        process.exit(0)
      }

      printReport(report)
    })
}
