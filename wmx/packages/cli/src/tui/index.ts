import { readFileSync } from 'fs'
import { resolve, dirname } from 'path'
import { fileURLToPath } from 'url'
import { renderDashboard } from './renderDashboard.js'

export function startTUI(): void {
  const __dirname = dirname(fileURLToPath(import.meta.url))
  const pkgPath = resolve(__dirname, '../../package.json')
  const pkg = JSON.parse(readFileSync(pkgPath, 'utf-8')) as { version?: string }
  const version = pkg.version ?? '1.0.0'
  const cwd = process.cwd()
  renderDashboard({ version, cwd })
}
