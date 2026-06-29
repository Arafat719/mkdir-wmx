import { existsSync, readFileSync, writeFileSync } from "fs";
import { join, resolve } from "path";
const CONFIG_FILENAME = ".wmxrc.json";
export function loadConfig(cwd) {
    let current = resolve(cwd);
    while (true) {
        const candidate = join(current, CONFIG_FILENAME);
        if (existsSync(candidate)) {
            try {
                const raw = readFileSync(candidate, "utf-8");
                return JSON.parse(raw);
            }
            catch {
                return null;
            }
        }
        const parent = resolve(current, "..");
        if (parent === current)
            return null;
        current = parent;
    }
}
export function saveConfig(config, dir) {
    const configPath = join(dir, CONFIG_FILENAME);
    writeFileSync(configPath, JSON.stringify(config, null, 2) + "\n", "utf-8");
}
