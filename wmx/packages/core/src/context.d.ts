import { Logger } from "./logger.js";
import type { WmxConfig } from "./config.js";
export interface WmxContext {
    cwd: string;
    config: WmxConfig | null;
    logger: Logger;
}
export declare function createContext(): Promise<WmxContext>;
