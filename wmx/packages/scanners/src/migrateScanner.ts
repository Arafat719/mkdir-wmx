import fs from 'fs/promises'
import path from 'path'

export interface MigrationPath {
  id: string
  from: string
  to: string
  reason: string
  steps: string[]
}

export interface MigrateResult {
  detected: MigrationPath[]
}

interface PackageJson {
  dependencies?: Record<string, string>
  devDependencies?: Record<string, string>
}

async function readPackageJson(cwd: string): Promise<PackageJson> {
  try {
    const raw = await fs.readFile(path.join(cwd, 'package.json'), 'utf8')
    return JSON.parse(raw)
  } catch {
    return {}
  }
}

async function pathExists(p: string): Promise<boolean> {
  try {
    await fs.access(p)
    return true
  } catch {
    return false
  }
}

function majorVersion(range: string): number | null {
  const match = range.match(/(\d+)\.\d+\.\d+/)
  return match ? parseInt(match[1], 10) : null
}

export async function scanMigrations(cwd: string): Promise<MigrateResult> {
  const pkg = await readPackageJson(cwd)
  const deps = { ...(pkg.dependencies ?? {}), ...(pkg.devDependencies ?? {}) }
  const detected: MigrationPath[] = []

  // React Router -> Next.js App Router
  if (('react-router-dom' in deps || 'react-router' in deps)) {
    detected.push({
      id: 'react-router-to-next-app-router',
      from: 'React Router',
      to: 'Next.js App Router',
      reason: 'react-router-dom is installed — Next.js App Router provides file-based routing, layouts, and server components out of the box.',
      steps: [
        'Install Next.js: npm install next',
        'Create an app/ directory and convert each <Route> into a page.tsx under the matching folder',
        'Replace useNavigate() with useRouter() from next/navigation',
        'Replace <Link to="..."> with <Link href="..."> from next/link',
        'Move shared layout markup into app/layout.tsx',
        'Remove react-router-dom once all routes are migrated',
      ],
    })
  }

  // Next.js Pages Router -> App Router
  const hasNext = 'next' in deps
  if (hasNext) {
    const hasPagesDir = (await pathExists(path.join(cwd, 'pages'))) || (await pathExists(path.join(cwd, 'src/pages')))
    const hasAppDir = (await pathExists(path.join(cwd, 'app'))) || (await pathExists(path.join(cwd, 'src/app')))
    if (hasPagesDir && !hasAppDir) {
      detected.push({
        id: 'next-pages-to-app-router',
        from: 'Next.js Pages Router',
        to: 'Next.js App Router',
        reason: 'A pages/ directory was found with no app/ directory — App Router is the recommended approach for new Next.js projects (React Server Components, nested layouts, streaming).',
        steps: [
          'Create an app/ directory alongside pages/',
          'Move each pages/X.tsx to app/X/page.tsx',
          'Convert getServerSideProps/getStaticProps to async Server Components',
          'Replace next/router with next/navigation',
          'Migrate _app.tsx logic into app/layout.tsx',
          'Delete pages/ once migration is verified',
        ],
      })
    }
  }

  // Tailwind v3 -> v4
  const tailwindVersion = deps['tailwindcss']
  if (tailwindVersion) {
    const major = majorVersion(tailwindVersion)
    if (major !== null && major < 4) {
      detected.push({
        id: 'tailwind-v3-to-v4',
        from: `Tailwind v${major}`,
        to: 'Tailwind v4',
        reason: `Installed Tailwind version is v${major} — v4 has a faster engine, CSS-first configuration, and no PostCSS setup required.`,
        steps: [
          'Run the official upgrade tool: npx @tailwindcss/upgrade',
          'Replace tailwind.config.js theme with @theme in your CSS entrypoint',
          'Replace @tailwind base/components/utilities with @import "tailwindcss"',
          'Update any custom plugins for the v4 plugin API',
          'Verify class names flagged as renamed/removed by the upgrade tool',
        ],
      })
    }
  }

  // Create React App -> Vite
  if ('react-scripts' in deps) {
    detected.push({
      id: 'cra-to-vite',
      from: 'Create React App',
      to: 'Vite',
      reason: 'react-scripts is installed — Create React App is no longer maintained; Vite offers significantly faster dev server and build times.',
      steps: [
        'Install Vite: npm install -D vite @vitejs/plugin-react',
        'Move public/index.html to project root and add a <script type="module" src="/src/main.tsx">',
        'Create vite.config.ts with the React plugin',
        'Rename environment variables from REACT_APP_* to VITE_*',
        'Replace process.env.REACT_APP_* with import.meta.env.VITE_*',
        'Update npm scripts to use vite / vite build / vite preview',
        'Remove react-scripts',
      ],
    })
  }

  // JavaScript -> TypeScript
  if (!('typescript' in deps)) {
    const hasTsconfig = await pathExists(path.join(cwd, 'tsconfig.json'))
    if (!hasTsconfig) {
      const hasSrc = await pathExists(path.join(cwd, 'src'))
      if (hasSrc) {
        detected.push({
          id: 'js-to-ts',
          from: 'JavaScript',
          to: 'TypeScript',
          reason: 'No tsconfig.json or typescript dependency found — adding TypeScript catches type errors before runtime.',
          steps: [
            'Install TypeScript: npm install -D typescript @types/node',
            'Run npx tsc --init to generate tsconfig.json',
            'Rename files incrementally from .js/.jsx to .ts/.tsx',
            'Enable "strict": true once initial errors are resolved',
            'Add type definitions for any untyped dependencies (@types/*)',
          ],
        })
      }
    }
  }

  return { detected }
}
