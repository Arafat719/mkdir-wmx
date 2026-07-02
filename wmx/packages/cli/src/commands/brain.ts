import type { Command } from 'commander'
import ora from 'ora'
import fs from 'fs-extra'
import path from 'path'
import { buildBrain } from 'wmx-os-scanners'
import type { BrainContext } from 'wmx-os-scanners'

function colorize(text: string, code: number): string {
  return `\x1b[${code}m${text}\x1b[0m`
}

const gray    = (t: string) => colorize(t, 90)
const white   = (t: string) => colorize(t, 97)
const bold    = (t: string) => colorize(t, 1)
const magenta = (t: string) => colorize(t, 35)
const cyan    = (t: string) => colorize(t, 36)
const green   = (t: string) => colorize(t, 32)

export function register(program: Command): void {
  program
    .command('brain')
    .description('Build a local knowledge graph of the project: architecture, routes, components, and their dependencies')
    .option('--output <dir>', 'Output directory', '.wmx')
    .action(async (opts: { output: string }) => {
      const cwd = process.cwd()
      const outputDir = path.resolve(cwd, opts.output)
      const spinner = ora('Scanning project into a knowledge graph...').start()

      let brain: BrainContext
      try {
        brain = await buildBrain(cwd)
      } catch (err) {
        spinner.fail('Scan failed')
        console.error(err)
        process.exit(1)
      }

      await fs.ensureDir(outputDir)
      await fs.writeJson(path.join(outputDir, 'brain.json'), brain, { spaces: 2 })

      spinner.stop()

      console.log()
      console.log(magenta(bold('  ╔══════════════════════════════════╗')))
      console.log(magenta(bold('  ║           WMX Brain               ║')))
      console.log(magenta(bold('  ╚══════════════════════════════════╝')))
      console.log()
      console.log('  ' + gray('Project:    ') + white(brain.projectName))
      console.log('  ' + gray('Modules:    ') + white(String(brain.modules.length)))
      console.log('  ' + gray('Routes:     ') + white(String(brain.routes.length + brain.apiRoutes.length)))
      console.log('  ' + gray('Components: ') + white(String(brain.components.length)))
      console.log('  ' + gray('Hooks:      ') + white(String(brain.hooks.length)))
      console.log('  ' + gray('Graph edges:') + white(' ' + String(brain.graphEdges.length)))
      console.log()

      const relOutput = path.relative(cwd, outputDir)
      console.log(`  ${green('✔')} Brain saved to ${cyan(relOutput + '/brain.json')}`)
      console.log()
    })
}
