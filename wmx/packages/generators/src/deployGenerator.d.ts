interface WmxConfig {
    projectName?: string;
    framework?: string;
    packageManager?: string;
    frontend?: {
        framework?: string;
        dir?: string;
    };
    backend?: {
        framework?: string;
        dir?: string;
    };
    database?: string;
}
export declare function generateVercelConfig(config: WmxConfig): object;
export declare function generateRenderConfig(config: WmxConfig): string;
export declare function generateNetlifyConfig(config: WmxConfig): string;
export {};
