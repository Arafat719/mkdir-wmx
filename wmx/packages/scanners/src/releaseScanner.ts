import fs from 'fs/promises'
import path from 'path'
import fg from 'fast-glob'
import { execa } from 'execa'
import { scanClean } from './cleanScanner.js'
import { scanSecurity } from './securityScanner.js'
import { scanPerformance } from './performanceScanner.js'
import { scanEnvSync } from './envScanner.js'
import { detectPackageManager } from './memoryScanner.js'

export type ReleaseStatus = 'pass' | 'warn' | 'fail' | 'skip'

export interface ReleaseCheck {
  id: string
  label: string
  status: ReleaseStatus
  message: string
}

export interface LighthouseEstimate {
  performance: number
  seo: number
  bestPractices: number
  overall: number
}

export interface ReleaseReport {
  checks: ReleaseCheck[]
  lighthouseEstimate: LighthouseEstimate
  readyToShip: boolean
}

export interface ReleaseOptions {
  skipBuild?: boolean
  skipTests?: boolean
}

const IGNORE = ['**/node_modules/**', '**/dist/**', '**/build/**', '**/.next/**', '**/.git/**']
const IMAGE_SIZE_LIMIT = 500 * 1024 // 500KB

interface PackageJson {
  scripts?: Record<string, string>
}

async function readPackageJson(cwd: string): Promise<PackageJson> {
  try {
    const raw = await fs.readFile(path.join(cwd, 'package.json'), 'utf8')
    return JSON.parse(raw)
  } catch {
    return {}
  }
}

async function pathExistsAny(cwd: string, candidates: string[]): Promise<string | null> {
  for (const candidate of candidates) {
    try {
      await fs.access(path.join(cwd, candidate))
      return candidate
    } catch {
      // keep looking
    }
  }
  return null
}

async function runScript(
  cwd: string,
  script: string,
  pm: string | null,
  scripts: Record<string, string> | undefined
): Promise<ReleaseCheck> {
  if (!scripts || !(script in scripts)) {
    return { id: script, label: script[0].toUpperCase() + script.slice(1), status: 'skip', message: `No "${script}" script found in package.json` }
  }

  const runner = pm === 'yarn' ? 'yarn' : pm === 'pnpm' ? 'pnpm' : pm === 'bun' ? 'bun' : 'npm'
  const args = runner === 'npm' ? ['run', script] : [script]

  try {
    const result = await execa(runner, args, { cwd, reject: false, timeout: 5 * 60 * 1000 })
    if (result.exitCode === 0) {
      return { id: script, label: script[0].toUpperCase() + script.slice(1), status: 'pass', message: `${script} succeeded` }
    }
    const tail = (result.stderr || result.stdout || '').split('\n').filter(Boolean).slice(-3).join(' | ')
    return { id: script, label: script[0].toUpperCase() + script.slice(1), status: 'fail', message: tail || `${script} exited with code ${result.exitCode}` }
  } catch (err) {
    return { id: script, label: script[0].toUpperCase() + script.slice(1), status: 'fail', message: err instanceof Error ? err.message : `${script} failed` }
  }
}

async function checkImages(cwd: string): Promise<ReleaseCheck> {
  const [clean, imageFiles] = await Promise.all([
    scanClean(cwd),
    fg(['**/*.{png,jpg,jpeg,gif,webp}'], { cwd, ignore: IGNORE, absolute: true }),
  ])

  let oversized = 0
  for (const file of imageFiles) {
    try {
      const stat = await fs.stat(file)
      if (stat.size > IMAGE_SIZE_LIMIT) oversized++
    } catch {
      // skip
    }
  }

  const unused = clean.images.length
  if (unused === 0 && oversized === 0) {
    return { id: 'images', label: 'Images', status: 'pass', message: 'No unused or oversized images' }
  }
  return {
    id: 'images', label: 'Images', status: 'warn',
    message: `${unused} unused image(s), ${oversized} oversized image(s) (>500KB)`,
  }
}

async function checkRobots(cwd: string): Promise<ReleaseCheck> {
  const found = await pathExistsAny(cwd, ['public/robots.txt', 'robots.txt', 'app/robots.ts', 'app/robots.js', 'src/app/robots.ts', 'src/app/robots.js'])
  return found
    ? { id: 'robots', label: 'robots.txt', status: 'pass', message: `Found ${found}` }
    : { id: 'robots', label: 'robots.txt', status: 'warn', message: 'No robots.txt or app/robots.ts found' }
}

async function checkSitemap(cwd: string): Promise<ReleaseCheck> {
  const found = await pathExistsAny(cwd, [
    'public/sitemap.xml', 'app/sitemap.ts', 'app/sitemap.js',
    'src/app/sitemap.ts', 'src/app/sitemap.js', 'next-sitemap.config.js',
  ])
  return found
    ? { id: 'sitemap', label: 'Sitemap', status: 'pass', message: `Found ${found}` }
    : { id: 'sitemap', label: 'Sitemap', status: 'warn', message: 'No sitemap.xml or app/sitemap.ts found' }
}

async function checkFavicon(cwd: string): Promise<ReleaseCheck> {
  const found = await pathExistsAny(cwd, [
    'public/favicon.ico', 'app/favicon.ico', 'src/app/favicon.ico', 'public/favicon.svg',
  ])
  return found
    ? { id: 'favicon', label: 'Favicon', status: 'pass', message: `Found ${found}` }
    : { id: 'favicon', label: 'Favicon', status: 'warn', message: 'No favicon found in public/ or app/' }
}

async function scanTextSignals(cwd: string): Promise<{ hasMetadataApi: boolean; hasTitleTag: boolean; hasMetaDescription: boolean }> {
  const files = await fg(['app/**/{page,layout}.{ts,tsx}', 'src/app/**/{page,layout}.{ts,tsx}', 'public/index.html', 'index.html'], {
    cwd, ignore: IGNORE,
  })

  let hasMetadataApi = false
  let hasTitleTag = false
  let hasMetaDescription = false

  for (const relFile of files) {
    let content: string
    try {
      content = await fs.readFile(path.join(cwd, relFile), 'utf8')
    } catch {
      continue
    }
    if (/export\s+(const\s+metadata|async function generateMetadata|function generateMetadata)/.test(content)) hasMetadataApi = true
    if (/<title>/.test(content) || /<Helmet>/.test(content)) hasTitleTag = true
    if (/<meta\s+name=["']description["']/.test(content)) hasMetaDescription = true
  }

  return { hasMetadataApi, hasTitleTag, hasMetaDescription }
}

async function checkMetadata(cwd: string): Promise<ReleaseCheck> {
  const signals = await scanTextSignals(cwd)
  if (signals.hasMetadataApi) {
    return { id: 'metadata', label: 'Metadata', status: 'pass', message: 'Next.js metadata API detected' }
  }
  return { id: 'metadata', label: 'Metadata', status: 'warn', message: 'No metadata export / generateMetadata found' }
}

async function checkSeo(cwd: string): Promise<ReleaseCheck> {
  const signals = await scanTextSignals(cwd)
  const hasBasics = signals.hasTitleTag || signals.hasMetadataApi
  if (hasBasics && signals.hasMetaDescription) {
    return { id: 'seo', label: 'SEO', status: 'pass', message: 'Title and meta description detected' }
  }
  if (hasBasics) {
    return { id: 'seo', label: 'SEO', status: 'warn', message: 'Title found but no meta description detected' }
  }
  return { id: 'seo', label: 'SEO', status: 'warn', message: 'No title tag or metadata detected on entry pages' }
}

async function checkEnvironment(cwd: string): Promise<ReleaseCheck> {
  const report = await scanEnvSync(cwd)
  if (report.missingInEnv.length === 0) {
    return { id: 'environment', label: 'Environment', status: 'pass', message: '.env is in sync with .env.example' }
  }
  return {
    id: 'environment', label: 'Environment', status: 'fail',
    message: `Missing in .env: ${report.missingInEnv.join(', ')}`,
  }
}

async function checkDuplicatePackages(cwd: string): Promise<ReleaseCheck> {
  const versionsByName = new Map<string, Set<string>>()

  const addVersion = (name: string, version: string) => {
    const set = versionsByName.get(name) ?? new Set<string>()
    set.add(version)
    versionsByName.set(name, set)
  }

  const npmLockPath = path.join(cwd, 'package-lock.json')
  try {
    const raw = await fs.readFile(npmLockPath, 'utf8')
    const lock = JSON.parse(raw)
    const packages = lock.packages ?? {}
    for (const [key, value] of Object.entries(packages)) {
      if (!key.startsWith('node_modules/')) continue
      const name = key.replace(/^.*node_modules\//, '')
      const version = (value as { version?: string }).version
      if (name && version) addVersion(name, version)
    }
  } catch {
    // try yarn.lock / pnpm-lock.yaml with a lightweight regex pass
    for (const lockFile of ['yarn.lock', 'pnpm-lock.yaml']) {
      try {
        const raw = await fs.readFile(path.join(cwd, lockFile), 'utf8')
        const pattern = /["']?(@?[^@\s"']+)@[\^~]?[\d][^\s"',:]*["']?\s*:/g
        let match: RegExpExecArray | null
        while ((match = pattern.exec(raw)) !== null) {
          // best-effort — version not reliably extractable from this pattern alone
          addVersion(match[1], match[0])
        }
      } catch {
        // lockfile not present
      }
    }
  }

  const duplicates = Array.from(versionsByName.entries()).filter(([, versions]) => versions.size > 1)
  if (duplicates.length === 0) {
    return { id: 'duplicates', label: 'Duplicate Packages', status: 'pass', message: 'No duplicate package versions detected' }
  }
  return {
    id: 'duplicates', label: 'Duplicate Packages', status: 'warn',
    message: `${duplicates.length} package(s) with multiple versions: ${duplicates.slice(0, 5).map(([n]) => n).join(', ')}`,
  }
}

async function checkSecurity(cwd: string): Promise<ReleaseCheck> {
  const report = await scanSecurity(cwd)
  const high = report.findings.filter(f => f.severity === 'high').length
  if (high > 0) {
    return { id: 'security', label: 'Security', status: 'fail', message: `${high} high-severity security finding(s)` }
  }
  if (report.findings.length > 0) {
    return { id: 'security', label: 'Security', status: 'warn', message: `${report.findings.length} lower-severity finding(s)` }
  }
  return { id: 'security', label: 'Security', status: 'pass', message: 'No security issues found' }
}

async function checkPerformance(cwd: string): Promise<ReleaseCheck> {
  const report = await scanPerformance(cwd)
  if (report.issues.length === 0) {
    return { id: 'performance', label: 'Performance', status: 'pass', message: 'No large/unoptimized components detected' }
  }
  return {
    id: 'performance', label: 'Performance', status: 'warn',
    message: `${report.issues.length} component(s) flagged for optimization`,
  }
}

function computeLighthouseEstimate(checks: ReleaseCheck[]): LighthouseEstimate {
  const byId = new Map(checks.map(c => [c.id, c]))
  const perfCheck = byId.get('performance')
  const imagesCheck = byId.get('images')

  let performance = 100
  if (perfCheck?.status === 'warn') performance -= 20
  if (imagesCheck?.status === 'warn') performance -= 10

  let seo = 100
  for (const id of ['seo', 'robots', 'sitemap', 'metadata']) {
    const check = byId.get(id)
    if (check?.status === 'warn') seo -= 15
    if (check?.status === 'fail') seo -= 25
  }

  let bestPractices = 100
  const securityCheck = byId.get('security')
  if (securityCheck?.status === 'fail') bestPractices -= 40
  if (securityCheck?.status === 'warn') bestPractices -= 15
  const dupCheck = byId.get('duplicates')
  if (dupCheck?.status === 'warn') bestPractices -= 10
  const faviconCheck = byId.get('favicon')
  if (faviconCheck?.status === 'warn') bestPractices -= 5

  const clamp = (n: number) => Math.max(0, Math.min(100, Math.round(n)))
  performance = clamp(performance)
  seo = clamp(seo)
  bestPractices = clamp(bestPractices)
  const overall = clamp((performance + seo + bestPractices) / 3)

  return { performance, seo, bestPractices, overall }
}

export async function scanRelease(cwd: string, opts: ReleaseOptions = {}): Promise<ReleaseReport> {
  const pkg = await readPackageJson(cwd)
  const rootFiles = await fs.readdir(cwd).catch(() => [] as string[])
  const pm = detectPackageManager(rootFiles)

  const buildCheck = opts.skipBuild
    ? { id: 'build', label: 'Build', status: 'skip' as ReleaseStatus, message: 'Skipped (--skip-build)' }
    : await runScript(cwd, 'build', pm, pkg.scripts)

  const testCheck = opts.skipTests
    ? { id: 'test', label: 'Tests', status: 'skip' as ReleaseStatus, message: 'Skipped (--skip-tests)' }
    : await runScript(cwd, 'test', pm, pkg.scripts)

  const [
    imagesCheck, seoCheck, robotsCheck, sitemapCheck, faviconCheck,
    metadataCheck, environmentCheck, duplicatesCheck, securityCheck, performanceCheck,
  ] = await Promise.all([
    checkImages(cwd),
    checkSeo(cwd),
    checkRobots(cwd),
    checkSitemap(cwd),
    checkFavicon(cwd),
    checkMetadata(cwd),
    checkEnvironment(cwd),
    checkDuplicatePackages(cwd),
    checkSecurity(cwd),
    checkPerformance(cwd),
  ])

  const checks: ReleaseCheck[] = [
    buildCheck, testCheck, imagesCheck, seoCheck, robotsCheck, sitemapCheck,
    faviconCheck, metadataCheck, environmentCheck, duplicatesCheck, securityCheck, performanceCheck,
  ]

  const lighthouseEstimate = computeLighthouseEstimate(checks)
  const readyToShip = !checks.some(c => c.status === 'fail')

  return { checks, lighthouseEstimate, readyToShip }
}
