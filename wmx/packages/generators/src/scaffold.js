import path from 'path';
import { fileURLToPath } from 'url';
import fs from 'fs-extra';
import { execa } from 'execa';
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
export class ScaffoldGenerator {
    static async generate(answers) {
        const templateName = ScaffoldGenerator.resolveTemplate(answers);
        const templatesDir = path.join(__dirname, '..', 'templates');
        const templatePath = path.join(templatesDir, templateName);
        const targetPath = path.join(process.cwd(), answers.projectName);
        if (!(await fs.pathExists(templatePath))) {
            throw new Error(`Template not found: ${templateName} (looked in ${templatePath})`);
        }
        if (await fs.pathExists(targetPath)) {
            throw new Error(`Directory already exists: ${targetPath}`);
        }
        console.log(`\nScaffolding "${answers.projectName}" from template "${templateName}"...`);
        await fs.copy(templatePath, targetPath);
        await ScaffoldGenerator.replaceInAllFiles(targetPath, '__PROJECT_NAME__', answers.projectName);
        const wmxrc = {
            projectName: answers.projectName,
            framework: answers.framework,
            backend: answers.backend,
            database: answers.database,
            packageManager: answers.packageManager,
            features: answers.features ?? [],
            scaffoldedAt: new Date().toISOString(),
            template: templateName
        };
        await fs.writeJson(path.join(targetPath, '.wmxrc.json'), wmxrc, { spaces: 2 });
        console.log(`\nRunning ${answers.packageManager} install...`);
        try {
            if (templateName === 'react-express-mongo') {
                await execa(answers.packageManager, ['install'], {
                    cwd: path.join(targetPath, 'frontend'),
                    stdio: 'inherit'
                });
                await execa(answers.packageManager, ['install'], {
                    cwd: path.join(targetPath, 'backend'),
                    stdio: 'inherit'
                });
            }
            else {
                await execa(answers.packageManager, ['install'], {
                    cwd: targetPath,
                    stdio: 'inherit'
                });
            }
        }
        catch (err) {
            console.warn(`\nPackage install failed (you can run it manually): ${err.message}`);
        }
        console.log(`\n✅ Project "${answers.projectName}" created at ${targetPath}`);
        console.log(`   cd ${answers.projectName} and follow the README to get started.\n`);
    }
    static resolveTemplate(answers) {
        const fw = answers.framework?.toLowerCase() ?? '';
        const be = answers.backend?.toLowerCase() ?? '';
        const db = answers.database?.toLowerCase() ?? '';
        if (fw.includes('next'))
            return 'nextjs-postgres';
        if (fw.includes('react') && be.includes('express') && db.includes('mongo'))
            return 'react-express-mongo';
        return 'react-express-mongo';
    }
    static async replaceInAllFiles(dir, search, replacement) {
        const entries = await fs.readdir(dir, { withFileTypes: true });
        for (const entry of entries) {
            const fullPath = path.join(dir, entry.name);
            if (entry.isDirectory()) {
                await ScaffoldGenerator.replaceInAllFiles(fullPath, search, replacement);
            }
            else {
                try {
                    const content = await fs.readFile(fullPath, 'utf8');
                    if (content.includes(search)) {
                        const updated = content.split(search).join(replacement);
                        await fs.writeFile(fullPath, updated, 'utf8');
                    }
                }
                catch {
                    // Skip binary files silently
                }
            }
        }
    }
}
