import { loadConfig } from "./config.js";
import { logger, Logger } from "./logger.js";
import type { WmxConfig } from "./config.js";

export interface WmxContext {
  cwd: string;
  config: WmxConfig | null;
  logger: Logger;
}

export async function createContext(): Promise<WmxContext> {
  const cwd = process.cwd();
  const config = loadConfig(cwd);

  return {
    cwd,
    config,
    logger,
  };
}
