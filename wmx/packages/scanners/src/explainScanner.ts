import fs from 'fs/promises'
import path from 'path'
import fg from 'fast-glob'
import { FrameworkScanner } from './scanners/FrameworkScanner.js'

export interface ProjectFlow {
  name: string
  steps: string[]
}

export interface ExplainResult {
  framework: string | null
  database: string | null
  packageManager: string | null
  flows: ProjectFlow[]
}

interface PackageJson {
  dependencies?: Record<string, string>
  devDependencies?: Record<string, string>
}

const IGNORE = ['**/node_modules/**', '**/dist/**', '**/build/**', '**/.next/**', '**/.git/**']

const DATABASE_PACKAGES: Array<[string, string]> = [
  ['@prisma/client', 'Prisma ORM'],
  ['mongoose', 'MongoDB (Mongoose)'],
  ['mongodb', 'MongoDB'],
  ['pg', 'PostgreSQL'],
  ['mysql2', 'MySQL'],
  ['mysql', 'MySQL'],
  ['sequelize', 'SQL (Sequelize ORM)'],
  ['typeorm', 'SQL (TypeORM)'],
  ['drizzle-orm', 'SQL (Drizzle ORM)'],
  ['sqlite3', 'SQLite'],
  ['better-sqlite3', 'SQLite'],
  ['redis', 'Redis'],
  ['ioredis', 'Redis'],
]

async function readPackageJson(cwd: string): Promise<PackageJson> {
  try {
    const raw = await fs.readFile(path.join(cwd, 'package.json'), 'utf8')
    return JSON.parse(raw)
  } catch {
    return {}
  }
}

export function detectDatabase(deps: Record<string, string>): string | null {
  for (const [pkg, label] of DATABASE_PACKAGES) {
    if (pkg in deps) return label
  }
  return null
}

function detectPackageManager(cwd: string, files: string[]): string | null {
  if (files.some(f => f === 'pnpm-lock.yaml')) return 'pnpm'
  if (files.some(f => f === 'yarn.lock')) return 'yarn'
  if (files.some(f => f === 'package-lock.json')) return 'npm'
  return null
}

interface AuthSignals {
  hasLogin: boolean
  hasJwt: boolean
  hasMiddleware: boolean
  hasDashboard: boolean
  hasApi: boolean
}

async function detectAuthSignals(cwd: string, deps: Record<string, string>): Promise<AuthSignals> {
  const files = await fg(['**/*.{ts,tsx,js,jsx}'], { cwd, ignore: IGNORE, absolute: false })

  let hasLogin = false
  let hasJwt = 'jsonwebtoken' in deps || 'jose' in deps
  let hasMiddleware = false
  let hasDashboard = false
  let hasApi = false

  const loginPattern = /\b(login|signin|sign-in|authenticate)\b/i
  const jwtPattern = /\bjwt\.(sign|verify)\s*\(|jsonwebtoken/
  const middlewarePattern = /\b(requireAuth|authMiddleware|verifyToken|isAuthenticated|withAuth)\b|app\.use\s*\(\s*['"`]?\/?(auth|protected)/i
  const dashboardPattern = /\bdashboard\b/i
  const apiPattern = /\b(app|router)\.(get|post|put|delete|patch)\s*\(|\/api\//

  for (const relFile of files) {
    const lower = relFile.toLowerCase()

    if (!hasLogin && loginPattern.test(lower)) hasLogin = true
    if (!hasMiddleware && /middleware/.test(lower)) hasMiddleware = true
    if (!hasDashboard && dashboardPattern.test(lower)) hasDashboard = true

    if (hasLogin && hasJwt && hasMiddleware && hasDashboard && hasApi) break

    let content: string
    try {
      content = await fs.readFile(path.join(cwd, relFile), 'utf8')
    } catch {
      continue
    }

    if (!hasLogin && loginPattern.test(content)) hasLogin = true
    if (!hasJwt && jwtPattern.test(content)) hasJwt = true
    if (!hasMiddleware && middlewarePattern.test(content)) hasMiddleware = true
    if (!hasDashboard && dashboardPattern.test(content)) hasDashboard = true
    if (!hasApi && apiPattern.test(content)) hasApi = true
  }

  return { hasLogin, hasJwt, hasMiddleware, hasDashboard, hasApi }
}

function buildAuthFlow(signals: AuthSignals, database: string | null): ProjectFlow | null {
  const steps: string[] = []

  if (signals.hasLogin) steps.push('Login')
  if (signals.hasJwt) steps.push('JWT')
  if (signals.hasMiddleware) steps.push('Middleware')
  if (signals.hasDashboard) steps.push('Dashboard')
  if (signals.hasApi) steps.push('API')
  if (database) steps.push('Database')

  if (steps.length < 2) return null
  return { name: 'Authentication', steps }
}

function buildRequestFlow(signals: AuthSignals, database: string | null): ProjectFlow | null {
  if (!signals.hasApi) return null
  const steps = ['Client', 'API']
  if (database) steps.push('Database')
  if (steps.length < 2) return null
  return { name: 'Request Flow', steps }
}

export async function explainProject(cwd: string): Promise<ExplainResult> {
  const pkg = await readPackageJson(cwd)
  const deps = { ...(pkg.dependencies ?? {}), ...(pkg.devDependencies ?? {}) }

  const [frameworkInfo, rootFiles, signals] = await Promise.all([
    new FrameworkScanner(cwd).scan(),
    fs.readdir(cwd).catch(() => [] as string[]),
    detectAuthSignals(cwd, deps),
  ])

  const database = detectDatabase(deps)
  const packageManager = detectPackageManager(cwd, rootFiles)

  const flows: ProjectFlow[] = []
  const authFlow = buildAuthFlow(signals, database)
  if (authFlow) flows.push(authFlow)
  if (!authFlow) {
    const requestFlow = buildRequestFlow(signals, database)
    if (requestFlow) flows.push(requestFlow)
  }

  return {
    framework: frameworkInfo.name,
    database,
    packageManager,
    flows,
  }
}
