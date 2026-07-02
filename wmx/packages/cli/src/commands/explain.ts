import type { Command } from 'commander'
import ora from 'ora'
import { explainProject } from 'wmx-os-scanners'
import type { ExplainResult, ProjectFlow } from 'wmx-os-scanners'

function colorize(text: string, code: number): string {
  return `\x1b[${code}m${text}\x1b[0m`
}

const gray    = (t: string) => colorize(t, 90)
const white   = (t: string) => colorize(t, 97)
const bold    = (t: string) => colorize(t, 1)
const magenta = (t: string) => colorize(t, 35)
const cyan    = (t: string) => colorize(t, 36)
const green   = (t: string) => colorize(t, 32)

function printFlow(flow: ProjectFlow): void {
  console.log(bold(cyan(`  ${flow.name}`)))
  console.log()
  flow.steps.forEach((step, i) => {
    console.log('  ' + white(step))
    if (i < flow.steps.length - 1) console.log('  ' + gray('↓'))
  })
  console.log()
}

function printReport(result: ExplainResult): void {
  console.log()
  console.log(magenta(bold('  ╔══════════════════════════════════╗')))
  console.log(magenta(bold('  ║          WMX Explain              ║')))
  console.log(magenta(bold('  ╚══════════════════════════════════╝')))
  console.log()

  console.log(bold('  Overview'))
  console.log('  ' + gray('─'.repeat(8)))
  console.log('  ' + gray('Framework:       ') + white(result.framework ?? 'unknown'))
  console.log('  ' + gray('Database:        ') + white(result.database ?? 'none detected'))
  console.log('  ' + gray('Package manager: ') + white(result.packageManager ?? 'unknown'))
  console.log()

  if (result.flows.length === 0) {
    console.log(gray('  No recognizable flows detected (auth / API / database signals not found).'))
    console.log()
    return
  }

  for (const flow of result.flows) {
    printFlow(flow)
  }

  console.log(green('  ✔ Explained ') + white(String(result.flows.length)) + green(' flow(s).'))
  console.log()
}

export function register(program: Command): void {
  program
    .command('explain')
    .description('Explain how the project works: architecture and key flows')
    .option('--json', 'Output raw JSON')
    .action(async (opts: { json?: boolean }) => {
      const cwd = process.cwd()
      const spinner = ora('Analyzing project...').start()

      let result: ExplainResult
      try {
        result = await explainProject(cwd)
      } catch (err) {
        spinner.fail('Analysis failed')
        console.error(err)
        process.exit(1)
      }

      spinner.stop()

      if (opts.json) {
        process.stdout.write(JSON.stringify(result, null, 2) + '\n')
        return
      }

      printReport(result)
    })
}
