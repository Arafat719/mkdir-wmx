import { existsSync, readFileSync, writeFileSync } from "fs";
import { join, resolve } from "path";
import { logger } from "./logger.js";

export interface WmxConfig {
  framework?: string;
  backend?: string;
  database?: string;
  packageManager?: string;
  ignore?: string[];
  plugins?: string[];
  deploy?: {
    provider: string;
  };
}

const CONFIG_FILENAME = ".wmxrc.json";

export function loadConfig(cwd: string): WmxConfig | null {
  let current = resolve(cwd);

  while (true) {
    const candidate = join(current, CONFIG_FILENAME);

    if (existsSync(candidate)) {
      try {
        const raw = readFileSync(candidate, "utf-8");
        return JSON.parse(raw) as WmxConfig;
      } catch (err) {
        logger.warn(`Failed to parse ${candidate}: ${err instanceof Error ? err.message : String(err)}`);
        return null;
      }
    }

    const parent = resolve(current, "..");
    if (parent === current) return null;
    current = parent;
  }
}

export function saveConfig(config: WmxConfig, dir: string): void {
  const configPath = join(dir, CONFIG_FILENAME);
  writeFileSync(configPath, JSON.stringify(config, null, 2) + "\n", "utf-8");
}
