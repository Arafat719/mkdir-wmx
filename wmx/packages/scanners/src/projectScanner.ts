import fs from 'fs/promises'
import path from 'path'
import fg from 'fast-glob'
import { scanDependencies } from './dependencyScanner.js'

export interface ProjectIssue {
  type: 'error' | 'warn' | 'info'
  code: string
  message: string
  fix?: string
}

async function pathExists(p: string): Promise<boolean> {
  try {
    await fs.access(p)
    return true
  } catch {
    return false
  }
}

async function checkDeps(cwd: string, issues: ProjectIssue[]): Promise<void> {
  const pkgPath = path.join(cwd, 'package.json')
  if (!(await pathExists(pkgPath))) return

  let pkg: Record<string, unknown>
  try {
    const raw = await fs.readFile(pkgPath, 'utf8')
    pkg = JSON.parse(raw)
  } catch {
    return
  }

  const declared: string[] = [
    ...Object.keys((pkg.dependencies as Record<string, string>) ?? {}),
    ...Object.keys((pkg.devDependencies as Record<string, string>) ?? {})
  ]

  const nodeModulesPath = path.join(cwd, 'node_modules')
  const nodeModulesExists = await pathExists(nodeModulesPath)

  // DEPS_001: declared package missing from node_modules
  if (nodeModulesExists) {
    for (const dep of declared) {
      const depPath = path.join(nodeModulesPath, dep)
      if (!(await pathExists(depPath))) {
        issues.push({
          type: 'error',
          code: 'DEPS_001',
          message: `Package "${dep}" is declared in package.json but missing from node_modules`,
          fix: `Run your package manager install command to restore missing dependencies`
        })
      }
    }
  }

  // DEPS_002 / DEPS_003: delegate to scanDependencies() for accurate unused/missing detection.
  // This handles tooling excludes (vite, typescript, etc.), sub-path imports (react-dom/client),
  // and config files (vite.config.ts, next.config.js, etc.) that live outside src/.
  try {
    const report = await scanDependencies(cwd)

    for (const name of report.unused) {
      issues.push({
        type: 'warn',
        code: 'DEPS_002',
        message: `Package "${name}" is installed but not imported anywhere in the project`,
        fix: `Remove unused dependency: npm uninstall ${name}`
      })
    }

    for (const name of report.missing) {
      issues.push({
        type: 'warn',
        code: 'DEPS_003',
        message: `Package "${name}" is imported in source but not declared in package.json`,
        fix: `Install the missing package: npm install ${name}`
      })
    }
  } catch {
    // scanDependencies can fail on malformed package.json — skip gracefully
  }
}

async function checkEnv(cwd: string, issues: ProjectIssue[]): Promise<void> {
  const examplePath = path.join(cwd, '.env.example')
  const envPath = path.join(cwd, '.env')

  const exampleExists = await pathExists(examplePath)
  const envExists = await pathExists(envPath)

  // ENV_001: .env.example exists but .env does not
  if (exampleExists && !envExists) {
    issues.push({
      type: 'warn',
      code: 'ENV_001',
      message: '.env.example found but .env file does not exist',
      fix: 'Run: cp .env.example .env and fill in the required values'
    })
    return
  }

  // ENV_002: key in .env.example missing from .env
  if (exampleExists && envExists) {
    const exampleContent = await fs.readFile(examplePath, 'utf8')
    const envContent = await fs.readFile(envPath, 'utf8')

    const parseKeys = (content: string): Set<string> => {
      const keys = new Set<string>()
      content.split('\n').forEach(line => {
        const trimmed = line.trim()
        if (trimmed.length > 0 && !trimmed.startsWith('#')) {
          const key = trimmed.split('=')[0].trim()
          if (key.length > 0) keys.add(key)
        }
      })
      return keys
    }

    const requiredKeys = parseKeys(exampleContent)
    const presentKeys = parseKeys(envContent)

    for (const key of requiredKeys) {
      if (!presentKeys.has(key)) {
        issues.push({
          type: 'error',
          code: 'ENV_002',
          message: `Environment variable "${key}" is required (in .env.example) but missing from .env`,
          fix: `Add ${key}=<value> to your .env file`
        })
      }
    }
  }
}

async function checkDocs(cwd: string, issues: ProjectIssue[]): Promise<void> {
  const readmePath = path.join(cwd, 'README.md')
  const readmeExists = await pathExists(readmePath)

  // DOCS_001: README.md missing
  if (!readmeExists) {
    issues.push({
      type: 'warn',
      code: 'DOCS_001',
      message: 'README.md is missing from the project root',
      fix: 'Create a README.md describing your project setup and usage'
    })
    return
  }

  // DOCS_002: README.md under 100 bytes
  const stat = await fs.stat(readmePath)
  if (stat.size < 100) {
    issues.push({
      type: 'warn',
      code: 'DOCS_002',
      message: `README.md exists but is only ${stat.size} bytes — likely a placeholder`,
      fix: 'Expand README.md with setup instructions, usage examples, and project description'
    })
  }
}

async function checkGit(cwd: string, issues: ProjectIssue[]): Promise<void> {
  const gitignorePath = path.join(cwd, '.gitignore')
  const gitignoreExists = await pathExists(gitignorePath)

  // GIT_001: no .gitignore
  if (!gitignoreExists) {
    issues.push({
      type: 'warn',
      code: 'GIT_001',
      message: 'No .gitignore file found in project root',
      fix: 'Create a .gitignore and add node_modules, .env, dist, and build at minimum'
    })
    return
  }

  // GIT_002: node_modules not in .gitignore
  const content = await fs.readFile(gitignorePath, 'utf8')
  const lines = content.split('\n').map(l => l.trim())
  if (!lines.includes('node_modules') && !lines.includes('/node_modules') && !lines.includes('node_modules/')) {
    issues.push({
      type: 'error',
      code: 'GIT_002',
      message: 'node_modules is not listed in .gitignore — it may be committed to version control',
      fix: 'Add "node_modules" as a line in your .gitignore file immediately'
    })
  }
}

async function checkSize(cwd: string, issues: ProjectIssue[]): Promise<void> {
  const srcPath = path.join(cwd, 'src')
  if (!(await pathExists(srcPath))) return

  const sourceFiles = await fg(['src/**/*.{ts,tsx,js,jsx}'], { cwd, absolute: true })
  const SIZE_LIMIT = 500 * 1024 // 500KB

  for (const file of sourceFiles) {
    try {
      const stat = await fs.stat(file)
      if (stat.size > SIZE_LIMIT) {
        const relativePath = path.relative(cwd, file)
        const sizeKb = Math.round(stat.size / 1024)
        issues.push({
          type: 'warn',
          code: 'SIZE_001',
          message: `File "${relativePath}" is ${sizeKb}KB — exceeds the 500KB recommended limit`,
          fix: 'Consider splitting this file into smaller modules'
        })
      }
    } catch {
      // skip
    }
  }
}

async function checkSecurity(cwd: string, issues: ProjectIssue[]): Promise<void> {
  const pkgPath = path.join(cwd, 'package.json')
  if (!(await pathExists(pkgPath))) return

  let pkg: Record<string, unknown>
  try {
    const raw = await fs.readFile(pkgPath, 'utf8')
    pkg = JSON.parse(raw)
  } catch {
    return
  }

  const allDeps: Record<string, string> = {
    ...((pkg.dependencies as Record<string, string>) ?? {}),
    ...((pkg.devDependencies as Record<string, string>) ?? {})
  }

  const vulnerablePackages = [
    { name: 'lodash',     safeVersion: '4.17.21' },
    { name: 'axios',      safeVersion: '0.21.2'  },
    { name: 'node-fetch', safeVersion: '2.6.7'   }
  ]

  for (const vuln of vulnerablePackages) {
    const declared = allDeps[vuln.name]
    if (!declared) continue

    const clean = declared.replace(/^[\^~>=<]+/, '').trim()
    const parts = clean.split('.').map(Number)
    if (parts.length < 2) continue

    const [major, minor, patch] = parts
    const [safeMajor, safeMinor, safePatch] = vuln.safeVersion.split('.').map(Number)

    const isVulnerable =
      major < safeMajor ||
      (major === safeMajor && minor < safeMinor) ||
      (major === safeMajor && minor === safeMinor && (patch ?? 0) < safePatch)

    if (isVulnerable) {
      issues.push({
        type: 'warn',
        code: 'SEC_001',
        message: `Package "${vuln.name}@${clean}" has known vulnerabilities — safe version is ${vuln.safeVersion}+`,
        fix: `Upgrade: npm install ${vuln.name}@latest`
      })
    }
  }
}

export async function scanProject(cwd: string): Promise<ProjectIssue[]> {
  const issues: ProjectIssue[] = []

  await Promise.all([
    checkDeps(cwd, issues),
    checkEnv(cwd, issues),
    checkDocs(cwd, issues),
    checkGit(cwd, issues),
    checkSize(cwd, issues),
    checkSecurity(cwd, issues)
  ])

  return issues
}
