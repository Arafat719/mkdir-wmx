import type { Command } from 'commander'
import ora from 'ora'
import path from 'path'
import { scanMemory } from 'wmx-os-scanners'
import type { ProjectMemory } from 'wmx-os-scanners'
import { writeMemoryDoc } from 'wmx-os-generators'

function colorize(text: string, code: number): string {
  return `\x1b[${code}m${text}\x1b[0m`
}

const gray    = (t: string) => colorize(t, 90)
const white   = (t: string) => colorize(t, 97)
const bold    = (t: string) => colorize(t, 1)
const magenta = (t: string) => colorize(t, 35)
const cyan    = (t: string) => colorize(t, 36)
const green   = (t: string) => colorize(t, 32)

function printSummary(memory: ProjectMemory): void {
  console.log()
  console.log(magenta(bold('  ╔══════════════════════════════════╗')))
  console.log(magenta(bold('  ║        WMX Project Memory         ║')))
  console.log(magenta(bold('  ╚══════════════════════════════════╝')))
  console.log()

  console.log(bold('  Project Summary'))
  console.log('  ' + gray('─'.repeat(15)))
  console.log('  ' + gray('Name:            ') + white(memory.projectName))
  console.log('  ' + gray('Framework:       ') + white(memory.framework ?? 'unknown'))
  console.log('  ' + gray('Database:        ') + white(memory.database ?? 'none detected'))
  console.log('  ' + gray('Package manager: ') + white(memory.packageManager ?? 'unknown'))
  console.log()

  console.log(bold('  Contents'))
  console.log('  ' + gray('─'.repeat(8)))
  console.log('  ' + cyan(String(memory.routes.length).padStart(4)) + gray('  page routes'))
  console.log('  ' + cyan(String(memory.apiRoutes.length).padStart(4)) + gray('  API endpoints'))
  console.log('  ' + cyan(String(memory.components.length).padStart(4)) + gray('  components'))
  console.log('  ' + cyan(String(memory.hooks.length).padStart(4)) + gray('  hooks'))
  console.log()

  console.log(bold('  Coding Style'))
  console.log('  ' + gray('─'.repeat(12)))
  console.log('  ' + gray(`Quotes: ${memory.codingStyle.quotes}, Semicolons: ${memory.codingStyle.semicolons ? 'yes' : 'no'}, Indent: ${memory.codingStyle.indent}`))
  console.log()

  console.log(bold('  Naming Convention'))
  console.log('  ' + gray('─'.repeat(17)))
  console.log('  ' + gray(`Components: ${memory.namingConvention.componentFiles}, Files: ${memory.namingConvention.generalFiles}`))
  console.log()
}

export function register(program: Command): void {
  program
    .command('memory')
    .description('Generate an AI-readable project memory file (architecture, routes, components, style)')
    .option('--output <dir>', 'Output directory for the memory file', '.wmx')
    .option('--json', 'Output raw JSON instead of writing files')
    .action(async (opts: { output: string; json?: boolean }) => {
      const cwd = process.cwd()
      const outputDir = path.resolve(cwd, opts.output)
      const spinner = ora('Building project memory...').start()

      let memory: ProjectMemory
      try {
        memory = await scanMemory(cwd)
      } catch (err) {
        spinner.fail('Scan failed')
        console.error(err)
        process.exit(1)
      }

      spinner.stop()

      if (opts.json) {
        process.stdout.write(JSON.stringify(memory, null, 2) + '\n')
        return
      }

      printSummary(memory)

      try {
        await writeMemoryDoc(memory, outputDir)
      } catch (err) {
        console.error('Failed to write memory files:', err)
        process.exit(1)
      }

      const relOutput = path.relative(cwd, outputDir)
      console.log(`  ${green('✔')} Memory saved to ${cyan(relOutput + '/memory.md')} and ${cyan(relOutput + '/memory.json')}`)
      console.log(gray('  Feed memory.md to an AI assistant to give it instant project context.'))
      console.log()
    })
}
