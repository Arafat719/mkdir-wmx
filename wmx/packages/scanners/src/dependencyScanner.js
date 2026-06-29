import { readFile } from 'fs/promises';
import fse from 'fs-extra';
import fg from 'fast-glob';
import { execa } from 'execa';
const HEAVY_PACKAGES = [
    {
        name: 'moment',
        reason: 'Large bundle size (~67kb gzipped)',
        alternative: 'date-fns (smaller, tree-shakeable)',
    },
    {
        name: 'lodash',
        reason: 'Full build adds ~70kb, not tree-shakeable',
        alternative: 'lodash-es or native JS methods',
    },
    {
        name: 'request',
        reason: 'Deprecated since 2020, unmaintained',
        alternative: 'axios or native fetch',
    },
    {
        name: 'bluebird',
        reason: 'Native Promise is sufficient in Node.js >= 18',
        alternative: 'native Promise',
    },
];
const NODE_BUILTINS = new Set([
    'fs', 'path', 'os', 'url', 'crypto', 'http', 'https', 'stream', 'events',
    'util', 'child_process', 'buffer', 'assert', 'module', 'net', 'tls', 'zlib',
    'readline', 'process',
]);
const TOOLING_EXCLUDES = [
    'typescript', 'nodemon', 'ts-node', 'tsx', 'esbuild', 'rollup', 'vite', 'webpack', 'dotenv',
];
function isExcludedFromUnused(name) {
    if (TOOLING_EXCLUDES.includes(name))
        return true;
    if (/^@types\//.test(name))
        return true;
    if (/^eslint/.test(name))
        return true;
    if (/^prettier/.test(name))
        return true;
    if (/^jest/.test(name))
        return true;
    if (/^vitest/.test(name))
        return true;
    return false;
}
function parsePackageName(raw) {
    if (raw.startsWith('@')) {
        const firstSlash = raw.indexOf('/');
        if (firstSlash === -1)
            return raw;
        const secondSlash = raw.indexOf('/', firstSlash + 1);
        return secondSlash === -1 ? raw : raw.slice(0, secondSlash);
    }
    const slash = raw.indexOf('/');
    return slash === -1 ? raw : raw.slice(0, slash);
}
export async function scanDependencies(cwd) {
    // Step 1 — Read package.json
    const pkg = (await fse.readJson(`${cwd}/package.json`));
    const dependencies = pkg.dependencies ?? {};
    const devDependencies = pkg.devDependencies ?? {};
    const deps = { ...dependencies, ...devDependencies };
    // Step 2 — Scan source files for imports
    const files = await fg('src/**/*.{ts,tsx,js,jsx,mjs,cjs}', { cwd, absolute: true });
    const importedPackages = new Set();
    const fromRegex = /from\s+['"]([^'"./][^'"]*)['"]/g;
    const requireRegex = /require\s*\(\s*['"]([^'"./][^'"]*)['"]\s*\)/g;
    for (const file of files) {
        const content = await readFile(file, 'utf-8');
        fromRegex.lastIndex = 0;
        let match;
        while ((match = fromRegex.exec(content)) !== null) {
            importedPackages.add(parsePackageName(match[1]));
        }
        requireRegex.lastIndex = 0;
        while ((match = requireRegex.exec(content)) !== null) {
            importedPackages.add(parsePackageName(match[1]));
        }
    }
    // Step 3 — Unused dependencies
    const unused = Object.keys(deps).filter(name => !importedPackages.has(name) && !isExcludedFromUnused(name));
    // Step 4 — Missing dependencies
    const missing = Array.from(importedPackages).filter(name => !(name in deps) && !NODE_BUILTINS.has(name));
    // Step 5 — Heavy dependencies
    const heavy = HEAVY_PACKAGES.filter(h => h.name in deps);
    // Step 6 — Outdated dependencies
    const outdated = await getOutdatedDeps(cwd);
    return { unused, missing, heavy, outdated };
}
async function getOutdatedDeps(cwd) {
    try {
        // npm outdated exits with code 1 when packages are outdated — that is normal
        const result = await execa('npm', ['outdated', '--json'], { cwd, reject: false });
        const stdout = result.stdout.trim();
        if (!stdout)
            return [];
        const parsed = JSON.parse(stdout);
        return Object.entries(parsed).map(([name, entry]) => ({
            name,
            current: entry.current,
            latest: entry.latest,
            type: entry.type === 'devDependencies' ? 'dev' : 'prod',
        }));
    }
    catch {
        return [];
    }
}
