import fse from 'fs-extra';
import path from 'path';
const BACKEND_FRAMEWORKS = ['express', 'nestjs', 'fastify', 'koa'];
function hasBackend(config) {
    return !!(config.backend && BACKEND_FRAMEWORKS.includes(config.backend.framework ?? ''));
}
export function generateVercelConfig(config) {
    const frontendDir = config.frontend?.dir ?? 'frontend';
    const backendDir = config.backend?.dir ?? 'backend';
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
                { src: '/(.*)', dest: `/${frontendDir}` },
            ],
        };
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
    };
}
export function generateRenderConfig(config) {
    const frontendDir = config.frontend?.dir ?? 'frontend';
    const backendDir = config.backend?.dir ?? 'backend';
    const projectName = config.projectName ?? 'my-app';
    const envExamplePath = path.join(process.cwd(), '.env.example');
    let envKeys = [];
    if (fse.pathExistsSync(envExamplePath)) {
        const content = fse.readFileSync(envExamplePath, 'utf-8');
        envKeys = content
            .split('\n')
            .filter(line => line.includes('=') && !line.trimStart().startsWith('#'))
            .map(line => line.split('=')[0].trim())
            .filter(Boolean);
    }
    if (hasBackend(config)) {
        const envSection = envKeys.length > 0
            ? `\n        envVars:\n${envKeys.map(k => `          - key: ${k}\n            value: placeholder`).join('\n')}`
            : '';
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
`;
    }
    return `services:
      - type: static
        name: ${projectName}-frontend
        rootDir: ${frontendDir}
        buildCommand: npm install && npm run build
        staticPublishPath: dist
`;
}
export function generateNetlifyConfig(config) {
    const frontendDir = config.frontend?.dir ?? 'frontend';
    const framework = config.frontend?.framework ?? '';
    let buildCommand;
    let publish;
    if (framework === 'next') {
        buildCommand = 'npm run build';
        publish = '.next';
    }
    else if (framework === 'nuxt') {
        buildCommand = 'npm run generate';
        publish = 'dist';
    }
    else {
        buildCommand = 'npm run build';
        publish = 'dist';
    }
    return `[build]
  base    = "${frontendDir}"
  command = "${buildCommand}"
  publish = "${publish}"

[[redirects]]
  from   = "/*"
  to     = "/index.html"
  status = 200
`;
}
