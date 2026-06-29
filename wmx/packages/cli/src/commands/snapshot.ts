import type { Command } from 'commander'
import path from 'path'
import chalk from 'chalk'
import ora from 'ora'
import fse from 'fs-extra'
import { execa } from 'execa'
import inquirer from 'inquirer'
import { scanStats } from 'wmx-os-scanners'

interface Snapshot {
  name: string
  timestamp: string
  nodeVersion: string
  dependencies: Record<string, string>
  devDependencies: Record<string, string>
  wmxConfig: object
  stats: { fileCount: number; totalLines: number }
  gitCommit: string
}

const COL = { NAME: 24, DATE: 24, FILES: 8, LINES: 10, COMMIT: 10 }

export function register(program: Command): void {
  const snapshot = program
    .command('snapshot')
    .description('Save and restore project state snapshots')

  // ── save ─────────────────────────────────────────────────────────────────────

  snapshot
    .command('save [name]')
    .description('Save a snapshot of the current project state')
    .action(async (name?: string) => {
      const cwd = process.cwd()
      const timestamp    = new Date().toISOString().replace(/[:.]/g, '-')
      const snapshotName = name ?? `snapshot-${timestamp}`
      const filename     = `${timestamp}-${snapshotName}.json`
      const snapshotDir  = path.join(cwd, '.wmx', 'snapshots')

      await fse.ensureDir(snapshotDir)

      const spinner = ora('Collecting project state...').start()

      // Read package.json
      let dependencies: Record<string, string>     = {}
      let devDependencies: Record<string, string>   = {}
      try {
        const pkg = await fse.readJson(path.join(cwd, 'package.json'))
        dependencies    = pkg.dependencies    ?? {}
        devDependencies = pkg.devDependencies ?? {}
      } catch { /* use empty objects */ }

      // Read .wmxrc.json
      let wmxConfig: object = {}
      try {
        wmxConfig = await fse.readJson(path.join(cwd, '.wmxrc.json'))
      } catch { /* use empty object */ }

      // Stats
      let stats = { fileCount: 0, totalLines: 0 }
      try {
        const result = await scanStats(cwd)
        stats = { fileCount: result.totalFiles, totalLines: result.totalLines }
      } catch { /* use fallback */ }

      // Git commit
      let gitCommit = ''
      try {
        const result = await execa('git', ['rev-parse', 'HEAD'], { cwd, reject: false })
        if (result.exitCode === 0) gitCommit = result.stdout.trim()
      } catch { /* no git */ }

      const snap: Snapshot = {
        name:           snapshotName,
        timestamp:      new Date().toISOString(),
        nodeVersion:    process.version,
        dependencies,
        devDependencies,
        wmxConfig,
        stats,
        gitCommit,
      }

      await fse.writeJson(path.join(snapshotDir, filename), snap, { spaces: 2 })
      spinner.succeed()
      console.log(chalk.green(`✔  Snapshot "${snapshotName}" saved to .wmx/snapshots/${filename}`))
    })

  // ── list ─────────────────────────────────────────────────────────────────────

  snapshot
    .command('list')
    .description('List all saved snapshots')
    .action(async () => {
      const snapshotDir = path.join(process.cwd(), '.wmx', 'snapshots')

      if (!(await fse.pathExists(snapshotDir))) {
        console.log(chalk.gray('No snapshots found. Run: wmx snapshot save'))
        return
      }

      const files = (await fse.readdir(snapshotDir)).filter(f => f.endsWith('.json'))

      if (files.length === 0) {
        console.log(chalk.gray('No snapshots found. Run: wmx snapshot save'))
        return
      }

      const snapshots: Snapshot[] = []
      for (const file of files) {
        try {
          const snap = await fse.readJson(path.join(snapshotDir, file)) as Snapshot
          snapshots.push(snap)
        } catch { /* skip corrupt file */ }
      }

      snapshots.sort((a, b) =>
        new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()
      )

      const header =
        chalk.cyan.bold('Name'.padEnd(COL.NAME)) +
        chalk.cyan.bold('Date'.padEnd(COL.DATE)) +
        chalk.cyan.bold('Files'.padEnd(COL.FILES)) +
        chalk.cyan.bold('Lines'.padEnd(COL.LINES)) +
        chalk.cyan.bold('Commit'.padEnd(COL.COMMIT))

      console.log()
      console.log(header)
      console.log(chalk.gray('─'.repeat(COL.NAME + COL.DATE + COL.FILES + COL.LINES + COL.COMMIT)))

      for (const snap of snapshots) {
        const row =
          chalk.white(snap.name.slice(0, COL.NAME - 1).padEnd(COL.NAME)) +
          chalk.white(new Date(snap.timestamp).toLocaleString().slice(0, COL.DATE - 1).padEnd(COL.DATE)) +
          chalk.white(String(snap.stats.fileCount).padEnd(COL.FILES)) +
          chalk.white(String(snap.stats.totalLines).padEnd(COL.LINES)) +
          chalk.white((snap.gitCommit.slice(0, 7) || 'n/a').padEnd(COL.COMMIT))
        console.log(row)
      }
      console.log()
    })

  // ── restore ───────────────────────────────────────────────────────────────────

  snapshot
    .command('restore <name>')
    .description('Restore dependencies from a saved snapshot')
    .action(async (name: string) => {
      const snapshotDir = path.join(process.cwd(), '.wmx', 'snapshots')

      if (!(await fse.pathExists(snapshotDir))) {
        console.log(chalk.red('No snapshots found.'))
        process.exit(1)
      }

      const files = (await fse.readdir(snapshotDir)).filter(f => f.endsWith('.json'))

      if (files.length === 0) {
        console.log(chalk.red('No snapshots found.'))
        process.exit(1)
      }

      let snap: Snapshot | undefined
      for (const file of files) {
        try {
          const parsed = await fse.readJson(path.join(snapshotDir, file)) as Snapshot
          if (parsed.name === name) { snap = parsed; break }
        } catch { /* skip */ }
      }

      if (!snap) {
        console.log(chalk.red(`Snapshot "${name}" not found. Run: wmx snapshot list`))
        process.exit(1)
      }

      console.log(chalk.cyan(`Snapshot: ${snap.name}`))
      console.log(chalk.cyan(`Date:     ${new Date(snap.timestamp).toLocaleString()}`))
      console.log(chalk.cyan(`Deps:     ${Object.keys(snap.dependencies).length}`))
      console.log(chalk.cyan(`Files:    ${snap.stats.fileCount}`))
      console.log(chalk.cyan(`Lines:    ${snap.stats.totalLines}`))
      console.log(chalk.cyan(`Commit:   ${snap.gitCommit.slice(0, 7) || 'n/a'}`))

      const { proceed } = await inquirer.prompt<{ proceed: boolean }>([
        {
          type: 'confirm',
          name: 'proceed',
          message: 'This will overwrite package.json dependencies and run npm install. Proceed?',
          default: false,
        },
      ])

      if (!proceed) {
        console.log(chalk.gray('Restore cancelled.'))
        return
      }

      const pkgPath = path.join(process.cwd(), 'package.json')
      const pkg = await fse.readJson(pkgPath)
      pkg.dependencies    = snap.dependencies
      pkg.devDependencies = snap.devDependencies
      await fse.writeJson(pkgPath, pkg, { spaces: 2 })

      const spinner = ora('Reinstalling dependencies...').start()
      try {
        await execa('npm', ['install'], { cwd: process.cwd(), stdio: 'pipe' })
        spinner.succeed()
        console.log(chalk.green('✔  Restore complete.'))
      } catch (error) {
        spinner.fail('Restore failed.')
        const message = error instanceof Error ? error.message : String(error)
        console.log(chalk.red(message))
        process.exit(1)
      }
    })
}
