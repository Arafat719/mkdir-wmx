import fse from 'fs-extra'
import path from 'path'

interface DeployConfig {
  projectName?: string
  framework?: string
  backend?: string
}

const BACKEND_FRAMEWORKS = ['express', 'nestjs', 'fastify', 'koa']

function hasBackend(config: DeployConfig): boolean {
  return BACKEND_FRAMEWORKS.includes((config.backend ?? '').toLowerCase())
}

function getDirs(config: DeployConfig): { frontendDir: string; backendDir: string } {
  return hasBackend(config)
    ? { frontendDir: 'frontend', backendDir: 'backend' }
    : { frontendDir: '.', backendDir: 'backend' }
}

export function generateVercelConfig(config: DeployConfig): object {
  const { frontendDir, backendDir } = getDirs(config)

  if (hasBackend(config)) {
    return {
      version: 2,
      builds: [
        {
          src: `${frontendDir}/package.json`,
          use: '@vercel/static-build',
          config: { distDir: 'dist' },
        },
        { src: `${backendDir}/package.json`, use: '@vercel/node' },
      ],
      routes: [
        { src: '/api/(.*)', dest: `/${backendDir}` },
        { src: '/(.*)',     dest: `/${frontendDir}` },
      ],
    }
  }

  return {
    version: 2,
    builds: [
      {
        src: `${frontendDir}/package.json`,
        use: '@vercel/static-build',
        config: { distDir: 'dist' },
      },
    ],
  }
}

export function generateRenderConfig(config: DeployConfig, cwd: string = process.cwd()): string {
  const { frontendDir, backendDir } = getDirs(config)
  const projectName = config.projectName ?? 'my-app'

  const envExamplePath = hasBackend(config)
    ? path.join(cwd, backendDir, '.env.example')
    : path.join(cwd, '.env.example')
  let envKeys: string[] = []
  if (fse.pathExistsSync(envExamplePath)) {
    const content = fse.readFileSync(envExamplePath, 'utf-8')
    envKeys = content
      .split('\n')
      .filter(line => line.includes('=') && !line.trimStart().startsWith('#'))
      .map(line => line.split('=')[0].trim())
      .filter(Boolean)
  }

  if (hasBackend(config)) {
    const envSection = envKeys.length > 0
      ? `\n        envVars:\n${envKeys.map(k => `          - key: ${k}\n            value: placeholder`).join('\n')}`
      : ''

    return `services:
      - type: web
        name: ${projectName}-backend
        runtime: node
        rootDir: ${backendDir}
        buildCommand: npm install && npm run build
        startCommand: npm start${envSection}

      - type: static
        name: ${projectName}-frontend
        rootDir: ${frontendDir}
        buildCommand: npm install && npm run build
        staticPublishPath: dist
`
  }

  return `services:
      - type: static
        name: ${projectName}-frontend
        rootDir: ${frontendDir}
        buildCommand: npm install && npm run build
        staticPublishPath: dist
`
}

export function generateNetlifyConfig(config: DeployConfig): string {
  const { frontendDir } = getDirs(config)
  const framework = (config.framework ?? '').toLowerCase()

  let buildCommand: string
  let publish: string

  if (framework.includes('next')) {
    buildCommand = 'npm run build'
    publish = '.next'
  } else if (framework.includes('nuxt')) {
    buildCommand = 'npm run generate'
    publish = 'dist'
  } else {
    buildCommand = 'npm run build'
    publish = 'dist'
  }

  return `[build]
  base    = "${frontendDir}"
  command = "${buildCommand}"
  publish = "${publish}"

[[redirects]]
  from   = "/*"
  to     = "/index.html"
  status = 200
`
}
