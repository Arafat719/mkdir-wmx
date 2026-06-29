import type { Command } from 'commander'
import ora from 'ora'
import fs from 'fs/promises'
import path from 'path'
import { analyzeProject } from 'wmx-os-scanners'
import type { ExportEntry } from 'wmx-os-scanners'

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

const ASSET_EXTS = new Set([
  '.png', '.jpg', '.jpeg', '.gif', '.webp',
  '.svg',
  '.ttf', '.woff', '.woff2',
])

const IGNORE_DIRS = new Set([
  'node_modules', '.git', 'dist', 'build', '.next', '.wmx', 'coverage',
])

const SKIP_EXPORT_NAMES = new Set(['default', '_'])

interface UnusedResult {
  assets: string[]
  exports: ExportEntry[]
}

async function walkAssets(dir: string, cwd: string, results: string[]): Promise<void> {
  try {
    const entries = await fs.readdir(dir, { withFileTypes: true })
    for (const entry of entries) {
      if (IGNORE_DIRS.has(entry.name)) continue
      const fullPath = path.join(dir, entry.name)
      if (entry.isDirectory()) {
        await walkAssets(fullPath, cwd, results)
      } else if (entry.isFile()) {
        if (ASSET_EXTS.has(path.extname(entry.name).toLowerCase())) {
          results.push(path.relative(cwd, fullPath))
        }
      }
    }
  } catch {
    return
  }
}

function isAssetReferenced(assetFile: string, importTos: string[]): boolean {
  const basename = path.basename(assetFile)
  const normalised = assetFile.replace(/\\/g, '/')
  return importTos.some(to => to.includes(basename) || to.endsWith(normalised))
}

function isFileImported(exportFile: string, importTos: string[]): boolean {
  const normalised = exportFile.replace(/\\/g, '/').replace(/\.(ts|tsx|js|jsx)$/, '')
  const basename   = path.basename(normalised)
  return importTos.some(to => {
    const normTo = to.replace(/\\/g, '/')
    return normTo === normalised ||
           normTo.endsWith('/' + basename) ||
           normTo === basename
  })
}

async function findUnused(cwd: string): Promise<UnusedResult> {
  const assetFiles: string[] = []

  const [analysis] = await Promise.all([
    analyzeProject(cwd),
    walkAssets(cwd, cwd, assetFiles),
  ])

  const importTos = analysis.imports.map(i => i.to)

  const unusedAssets = assetFiles.filter(f => !isAssetReferenced(f, importTos))

  const unusedExports = analysis.exports.filter(exp => {
    if (SKIP_EXPORT_NAMES.has(exp.name)) return false
    if (exp.name.startsWith('__')) return false
    return !isFileImported(exp.file, importTos)
  })

  return { assets: unusedAssets, exports: unusedExports }
}

function printUnused(result: UnusedResult, showFiles: boolean, showExports: boolean): void {
  console.log()
  console.log(magenta(bold('  ╔══════════════════════════════════╗')))
  console.log(magenta(bold('  ║        WMX Unused Scanner        ║')))
  console.log(magenta(bold('  ╚══════════════════════════════════╝')))
  console.log()

  if (showFiles) {
    console.log(magenta(bold('  Unused Assets')))
    console.log('  ' + gray('─'.repeat(13)))
    if (result.assets.length === 0) {
      console.log(green('  ✔  No unused assets found.'))
    } else {
      for (const f of result.assets) {
        console.log('  ' + yellow(f))
      }
    }
    console.log()
  }

  if (showExports) {
    console.log(magenta(bold('  Unused Exports')))
    console.log('  ' + gray('─'.repeat(14)))
    console.log(gray('  (static analysis only — dynamic imports may not be detected)'))
    if (result.exports.length === 0) {
      console.log(green('  ✔  No unused exports found.'))
    } else {
      const nameW = Math.min(Math.max(...result.exports.map(e => e.name.length), 12), 30)
      for (const exp of result.exports) {
        console.log('  ' + cyan(exp.name.padEnd(nameW + 2)) + gray(exp.file))
      }
    }
    console.log()
  }

  if (showFiles && showExports) {
    console.log('  ' + gray('─'.repeat(50)))
    console.log()
    console.log(
      '  ' +
      bold(white(String(result.assets.length)))  + gray(' unused assets, ') +
      bold(white(String(result.exports.length))) + gray(' unused exports')
    )
    console.log()
  }
}

export function register(program: Command): void {
  program
    .command('unused')
    .description('Find unused asset files and exports in the project')
    .option('--files',   'Show only unused asset files (images, SVGs, fonts)')
    .option('--exports', 'Show only unused exports')
    .option('--json',    'Output raw JSON')
    .action(async (opts: { files?: boolean; exports?: boolean; json?: boolean }) => {
      const showAll     = !opts.files && !opts.exports
      const showFiles   = showAll || (opts.files   ?? false)
      const showExports = showAll || (opts.exports ?? false)

      const cwd     = process.cwd()
      const spinner = ora('Scanning for unused assets and exports...').start()

      let result: UnusedResult
      try {
        result = await findUnused(cwd)
      } catch (err) {
        spinner.fail('Scan failed')
        console.error(err)
        process.exit(1)
      }

      spinner.stop()

      if (opts.json) {
        const output: Partial<UnusedResult> = {}
        if (showFiles)   output.assets  = result.assets
        if (showExports) output.exports = result.exports
        process.stdout.write(JSON.stringify(output, null, 2) + '\n')
        process.exit(0)
      }

      printUnused(result, showFiles, showExports)
    })
}
