import fs from 'fs/promises';
import path from 'path';
import fse from 'fs-extra';
export async function parseEnvFile(filePath) {
    let content;
    try {
        content = await fse.readFile(filePath, 'utf-8');
    }
    catch {
        return [];
    }
    const results = [];
    for (const line of content.split('\n')) {
        const trimmed = line.trim();
        if (!trimmed || trimmed.startsWith('#'))
            continue;
        const eqIndex = trimmed.indexOf('=');
        if (eqIndex === -1)
            continue;
        const key = trimmed.slice(0, eqIndex).trim();
        const value = trimmed.slice(eqIndex + 1).trim();
        let masked;
        if (value === '') {
            masked = '(empty)';
        }
        else if (value.length <= 4) {
            masked = '••••';
        }
        else {
            masked = value.slice(0, 2) + '••••••' + value.slice(-2);
        }
        results.push({ key, value, masked });
    }
    return results;
}
export async function parseEnvKeys(filePath) {
    const entries = await parseEnvFile(filePath);
    return entries.map(e => e.key);
}
export async function scanEnvSync(cwd) {
    const envPath = path.join(cwd, '.env');
    const examplePath = path.join(cwd, '.env.example');
    const envKeys = await parseEnvKeys(envPath);
    const exampleKeys = await parseEnvKeys(examplePath);
    const envKeySet = new Set(envKeys);
    const exampleKeySet = new Set(exampleKeys);
    return {
        missingInEnv: exampleKeys.filter(k => !envKeySet.has(k)),
        missingInExample: envKeys.filter(k => !exampleKeySet.has(k)),
        presentInBoth: envKeys.filter(k => exampleKeySet.has(k)),
    };
}
export async function scanEnvFile(cwd) {
    const examplePath = path.join(cwd, '.env.example');
    const envPath = path.join(cwd, '.env');
    let exampleContent = '';
    try {
        exampleContent = await fs.readFile(examplePath, 'utf8');
    }
    catch {
        return [];
    }
    const requiredKeys = exampleContent
        .split('\n')
        .map(line => line.trim())
        .filter(line => line.length > 0 && !line.startsWith('#'))
        .map(line => line.split('=')[0].trim())
        .filter(key => key.length > 0);
    const presentKeys = new Set();
    try {
        const envContent = await fs.readFile(envPath, 'utf8');
        envContent
            .split('\n')
            .map(line => line.trim())
            .filter(line => line.length > 0 && !line.startsWith('#'))
            .forEach(line => {
            const key = line.split('=')[0].trim();
            if (key.length > 0)
                presentKeys.add(key);
        });
    }
    catch {
        // .env does not exist — all keys missing
    }
    return requiredKeys.map(key => ({
        key,
        required: true,
        present: presentKeys.has(key)
    }));
}
