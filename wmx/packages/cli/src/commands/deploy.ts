import type { Command } from 'commander'
import path from 'path'
import chalk from 'chalk'
import ora from 'ora'
import fse from 'fs-extra'
import inquirer from 'inquirer'
import {
  generateVercelConfig,
  generateRenderConfig,
  generateNetlifyConfig,
} from 'wmx-os-generators'

const VALID_PROVIDERS = ['vercel', 'render', 'netlify'] as const
type Provider = typeof VALID_PROVIDERS[number]

export function register(program: Command): void {
  program
    .command('deploy')
    .description('Generate deployment config for your chosen provider')
    .option('--provider <name>', 'Deployment provider: vercel | render | netlify')
    .option('--output <dir>',    'Output directory (default: project root)')
    .action(async (opts: { provider?: string; output?: string }) => {
      // Step a — Load config
      const cwd = opts.output ? path.resolve(opts.output) : process.cwd()
      let config: Record<string, unknown> = {}
      try {
        config = await fse.readJson(path.join(cwd, '.wmxrc.json'))
      } catch {
        // config stays as {}
      }

      // Step b — Choose provider
      let provider: Provider

      if (opts.provider) {
        if (!VALID_PROVIDERS.includes(opts.provider as Provider)) {
          console.log(chalk.red(`Unknown provider "${opts.provider}". Choose: vercel, render, netlify`))
          process.exit(1)
        }
        provider = opts.provider as Provider
      } else {
        const { chosen } = await inquirer.prompt<{ chosen: Provider }>([
          {
            type: 'list',
            name: 'chosen',
            message: 'Choose a deployment provider:',
            choices: [
              { name: 'Vercel  (recommended for frontend + serverless)', value: 'vercel' },
              { name: 'Render  (fullstack, Docker-friendly)',             value: 'render' },
              { name: 'Netlify (static sites and JAMstack)',              value: 'netlify' },
            ],
          },
        ])
        provider = chosen
      }

      // Step c — Generate config and write file
      let filename: string

      if (provider === 'vercel') {
        filename = 'vercel.json'
        const outputPath = path.join(cwd, filename)
        const spinner = ora(`Generating ${filename}...`).start()
        const result = generateVercelConfig(config)
        await fse.writeJson(outputPath, result, { spaces: 2 })
        spinner.succeed()
        printSuccess(filename, outputPath)
        printNextSteps('vercel')
      } else if (provider === 'render') {
        filename = 'render.yaml'
        const outputPath = path.join(cwd, filename)
        const spinner = ora(`Generating ${filename}...`).start()
        const result = generateRenderConfig(config)
        await fse.outputFile(outputPath, result, 'utf-8')
        spinner.succeed()
        printSuccess(filename, outputPath)
        printNextSteps('render')
      } else {
        filename = 'netlify.toml'
        const outputPath = path.join(cwd, filename)
        const spinner = ora(`Generating ${filename}...`).start()
        const result = generateNetlifyConfig(config)
        await fse.outputFile(outputPath, result, 'utf-8')
        spinner.succeed()
        printSuccess(filename, outputPath)
        printNextSteps('netlify')
      }
    })
}

function printSuccess(filename: string, outputPath: string): void {
  console.log(chalk.green(`✔  ${filename} written to ${outputPath}`))
  console.log()
}

function printNextSteps(provider: Provider): void {
  if (provider === 'vercel') {
    console.log(chalk.cyan('Next steps:'))
    console.log(chalk.cyan('  1. Install Vercel CLI: npm i -g vercel'))
    console.log(chalk.cyan('  2. Run: vercel deploy'))
  } else if (provider === 'render') {
    console.log(chalk.cyan('Next steps:'))
    console.log(chalk.cyan('  1. Push your code to GitHub'))
    console.log(chalk.cyan('  2. Go to render.com → New → Blueprint'))
    console.log(chalk.cyan('  3. Connect your repo and upload render.yaml'))
  } else {
    console.log(chalk.cyan('Next steps:'))
    console.log(chalk.cyan('  1. Install Netlify CLI: npm i -g netlify-cli'))
    console.log(chalk.cyan('  2. Run: netlify deploy'))
    console.log(chalk.cyan('  OR connect your repo at netlify.com'))
  }
}
