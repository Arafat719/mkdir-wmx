import type { Command } from 'commander'
import ora from 'ora'
import path from 'path'
import chalk from 'chalk'
import fs from 'fs-extra'
import { analyzeProject } from 'wmx-os-scanners'
import { generateReadme, generateArchitectureDocs, generateApiDocs } from 'wmx-os-generators'

export function register(program: Command): void {
  program
    .command('docs')
    .description('Generate project documentation files')
    .option('--readme', 'Generate README.md only')
    .option('--arch', 'Generate ARCHITECTURE.md only')
    .option('--api', 'Generate API.md only')
    .option('--all', 'Generate all documentation files (default)')
    .option('--output <dir>', 'Output directory', process.cwd())
    .option('--overwrite', 'Overwrite existing files (default: skip with warning)')
    .action(async (opts: {
      readme?: boolean
      arch?: boolean
      api?: boolean
      all?: boolean
      output: string
      overwrite?: boolean
    }) => {
      const flaggedReadme = opts.readme ?? false
      const flaggedArch   = opts.arch   ?? false
      const flaggedApi    = opts.api    ?? false
      const flaggedAll    = opts.all    ?? false

      // If no flags passed at all, treat as --all
      const doAll    = flaggedAll || (!flaggedReadme && !flaggedArch && !flaggedApi)
      const doReadme = doAll || flaggedReadme
      const doArch   = doAll || flaggedArch
      const doApi    = doAll || flaggedApi

      const projectRoot = process.cwd()
      const outputDir   = path.resolve(opts.output)

      // Run the analyzer once if we need architecture or API docs
      let analysis: Awaited<ReturnType<typeof analyzeProject>> | undefined
      if (doArch || doApi) {
        const spinner = ora('Analyzing project...').start()
        try {
          analysis = await analyzeProject(projectRoot)
          spinner.stop()
        } catch (err) {
          spinner.fail('Analysis failed')
          console.error(err)
          process.exit(1)
        }
      }

      type FileTask = { name: string; generate: () => string | Promise<string> }
      const tasks: FileTask[] = []

      if (doReadme) {
        tasks.push({ name: 'README.md',       generate: () => generateReadme(projectRoot) })
      }
      if (doArch && analysis) {
        tasks.push({ name: 'ARCHITECTURE.md', generate: () => generateArchitectureDocs(analysis!) })
      }
      if (doApi && analysis) {
        tasks.push({ name: 'API.md',          generate: () => generateApiDocs(analysis!.routes) })
      }

      for (const task of tasks) {
        const spinner    = ora(`Writing ${task.name}...`).start()
        const outputPath = path.join(outputDir, task.name)

        const exists = await fs.pathExists(outputPath)
        if (exists && !opts.overwrite) {
          spinner.warn()
          console.log(chalk.yellow(`⚠  ${task.name} already exists. Use --overwrite to replace it.`))
          continue
        }

        const content = await task.generate()
        await fs.outputFile(outputPath, content, 'utf8')
        spinner.succeed()
        console.log(chalk.green(`✔  ${task.name} written to ${outputPath}`))
      }

      console.log(chalk.green('docs complete.'))
    })
}
