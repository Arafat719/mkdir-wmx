import { loadConfig } from "./config.js";
import { logger } from "./logger.js";
export async function createContext() {
    const cwd = process.cwd();
    const config = loadConfig(cwd);
    return {
        cwd,
        config,
        logger,
    };
}
