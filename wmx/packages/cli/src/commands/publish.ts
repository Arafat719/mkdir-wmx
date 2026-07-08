import type { Command } from 'commander'
import chalk from 'chalk'
import ora from 'ora'
import { execa } from 'execa'
import inquirer from 'inquirer'
import fs from 'fs-extra'
import path from 'path'

interface PublishConfig {
  currentVersion: string
  newVersion: string
  bumpType: 'patch' | 'minor' | 'major'
  packageName: string
  changelogEntries: string[]
}

function bumpVersion(current: string, type: 'patch' | 'minor' | 'major'): string {
  const parts = current.split('.').map(Number)
  let [major, minor, patch] = parts
  if (type === 'patch') {
    patch += 1
  } else if (type === 'minor') {
    minor += 1
    patch = 0
  } else {
    major += 1
    minor = 0
    patch = 0
  }
  return `${major}.${minor}.${patch}`
}

function detectPackageManager(cwd: string): string {
  if (fs.pathExistsSync(path.join(cwd, 'pnpm-lock.yaml')))   return 'pnpm'
  if (fs.pathExistsSync(path.join(cwd, 'yarn.lock')))         return 'yarn'
  return 'npm'
}

async function getGitLogSinceLastTag(cwd: string): Promise<string[]> {
  const describeResult = await execa('git', ['describe', '--tags', '--abbrev=0'], { cwd, reject: false })
  let logResult
  if (describeResult.exitCode === 0 && describeResult.stdout.trim() !== '') {
    const lastTag = describeResult.stdout.trim()
    logResult = await execa('git', ['log', `${lastTag}..HEAD`, '--oneline'], { cwd, reject: false })
  } else {
    logResult = await execa('git', ['log', '--oneline'], { cwd, reject: false })
  }
  if (!logResult.stdout || logResult.exitCode !== 0) return []
  return logResult.stdout.split('\n').filter((line: string) => line.trim() !== '')
}

async function updateChangelog(cwd: string, version: string, entries: string[]): Promise<void> {
  const changelogPath = path.join(cwd, 'CHANGELOG.md')
  const date = new Date().toISOString().split('T')[0]
  const newSection = `## [${version}] — ${date}\n\n${entries.map(e => `- ${e}`).join('\n')}\n\n`

  let existing = ''
  if (await fs.pathExists(changelogPath)) {
    existing = await fs.readFile(changelogPath, 'utf-8')
  }

  const header = '# Changelog\n\nAll notable changes to this project will be documented here.\n\n'
  let content: string
  if (!existing || !existing.startsWith('# Changelog')) {
    content = header + newSection + existing
  } else {
    const afterHeader = existing.indexOf('\n\n') + 2
    content = existing.slice(0, afterHeader) + newSection + existing.slice(afterHeader)
  }

  await fs.outputFile(changelogPath, content)
}

export function register(program: Command): void {
  program
    .command('publish')
    .description('Bump version, update changelog, tag, and publish to npm')
    .option('--dry-run', 'Preview all steps without making any changes')
    .option('--skip-build', 'Skip the build step before publishing')
    .option('--skip-git', 'Skip git commit and tag steps')
    .action(async (opts: { dryRun?: boolean; skipBuild?: boolean; skipGit?: boolean }) => {
      // Step 1 — Load package.json
      const cwd = process.cwd()
      const pkgPath = path.join(cwd, 'package.json')
      if (!(await fs.pathExists(pkgPath))) {
        console.log(chalk.red('No package.json found in current directory.'))
        process.exit(1)
      }
      const pkg = await fs.readJson(pkgPath)
      const currentVersion: string = pkg.version ?? '0.0.0'
      const packageName: string = pkg.name ?? 'unknown'

      // Step 2 — Choose bump type
      console.log(chalk.cyan('Current version: ') + chalk.white.bold(currentVersion))
      console.log()
      const { bumpType } = await inquirer.prompt<{ bumpType: 'patch' | 'minor' | 'major' }>([
        {
          type: 'list',
          name: 'bumpType',
          message: 'Select version bump type:',
          choices: [
            {
              name: `patch  — ${currentVersion} → ${bumpVersion(currentVersion, 'patch')}  (bug fixes)`,
              value: 'patch',
            },
            {
              name: `minor  — ${currentVersion} → ${bumpVersion(currentVersion, 'minor')}  (new features)`,
              value: 'minor',
            },
            {
              name: `major  — ${currentVersion} → ${bumpVersion(currentVersion, 'major')}  (breaking changes)`,
              value: 'major',
            },
          ],
        },
      ])
      const newVersion = bumpVersion(currentVersion, bumpType)

      // Step 3 — Collect git log entries
      const gitSpinner = ora('Reading git history...').start()
      let changelogEntries = await getGitLogSinceLastTag(cwd)
      gitSpinner.stop()
      if (changelogEntries.length === 0) {
        changelogEntries = [`Release v${newVersion}`]
      }

      // Step 4 — Preview summary
      console.log()
      console.log(chalk.cyan.bold('Publish Summary'))
      console.log(chalk.gray('─'.repeat(40)))
      console.log(chalk.white('  Package : ') + chalk.yellow(packageName))
      console.log(chalk.white('  Version : ') + chalk.yellow(currentVersion) + chalk.gray(' → ') + chalk.green(newVersion))
      console.log(chalk.white('  Changes : ') + chalk.yellow(`${changelogEntries.length} commit(s)`))
      const displayed = changelogEntries.slice(0, 5)
      for (const entry of displayed) {
        console.log(chalk.gray('    - ' + entry))
      }
      if (changelogEntries.length > 5) {
        console.log(chalk.gray(`    ...and ${changelogEntries.length - 5} more`))
      }
      console.log(chalk.white('  Files   : ') + chalk.yellow('package.json, CHANGELOG.md'))
      if (!opts.skipGit) {
        console.log(chalk.white('  Git     : ') + chalk.yellow(`commit + tag v${newVersion}`))
      }
      if (!opts.skipBuild) {
        console.log(chalk.white('  Build   : ') + chalk.yellow('pnpm run build'))
      }
      console.log(chalk.white('  Publish : ') + chalk.yellow('npm publish --access public'))
      console.log()

      // Step 5 — Dry run exit
      if (opts.dryRun) {
        console.log(chalk.blue('ℹ  Dry run complete. No changes were made.'))
        process.exit(0)
      }

      // Step 6 — Final confirm
      const { confirmed } = await inquirer.prompt<{ confirmed: boolean }>([
        {
          type: 'confirm',
          name: 'confirmed',
          message: `Publish ${packageName}@${newVersion}?`,
          default: false,
        },
      ])
      if (!confirmed) {
        console.log(chalk.gray('Publish cancelled.'))
        process.exit(0)
      }

      // Step 7 — Bump version in package.json
      const pkgSpinner = ora('Updating package.json...').start()
      pkg.version = newVersion
      await fs.writeJson(pkgPath, pkg, { spaces: 2 })
      pkgSpinner.succeed()
      console.log(chalk.green(`✔  package.json → v${newVersion}`))

      // Step 8 — Update CHANGELOG.md
      const changelogSpinner = ora('Updating CHANGELOG.md...').start()
      await updateChangelog(cwd, newVersion, changelogEntries)
      changelogSpinner.succeed()
      console.log(chalk.green('✔  CHANGELOG.md updated'))

      // Step 9 — Build (unless --skip-build)
      if (!opts.skipBuild) {
        const buildSpinner = ora('Running build...').start()
        const packageManager = detectPackageManager(cwd)
        const result = await execa(packageManager, ['run', 'build'], { cwd, reject: false })
        if (result.exitCode !== 0) {
          buildSpinner.fail('Build failed.')
          console.log(chalk.red(result.stderr || result.stdout))
          console.log(chalk.red('Publish aborted. Fix build errors and try again.'))
          process.exit(1)
        }
        buildSpinner.succeed()
        console.log(chalk.green('✔  Build passed'))
      }

      // Step 10 — Git commit and tag (unless --skip-git)
      if (!opts.skipGit) {
        const gitCommitSpinner = ora('Creating git commit and tag...').start()

        await execa('git', ['add', 'package.json', 'CHANGELOG.md'], { cwd, reject: false })

        const commitResult = await execa('git', ['commit', '-m', `chore: release v${newVersion}`], { cwd, reject: false })
        if (commitResult.exitCode !== 0 && !commitResult.stderr.includes('nothing to commit')) {
          gitCommitSpinner.fail('Git commit failed.')
          console.log(chalk.red(commitResult.stderr))
          process.exit(1)
        }

        const tagResult = await execa('git', ['tag', `v${newVersion}`], { cwd, reject: false })
        if (tagResult.exitCode !== 0) {
          gitCommitSpinner.fail(`Git tag v${newVersion} failed.`)
          console.log(chalk.red(tagResult.stderr))
          process.exit(1)
        }

        gitCommitSpinner.succeed()
        console.log(chalk.green(`✔  Git commit + tag v${newVersion} created`))
        console.log(chalk.gray('   To push: git push && git push --tags'))
      }

      // Step 11 — npm publish
      const publishSpinner = ora('Publishing to npm...').start()
      const publishResult = await execa('npm', ['publish', '--access', 'public'], { cwd, reject: false })
      if (publishResult.exitCode !== 0) {
        publishSpinner.fail('npm publish failed.')
        console.log(chalk.red(publishResult.stderr || publishResult.stdout))
        process.exit(1)
      }
      publishSpinner.succeed()
      console.log(chalk.green(`✔  ${packageName}@${newVersion} published to npm!`))
      console.log()
      console.log(chalk.cyan('Install with:'))
      console.log(chalk.white(`  npm install ${packageName}`))
      console.log(chalk.white(`  npx ${packageName} --help`))
    })
}
