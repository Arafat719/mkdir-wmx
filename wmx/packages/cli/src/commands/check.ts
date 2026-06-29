import type { Command } from 'commander'
import { execa } from 'execa'
import { scanEnvFile } from 'wmx-os-scanners'

interface ToolResult {
  name: string
  required: boolean
  passed: boolean
  version: string | null
  error: string | null
}

interface EnvResult {
  key: string
  present: boolean
}

interface CheckReport {
  tools: ToolResult[]
  env: EnvResult[]
  issueCount: number
  allPassed: boolean
}

async function runTool(command: string, args: string[]): Promise<string | null> {
  try {
    const result = await execa(command, args, { reject: false })
    if (result.exitCode === 0) {
      return (result.stdout as string).trim().split('\n')[0]
    }
    return null
  } catch {
    return null
  }
}

function parseNodeVersion(raw: string): number | null {
  const match = raw.match(/v?(\d+)/)
  return match ? parseInt(match[1], 10) : null
}

async function checkTools(): Promise<ToolResult[]> {
  const results: ToolResult[] = []

  // Node.js — required, must be >= 18
  const nodeRaw = await runTool('node', ['--version'])
  if (nodeRaw === null) {
    results.push({ name: 'Node.js', required: true, passed: false, version: null, error: 'Not found' })
  } else {
    const major = parseNodeVersion(nodeRaw)
    if (major !== null && major >= 18) {
      results.push({ name: 'Node.js', required: true, passed: true, version: nodeRaw, error: null })
    } else {
      results.push({ name: 'Node.js', required: true, passed: false, version: nodeRaw, error: `Version ${nodeRaw} is below required v18` })
    }
  }

  // Git — required
  const gitRaw = await runTool('git', ['--version'])
  if (gitRaw === null) {
    results.push({ name: 'Git', required: true, passed: false, version: null, error: 'Not found' })
  } else {
    results.push({ name: 'Git', required: true, passed: true, version: gitRaw, error: null })
  }

  // npm — optional
  const npmRaw = await runTool('npm', ['--version'])
  results.push({ name: 'npm', required: false, passed: npmRaw !== null, version: npmRaw ? `v${npmRaw}` : null, error: npmRaw ? null : 'Not found' })

  // pnpm — optional
  const pnpmRaw = await runTool('pnpm', ['--version'])
  results.push({ name: 'pnpm', required: false, passed: pnpmRaw !== null, version: pnpmRaw ? `v${pnpmRaw}` : null, error: pnpmRaw ? null : 'Not found' })

  // bun — optional
  const bunRaw = await runTool('bun', ['--version'])
  results.push({ name: 'bun', required: false, passed: bunRaw !== null, version: bunRaw ? `v${bunRaw}` : null, error: bunRaw ? null : 'Not found' })

  // Docker — optional
  const dockerRaw = await runTool('docker', ['--version'])
  results.push({ name: 'Docker', required: false, passed: dockerRaw !== null, version: dockerRaw ?? null, error: dockerRaw ? null : 'Not found' })

  // mongosh — optional
  const mongoshRaw = await runTool('mongosh', ['--version'])
  results.push({ name: 'mongosh', required: false, passed: mongoshRaw !== null, version: mongoshRaw ?? null, error: mongoshRaw ? null : 'Not found' })

  return results
}

function colorize(text: string, code: number): string {
  return `\x1b[${code}m${text}\x1b[0m`
}

const green  = (t: string) => colorize(t, 32)
const red    = (t: string) => colorize(t, 31)
const yellow = (t: string) => colorize(t, 33)
const bold   = (t: string) => colorize(t, 1)
const purple = (t: string) => colorize(t, 35)

function printReport(tools: ToolResult[], env: EnvResult[], issueCount: number): void {
  console.log()
  console.log(purple(bold('  wmx environment check')))
  console.log()

  console.log(bold('  Tools'))
  for (const tool of tools) {
    if (tool.passed) {
      console.log(`  ${green('✔')} ${tool.name.padEnd(10)} ${green(tool.version ?? '')}`)
    } else if (tool.required) {
      console.log(`  ${red('✘')} ${tool.name.padEnd(10)} ${red(tool.error ?? 'MISSING')}`)
    } else {
      console.log(`  ${yellow('⚠')} ${tool.name.padEnd(10)} ${yellow('MISSING (optional)')}`)
    }
  }

  if (env.length > 0) {
    console.log()
    console.log(bold('  Environment variables (.env.example)'))
    for (const item of env) {
      if (item.present) {
        console.log(`  ${green('✔')} ${item.key}`)
      } else {
        console.log(`  ${red('✘')} ${item.key} ${red('MISSING in .env')}`)
      }
    }
  }

  console.log()
  if (issueCount === 0) {
    console.log(`  ${green('All checks passed')}`)
  } else {
    console.log(`  ${red(`${issueCount} issue${issueCount === 1 ? '' : 's'} found`)}`)
  }
  console.log()
}

export function register(program: Command): void {
  program
    .command('check')
    .description('Check your local environment for required and optional tools')
    .option('--json', 'Output results as JSON')
    .action(async (opts: { json?: boolean }) => {
      const tools = await checkTools()

      const envItems = await scanEnvFile(process.cwd())
      const env: EnvResult[] = envItems.map(item => ({
        key: item.key,
        present: item.present
      }))

      const requiredFailures = tools.filter(t => t.required && !t.passed).length
      const missingEnvKeys   = env.filter(e => !e.present).length
      const issueCount       = requiredFailures + missingEnvKeys
      const allPassed        = issueCount === 0

      if (opts.json) {
        const report: CheckReport = { tools, env, issueCount, allPassed }
        process.stdout.write(JSON.stringify(report, null, 2) + '\n')
        process.exit(allPassed ? 0 : 1)
      }

      printReport(tools, env, issueCount)
      process.exit(allPassed ? 0 : 1)
    })
}
