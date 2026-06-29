export interface EnvCheckItem {
    key: string;
    required: boolean;
    present: boolean;
}
export interface EnvEntry {
    key: string;
    value: string;
    masked: string;
}
export interface EnvSyncReport {
    missingInEnv: string[];
    missingInExample: string[];
    presentInBoth: string[];
}
export declare function parseEnvFile(filePath: string): Promise<EnvEntry[]>;
export declare function parseEnvKeys(filePath: string): Promise<string[]>;
export declare function scanEnvSync(cwd: string): Promise<EnvSyncReport>;
export declare function scanEnvFile(cwd: string): Promise<EnvCheckItem[]>;
