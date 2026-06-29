export interface WmxConfig {
    framework?: string;
    backend?: string;
    database?: string;
    ignore?: string[];
    plugins?: string[];
    deploy?: {
        provider: string;
    };
}
export declare function loadConfig(cwd: string): WmxConfig | null;
export declare function saveConfig(config: WmxConfig, dir: string): void;
