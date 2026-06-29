import fs from 'fs/promises';
import path from 'path';
import fg from 'fast-glob';
async function pathExists(p) {
    try {
        await fs.access(p);
        return true;
    }
    catch {
        return false;
    }
}
async function checkDeps(cwd, issues) {
    const pkgPath = path.join(cwd, 'package.json');
    if (!(await pathExists(pkgPath)))
        return;
    let pkg;
    try {
        const raw = await fs.readFile(pkgPath, 'utf8');
        pkg = JSON.parse(raw);
    }
    catch {
        return;
    }
    const declared = [
        ...Object.keys(pkg.dependencies ?? {}),
        ...Object.keys(pkg.devDependencies ?? {})
    ];
    const nodeModulesPath = path.join(cwd, 'node_modules');
    const nodeModulesExists = await pathExists(nodeModulesPath);
    // DEPS_001: declared package missing from node_modules
    if (nodeModulesExists) {
        for (const dep of declared) {
            const depPath = path.join(nodeModulesPath, dep);
            if (!(await pathExists(depPath))) {
                issues.push({
                    type: 'error',
                    code: 'DEPS_001',
                    message: `Package "${dep}" is declared in package.json but missing from node_modules`,
                    fix: `Run your package manager install command to restore missing dependencies`
                });
            }
        }
    }
    // DEPS_002: package in node_modules not imported anywhere in src/
    const srcPath = path.join(cwd, 'src');
    if (await pathExists(srcPath)) {
        const sourceFiles = await fg(['src/**/*.{ts,tsx,js,jsx}'], { cwd, absolute: true });
        let allImports = '';
        for (const file of sourceFiles) {
            try {
                allImports += await fs.readFile(file, 'utf8');
            }
            catch {
                // skip unreadable files
            }
        }
        for (const dep of declared) {
            if (dep.startsWith('@types/'))
                continue;
            const importPattern = new RegExp(`from ['"]${dep}['"]|require\\(['"]${dep}['"]\\)`, 'm');
            if (!importPattern.test(allImports)) {
                issues.push({
                    type: 'warn',
                    code: 'DEPS_002',
                    message: `Package "${dep}" is installed but not imported anywhere in src/`,
                    fix: `Remove unused dependency: npm uninstall ${dep}`
                });
            }
        }
    }
}
async function checkEnv(cwd, issues) {
    const examplePath = path.join(cwd, '.env.example');
    const envPath = path.join(cwd, '.env');
    const exampleExists = await pathExists(examplePath);
    const envExists = await pathExists(envPath);
    // ENV_001: .env.example exists but .env does not
    if (exampleExists && !envExists) {
        issues.push({
            type: 'warn',
            code: 'ENV_001',
            message: '.env.example found but .env file does not exist',
            fix: 'Run: cp .env.example .env and fill in the required values'
        });
        return;
    }
    // ENV_002: key in .env.example missing from .env
    if (exampleExists && envExists) {
        const exampleContent = await fs.readFile(examplePath, 'utf8');
        const envContent = await fs.readFile(envPath, 'utf8');
        const parseKeys = (content) => {
            const keys = new Set();
            content.split('\n').forEach(line => {
                const trimmed = line.trim();
                if (trimmed.length > 0 && !trimmed.startsWith('#')) {
                    const key = trimmed.split('=')[0].trim();
                    if (key.length > 0)
                        keys.add(key);
                }
            });
            return keys;
        };
        const requiredKeys = parseKeys(exampleContent);
        const presentKeys = parseKeys(envContent);
        for (const key of requiredKeys) {
            if (!presentKeys.has(key)) {
                issues.push({
                    type: 'error',
                    code: 'ENV_002',
                    message: `Environment variable "${key}" is required (in .env.example) but missing from .env`,
                    fix: `Add ${key}=<value> to your .env file`
                });
            }
        }
    }
}
async function checkDocs(cwd, issues) {
    const readmePath = path.join(cwd, 'README.md');
    const readmeExists = await pathExists(readmePath);
    // DOCS_001: README.md missing
    if (!readmeExists) {
        issues.push({
            type: 'warn',
            code: 'DOCS_001',
            message: 'README.md is missing from the project root',
            fix: 'Create a README.md describing your project setup and usage'
        });
        return;
    }
    // DOCS_002: README.md under 100 bytes
    const stat = await fs.stat(readmePath);
    if (stat.size < 100) {
        issues.push({
            type: 'warn',
            code: 'DOCS_002',
            message: `README.md exists but is only ${stat.size} bytes — likely a placeholder`,
            fix: 'Expand README.md with setup instructions, usage examples, and project description'
        });
    }
}
async function checkGit(cwd, issues) {
    const gitignorePath = path.join(cwd, '.gitignore');
    const gitignoreExists = await pathExists(gitignorePath);
    // GIT_001: no .gitignore
    if (!gitignoreExists) {
        issues.push({
            type: 'warn',
            code: 'GIT_001',
            message: 'No .gitignore file found in project root',
            fix: 'Create a .gitignore and add node_modules, .env, dist, and build at minimum'
        });
        return;
    }
    // GIT_002: node_modules not in .gitignore
    const content = await fs.readFile(gitignorePath, 'utf8');
    const lines = content.split('\n').map(l => l.trim());
    if (!lines.includes('node_modules') && !lines.includes('/node_modules') && !lines.includes('node_modules/')) {
        issues.push({
            type: 'error',
            code: 'GIT_002',
            message: 'node_modules is not listed in .gitignore — it may be committed to version control',
            fix: 'Add "node_modules" as a line in your .gitignore file immediately'
        });
    }
}
async function checkSize(cwd, issues) {
    const srcPath = path.join(cwd, 'src');
    if (!(await pathExists(srcPath)))
        return;
    const sourceFiles = await fg(['src/**/*.{ts,tsx,js,jsx}'], { cwd, absolute: true });
    const SIZE_LIMIT = 500 * 1024; // 500KB
    for (const file of sourceFiles) {
        try {
            const stat = await fs.stat(file);
            if (stat.size > SIZE_LIMIT) {
                const relativePath = path.relative(cwd, file);
                const sizeKb = Math.round(stat.size / 1024);
                issues.push({
                    type: 'warn',
                    code: 'SIZE_001',
                    message: `File "${relativePath}" is ${sizeKb}KB — exceeds the 500KB recommended limit`,
                    fix: 'Consider splitting this file into smaller modules'
                });
            }
        }
        catch {
            // skip
        }
    }
}
async function checkSecurity(cwd, issues) {
    const pkgPath = path.join(cwd, 'package.json');
    if (!(await pathExists(pkgPath)))
        return;
    let pkg;
    try {
        const raw = await fs.readFile(pkgPath, 'utf8');
        pkg = JSON.parse(raw);
    }
    catch {
        return;
    }
    const allDeps = {
        ...(pkg.dependencies ?? {}),
        ...(pkg.devDependencies ?? {})
    };
    const vulnerablePackages = [
        { name: 'lodash', safeVersion: '4.17.21' },
        { name: 'axios', safeVersion: '0.21.2' },
        { name: 'node-fetch', safeVersion: '2.6.7' }
    ];
    for (const vuln of vulnerablePackages) {
        const declared = allDeps[vuln.name];
        if (!declared)
            continue;
        const clean = declared.replace(/^[\^~>=<]+/, '').trim();
        const parts = clean.split('.').map(Number);
        if (parts.length < 2)
            continue;
        const [major, minor, patch] = parts;
        const [safeMajor, safeMinor, safePatch] = vuln.safeVersion.split('.').map(Number);
        const isVulnerable = major < safeMajor ||
            (major === safeMajor && minor < safeMinor) ||
            (major === safeMajor && minor === safeMinor && (patch ?? 0) < safePatch);
        if (isVulnerable) {
            issues.push({
                type: 'warn',
                code: 'SEC_001',
                message: `Package "${vuln.name}@${clean}" has known vulnerabilities — safe version is ${vuln.safeVersion}+`,
                fix: `Upgrade: npm install ${vuln.name}@latest`
            });
        }
    }
}
export async function scanProject(cwd) {
    const issues = [];
    await Promise.all([
        checkDeps(cwd, issues),
        checkEnv(cwd, issues),
        checkDocs(cwd, issues),
        checkGit(cwd, issues),
        checkSize(cwd, issues),
        checkSecurity(cwd, issues)
    ]);
    return issues;
}
